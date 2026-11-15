import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {once} from 'node:events';
import {createRankingServer} from '../servidor/servidor.mjs';
import game from '../servidor/modelo.cjs';

const {tracks,characters,vehicles,racing,replay}=game;
const localDir=resolve('datos','pruebas');
mkdirSync(localDir,{recursive:true});
const dbFile=join(mkdtempSync(join(localDir,'ranking-')),'tiempos.sqlite');
let clock=Date.now();
const headers={'Content-Type':'application/json'};
let server,url;
async function listen(){
  server=createRankingServer({dbFile,clock:()=>clock});
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  url='http://127.0.0.1:'+server.address().port;
}
async function close(){
  if(server.listening)await new Promise(done=>server.close(done));
}
async function post(path,data,additional={}){
  const res=await fetch(url+'/api/'+path,{method:'POST',headers:{...headers,...additional},body:JSON.stringify(data)});
  return {status:res.status,...await res.json()};
}
const read=async path=>await (await fetch(url+'/api/'+path)).json();
const initial=(id='lopera')=>({track:id,driver:'guitarra-gafas',vehicle:'peineta',entrants:6,clientVersion:replay.version});

function drive(session,route){
  const track=tracks.find(t=>t.id===route);
  const race=new racing.Race(characters[3],vehicles[3],track,6,replay.seed(session.seed));
  const recorder=new replay.Recorder();
  while(race.countdown>0)race.step(replay.dt,{});
  while(!race.done&&recorder.ticks<replay.maxTicks){
    const p=race.player;
    const progress=track.project(p.x,p.y,p.roadS,p.onBranch);
    const aim=track.at(progress.s+(p.speed>300?107:91));
    const d=racing.turn(Math.atan2(aim.y-p.y,aim.x-p.x)-p.angle);
    const input={gas:p.speed<377,brake:false,left:d<-.032,right:d>.032,drift:Math.abs(d)>.49,item:!!race.item,turbo:race.bottle};
    recorder.add(input);
    race.step(replay.dt,input);
    race.events.length=0;
  }
  assert(race.done);
  return {runs:recorder.runs,timeMs:Math.round(race.player.finishTime*1000)};
}
try{
  await listen();
  const health=await read('health');
  assert.deepEqual(health,{version:replay.version,tracks:30});
  assert.equal((await post('races',initial(),{Origin:'https://example.invalid'})).status,403);
  const first=await post('races',initial());
  assert.equal(first.status,201);
  const result=drive(first,'lopera');
  const payload={id:first.id,name:'Peña 12',runs:result.runs,timeMs:1};
  assert.equal((await post('scores',payload)).status,422);
  clock+=result.timeMs+6000;
  assert.equal((await post('scores',{...payload,name:'<script>'})).status,400);
  assert.equal((await post('scores',{...payload,runs:[[1,1]]})).status,422);
  assert.equal((await post('scores',{...payload,runs:[[0,Math.ceil(result.timeMs/8.34)]]})).status,422);
  const saved={id:first.id,saved:true,timeMs:result.timeMs,rank:1};
  assert.deepEqual(await post('scores',payload),{status:201,...saved});
  assert.deepEqual(await post('scores',payload),{status:200,...saved});
  assert.equal((await post('scores',{...payload,name:'Otro'})).status,409);
  const second=await post('races',initial('lopera-2'),{Origin:'https://atunagas.aquiestalatuna.es'});
  assert.equal(second.status,201);
  const inverse=drive(second,'lopera-2');
  clock+=inverse.timeMs+6000;
  assert.equal((await post('scores',{id:second.id,name:'Rondalla',runs:inverse.runs})).status,201);
  const direct=(await read('scores?locality=lopera&track=lopera')).rows;
  const back=(await read('scores?track=lopera-2')).rows;
  assert.equal(direct.length,1);
  assert.equal(back.length,1);
  assert.equal(back[0].direction,2);
  assert.equal(direct[0].name,'Peña 12');
  assert.equal(direct[0].driver,'guitarra-gafas');
  assert.equal(direct[0].vehicle,'peineta');
  assert(direct[0].date);
  assert.equal((await read('scores?locality=lopera')).rows.length,2);
  const global=(await read('scores')).rows;
  assert.equal(global.length,2);
  assert(global[0].time_ms<=global[1].time_ms);
  const hidden=await fetch(url+'/respaldo/antes-de-1.2-2026-11-15.zip');
  assert.equal(hidden.status,404);
  await close();
  await listen();
  assert.deepEqual((await read('scores')).rows,global);
  console.log('API: 30 circuitos, dos tiempos recalculados, filtrados y persistidos tras reiniciar. Duplicados, tiempos falsos y origen ajeno rechazados.');
}finally{
  if(server)await close();
}
