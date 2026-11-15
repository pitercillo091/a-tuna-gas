const {parentPort,workerData}=require('node:worker_threads');
const {characters,vehicles,tracks,racing,replay}=require('./modelo.cjs');
const {session,runs}=workerData;
const track=tracks.find(item=>item.id===session.track);
const character=characters.find(item=>item.id===session.driver);
const vehicle=vehicles.find(item=>item.id===session.vehicle);
const race=new racing.Race(character,vehicle,track,session.entrants,replay.seed(session.seed));
parentPort.postMessage(replay.simulate(race,runs));
