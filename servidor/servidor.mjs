import {createServer} from 'node:http';
import {createHash,randomBytes,randomInt} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {Worker} from 'node:worker_threads';
import {createReadStream, mkdirSync, statSync} from 'node:fs';
import {dirname, extname, join, resolve, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import game from './modelo.cjs';
import {HttpError, maxBody, pageSize, sessionTtl, publicOrigin, pagesOrigin, scoreFields,
  raceSelection, raceSubmission, checkElapsed, rankingFilters} from './reglas-ranking.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const {tracks,replay}=game;
const allowed=new Set(['animaciones','circuitos','clasificaciones','interfaz','juego','musica','objetos','personajes','promocion','sonidos','vehiculos']);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.woff2':'font/woff2','.json':'application/json','.txt':'text/plain; charset=utf-8'};
const version=replay.version;
const trackById=new Map(tracks.map(track=>[track.id,track]));

function send(res,status,value){
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(value));
}
async function body(req){
  if(!String(req.headers['content-type']).startsWith('application/json'))throw new HttpError(415,'Se requiere JSON.');
  let size=0;
  const chunks=[];
  for await(const chunk of req){
    size+=chunk.length;
    if(size>maxBody){req.resume();throw new HttpError(413,'La repetición es demasiado grande.');}
    chunks.push(chunk);
  }
  try{
    const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error();
    return value;
  }catch{throw new HttpError(400,'Los datos no son válidos.');}
}
function simulate(session,runs){
  return new Promise((done,fail)=>{
    const worker=new Worker(new URL('verificacion.cjs',import.meta.url),{workerData:{session,runs}});
    const timer=setTimeout(()=>{worker.terminate();fail(new HttpError(503,'La validación tardó demasiado. Prueba de nuevo.'));},14000);
    worker.once('message',value=>{clearTimeout(timer);done(value);});
    worker.once('error',error=>{clearTimeout(timer);fail(error);});
    worker.once('exit',code=>{clearTimeout(timer);if(code)fail(new Error('Validación interrumpida.'));});
  });
}
function serveStatic(req,res,url,directory){
  const path=decodeURIComponent(url.pathname);
  const key=path==='/'?'index.html':path.slice(1);
  const parts=key.split('/');
  if(key.includes('\\')||parts.includes('..'))throw new HttpError(404,'Archivo no encontrado.');
  const [section]=parts;
  const file=resolve(directory,key);
  const mime=types[extname(file)];
  if((key!=='index.html'&&!allowed.has(section))||!mime||!file.startsWith(resolve(directory)+sep))
    throw new HttpError(404,'Archivo no encontrado.');
  let stat;
  try{stat=statSync(file);}catch{throw new HttpError(404,'Archivo no encontrado.');}
  if(!stat.isFile())throw new HttpError(404,'Archivo no encontrado.');
  const range=req.headers.range;
  const rangeMatch=range&&/^bytes=(\d+)-(\d*)$/.exec(range);
  const start=rangeMatch?Number(rangeMatch[1]):0;
  const end=rangeMatch?.[2]?Math.min(Number(rangeMatch[2]),stat.size-1):stat.size-1;
  if(range&&(!rangeMatch||start>end||start>=stat.size)){
    res.writeHead(416,{'Content-Range':'bytes */'+stat.size});res.end();return;
  }
  const headers={'Content-Type':mime,'Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-cache'};
  if(range)headers['Content-Range']='bytes '+start+'-'+end+'/'+stat.size;
  res.writeHead(range?206:200,headers);
  if(req.method==='HEAD')res.end();else createReadStream(file,{start,end}).pipe(res);
}

