(() => {
  const game=globalThis.ATunaGas;
  const id=name=>document.getElementById(name);
  const {tracks,characters,vehicles}=game;
  const regions=tracks.filter(t=>t.direction===1);
  const host=window.location.hostname;
  const endpoint=window.location.protocol==='file:'?'': ['127.0.0.1','localhost'].includes(host)?
    window.location.origin:game.rankingEndpoint;
  const node=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;return el;};
  const offline='Abre el juego desde el sitio publicado o inicia el servidor de clasificaciones local.';
  let result;
  let refreshCount=0;
  let submission=0;
  const time=ms=>{
    const minutes=Math.floor(ms/60000);
    const seconds=String(Math.floor(ms/1000)%60).padStart(2,'0');
    return minutes+':'+seconds+'.'+String(ms%1000).padStart(3,'0');
  };

  async function call(path,{data,timeout=9000}={}){
    if(!endpoint)throw Error(offline);
    const options={signal:AbortSignal.timeout(timeout)};
    if(data)Object.assign(options,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    let response;
    try{response=await fetch(endpoint+'/api/'+path,options);}
    catch{throw Error('No se pudo conectar con la clasificación compartida. Puedes volver a intentarlo.');}
    const json=await response.json();
    if(!response.ok)throw Error(json.error||'El servidor no pudo procesar la solicitud.');
    return json;
  }

  async function start(track,driver,vehicle,entrants){
    if(!endpoint)return null;
    try{return await call('races',{data:{track,driver,vehicle,entrants,clientVersion:'1.2'},timeout:2500});}
    catch{return null;}
  }

  function offer(race){
    submission++;
    const form=id('time-form');
    const ready=race.session&&race.recorder&&game.replay.ticks(race.recorder.runs);
    result=ready?{id:race.session.id,runs:race.recorder.runs}:null;
    form.hidden=!result;
    id('save-time').disabled=false;
    id('time-name').disabled=false;
    id('save-status').textContent=result?'':endpoint?
      'Esta carrera se inició sin conexión a la clasificación o superó el tiempo máximo. Inicia otra para guardar un tiempo.':offline;
  }

  id('time-form').addEventListener('submit',async event=>{
    event.preventDefault();
    if(!result)return;
    const revision=++submission;
    const input=id('time-name');
    const button=id('save-time');
    input.disabled=true;
    button.disabled=true;
    id('save-status').textContent='Verificando la carrera…';
    try{
      const saved=await call('scores',{data:{...result,name:input.value},timeout:18000});
      if(revision!==submission)return;
      id('save-status').textContent='Tiempo guardado · '+time(saved.timeMs);
      result=null;
      button.textContent='Guardado';
    }catch(error){
      if(revision!==submission)return;
      id('save-status').textContent=error.message;
      input.disabled=false;
      button.disabled=false;
    }
  });
  const towns=id('filter-town');
  const circuits=id('filter-track');

  function option(value,label){
    const el=node('option',label);
    el.value=value;
    return el;
  }
  towns.append(...regions.map(t=>option(t.region,t.town)));
  function updateChoices(){
    const value=circuits.value;
    const available=tracks.filter(t=>!towns.value||t.region===towns.value);
    circuits.replaceChildren(option('','Todos los circuitos'),...available.map(t=>option(t.id,t.name)));
    circuits.value=available.some(t=>t.id===value)?value:'';
  }
  async function load(){
    const current=++refreshCount;
    id('ranking-body').replaceChildren();
    id('ranking-status').textContent='Cargando tiempos…';
    const params=new URLSearchParams();
    if(towns.value)params.set('locality',towns.value);
    if(circuits.value)params.set('track',circuits.value);
    try{
      const {rows}=await call('scores?'+params);
      if(current!==refreshCount)return;
      id('ranking-status').textContent=rows.length?'':'Todavía no hay tiempos guardados para esta selección.';
      id('ranking-body').replaceChildren(...rows.map((score,i)=>{
        const route=tracks.find(t=>t.id===score.track);
        const driver=characters.find(c=>c.id===score.driver);
        const vehicle=vehicles.find(v=>v.id===score.vehicle);
        const date=new Intl.DateTimeFormat('es-ES',{dateStyle:'short'}).format(new Date(score.date));
        const tr=document.createElement('tr');
        for (const field of [i+1,score.name,time(score.time_ms),route?.name||score.track,driver?.name||score.driver,
          vehicle?.name||score.vehicle,date])tr.append(node('td',field));
        return tr;
      }));
    }catch(error){
      if(current===refreshCount)id('ranking-status').textContent=error.message;
    }
  }
  function open(track){
    if(track){
      towns.value=track.region;
      updateChoices();
      circuits.value=track.id;
    }else{
      towns.value='';
      updateChoices();
      circuits.value='';
    }
    load();
  }
  towns.addEventListener('change',()=>{circuits.value='';updateChoices();load();});
  circuits.addEventListener('change',load);
  id('ranking-refresh').addEventListener('click',load);
  game.ranking={start,offer,open};
})();
