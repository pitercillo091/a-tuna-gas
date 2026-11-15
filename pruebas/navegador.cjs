const assert = require('node:assert/strict');
const {mkdir} = require('node:fs/promises');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');

const root=resolve(__dirname,'..');
const gameUrl=pathToFileURL(resolve(root,'index.html')).href;
const evidence=resolve(root,'pruebas','capturas-1.2');
const capture=(page,name,fullPage=false)=>page.screenshot({path:resolve(evidence,name+'.png'),fullPage});

async function music(scene,page,audio='#music-main') {
  await page.waitForFunction(({source,wanted})=>{
    const player=document.querySelector(source);
    return !player.paused && player.dataset.scene===wanted && player.readyState>=2 && player.currentTime>0;
  },{source:audio,wanted:scene});
}

async function setup(page,pilot,vehicle,route,count) {
  await page.locator('#play').click();
  assert.equal(await page.locator('#choices button').count(),15);
  assert.equal(await page.locator('[data-id="piter-laud"]').count(),0);
  await page.locator('[data-id="'+pilot+'"]').click();
  await page.locator('#next').click();
  assert.equal(await page.locator('#choices button').count(),6);
  await page.locator('[data-id="'+vehicle+'"]').click();
  await page.locator('#next').click();
  assert.equal(await page.locator('.circuit-card').count(),15);
  if(route.endsWith('-2'))await page.locator('[data-direction="2"]').click();
  await page.locator('[data-id="'+route+'"]').click();
  await page.locator('#next').click();
  await page.locator('#entrant-count').selectOption(String(count));
  assert.equal(await page.locator('#grid-field li').count(),count);
  assert.equal(await page.locator('#grid-field li:last-child').getAttribute('data-pilot'),pilot);
}

async function enter(page,route,count,playIntro=false) {
  await page.locator('#next').click();
  await page.locator('#intro').waitFor();
  assert.equal(await page.locator('#lineup li').count(),count);
  if(playIntro) {
    await music('intro',page);
    await page.locator('#intro-pilot').getByText('Pacheco´s',{exact:true}).waitFor();
    await capture(page,'previa-pacheco');
  } else await page.locator('#skip-intro').click();
  await page.locator('#race').waitFor();
  await page.waitForFunction(([id,n])=>window.observedRace?.track.id===id&&window.observedRace.cars.length===n,[route,count]);
}

async function drive(page,until) {
  return page.evaluate(end=>{
    const race=window.observedRace;
    const {track,player}=race;
    const {turn}=ATunaGas.racing;
    for(let i=0;i<120*190 && !race.done && player.progress<end*track.total;i++){
      const road=track.project(player.x,player.y,player.roadS,player.onBranch);
      const target=track.at(road.s+(player.speed>300?107:91));
      const angle=turn(Math.atan2(target.y-player.y,target.x-player.x)-player.angle);
      race.step(1/120,{gas:player.speed<(track.id==='lopera'?500:377),brake:false,left:angle<-.032,right:angle>.032,
        drift:Math.abs(angle)>.49,item:!!race.item,turbo:race.bottle});
      race.events.length=0;
    }
    return {done:race.done,progress:player.progress/track.total};
  },until);
}

async function touchObject(page,type) {
  await page.evaluate(kind=>{
    const race=window.observedRace;
    const item=race.trackItems.entries.find(object=>object.active&&object.kind===kind);
    if(!item) throw Error('Objeto ausente');
    const road=race.track.project(item.x,item.y);
    Object.assign(race.player,{x:item.x,y:item.y,speed:140,boost:0,hitDelay:0,spin:0,bottleBoost:0,shield:0,
      angle:road.angle,movementAngle:road.angle,roadS:road.s,progress:road.s,onBranch:false});
  },type);
}

async function headGallery(page) {
  await page.evaluate(()=>{
    const gallery=document.createElement('div');
    gallery.id='qa-heads';
    gallery.style.cssText='position:absolute;z-index:30;inset:0 auto auto 0;width:1040px;padding:16px;background:#182a31;color:#ffe6ac;display:grid;grid-template-columns:repeat(5,1fr);gap:10px;';
    for(const pilot of ATunaGas.characters) {
      const tile=document.createElement('div');
      tile.style.cssText='background:#45565d;text-align:center;padding:6px;';
      const face=document.createElement('canvas');
      face.width=80;face.height=88;
      const ctx=face.getContext('2d');ctx.drawImage(ATunaGas.portrait.heads.get(pilot.id),0,0);
      face.style.cssText='width:120px;image-rendering:pixelated;display:block;margin:auto;';
      tile.append(face,pilot.name);
      gallery.append(tile);
    }
    document.body.append(gallery);
  });
  await page.locator('#qa-heads').screenshot({path:resolve(evidence,'encuadres.png')});
  await page.locator('#qa-heads').evaluate(n=>n.remove());
}

async function monitor(page){
  await page.evaluate(()=>{
    const {Race}=ATunaGas.racing;
    const step=Race.prototype.step;
    Race.prototype.step=function(dt,input){window.observedRace=this;step.call(this,dt,input);};
  });
}

