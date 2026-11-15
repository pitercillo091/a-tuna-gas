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
  let savedScore;
  let offset = 0;
  const pageSize = 50;
  const dialog = id('time-dialog');
  const dateTime = new Intl.DateTimeFormat('es-ES', {dateStyle:'short', timeStyle:'short'});
  const direction = value => Number(value) === 2 ? 'Invertido' : 'Normal';
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
    const json=await response.json().catch(() => ({}));
    if(!response.ok)throw Error(json.error||'El servidor no pudo procesar la solicitud.');
    return json;
  }

  async function start(track,driver,vehicle,entrants){
    if(!endpoint)return null;
    try{return await call('races',{data:{track,driver,vehicle,entrants,clientVersion:game.replay.version},timeout:4500});}
    catch{return null;}
  }

  function showDialog() {
    if (result && !dialog.open) {
      dialog.showModal();
      id('time-name').focus();
    }
  }

  function offer(race, onSaved){
    const revision = ++submission;
    if (dialog.open) dialog.close();
    savedScore = null;
    const ready=race.session&&race.recorder&&game.replay.ticks(race.recorder.runs);
    result=ready?{id:race.session.id,runs:race.recorder.runs,onSaved}:null;
    id('open-save-time').hidden = !result;
    id('save-time').disabled=false;
    id('time-name').disabled=false;
    id('time-error').textContent='';
    id('save-status').textContent=result?'':endpoint?
      'Esta carrera se inició sin conexión a la clasificación o superó el tiempo máximo. Inicia otra para guardar un tiempo.':offline;
    const {player, track} = race;
    const details = [['Tiempo', time(Math.round(player.finishTime * 1000))], ['Piloto', player.character.name],
      ['Coche', player.vehicle.name], ['Circuito', track.name], ['Localidad', track.town],
      ['Sentido', direction(track.direction)], ['Fecha y hora', dateTime.format(new Date())]];
    id('time-summary').replaceChildren(...details.flatMap(([label, value]) => [node('dt',label),node('dd',value)]));
    if (result) requestAnimationFrame(() => requestAnimationFrame(() => {
      if (revision === submission && !id('results').hidden) showDialog();
    }));
  }
  id('open-save-time').addEventListener('click',showDialog);
  id('close-save-time').addEventListener('click',() => dialog.close());

  id('time-form').addEventListener('submit',async event=>{
    event.preventDefault();
    if(!result)return;
    const revision=++submission;
    const input=id('time-name');
    const button=id('save-time');
    const name=input.value.normalize('NFKC').trim().replace(/ +/g,' ');
    if ([...name].length < 2 || [...name].length > 24 || !/^[\p{L}\p{N}][\p{L}\p{M}\p{N} ._'’\-]*$/u.test(name)) {
      id('time-error').textContent='Introduce un nombre de 2 a 24 caracteres que empiece por una letra o un número.';
      input.focus();
      return;
    }
    input.disabled=true;
    button.disabled=true;
    id('time-error').textContent='Verificando la carrera…';
    try{
      const {id:raceId,runs,onSaved} = result;
      const saved=await call('scores',{data:{id:raceId,runs,name},timeout:18000});
      if(revision!==submission)return;
      savedScore = saved;
      id('save-status').textContent='Tiempo guardado · '+time(saved.timeMs);
      result=null;
      id('open-save-time').hidden = true;
      dialog.close();
      if (!id('results').hidden) onSaved();
    }catch(error){
      if(revision!==submission)return;
      id('time-error').textContent=error.message;
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
    if(offset)params.set('offset',offset);
    id('ranking-prev').disabled = true;
    id('ranking-next').disabled = true;
    try{
      const {rows,hasMore}=await call('scores?'+params);
      if(current!==refreshCount)return;
      id('ranking-status').textContent=rows.length?'':'Todavía no hay tiempos guardados para esta selección.';
      id('ranking-prev').disabled = offset === 0;
      id('ranking-next').disabled = !hasMore;
      id('ranking-body').replaceChildren(...rows.map((score,i)=>{
        const route=tracks.find(t=>t.id===score.track);
        const driver=characters.find(c=>c.id===score.driver);
        const vehicle=vehicles.find(v=>v.id===score.vehicle);
        const date=dateTime.format(new Date(score.date));
        const tr=document.createElement('tr');
        if (score.id === savedScore?.id) tr.dataset.saved = 'true';
        for (const field of [offset+i+1,score.name,time(score.time_ms),route?.name||score.track,
          route?.town||score.locality,direction(score.direction),driver?.name||score.driver,
          vehicle?.name||score.vehicle,date])tr.append(node('td',field));
        return tr;
      }));
      if (id('ranking-body').querySelector('[data-saved=true]')) {
        id('ranking-status').textContent = 'Tiempo guardado · ' + time(savedScore.timeMs);
      }
    }catch(error){
      if(current===refreshCount)id('ranking-status').textContent=error.message;
    }
  }
  function open(track, showSaved=false){
    offset = showSaved && savedScore?.rank ? Math.floor((savedScore.rank - 1) / pageSize) * pageSize : 0;
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
  towns.addEventListener('change',()=>{offset=0;circuits.value='';updateChoices();load();});
  circuits.addEventListener('change',()=>{offset=0;load();});
  id('ranking-prev').addEventListener('click',()=>{offset=Math.max(0,offset-pageSize);load();});
  id('ranking-next').addEventListener('click',()=>{offset+=pageSize;load();});
  id('ranking-refresh').addEventListener('click',load);
  game.ranking={start,offer,open};
})();
