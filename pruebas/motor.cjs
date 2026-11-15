const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');

globalThis.ATunaGas = {};
require('../personajes/catalogo.js');
require('../animaciones/atlas.js');
require('../vehiculos/catalogo.js');
for (const path of ['trazado', 'lopera', 'arjona', 'banos', 'poblaciones', 'ampliacion-1.1', 'catalogo']) require('../circuitos/' + path + '.js');
require('../objetos/pista.js');
require('../juego/carrera.js');

const {characters, vehicles, tracks, racing, atlas} = ATunaGas;
const [track,arjona,banos]=['lopera','arjona','banos'].map(id=>tracks.find(route=>route.id===id));
function seeded(seed){
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}
const dt = 1 / 120;
const neutral = {gas: false, brake: false, left: false, right: false, drift: false, item: false};
assert.equal(characters.length * vehicles.length, 90);
assert.equal(ATunaGas.resolvePilot("piter-laud").id, "guitarra-gafas");
assert.equal(tracks.length,30);
assert.equal(tracks.at(-1).id,'cordoba-2');
assert.deepEqual(Object.keys(atlas),characters.map(pilot=>pilot.id));
assert(tracks.at(-1).total > tracks.find(route=>route.id==='jaen').total);
const jaen=tracks.find(route=>route.id==='jaen');
assert(jaen.total > Math.max(...tracks.filter(route=>!['jaen','cordoba'].includes(route.region)).map(route=>route.total)));

for (const pilot of characters) {
  const png = readFileSync(join(__dirname, '..', pilot.portrait));
  assert.equal(createHash('sha256').update(png).digest('hex'), pilot.sourceHash);
  const animation=atlas[pilot.id];
  const original=readFileSync(join(__dirname,'..',animation.src));
  assert.equal(createHash('sha256').update(original).digest('hex'),animation.sha256);
  for (const vehicle of vehicles) {
    const race = new racing.Race(pilot, vehicle, track, 6, seeded(99));
    assert.equal(race.player.character, pilot);
    assert.equal(race.player.vehicle, vehicle);
    assert.equal(race.ranking()[5], race.player);
  }
}

function start() {
  const race = new racing.Race(characters[3], vehicles[3], track, 6, seeded(210));
  while (race.countdown > 0) race.step(dt, neutral);
  return race;
}

function position(race, distance, offset, speed = 160) {
  const pose = track.at(distance, offset);
  Object.assign(race.player, pose, {
    roadS: track.wrap(distance), progress: distance, speed, movementAngle: pose.angle
  });
}

const objectRace = start();
const box = objectRace.boxes[0];
const boxPose = track.project(box.x, box.y);
position(objectRace, boxPose.s, boxPose.offset, 0);
objectRace.step(dt, neutral);
assert.equal(objectRace.item, 'Escudo de capa');
objectRace.step(dt, {...neutral, item: true});
assert(objectRace.player.shield > 0);
assert.equal(objectRace.item, null);
assert(box.cooldown > 0);
objectRace.player.shield=0;

const bottleRace=start();
const bottle=bottleRace.trackItems.entries.find(item=>item.kind==='bottle'&&item.active);
const bottlePose=track.project(bottle.x,bottle.y);
position(bottleRace,bottlePose.s,bottlePose.offset,140);
bottleRace.step(dt,neutral);
assert.equal(bottleRace.bottle,true);
assert.equal(bottleRace.player.boost,0);
assert.equal(bottle.active,false);
bottleRace.step(dt,{...neutral,item:true});
assert.equal(bottleRace.bottle,true);
bottleRace.step(dt,{...neutral,turbo:true});
assert.equal(bottleRace.bottle,false);
assert(bottleRace.player.boost>1.7);
assert(bottleRace.events.includes('bottleTurbo'));
bottleRace.trackItems.update(bottle.wake+1,bottleRace.player);
assert.equal(bottle.active,true);

const spikeRace=start();
const spike=spikeRace.trackItems.entries.find(item=>item.kind==='spike'&&item.active);
const spikePose=track.project(spike.x,spike.y);
position(spikeRace,spikePose.s,spikePose.offset,160);
spikeRace.step(dt,neutral);
assert(spikeRace.player.spin>.8 && spikeRace.player.speed<80);
assert(!spike.active);
assert(spikeRace.events.includes('spin'));
const angle=spikeRace.player.angle;
spikeRace.step(dt,{...neutral,left:true,gas:true});
assert.equal(spikeRace.player.angle,angle);
for(let i=0;i<120;i++)spikeRace.step(dt,neutral);
assert.equal(spikeRace.player.spin,0);
assert.equal(spikeRace.pads,undefined);

const placements=seed=>new racing.Race(characters[3],vehicles[3],track,6,seeded(seed))
  .trackItems.entries.map(({kind,x,y})=>[kind,x,y]);
assert.notDeepEqual(placements(12),placements(13));
for(let n=6;n<=15;n++){
  const race=new racing.Race(characters[3],vehicles[3],track,n,seeded(57));
  assert.equal(race.cars.length,n);
  assert.equal(new Set(race.cars.map(car=>car.character.id)).size,n);
  assert.equal(race.player,race.cars.at(-1));
  assert.deepEqual(racing.buildGrid(characters[3],vehicles[3],track,n).map(car=>car.character.id),
    race.ranking().map(car=>car.character.id));
}