export function createRankingServer({dbFile=process.env.RANKING_DB||join(root,'datos','tiempos.sqlite'),
  site=process.env.SITE_ORIGIN||publicOrigin,directory=root,apiOnly=false,clock=Date.now}={}){
  if(dbFile!==':memory:')mkdirSync(dirname(resolve(dbFile)),{recursive:true});
  const db=new DatabaseSync(dbFile);
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY, track TEXT NOT NULL, driver TEXT NOT NULL, vehicle TEXT NOT NULL,
      entrants INTEGER NOT NULL, seed INTEGER NOT NULL, created INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_created ON sessions(created);
    CREATE TABLE IF NOT EXISTS scores (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, time_ms INTEGER NOT NULL CHECK(time_ms>0),
      driver TEXT NOT NULL, vehicle TEXT NOT NULL, track TEXT NOT NULL, locality TEXT NOT NULL,
      direction INTEGER NOT NULL CHECK(direction IN (1,2)), date TEXT NOT NULL, request_hash TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS scores_time ON scores(time_ms,date);
    CREATE INDEX IF NOT EXISTS scores_track ON scores(track,time_ms,date);
    CREATE INDEX IF NOT EXISTS scores_locality ON scores(locality,time_ms,date);`);
  const start=db.prepare('INSERT INTO sessions VALUES (?,?,?,?,?,?,?)');
  const purge=db.prepare('DELETE FROM sessions WHERE created < ?');
  const getSession=db.prepare('SELECT * FROM sessions WHERE id=?');
  const findScore=db.prepare('SELECT * FROM scores WHERE id=?');
  const insert=db.prepare('INSERT OR IGNORE INTO scores VALUES (?,?,?,?,?,?,?,?,?,?)');
  const order=' ORDER BY time_ms,date,id LIMIT '+(pageSize+1)+' OFFSET ?';
  const globalList=db.prepare('SELECT '+scoreFields+' FROM scores'+order);
  const trackList=db.prepare('SELECT '+scoreFields+' FROM scores WHERE track=?'+order);
  const townList=db.prepare('SELECT '+scoreFields+' FROM scores WHERE locality=?'+order);
  const rankInTrack=db.prepare('SELECT count(*)+1 AS rank FROM scores WHERE track=? AND (time_ms,date,id)<(?,?,?)');
  const savedResult = row => ({saved:true,id:row.id,timeMs:row.time_ms,
    rank:rankInTrack.get(row.track,row.time_ms,row.date,row.id).rank});
  const pending=new Set();
  const requests=new Map();
  let lastPurge=0;

  function limit(req,route,max){
    const key=req.socket.remoteAddress+':'+route;
    const window=Math.floor(clock()/60000);
    const state=requests.get(key);
    const count=state?.window===window?state.count+1:1;
    if(requests.size>2000){
      for(const [address,record] of requests){
        if(record.window!==window)requests.delete(address);
      }
    }
    requests.set(key,{window,count});
    if(count>max)throw new HttpError(429,'Demasiados intentos seguidos. Espera un minuto.');
  }

  const server=createServer(async(req,res)=>{
    try{
      res.setHeader('X-Content-Type-Options','nosniff');
      const url=new URL(req.url,'http://localhost');
      if(!url.pathname.startsWith('/api/')){
        if(!apiOnly&&['GET','HEAD'].includes(req.method))return serveStatic(req,res,url,directory);
        throw new HttpError(404,'Ruta no encontrada.');
      }
      const origin=req.headers.origin;
      const localOrigins=['http://'+req.headers.host,'https://'+req.headers.host];
      const local=!apiOnly&&['localhost','127.0.0.1'].includes(urlHostname(req.headers.host));
      if(origin&&origin!==site&&origin!==pagesOrigin&&!(local&&localOrigins.includes(origin)))throw new HttpError(403,'Origen web no autorizado.');
      if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
      if(req.method==='OPTIONS'){
        res.writeHead(204,{'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});
        return res.end();
      }
      if(req.method==='GET'&&url.pathname==='/api/health')return send(res,200,{version,tracks:tracks.length});
      if(req.method==='GET'&&url.pathname==='/api/scores'){
        const {route,region,offset}=rankingFilters(tracks,url.searchParams);
        const rows=route?trackList.all(route,offset):region?townList.all(region,offset):globalList.all(offset);
        return send(res,200,{rows:rows.slice(0,pageSize),hasMore:rows.length>pageSize});
      }
      if(req.method==='POST'&&url.pathname==='/api/races'){
        limit(req,'race',60);
        const {track,driver,vehicle,entrants}=raceSelection(game,await body(req));
        const now=clock();
        if(now-lastPurge>60000){purge.run(now-sessionTtl);lastPurge=now;}
        const id=randomBytes(24).toString('base64url');
        const seed=randomInt(2**32);
        start.run(id,track,driver,vehicle,entrants,seed,now);
        return send(res,201,{id,seed});
      }
      if(req.method==='POST'&&url.pathname==='/api/scores'){
        limit(req,'score',24);
        const {id,name,runs,time}=raceSubmission(await body(req),replay);
        const fingerprint=createHash('sha256').update(JSON.stringify([name,runs])).digest('hex');
        const stored=findScore.get(id);
        if(stored){
          if(stored.request_hash!==fingerprint)throw new HttpError(409,'Esta carrera ya tiene un tiempo guardado.');
          return send(res,200,savedResult(stored));
        }
        const session=getSession.get(id);
        const now=clock();
        const route=trackById.get(session?.track);
        checkElapsed(session,route,time,now);
        if(pending.has(id)||pending.size>=2)throw new HttpError(503,'Hay una validación en curso. Reintenta en unos segundos.');
        pending.add(id);
        try{
          const verified=await simulate(session,runs);
          if(!verified||verified!==time)throw new HttpError(422,'La repetición no completa la carrera. El tiempo no se ha guardado.');
          insert.run(id,name,verified,session.driver,session.vehicle,session.track,route.region,route.direction,
            new Date(clock()).toISOString(),fingerprint);
          const result=findScore.get(id);
          if(result.request_hash!==fingerprint)throw new HttpError(409,'Esta carrera ya tiene un tiempo guardado.');
          return send(res,201,savedResult(result));
        }finally{pending.delete(id);}
      }
      throw new HttpError(404,'Ruta no encontrada.');
    }catch(error){
      if(!res.headersSent){
        if(!error.status)console.error(error);
        send(res,error.status||500,{error:error.status?error.message:'No se pudo procesar el resultado.'});
      }
    }
  });
  server.once('close',()=>db.close());
  return server;
}

function urlHostname(host){
  try{return new URL('http://'+host).hostname;}catch{return '';}
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  const port=Number(process.env.PORT||8783);
  const apiOnly=process.env.API_ONLY==='1';
  const server=createRankingServer({apiOnly});
  server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log('A Tuna Gas · HTTP en puerto '+port));
}
