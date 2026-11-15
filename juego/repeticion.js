(() => {
  const fields=['gas','brake','left','right','drift','item','turbo'];
  const dt=1/120;
  const version='1.2.1';
  const maxTicks=120*900;
  const maxRuns=24000;
  const seed=value=>{
    let state=value>>>0;
    return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  };
  class Recorder {
    constructor(){this.runs=[];this.ticks=0;}
    add(input){
      if(this.ticks>=maxTicks)return;
      const mask=fields.reduce((code,key,i)=>code|(input[key]?1<<i:0),0);
      const last=this.runs.at(-1);
      if(last?.[0]===mask)last[1]++;
      else this.runs.push([mask,1]);
      this.ticks++;
    }
  }
  function ticks(runs){
    if(!Array.isArray(runs)||!runs.length||runs.length>maxRuns)return 0;
    let total=0, previous=-1;
    for(const pair of runs){
      if(!Array.isArray(pair)||pair.length!==2)return 0;
      const [mask,count]=pair;
      if(!Number.isInteger(mask)||mask<0||mask>=1<<fields.length||mask===previous||
        !Number.isInteger(count)||count<1)return 0;
      previous=mask;
      total+=count;
      if(total>maxTicks)return 0;
    }
    return total;
  }
  function simulate(race,runs,deadline=Infinity){
    if(!ticks(runs))return null;
    const inputs=Array.from({length:1<<fields.length},(_,mask)=>
      Object.fromEntries(fields.map((key,i)=>[key,Boolean(mask&(1<<i))])));
    while(race.countdown>0)race.step(dt,inputs[0]);
    let elapsedTicks = 0;
    for(const [mask,count] of runs){
      for(let i=0;i<count;i++){
        if ((elapsedTicks++ & 255) === 0 && deadline !== Infinity && performance.now() > deadline) return undefined;
        if(race.done)return null;
        race.step(dt,inputs[mask]);
        race.events.length=0;
      }
    }
    return race.done?Math.round(race.player.finishTime*1000):null;
  }
  globalThis.ATunaGas.replay={Recorder,seed,simulate,ticks,dt,maxTicks,version};
})();