const hazard = objectRace.hazards[0];
const hazardPose = track.project(hazard.x, hazard.y);
objectRace.player.boost = 0;
position(objectRace, hazardPose.s, hazardPose.offset);
objectRace.step(dt, neutral);
assert(objectRace.player.speed < 95);
assert.equal(objectRace.status, '¡Obstáculo!');
objectRace.player.hitDelay = 0;
objectRace.item = 'Escudo de capa';
position(objectRace, hazardPose.s, hazardPose.offset);
objectRace.step(dt, {...neutral, item: true});
assert(objectRace.player.speed > 145);
assert.equal(objectRace.status, 'La capa te ha protegido');

const confettiRace = start();
confettiRace.item = 'Confeti';
confettiRace.step(dt, {...neutral, item: true});
assert(confettiRace.cars.filter(car => car !== confettiRace.player).every(car => car.stunned > 0));

const driftRace = start();
const p = driftRace.player;
position(driftRace, -10, 0, 250);
for (let i = 0; i < 75; i++) {
  driftRace.step(dt, {...neutral, gas: true, drift: true, left: i % 2 === 0, right: i % 2 === 1});
}
assert(p.drifting && p.driftCharge >= .58);
driftRace.step(dt, {...neutral, gas: true});
assert(p.boost > 0);
assert.equal(driftRace.status, 'Impulso de derrape');

const reverse = start();
position(reverse, 2, 0, -90);
for (let i = 0; i < 20; i++) reverse.step(dt, {...neutral, brake: true});
assert(reverse.player.progress < 0);
assert.equal(reverse.nextCheckpoint, track.total / 8);
assert.equal(reverse.done, false);

function runRace(track, vehicle, shortcut, count=6) {
  const race = new racing.Race(characters[3], vehicle, track, count, seeded(74 + count));
  const player = race.player;
  let followedShortcut = 0;
  let furthest = 0;
  for (let i = 0; i < 120 * 180 && !race.done; i++) {
    const road = track.project(player.x, player.y, player.roadS, player.onBranch);
    const look = Math.abs(player.speed) > 300 ? 107 : 91;
    const ahead = track.wrap(road.s + look);
    const fork = shortcut && ahead >= track.branchStart && ahead <= track.branchEnd;
    const target = fork ? track.atBranch(ahead) : track.at(road.s + look);
    const delta = racing.turn(Math.atan2(target.y - player.y, target.x - player.x) - player.angle);
    const speedLimit = track.id === 'lopera' ? 500 : fork ? 310 : 377;
    race.step(dt, {...neutral, gas: player.speed < speedLimit,
      left: delta < -.032, right: delta > .032, drift: Math.abs(delta) > .49, item: !!race.item, turbo:race.bottle});
    race.events.length = 0;
    furthest = Math.max(furthest, player.progress);
    if (player.onBranch && Math.abs(road.offset) < road.road) followedShortcut++;
  }
  assert(race.done, track.name + ' / ' + vehicle.name + ' no acabó. Avance=' + furthest.toFixed(1));
  const beforeResults = race.ranking().map(car => car.finishTime);
  const results = race.results();
  assert.equal(results.length,count);
  assert(results.every(car => Number.isFinite(car.finishTime)));
  assert(results.every((car,i)=>!i || car.finishTime>=results[i-1].finishTime));
  assert.deepEqual(race.ranking().map(car => car.finishTime), beforeResults);
  assert.equal(results.findIndex(car => car.index === player.index), race.ranking().indexOf(player));
  console.log(track.name + ' · ' + vehicle.name + ' · ' + count + ' corredores' + (shortcut ? ' · atajo' : '') + ': ' + race.elapsed.toFixed(2) + ' s.');
  return followedShortcut;
}

const crossing = tracks.find(route=>route.id==='porcuna');
const a = crossing.project(1499,501,crossing.crossings[0]*crossing.total);
const b = crossing.project(1499,501,crossing.crossings[1]*crossing.total);
assert(Math.abs(a.offset)<8 && Math.abs(b.offset)<8);
assert(Math.abs(a.s-b.s)>1000);
assert(arjona.branchLength < arjona.branchEnd - arjona.branchStart - 100);
assert(banos.slope(banos.total * .40) > .03);
assert(banos.slope(banos.total * .72) < -.03);
assert(arjona.roadAt(arjona.total * .25) < arjona.roadAt(arjona.total * .10) - 25);
for(let i=0;i<tracks.length;i+=2){
  const [forward,back]=tracks.slice(i,i+2);
  assert.equal(back.region,forward.region);
  assert.equal(back.total,forward.total);
  assert.equal(back.direction,2);
  assert.notDeepEqual(back.obstacleSpecs,forward.obstacleSpecs);
  const probe=.213*forward.total;
  const a=forward.at(probe,20),b=back.at(-probe,-20);
  assert(Math.hypot(a.x-b.x,a.y-b.y)<.1);
  assert(Math.abs(Math.abs(racing.turn(a.angle-b.angle))-Math.PI)<1e-6);
  const projected=back.project(b.x,b.y,back.wrap(-probe));
  assert(Math.abs(back.delta(projected.s,-probe))<.1);
  for(const route of [forward,back]){
    runRace(route,vehicles.find(vehicle=>vehicle.id==='peineta'),false);
    runRace(route,vehicles.find(vehicle=>vehicle.id==='adoquin'),false);
  }
}
assert(runRace(arjona,vehicles[3],true)>240);
assert(runRace(tracks.find(course=>course.id==='arjona-2'),vehicles[3],true)>240);
runRace(track,vehicles[3],false,10);
runRace(tracks.at(-1),vehicles[3],false,15);
console.log('90 parejas de piloto y coche, 30 circuitos en ambos sentidos, campos de 6 a 15, atajos y objetos comprobados.');
