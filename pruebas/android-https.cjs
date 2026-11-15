const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {mkdtempSync,mkdirSync,existsSync}=require('node:fs');
const {resolve,join}=require('node:path');
const {once}=require('node:events');
const {request}=require('node:http');
const https=require('node:https');
const {chromium,devices}=require('playwright');

const destination=resolve('pruebas','capturas-1.2-final');
const tlsSource=`
import json
from datetime import datetime, timedelta, timezone
from ipaddress import ip_address
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
key=rsa.generate_private_key(public_exponent=65537,key_size=2048)
name=x509.Name([x509.NameAttribute(NameOID.COMMON_NAME,'localhost')])
now=datetime.now(timezone.utc)
cert=(x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key())
 .serial_number(x509.random_serial_number()).not_valid_before(now-timedelta(days=1))
 .not_valid_after(now+timedelta(days=1))
 .add_extension(x509.SubjectAlternativeName([x509.IPAddress(ip_address('127.0.0.1')),x509.DNSName('localhost')]),critical=False)
 .sign(key,hashes.SHA256()))
print(json.dumps({'key':key.private_bytes(serialization.Encoding.PEM,serialization.PrivateFormat.PKCS8,serialization.NoEncryption()).decode(),
 'cert':cert.public_bytes(serialization.Encoding.PEM).decode()}))
`;
const waitTimer=page=>page.waitForFunction(()=>window.raceQA?.countdown===0&&!window.raceQA.done);
const image=(page,name)=>page.screenshot({path:join(destination,name+'.png')});
async function touch(page,client,type,buttons=[]){
  const touchPoints=await Promise.all(buttons.map(async (button,i)=>{
    const box=await page.locator('[data-control="'+button+'"]').boundingBox();
    assert(box);
    return {x:Math.round(box.x+box.width/2),y:Math.round(box.y+box.height/2),id:i};
  }));
  await client.send('Input.dispatchTouchEvent',{type,touchPoints});
}
async function start(page){
  await page.evaluate(()=>{window.raceQA=null;});
  await page.locator('#next').tap();
  await page.locator('#skip-intro').tap();
  await page.locator('#race').waitFor();
  await waitTimer(page);
  assert.match(await page.locator('#race-title').innerText(),/Lopera 2/);
  assert(await page.evaluate(()=>!!window.raceQA.session));
}
async function test(){
  const {createRankingServer}=await import('../servidor/servidor.mjs');
  const {preparePages}=await import('../herramientas/preparar-pages.mjs');
  mkdirSync(destination,{recursive:true});
  mkdirSync('publicacion',{recursive:true});
  const folder=preparePages(join(mkdtempSync(resolve('publicacion','qa-https-')),'pages')).folder;
  const tls=spawnSync(process.env.QA_PYTHON||'python',['-c',tlsSource],{encoding:'utf8'});
  if(tls.status!==0)throw Error('La prueba HTTPS requiere Python con cryptography.');
  let clock=Date.now();
  const app=createRankingServer({dbFile:':memory:',directory:folder,clock:()=>clock});
  app.listen(0,'127.0.0.1');
  await once(app,'listening');
  const proxy=https.createServer(JSON.parse(tls.stdout),(incoming,outgoing)=>{
    const path=incoming.url.replace(/^\/juego(?=\/)/,'');
    const upstream=request({hostname:'127.0.0.1',port:app.address().port,path,method:incoming.method,
      headers:incoming.headers},upstreamResponse=>{
      outgoing.writeHead(upstreamResponse.statusCode,upstreamResponse.headers);
      upstreamResponse.pipe(outgoing);
    });
    upstream.on('error',()=>{outgoing.writeHead(502);outgoing.end();});
    incoming.pipe(upstream);
  });
  proxy.listen(0,'127.0.0.1');
  await once(proxy,'listening');
  const origin='https://127.0.0.1:'+proxy.address().port;
  let browser;
  try{
    const chrome=[
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
    ].find(existsSync);
    browser=await chromium.launch(process.platform==='win32'?(chrome?{channel:'chrome'}:{channel:'msedge'}):{});
    const context=await browser.newContext({...devices['Pixel 7'],viewport:{width:390,height:844},ignoreHTTPSErrors:true});
    const page=await context.newPage();
    page.setDefaultTimeout(16000);
    page.setDefaultNavigationTimeout(16000);
    const client=await context.newCDPSession(page);
    const errors=[];
    const requests=[];
    let interruptedTrack = false;
    await page.route('**/musica/pistas/estudiantina-madrilena.mp3', route => {
      if (interruptedTrack) return route.continue();
      interruptedTrack = true;
      return route.abort('failed');
    });
    page.on('pageerror',error=>errors.push(error.message));
    page.on('requestfailed',req=>{
      if(req.failure()?.errorText!=='net::ERR_ABORTED' &&
        !(interruptedTrack && req.url().endsWith('/estudiantina-madrilena.mp3'))) {
        errors.push(req.url()+' '+req.failure()?.errorText);
      }
    });
    page.on('response',res=>{if(res.status()>=400)errors.push(res.status()+' '+res.url());});
    page.on('request',req=>requests.push(req.url()));
    await page.goto(origin+'/juego/');
    await page.locator('#play:enabled').waitFor();
    await page.evaluate(()=>{
      const {Race}=ATunaGas.racing;
      const tick=Race.prototype.step;
      Race.prototype.step=function(dt,input){window.raceQA=this;tick.call(this,dt,input);};
    });
    await page.locator('#play').tap();
    await page.waitForFunction(() => {
      const music = document.getElementById('music-main');
      return music.dataset.scene === 'garage' && !music.paused && music.currentTime > 0;
    });
    assert(interruptedTrack);
    await page.evaluate(() => {
      const music = document.getElementById('music-main');
      music.currentTime = music.duration - .3;
    });
    await page.waitForFunction(() => {
      const music = document.getElementById('music-main');
      return music.loop && !music.paused && music.currentTime < 1;
    });
    await page.locator('#next').tap();
    await page.locator('#next').tap();
    assert.equal(await page.locator('.circuit-card').count(),15);
    await page.locator('[data-direction="2"]').tap();
    await page.locator('[data-id="lopera-2"]').tap();
    assert.equal(await page.locator('[data-direction="2"]').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('[data-id="lopera-2"]').innerText(),/Lopera 2/);
    await page.locator('#next').tap();
    await start(page);
    await touch(page,client,'touchStart',['gas','right']);
    await page.waitForFunction(()=>window.raceQA.player.speed>28&&window.raceQA.player.steer>.3);
    await touch(page,client,'touchEnd');
    await page.evaluate(()=>{
      const race=window.raceQA;
      const bottle=race.trackItems.entries.find(o=>o.active&&o.kind==='bottle');
      const road=race.track.project(bottle.x,bottle.y);
      Object.assign(race.player,{x:bottle.x,y:bottle.y,speed:100,angle:road.angle,movementAngle:road.angle,
        roadS:road.s,progress:road.s,onBranch:false,spin:0,hitDelay:0,boost:0});
    });
    await page.locator('#turbo-slot[data-ready=true]').waitFor();
    await page.locator('[data-control=turbo]').tap();
    await page.waitForFunction(()=>window.raceQA.player.bottleBoost>0);
    await page.waitForFunction(()=>!document.getElementById('music-main').paused);
    await image(page,'android-vertical');
    await page.evaluate(()=>{
      const race=window.raceQA;
      const box=race.trackItems.entries.find(o=>o.active&&o.kind==='box');
      const road=race.track.project(box.x,box.y);
      Object.assign(race.player,{x:box.x,y:box.y,speed:100,angle:road.angle,movementAngle:road.angle,
        roadS:road.s,progress:road.s,onBranch:false,spin:0,hitDelay:0,boost:0,bottleBoost:0});
    });
    await page.locator('#box-slot[data-ready=true]').waitFor();
    await page.locator('[data-control=item]').tap();
    await page.waitForFunction(()=>!window.raceQA.item &&
      (window.raceQA.player.boxPulse>0 || window.raceQA.player.boxSlow>0));
    await page.setViewportSize({width:844,height:390});
    await page.waitForFunction(()=>document.getElementById('track').clientHeight<330);
    const row=await page.locator('#touch').boundingBox();
    const board=await page.locator('#track').boundingBox();
    assert(row.y>=board.y+board.height);
    for(const key of ['gas','brake','drift','turbo','left','right']){
      const bounds=await page.locator('[data-control="'+key+'"]').boundingBox();
      assert(bounds.height>=44);
    }
    await image(page,'android-horizontal');
    console.log('Multitáctil, caja, turbo, recuperación y bucle de audio, y giro de pantalla verificados.');
    await page.evaluate(()=>{
      Object.defineProperty(document,'hidden',{configurable:true,value:true});
      document.dispatchEvent(new Event('visibilitychange'));
      delete document.hidden;
    });
    await page.locator('#pause-layer').waitFor();
    assert(await page.locator('#music-main').evaluate(a=>a.paused));
    await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
    await page.locator('#pause-layer').waitFor({state:'hidden'});
    await page.waitForFunction(()=>!document.getElementById('music-main').paused);
    await page.locator('#pause').tap();
    await page.locator('#quit').tap();
    console.log('Pausa en segundo plano y vuelta a parrilla verificadas.');
    await start(page);

    // Replay from real game controls and its fixed clock. Only the test host's
    // wall clock is advanced, so the server still validates every physics tick.
    clock+=90000;
    const finished=await page.evaluate(()=>{
      const race=window.raceQA;
      const {track,player,recorder}=race;
      const {turn}=ATunaGas.racing;
      for(let i=0;i<20000&&!race.done;i++){
        const road=track.project(player.x,player.y,player.roadS,player.onBranch);
        const aim=track.at(road.s+(player.speed>300?107:91));
        const d=turn(Math.atan2(aim.y-player.y,aim.x-player.x)-player.angle);
        const keys={gas:player.speed<377,brake:false,left:d<-.032,right:d>.032,drift:Math.abs(d)>.49,item:!!race.item,turbo:race.bottle};
        recorder.add(keys);
        race.step(1/120,keys);
        race.events.length=0;
      }
      return race.done;
    });
    assert(finished);
    console.log('Carrera completa, enviando la repetición desde el formulario móvil.');
    await page.setViewportSize({width:390,height:844});
    await page.locator('#time-form').waitFor();
    assert.equal(await page.locator('#time-name').getAttribute('inputmode'),'text');
    await page.locator('#time-name').fill('Tuna móvil');
    await page.locator('#save-time').tap();
    await page.locator('#ranking').waitFor();
    await page.locator('#ranking-body').getByText('Tuna móvil').waitFor();
    assert.match(await page.locator('#ranking-status').innerText(),/Tiempo guardado/);
    assert.equal(await page.locator('#filter-town').inputValue(),'lopera');
    assert.equal(await page.locator('#filter-track').inputValue(),'lopera-2');
    await image(page,'clasificacion-android');
    await page.locator('#filter-track').selectOption('lopera');
    await page.locator('#ranking-status').getByText(/Todavía no hay tiempos/).waitFor();
    await page.reload();
    await page.locator('#ranking-button').tap();
    await page.locator('#ranking-body').getByText('Tuna móvil').waitFor();
    assert.equal(await page.locator('#filter-track').inputValue(),'');
    assert(requests.some(url=>url.startsWith(origin+'/juego/musica/pistas/')));
    assert(requests.some(url=>url.startsWith(origin+'/juego/interfaz/fuentes/')));
    assert(requests.some(url=>url.startsWith(origin+'/juego/objetos/arte/')));
    assert(requests.some(url=>url.startsWith(origin+'/juego/personajes/arte/')));
    assert.deepEqual(errors,[]);
    console.log((chrome?'Chrome':'Edge Chromium')+' · Android emulado vertical y horizontal · HTTPS local bajo /juego/ · guardado real y lectura tras recargar.');
  }finally{
    await browser?.close();
    proxy.closeAllConnections();
    app.closeAllConnections();
    await new Promise(done=>proxy.close(done));
    await new Promise(done=>app.close(done));
  }
}
test().catch(error=>{console.error(error);process.exitCode=1;});
