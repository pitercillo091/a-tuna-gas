import {HttpError, maxBody, pageSize, publicOrigin, pagesOrigin, scoreFields,
  raceSelection, raceSubmission, checkElapsed, rankingFilters} from './reglas-ranking.mjs';

const encoding = new TextEncoder();

async function requestBody(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415, 'Se requiere JSON.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Los datos no son válidos.');
  const decode = new TextDecoder();
  const buffers = [];
  let size = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBody) {
      await reader.cancel();
      throw new HttpError(413, 'La repetición es demasiado grande.');
    }
    buffers.push(decode.decode(value, {stream:true}));
  }
  try {
    const candidate = JSON.parse(buffers.join('') + decode.decode());
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw Error();
    return candidate;
  } catch {
    throw new HttpError(400, 'Los datos no son válidos.');
  }
}

async function digest(text) {
  const buffer = await crypto.subtle.digest('SHA-256', encoding.encode(text));
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function serveRanking(game, database, key) {
  const {tracks, characters, vehicles, replay, racing} = game;
  const routes = new Map(tracks.map(track => [track.id, track]));
  const databaseHeaders = {apikey:key, Authorization:'Bearer '+key, 'Content-Type':'application/json'};
  async function sql(path, {data, prefer} = {}) {
    const headers = {...databaseHeaders};
    if (prefer) headers.Prefer = prefer;
    const options = {headers};
    if (data) Object.assign(options,{method:'POST',body:JSON.stringify(data)});
    const response = await fetch(database+'/rest/v1/'+path, options);
    if (!response.ok) {
      console.error('Clasificación: fallo de PostgREST', response.status);
      throw new HttpError(503,'La clasificación no está disponible en este momento.');
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async function limit(request, action, limitPerClient, maxGlobal) {
    const client = (request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
    const bucket = await digest(action + ':' + client + ':' + key);
    const available = await sql('rpc/atunagas_allow_action',{data:{p_bucket:bucket,p_limit:limitPerClient}});
    if (!available) throw new HttpError(429,'Demasiados intentos seguidos. Espera un minuto.');
    const capacity = await sql('rpc/atunagas_allow_action',{data:{p_bucket:'global:'+action,p_limit:maxGlobal}});
    if (!capacity) throw new HttpError(429,'La clasificación está ocupada. Prueba en un minuto.');
  }

  const lookup = async (table,id) => (await sql(table + '?id=eq.' + id + '&limit=1'))[0];
  async function confirmation(row) {
    const rank = await sql('rpc/atunagas_rank',{data:{p_id:row.id}});
    return {saved:true,id:row.id,timeMs:row.time_ms,rank};
  }

  return async request => {
    const origin = request.headers.get('origin');
    const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
    const send = (status, data) => new Response(JSON.stringify(data),{status,headers});
    if (origin && origin !== publicOrigin && origin !== pagesOrigin) {
      return send(403,{error:'Origen web no autorizado.'});
    }
    if (origin) headers['Access-Control-Allow-Origin'] = origin;
    if (request.method === 'OPTIONS') {
      return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}});
    }
    try {
      const url = new URL(request.url);
      const action = url.pathname.split('/').at(-1);
      if (request.method === 'GET' && action === 'health') return send(200,{version:replay.version,tracks:tracks.length});
      if (request.method === 'GET' && action === 'scores') {
        const {route, region, offset} = rankingFilters(tracks,url.searchParams);
        const params = new URLSearchParams({select:scoreFields,order:'time_ms.asc,date.asc,id.asc',
          offset:String(offset),limit:String(pageSize+1)});
        if (route) params.set('track','eq.'+route);
        else if (region) params.set('locality','eq.'+region);
        const rows = await sql('atunagas_scores?'+params);
        return send(200,{rows:rows.slice(0,pageSize),hasMore:rows.length>pageSize});
      }
      if (request.method === 'POST' && action === 'races') {
        const selection = raceSelection(game,await requestBody(request));
        await limit(request,'race',40,360);
        const bytes = crypto.getRandomValues(new Uint8Array(24));
        const id = btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_');
        const [seed] = crypto.getRandomValues(new Uint32Array(1));
        await sql('atunagas_sessions',{data:{id,seed,created:Date.now(),...selection},prefer:'return=minimal'});
        return send(201,{id,seed});
      }
      if (request.method === 'POST' && action === 'scores') {
        const {id, name, runs, time} = raceSubmission(await requestBody(request), replay);
        await limit(request,'score',16,160);
        const fingerprint = await digest(JSON.stringify([name,runs]));
        const stored = await lookup('atunagas_scores',id);
        if (stored) {
          if (stored.request_hash !== fingerprint) throw new HttpError(409,'Esta carrera ya tiene un tiempo guardado.');
          return send(200,await confirmation(stored));
        }
        const session = await lookup('atunagas_sessions',id);
        const route = routes.get(session?.track);
        checkElapsed(session,route,time,Date.now());
        const racer = characters.find(character => character.id === session.driver);
        const vehicle = vehicles.find(car => car.id === session.vehicle);
        const race = new racing.Race(racer,vehicle,route,session.entrants,replay.seed(session.seed));
        const verified = replay.simulate(race,runs,performance.now()+1500);
        if (verified === undefined) throw new HttpError(503,'La validación tardó demasiado. Prueba de nuevo.');
        if (!verified || verified !== time) throw new HttpError(422,'La repetición no completa la carrera. El tiempo no se ha guardado.');
        const data = {id,name,time_ms:verified,driver:session.driver,vehicle:session.vehicle,track:route.id,
          locality:route.region,direction:route.direction,request_hash:fingerprint};
        await sql('atunagas_scores?on_conflict=id',{data,prefer:'resolution=ignore-duplicates,return=minimal'});
        const saved = await lookup('atunagas_scores',id);
        if (saved.request_hash !== fingerprint) throw new HttpError(409,'Esta carrera ya tiene un tiempo guardado.');
        return send(201,await confirmation(saved));
      }
      return send(404,{error:'Ruta no encontrada.'});
    } catch (error) {
      if (!(error instanceof HttpError)) console.error('Clasificación: petición fallida',error.name);
      return send(error.status||500,{error:error.status?error.message:'No se pudo procesar el resultado.'});
    }
  };
}