async function main(){
  await mkdir(evidence,{recursive:true});
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const errors=[];
  function attach(page){
    page.on('pageerror',err=>errors.push(err.message));
    page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
    page.on('requestfailed',req=>{
      if(req.failure()?.errorText!=='net::ERR_ABORTED')errors.push(req.url()+' '+req.failure()?.errorText);
    });
  }
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900}});
    attach(page);
    await page.goto(gameUrl);
    await page.locator('#play:enabled').waitFor();
    assert.match(await page.title(),/^A Tuna Gas 1\.2/);
    await monitor(page);
    await page.locator('.hero-description').click();
    await music('home',page);
    await headGallery(page);
    await setup(page,'guitarra-gafas','peineta','lopera',6);
    await music('menu',page);
    for(let count=6;count<=15;count++){
      await page.locator('#entrant-count').selectOption(String(count));
      assert.equal(await page.locator('#grid-field li').count(),count);
    }
    await page.locator('#grid-field li:last-child').scrollIntoViewIfNeeded();
    await capture(page,'parrilla-15',true);
    await page.locator('#entrant-count').selectOption('6');
    await page.locator('[data-step="drivers"]').click();
    await music('garage',page);
    for(let i=0;i<3;i++) await page.locator('#next').click();
    await enter(page,'lopera',6,true);
    await music('race',page);
    await page.waitForFunction(()=>window.observedRace.countdown===0);
    assert.equal(await page.locator('#place').innerText(),'6/6');
    await page.keyboard.down('ArrowUp');
    await page.waitForFunction(()=>window.observedRace.player.speed>131);
    await page.keyboard.down('ArrowLeft');
    await page.keyboard.down('Shift');
    await page.waitForFunction(()=>window.observedRace.player.drifting);
    await page.keyboard.up('Shift');
    await page.keyboard.up('ArrowLeft');
    await page.keyboard.up('ArrowUp');
    await page.keyboard.press('Escape');
    assert(await page.locator('#pause-layer').isVisible());
    assert(await page.locator('#music-main').evaluate(el=>el.paused));
    await page.locator('#resume').click();
    await music('race',page);
    assert((await drive(page,4)).done);
    await page.locator('#results').waitFor();
    await music('podium',page);
    assert.match(await page.locator('#podium-names [data-place="1"]').innerText(),/PITER[\s\S]*Guitarra/);
    assert.equal(await page.locator('#standing time').count(),6);
    await page.waitForTimeout(1500);
    const shot=await page.locator('#podium-canvas').screenshot();
    await page.waitForTimeout(320);
    assert(!(await page.locator('#podium-canvas').screenshot()).equals(shot));
    await capture(page,'podio',true);
    await music('results',page);
    await page.locator('#replay').click();
    await page.locator('#skip-intro').click();
    await page.waitForFunction(()=>window.observedRace?.countdown===0&&!window.observedRace.done);
    await page.waitForFunction(()=>!document.getElementById('countdown').textContent);
    await touchObject(page,'bottle');
    await page.locator('#turbo-slot[data-ready="true"]').waitFor();
    assert.equal(await page.evaluate(()=>window.observedRace.player.boost),0);
    await capture(page,'botellin-recogido');
    await page.keyboard.press('Space');
    assert(await page.evaluate(()=>window.observedRace.bottle));
    await page.keyboard.press('t');
    await page.waitForFunction(()=>window.observedRace.player.bottleBoost>0&&!window.observedRace.bottle);
    await music('turbo',page,'#music-turbo');
    await capture(page,'turbo-en-marcha');
    await touchObject(page,'spike');
    await page.waitForFunction(()=>window.observedRace.player.spin>.25);
    await capture(page,'trompo');
    await page.locator('#music-button').click();
    assert(await page.locator('#music-main').evaluate(el=>el.paused));

    const newTracks=[
      ['puente-genil','Puente Genil 1',.10,10],['marmolejo','Marmolejo 1',.51,6],
      ['adamuz','Adamuz 1',.12,6],['el-carpio','El Carpio 1',.085,6],
      ['villafranca-2','Villafranca de Córdoba 2',.30,15]
    ];
    for(const [id,name,point,count] of newTracks){
      await page.locator('#home-button').click();
      await setup(page,'coki','farol',id,count);
      await enter(page,id,count);
      assert.equal(await page.locator('#race-title').innerText(),name);
      assert.match(await page.locator('#place').innerText(),new RegExp('/'+count+'$'));
      const initial=await page.locator('#track').screenshot();
      assert((await drive(page,point)).progress>=point);
      assert(!(await page.locator('#track').screenshot()).equals(initial));
      await capture(page,id);
      assert((await drive(page,4)).done);
      await page.locator('#results').waitFor();
      assert.equal(await page.locator('#standing time').count(),count);
      assert.equal(await page.locator('#podium-names [data-place]').count(),3);
      console.log(name+' · salida, cámara, meta y '+count+' clasificados.');
    }
    await page.close();

    const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    attach(phone);
    await phone.goto(gameUrl);
    await monitor(phone);
    await phone.locator('#sound').tap();
    await setup(phone,'canero','adoquin','lopera',15);
    await enter(phone,'lopera',15);
    await phone.waitForFunction(()=>window.observedRace.countdown===0);
    await phone.waitForFunction(()=>!document.getElementById('countdown').textContent);
    await touchObject(phone,'bottle');
    await phone.locator('#turbo-slot[data-ready="true"]').waitFor();
    await phone.locator('[data-control="turbo"]').tap();
    await phone.waitForFunction(()=>window.observedRace.player.bottleBoost>0);
    assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth),390);
    await capture(phone,'movil-turbo');
    assert.deepEqual(errors,[]);
    console.log('Edge: 6, 10 y 15 pilotos, todos los tamaños de parrilla, música por escena, pausa, botellín, trompo, podio y Turbo táctil.');
  } finally {
    await browser.close();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
