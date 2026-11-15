(() => {
  const {characters, vehicles, tracks, art, racing, sequences, GameAudio, Music, roadObjects, ranking, replay} = globalThis.ATunaGas;
  const byId = id => document.getElementById(id);
  const sectionNames = ['home', 'select', 'loading', 'intro', 'race', 'results', 'ranking'];
  const steps = ['drivers', 'vehicles', 'circuits', 'grid'];
  const choiceArea = byId('choices');
  const stage = byId('track');
  const minimap = byId('minimap');
  const startButton = byId('play');
  const timeNode = byId('time');
  const sound = new GameAudio();
  const music = new Music(byId('music-main'),byId('music-turbo'));
  let wantsMusic=true;
  const controls = {};
  const keysDown = new Set();
  const pointers = new Map();
  const bindings = {
    ArrowUp: 'gas', KeyW: 'gas', ArrowDown: 'brake', KeyS: 'brake',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ShiftLeft: 'drift', ShiftRight: 'drift', Space: 'item', KeyT: 'turbo'
  };
  const pendingArt=new WeakMap();
  const previewObserver=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      previewObserver.unobserve(entry.target);
      pendingArt.get(entry.target)?.();
      pendingArt.delete(entry.target);
    }
  },{rootMargin:'180px'});
  const statLabels = {speed: 'Velocidad', acceleration: 'Aceleración', handling: 'Manejo', weight: 'Peso'};
  let pilot = characters.find(person => person.id === 'guitarra-gafas');
  let kart = vehicles.find(vehicle => vehicle.id === 'farol');
  let track = tracks[0];
  let step = 'drivers';
  let entrantsCount=6;
  let screen = 'home';
  let loadingRevision=0;
  let resultTrack;
  let rankingFrom;
  let race;
  let lastFrame;
  let accumulated = 0;
  let request;
  let itemPending = false;
  let turboPending = false;
  const timestep = 1 / 120;

  function node(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function show(target) {
    screen = target;
    previewObserver.disconnect();
    document.body.classList.toggle('racing',target==='race');
    byId('ranking-button').hidden=['loading','intro','race','ranking'].includes(target);
    if(target==='ranking')music.setScene('menu');
    if(target==='home' || target==='intro' || target==='race') music.setScene(target);
    if(target==='results') music.setScene('podium');
    for (const name of sectionNames) byId(name).hidden = name !== target;
    window.scrollTo(0, 0);
  }

  function stats(vehicle) {
    const list = node('span', 'stats');
    for (const [key, label] of Object.entries(statLabels)) {
      const row = node('span', 'stat');
      const bar = node('meter');
      bar.min = 0;
      bar.max = 5;
      bar.value = vehicle[key];
      bar.setAttribute('aria-label', label);
      bar.textContent = vehicle[key] + ' de 5';
      row.append(node('span', '', label), bar, node('b', '', vehicle[key]));
      list.append(row);
    }
    return list;
  }

  function canvas(width, height) {
    const result = document.createElement('canvas');
    result.width = width;
    result.height = height;
    result.setAttribute('aria-hidden', 'true');
    return result;
  }

  function card(record, isDriver) {
    const cardButton = node('button', 'choice');
    cardButton.dataset.id = record.id;
    cardButton.setAttribute('aria-pressed', String(record === (isDriver ? pilot : kart)));
    cardButton.setAttribute('aria-label', record.name + (isDriver ? ', ' + record.role : ''));
    const artBox = node('span', 'art' + (isDriver ? '' : ' kart-art'));
    if (isDriver) {
      const sprite = document.createElement('img');
      sprite.src = record.portrait;
      sprite.alt = '';
      sprite.draggable = false;
      artBox.append(sprite);
    } else {
      const rendering = canvas(190, 116);
      art.preview(rendering, record, null, 1.44);
      artBox.append(rendering);
    }
    const copy = node('span', 'choice-copy');
    copy.append(node('strong', 'choice-name', record.name));
    if (isDriver) copy.append(node('span', 'choice-role', record.role));
    else copy.append(node('span', 'choice-role', record.tradeoff));
    const mark = node('span', 'selected-mark', '✓');
    mark.setAttribute('aria-hidden', 'true');
    cardButton.append(artBox, copy, mark);
    if (!isDriver) cardButton.append(stats(record));
    cardButton.addEventListener('click', () => {
      if (isDriver) pilot = record;
      else kart = record;
      for (const button of choiceArea.querySelectorAll('button')) {
        button.setAttribute('aria-pressed', String(button === cardButton));
      }
    });
    return cardButton;
  }

  function circuitCard(circuit) {
    const button = node('button', 'choice circuit-card');
    button.dataset.id = circuit.id;
    button.setAttribute('aria-pressed', String(circuit === track));
    const view = canvas(340, 211);
    view.className = 'circuit-art';
    const map = canvas(105, 70);
    map.className = 'circuit-map';
    pendingArt.set(button,()=>{
      art.landmarkPreview(view,circuit);
      art.trackPreview(map,circuit);
    });
    previewObserver.observe(button);
    const copy = node('span', 'choice-copy');
    copy.append(node('strong','choice-name',circuit.name),
      node('span','choice-role',circuit.routeTitle+' · '+circuit.description), node('span','circuit-info',circuit.feature));
    const mark = node('span','selected-mark','✓');
    mark.setAttribute('aria-hidden','true');
    button.append(view,map,copy,mark);
    button.addEventListener('click', () => {
      track = circuit;
      for (const choice of choiceArea.querySelectorAll('.circuit-card')) {
        choice.setAttribute('aria-pressed', String(choice === button));
      }
    });
    return button;
  }

  function fieldPreview(list) {
    const players=racing.buildGrid(pilot,kart,track,entrantsCount);
    list.replaceChildren(...players.map((entrant,index)=>{
      const item=node('li','field-card'+(index===players.length-1?' personal':''));
      item.dataset.pilot=entrant.character.id;
      item.dataset.position=index+1;
      const view=canvas(278,125);
      sequences.gridPortrait(view,entrant);
      item.append(view,node('span','grid-number',index+1+'º'),node('b','',entrant.character.name+' · '+entrant.vehicle.name));
      return item;
    }));
  }

  function showSetup(target) {
    clearRace();
    show('select');
    step = target;
    music.setScene(['drivers','vehicles'].includes(step)?'garage':'menu');
    const index = steps.indexOf(step);
    const titles = ['Elige piloto', 'Elige vehículo', 'Elige circuito', 'Parrilla de salida'];
    const notes = ['Escoge a un miembro de la Rondalla.', 'Las estadísticas del coche determinan cómo se conduce.', 'Cada recorrido pide una trazada distinta.', track.description];
    byId('selection-title').textContent = titles[index];
    byId('selection-note').textContent = notes[index];
    byId('next').textContent = step === 'grid' ? 'Empezar carrera →' : 'Continuar →';
    for (const button of byId('steps').querySelectorAll('button')) {
      const targetIndex = steps.indexOf(button.dataset.step);
      button.disabled = targetIndex > index;
      if (targetIndex === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    }
    choiceArea.className = 'choices';
    choiceArea.replaceChildren();
    if (step === 'grid') {
      choiceArea.classList.add('grid-preview');
      const field=node('div','');
      const lanes=node('div','grid-lanes');
      lanes.append(node('span','','Carril izquierdo'),node('span','','Carril derecho'));
      const list=node('ol','field-grid');
      list.id='grid-field';
      list.setAttribute('aria-label','Participantes en orden de salida');
      field.append(lanes,list);
      const info = node('div', 'combination-details grid-details');
      const counts=node('label','grid-count','Número de participantes');
      const select=node('select');
      select.id='entrant-count';
      for(let n=6;n<=characters.length;n++){
        const option=node('option','',n+' corredores');
        option.value=n;
        select.append(option);
      }
      select.value=entrantsCount;
      counts.append(select);
      const summary=node('p','','');
      const refresh=()=>{
        summary.textContent=track.name+' · '+track.laps+' vueltas · '+(entrantsCount-1)+' rivales';
        fieldPreview(list);
      };
      select.addEventListener('change',()=>{entrantsCount=Number(select.value);refresh();});
      info.append(counts,node('h3', '', pilot.name + ' · ' + kart.name),
        summary,stats(kart));
      choiceArea.append(field, info);
      refresh();
    } else if (step === 'circuits') {
      choiceArea.classList.add('circuit-list');
      const modes=node('div','route-modes');
      modes.setAttribute('aria-label','Sentido del recorrido');
      const list=node('div','route-cards');
      function setDirection(direction) {
        previewObserver.disconnect();
        track=tracks.find(course=>course.region===track.region&&course.direction===direction);
        for(const control of modes.querySelectorAll('button'))control.setAttribute('aria-pressed',String(Number(control.dataset.direction)===direction));
        list.replaceChildren(...tracks.filter(course=>course.direction===direction).map(circuitCard));
      }
      for(const [label,direction] of [['Original · 1',1],['Inverso · 2',2]]){
        const option=node('button','quiet',label);
        option.type='button';
        option.dataset.direction=direction;
        option.addEventListener('click',()=>setDirection(direction));
        modes.append(option);
      }
      choiceArea.append(modes,list);
      setDirection(track.direction);
    } else {
      const isDriver = step === 'drivers';
      if (!isDriver) choiceArea.classList.add('vehicle-list');
      const records = isDriver ? characters : vehicles;
      choiceArea.append(...records.map(record => card(record, isDriver)));
    }
    byId('selection-title').focus({preventScroll: true});
  }

  function clearControls() {
    keysDown.clear();
    pointers.clear();
    for (const button of byId('touch').querySelectorAll('.active')) button.classList.remove('active');
    itemPending = false;
    turboPending = false;
    refreshControls();
  }

  function refreshControls() {
    const held = new Set([...Array.from(keysDown, code => bindings[code]), ...Array.from(pointers.values(), value => value.control)]);
    for (const control of ['left', 'right', 'gas', 'brake', 'drift']) controls[control] = held.has(control);
  }

  function clearRace() {
    loadingRevision++;
    cancelAnimationFrame(request);
    race = null;
    lastFrame = undefined;
    accumulated = 0;
    byId('pause-layer').hidden = true;
    sound.motor(0, false);
    music.setBoost(false);
    clearControls();
  }

  function goHome() {
    clearRace();
    show('home');
    startButton.focus({preventScroll: true});
  }

  function formatTime(seconds) {
    const hundredths = Math.floor(seconds * 100);
    const min = Math.floor(hundredths / 6000);
    const sec = String(Math.floor(hundredths / 100) % 60).padStart(2, '0');
    return min + ':' + sec + '.' + String(hundredths % 100).padStart(2, '0');
  }

  function resizeStage() {
    if (screen !== 'race') return;
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const budget=matchMedia('(pointer:coarse)').matches?750:960;
    const targetWidth=Math.max(260,Math.min(budget,Math.round(width)));
    const targetHeight = Math.round(targetWidth * height / width);
    if (stage.width !== targetWidth || stage.height !== targetHeight) {
      stage.width = targetWidth;
      stage.height = targetHeight;
    }
    if (race?.paused) renderFrame();
  }

  function renderFrame() {
    const {player, elapsed, countdown, track} = race;
    art.drawRace(stage, minimap, race);
    const place = race.ranking().indexOf(player) + 1;
    const lap = Math.min(track.laps, Math.max(1, Math.floor(player.progress / track.total) + 1));
    byId('place').textContent = place + '/' + race.cars.length;
    byId('lap').textContent = lap + '/' + track.laps;
    byId('speed').textContent = racing.kmh(player.speed) + ' km/h';
    timeNode.textContent = formatTime(elapsed);
    byId('item').textContent = race.item || '—';
    byId('turbo-slot').dataset.ready=String(race.bottle);
    byId('turbo-status').textContent=player.bottleBoost?'¡Turbo!':race.bottle?'T / Turbo':'—';
    music.duck(countdown>0 || elapsed<.48);
    music.setBoost(player.bottleBoost>0);
    const signal = countdown > 0 ? String(Math.ceil(countdown)) : elapsed < .72 ? '¡YA!' : '';
    const count = byId('countdown');
    const message = byId('race-message');
    if (count.textContent !== signal) count.textContent = signal;
    const status = !signal && race.statusTime > 0 ? race.status : '';
    if (message.textContent !== status) message.textContent = status;
  }

  function animate(frame) {
    if (!race || race.paused) return;
    if (lastFrame === undefined) lastFrame = frame;
    accumulated += Math.min(.10, (frame - lastFrame) / 1000);
    lastFrame = frame;
    while (accumulated >= timestep && !race.done) {
      controls.item = itemPending;
      controls.turbo = turboPending;
      if(race.countdown<=0)race.recorder?.add(controls);
      race.step(timestep, controls);
      itemPending = false;
      turboPending = false;
      accumulated -= timestep;
    }
    for (const event of race.events.splice(0)) sound.effect(event);
    sound.motor(race.player.speed, race.countdown === 0 && !race.done);
    renderFrame();
    if (race.done) showResults(race);
    else request = requestAnimationFrame(animate);
  }

  function togglePause() {
    if (!race || race.done) return;
    race.paused = !race.paused;
    music.pause(race.paused);
    byId('pause-layer').hidden = !race.paused;
    byId('pause').textContent = race.paused ? 'Reanudar' : 'Pausar';
    clearControls();
    if (race.paused) {
      cancelAnimationFrame(request);
      sound.motor(0, false);
      byId('resume').focus();
    } else {
      lastFrame = undefined;
      request = requestAnimationFrame(animate);
      byId('pause').focus({preventScroll: true});
    }
  }

  function startRace() {
    clearRace();
    sound.unlock();
    show('loading');
    byId('loading-note').textContent = track.name;
    byId('loading-title').focus({preventScroll: true});
    request = requestAnimationFrame(() => {
      request=requestAnimationFrame(async()=>{
        if(screen!=='loading')return;
        const revision=loadingRevision;
        const pending=ranking.start(track.id,pilot.id,kart.id,entrantsCount);
        art.scenery(track);
        const session=await pending;
        if(screen!=='loading'||revision!==loadingRevision)return;
        race=new racing.Race(pilot,kart,track,entrantsCount,session?replay.seed(session.seed):Math.random);
        race.session=session;
        if(session)race.recorder=new replay.Recorder();
        showIntro();
      });
    });
  }

  function enterRace() {
    if (screen !== 'intro' || !race) return;
    cancelAnimationFrame(request);
    byId('race-title').textContent = race.track.name;
    show('race');
    byId('pause').textContent = 'Pausar';
    resizeStage();
    renderFrame();
    byId('pause').focus({preventScroll: true});
    request = requestAnimationFrame(animate);
  }

  function showIntro() {
    const entrants = race.ranking();
    const lineup = entrants.map(({character}, i) => {
      const li = node('li');
      li.append(node('span','',i+1),document.createTextNode(character.name));
      return li;
    });
    byId('lineup').replaceChildren(...lineup);
    const background=canvas(450,172);
    art.landmarkPreview(background,race.track);
    show('intro');
    byId('intro-title').focus({preventScroll:true});
    let start;
    let previous=-1;
    const shotLength=entrants.length>10?.72:sequences.secondsPerDriver;
    function frame(stamp) {
      if (screen !== 'intro') return;
      if(start === undefined) start=stamp;
      const time=(stamp-start)/1000;
      const i=Math.floor(time/shotLength);
      if(i>=entrants.length) {enterRace();return;}
      const entrant=entrants[i];
      if(previous!==i) {
        if(previous>=0) lineup[previous].removeAttribute('aria-current');
        lineup[i].setAttribute('aria-current','true');
        byId('intro-pilot').textContent=entrant.character.name;
        byId('intro-car').textContent=entrant.vehicle.name;
        previous=i;
      }
      sequences.intro(byId('intro-canvas'),entrant,time,i%2,race.track,background);
      request=requestAnimationFrame(frame);
    }
    request=requestAnimationFrame(frame);
  }

  function startPodium(order) {
    const top=order.slice(0,3);
    byId('podium-names').replaceChildren(...[1,0,2].map(index => {
      const {character}=top[index];
      const info=node('div');
      info.dataset.place=index+1;
      info.dataset.pilot=character.id;
      info.append(node('b','', (index+1) + '.º · ' + character.name),node('span','',sequences.roleOnPodium(character)));
      return info;
    }));
    const winner=sequences.roleOnPodium(top[0].character);
    const fanfare=winner==='Guitarra'?'guitar':winner.startsWith('Pandereta')?'tambourine':'strings';
    let start;
    let played=false;
    function frame(stamp) {
      if(screen !== 'results') return;
      if(start === undefined) start=stamp;
      const t=(stamp-start)/1000;
      if(!played && t>=1.15){ sound.effect(fanfare); played=true; }
      if(t>=7) music.setScene('results');
      sequences.drawPodium(byId('podium-canvas'),top,t);
      request=requestAnimationFrame(frame);
    }
    request=requestAnimationFrame(frame);
  }

  function showResults(finished) {
    resultTrack=finished.track;
    byId('save-time').textContent='Guardar tiempo';
    ranking.offer(finished);
    const order = finished.results();
    const place = order.findIndex(car => car.index === finished.player.index) + 1;
    byId('result-title').textContent = place === 1 ? '¡Victoria en ' + finished.track.name + '!' : place + '.º puesto en ' + finished.track.name;
    byId('result-note').textContent = finished.player.character.name + ' · ' + finished.player.vehicle.name +
      ' · ' + formatTime(finished.player.finishTime);
    byId('standing').replaceChildren(...order.map((car, i) => {
      const row = node('li', car.index === finished.player.index ? 'you' : '');
      const placeLabel = node('span', '', i + 1 + '.º');
      const time = node('time', '', formatTime(car.finishTime));
      row.append(placeLabel, node('strong', '', car.character.name), node('span', '', car.vehicle.name), time);
      return row;
    }));
    clearRace();
    show('results');
    startPodium(order);
    byId('result-title').focus({preventScroll: true});
  }

  startButton.disabled = true;
  Promise.all([art.ready,sequences.ready,roadObjects.ready]).then(() => {
    art.renderCover(byId('cover'));
    roadObjects.drawBottle(byId('bottle-icon').getContext('2d'),11,16,.93);
    startButton.disabled = false;
  }).catch(error => {
    console.error(error);
    document.querySelector('.hero-description').textContent = 'No se pudieron cargar los pilotos. Abre el juego desde su carpeta completa.';
  });
  window.addEventListener('pointerdown',()=>music.unlock(),{once:true});
  window.addEventListener('keydown',()=>music.unlock(),{once:true});
  startButton.addEventListener('click', () => { sound.unlock(); music.unlock(); showSetup('drivers'); });
  byId('home-button').addEventListener('click', goHome);
  function openRanking(track) {
    rankingFrom=screen;
    clearRace();
    show('ranking');
    ranking.open(track);
    byId('ranking-title').focus({preventScroll:true});
  }
  byId('ranking-button').addEventListener('click',()=>openRanking());
  byId('route-ranking').addEventListener('click',()=>openRanking(resultTrack));
  byId('ranking-back').addEventListener('click',()=>{
    if(rankingFrom==='results'){show('results');music.setScene('results');}
    else if(rankingFrom==='select')showSetup(step);
    else goHome();
  });
  byId('sound').addEventListener('click', event => {
    const enabled = sound.toggle();
    event.currentTarget.setAttribute('aria-pressed', String(enabled));
    event.currentTarget.textContent = enabled ? 'Sonido activado' : 'Sonido silenciado';
    music.setEnabled(enabled && wantsMusic);
  });
  byId('music-button').addEventListener('click',event=>{
    wantsMusic=!wantsMusic;
    event.currentTarget.setAttribute('aria-pressed',String(wantsMusic));
    event.currentTarget.textContent=wantsMusic?'♫ Música':'Música silenciada';
    music.setEnabled(sound.enabled && wantsMusic);
    music.unlock();
  });
  byId('back').addEventListener('click', () => {
    const index = steps.indexOf(step);
    if (index) showSetup(steps[index - 1]);
    else goHome();
  });
  byId('next').addEventListener('click', () => {
    const index = steps.indexOf(step);
    if (step === 'grid') startRace();
    else showSetup(steps[index + 1]);
  });
  byId('steps').addEventListener('click', event => {
    if (event.target.dataset.step) showSetup(event.target.dataset.step);
  });
  byId('skip-intro').addEventListener('click', enterRace);
  byId('pause').addEventListener('click', togglePause);
  byId('resume').addEventListener('click', togglePause);
  byId('quit').addEventListener('click', () => showSetup('grid'));
  byId('replay').addEventListener('click', startRace);
  byId('change').addEventListener('click', () => showSetup('drivers'));

  window.addEventListener('keydown', event => {
    if (screen !== 'race') return;
    if (event.code === 'Escape' && !event.repeat) {
      event.preventDefault();
      togglePause();
      return;
    }
    if (race.paused || !bindings[event.code]) return;
    event.preventDefault();
    if (bindings[event.code] === 'item' && !keysDown.has(event.code)) itemPending = true;
    if (bindings[event.code] === 'turbo' && !keysDown.has(event.code)) turboPending = true;
    keysDown.add(event.code);
    refreshControls();
  });
  window.addEventListener('keyup', event => {
    if (keysDown.delete(event.code)) refreshControls();
  });
  window.addEventListener('blur', clearControls);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen==='race' && race && !race.paused && !race.done) togglePause();
    music.refresh();
  });
  window.addEventListener('resize', resizeStage);
  for (const button of byId('touch').querySelectorAll('button')) {
    const control = button.dataset.control;
    button.addEventListener('pointerdown', event => {
      if (screen !== 'race' || race.paused) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, {control, button});
      button.classList.add('active');
      if (control === 'item') itemPending = true;
      if (control === 'turbo') turboPending = true;
      refreshControls();
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(name, event => {
        pointers.delete(event.pointerId);
        if (!Array.from(pointers.values()).some(pointer => pointer.button === button)) button.classList.remove('active');
        refreshControls();
      });
    }
  }
})();
