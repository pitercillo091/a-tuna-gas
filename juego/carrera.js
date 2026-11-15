(() => {
  const {tracks, characters, vehicles, resolvePilot, roadObjects} = globalThis.ATunaGas;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const turn = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
  const mysteryBox = 'Caja misteriosa';
  const kmh = speed => Math.round(Math.abs(speed) * .31);
  const bottleBoostDuration = 1.8;
  const pushRadius = 126;

  function tickCarTimers(car, dt) {
    for (const key of ['boost', 'shield', 'stunned', 'hitDelay', 'spin', 'bottleBoost', 'impact', 'boxSlow', 'boxPulse']) {
      car[key] = Math.max(0, car[key] - dt);
    }
  }

  function participant(track, character, vehicle, start, lane, index) {
    const pose = track.at(start, lane);
    return {
      character, vehicle, index, lane, lateral:lane, ...pose, progress: start, roadS: track.wrap(start),
      speed: 0, movementAngle: pose.angle, boost: 0, shield: 0, stunned: 0, hitDelay: 0, spin: 0, bottleBoost: 0, hasBottle: false,
      driftCharge: 0, drifting: false, finishTime: null, onBranch: false,
      hasBox: false, boxReadyAt: 0, boxCooldownUntil: 0, boxSlow: 0, boxPulse: 0,
      steer: 0, throttle: false, braking: false, impact: 0
    };
  }

  function buildGrid(character, vehicle, track, count = 6) {
    character=resolvePilot(character.id)||character;
    const size=clamp(Math.trunc(Number(count)||6),6,characters.length);
    const entrants=characters.filter(pilot=>pilot.id!==character.id).slice(0,size-1)
      .map((pilot,index)=>({pilot,kart:vehicles[(index+2)%vehicles.length]}));
    entrants.push({pilot:character,kart:vehicle});
    return entrants.map(({pilot,kart},index)=>{
      const start=-60-Math.floor(index/2)*46;
      const lane=Math.min(35,track.roadAt(start)*.46)*(index%2?1:-1);
      return participant(track,pilot,kart,start,lane,index);
    });
  }

  class Race {
    constructor(character, vehicle, track = tracks[0], count=6, random=Math.random) {
      this.track = track;
      this.cars = buildGrid(character,vehicle,track,count);
      this.player = this.cars.at(-1);
      this.hazards = track.obstacleSpecs.map(([fraction, lane, type, shortcut], index) => {
        const s = fraction * track.total;
        const pose = shortcut ? track.atBranch(s, lane) : track.at(s, lane);
        return {...pose, type: type || (index % 2 ? 'crate' : 'barrel')};
      });
      this.random = random;
      this.trackItems = new roadObjects.TrackItems(track, this.hazards, random);
      this.item = null;
      this.bottle = false;
      this.countdown = 3;
      this.elapsed = 0;
      this.status = '';
      this.statusTime = 0;
      this.paused = false;
      this.done = false;
      this.events = ['tick'];
      this.nextCheckpoint = track.total / 8;
    }

    say(message, sound) {
      this.status = message;
      this.statusTime = 1.55;
      if (sound) this.events.push(sound);
    }

    step(dt, input) {
      if (this.paused || this.done) return;
      if (this.countdown > 0) {
        const oldCount = Math.ceil(this.countdown);
        this.countdown = Math.max(0, this.countdown - dt);
        const count = Math.ceil(this.countdown);
        if (count < oldCount) this.events.push(count === 0 ? 'go' : 'tick');
        return;
      }
      const {track} = this;
      this.elapsed += dt;
      this.statusTime -= dt;
      for (const car of this.cars) {
        car.previousX = car.x;
        car.previousY = car.y;
        tickCarTimers(car, dt);
        if (car !== this.player) this.driveRival(car, dt);
      }
      this.drivePlayer(dt, input);
      this.checkRoadObjects();
      this.trackItems.update(this.elapsed,this.cars);
      for (const car of this.cars) {
        if (car !== this.player && car.hasBox && elapsedForBox(car, this.elapsed)) this.useItem(car);
      }
      this.checkRivals();
      const end = track.laps * track.total;
      if (this.player.progress >= end && this.nextCheckpoint >= end - .01) {
        this.player.finishTime = this.elapsed;
        this.done = true;
        this.events.push('finish');
      }
    }

    driveRival(car, dt, elapsed = this.elapsed, field = this.cars) {
      const {track} = this;
      if (car.hasBottle && !car.boost && !car.spin && !car.stunned && car.finishTime === null) {
        this.useBottle(car);
      }
      const {progress, index, vehicle} = car;
      const path = track.at(progress);
      const bend = Math.abs(turn(track.at(progress + 115).angle - path.angle));
      const traffic = Math.sin(progress / 213 + index * 2.13) * 18;
      const tier = index * 60 / (this.cars.length-2);
      let pace = (291 + tier + vehicle.speed * 4 - Math.min(.8, bend) * 61 +
        Math.sin(progress / 295 + index * 1.95) * 13 - track.slope(progress) * 110) * (car.spin ? .34 : car.stunned ? .50 : 1);
      if (car.bottleBoost) pace *= 1.27;
      if (car.boxSlow) pace *= .57;
      let desired = car.lane*.88 + traffic;
      if(field.length>6) {
        const leader=field.find(other=>other.index!==index && other.finishTime===null &&
          other.progress>progress && other.progress-progress<68 && Math.abs(other.lateral-car.lateral)<25);
        if(leader && leader.speed<pace) {
          const passing=-Math.sign(car.lane)*30;
          const blocked=field.some(other=>other.index!==index && other.finishTime===null &&
            Math.abs(other.progress-progress)<54 && Math.abs(other.lateral-passing)<22);
          if(!blocked) desired=passing;
          else pace=Math.min(pace,Math.max(86,leader.speed-5));
        }
      }
      car.lateral+=((field.length>6?Math.min(1,dt*5):1)*(desired-car.lateral));
      car.speed += (pace - car.speed) * Math.min(1, dt * (2 + vehicle.acceleration * .19));
      car.progress += car.speed * dt;
      const lane = car.lateral * Math.min(1, track.roadAt(car.progress) / 95);
      Object.assign(car, track.at(car.progress, lane));
      car.steer = turn(track.at(car.progress + 30).angle - path.angle) * 2;
      car.throttle = true;
      if (car.finishTime === null && car.progress >= track.total * track.laps) car.finishTime = elapsed;
    }

    drivePlayer(dt, input) {
      const {track, player: p} = this;
      const {vehicle} = p;
      if(input.turbo && this.bottle && !p.spin) this.useBottle();
      if(p.spin) {
        input={gas:false,brake:false,left:false,right:false,drift:false,item:false};
      }
      const before = track.project(p.x, p.y, p.roadS, p.onBranch);
      const offRoad = Math.abs(before.offset) > before.road;
      const steering = Number(input.right) - Number(input.left);
      p.steer += (steering - p.steer) * Math.min(1, dt * 13);
      const accelerating = input.gas || (p.bottleBoost > 0 && !input.brake);
      p.throttle = accelerating;
      p.braking = input.brake && p.speed > 16;
      const grade = track.slope(p.roadS);
      const maxSpeed = (299 + vehicle.speed * 24) * (1 - clamp(grade * 1.05, -.12, .12));
      if (input.item && this.item) this.useItem();
      if (accelerating) p.speed += (137 + vehicle.acceleration * 31) * dt;
      if (input.brake) p.speed -= (p.speed > 0 ? 500 : 100) * dt;
      if (!accelerating && !input.brake) p.speed *= Math.exp(-1.18 * dt);
      if (offRoad) p.speed *= Math.exp(-2.35 * dt);
      if (p.boost && !p.spin) p.speed += 320 * dt;
      if (p.speed > 20) p.speed -= grade * 330 * dt;
      const cap = maxSpeed * (p.boost ? 1.27 : 1) * (p.boxSlow ? .57 : 1);
      if (p.speed > cap) p.speed = Math.max(cap, p.speed - 265 * dt);
      p.speed = clamp(p.speed, -96, maxSpeed * 1.29);
      const absSpeed = Math.abs(p.speed);
      const wasDrifting = p.drifting;
      p.drifting = input.drift && p.speed > 127 && steering !== 0 && !offRoad;
      const agility = (1.38 + vehicle.handling * .222) * (p.drifting ? 1.33 : 1);
      p.angle += dt * steering * agility * clamp(absSpeed / 125, .22, 1) * (p.speed < -5 ? -1 : 1);
      if (p.drifting) {
        p.driftCharge += dt;
        p.speed *= Math.exp(-.26 * dt);
      } else if (wasDrifting) {
        if (p.driftCharge >= .58 && !offRoad) {
          p.boost = Math.max(p.boost, Math.min(1.12, p.driftCharge * .82));
          this.say('Impulso de derrape', 'boost');
        }
        p.driftCharge = 0;
      }
      p.movementAngle += turn(p.angle - p.movementAngle) *
        Math.min(1, dt * (p.drifting ? 2.8 : 11.5));
      p.x += Math.cos(p.movementAngle) * p.speed * dt;
      p.y += Math.sin(p.movementAngle) * p.speed * dt;
      const current = track.project(p.x, p.y, p.roadS, p.onBranch);
      const margin = current.branch ? 22 : 39;
      if (Math.abs(current.offset) > current.road + margin) {
        const edgeOffset = Math.sign(current.offset) * (current.road + margin - 3);
        p.x = current.x - Math.sin(current.angle) * edgeOffset;
        p.y = current.y + Math.cos(current.angle) * edgeOffset;
        if (p.hitDelay === 0) {
          this.hit('¡Fuera de pista!', .52);
          p.angle += turn(current.angle - p.angle) * .34;
        }
      }
      p.progress += track.delta(current.s, p.roadS);
      p.roadS = current.s;
      if (current.branch && !p.onBranch && Math.abs(current.offset) < current.road) this.say(track.shortcut.label);
      p.onBranch = current.branch;
      if (p.progress >= this.nextCheckpoint) this.nextCheckpoint += track.total / 8;
    }

    useItem(source = this.player) {
      const playerUsesBox = source === this.player;
      if (playerUsesBox) this.item = null;
      else {
        source.hasBox = false;
        source.boxCooldownUntil = this.elapsed + 9;
      }
      if (this.random() >= .5) {
        source.speed *= .62;
        source.boxSlow = 2.4;
        if (playerUsesBox) this.say('¡Caja trampa! Pierdes velocidad', 'boxSlow');
        else if (this.nearPlayer(source)) this.events.push('boxSlow');
        return;
      }

      source.boxPulse = .42;
      const targets = this.cars.filter(car => car !== source && car.finishTime === null &&
        Math.hypot(car.x - source.x, car.y - source.y) <= pushRadius);
      for (const car of targets) this.pushOut(car, source);
      if (playerUsesBox) this.say(targets.length ? '¡Empujón!' : 'Empujón sin rivales cerca', 'boxPush');
      else if (targets.includes(this.player)) this.say('¡Un rival te ha empujado!', 'boxPush');
      else if (this.nearPlayer(source)) this.events.push('boxPush');
    }

    nearPlayer(source) {
      return Math.hypot(source.x-this.player.x, source.y-this.player.y) < 240;
    }

    pushOut(car, source) {
      const {track} = this;
      const isPlayer = car === this.player;
      const road = track.project(car.x, car.y, isPlayer ? car.roadS : track.wrap(car.progress), car.onBranch);
      const side = Math.sign(road.offset) || (car.index < source.index ? -1 : 1);
      const lateral = side * Math.min(road.road + 14, Math.abs(road.offset) + 48);
      const pose = road.branch ? track.atBranch(road.s, lateral) : track.at(road.s, lateral);
      car.x = pose.x;
      car.y = pose.y;
      if (!isPlayer) car.lateral = lateral / Math.min(1, road.road / 95);
      car.stunned = Math.max(car.stunned, .55);
      car.speed *= .73;
      car.impact = .34;
      car.hitDelay = Math.max(car.hitDelay, .36);
    }

    useBottle(car = this.player) {
      car.bottleBoost = bottleBoostDuration;
      car.boost = Math.max(car.boost, bottleBoostDuration);
      if (car === this.player) {
        this.bottle = false;
        this.say('¡Turbo de botellín!', 'bottleTurbo');
      } else {
        car.hasBottle = false;
      }
    }

    applySpike(car) {
      if(car.hitDelay || car.spin || car.finishTime!==null) return false;
      if(car===this.player && car.shield) {
        this.hit('La capa te ha protegido', .42);
        return true;
      }
      car.spin=roadObjects.spikeDuration;
      car.hitDelay=roadObjects.spikeDuration+.28;
      car.impact=.34;
      car.speed*=.42;
      car.boost=0;
      car.bottleBoost=0;
      if(car===this.player){
        car.angle+=(car.steer<0?-.22:.22);
        this.say('¡Cruz con pinchos!','spin');
      }
      return true;
    }

    hit(message, loss) {
      const p = this.player;
      if (p.hitDelay > 0) return;
      if (p.shield > 0) {
        p.shield = 0;
        this.say('La capa te ha protegido', 'shield');
      } else {
        p.speed *= loss;
        p.impact = .34;
        this.say(message, 'bump');
      }
      p.hitDelay = .65;
    }

    checkRoadObjects() {
      const p = this.player;
      const nearby = (object, radius, car = p) => (car.x - object.x) ** 2 + (car.y - object.y) ** 2 < radius ** 2;
      if (this.hazards.some(obstacle => nearby(obstacle, 29))) this.hit('¡Obstáculo!', .33 + p.vehicle.weight * .055);
      for(const item of this.trackItems.entries){
        if(!item.active) continue;
        if (item.kind === 'spike') {
          const struck = this.cars.find(car => !car.hitDelay && !car.spin &&
            car.finishTime === null && roadObjects.touches(item, car));
          if (struck && this.applySpike(struck)) {
            this.trackItems.take(item,this.elapsed);
            if (struck !== p && this.nearPlayer(struck)) this.events.push('spin');
          }
          continue;
        }
        const isBottle = item.kind === 'bottle';
        if (!(isBottle ? this.bottle : this.item) && roadObjects.touches(item, p)) {
          if (isBottle) {
            this.bottle = true;
            this.say('Cruzcampo recogido · T o Turbo','pickup');
          } else {
            this.item = mysteryBox;
            this.say('Caja misteriosa · Espacio u Objeto', 'pickup');
          }
        } else {
          const rival = this.cars.find(car => car !== p && car.finishTime === null && !car.spin &&
            (isBottle ? !car.hasBottle : !car.hasBox && !car.boxSlow && this.elapsed >= car.boxCooldownUntil) &&
            roadObjects.touches(item, car));
          if (!rival) continue;
          if (isBottle) rival.hasBottle = true;
          else {
            rival.hasBox = true;
            rival.boxReadyAt = this.elapsed + 2.8 + this.random() * 3.2;
          }
        }
        this.trackItems.take(item,this.elapsed);
      }
    }

    checkRivals() {
      const p = this.player;
      if (p.hitDelay) return;
      for (const rival of this.cars) {
        if (rival === p) continue;
        const dx = p.x - rival.x;
        const dy = p.y - rival.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 31) {
          const angle = distance ? Math.atan2(dy, dx) : p.angle + Math.PI / 2;
          p.x += Math.cos(angle) * (31 - distance);
          p.y += Math.sin(angle) * (31 - distance);
          this.hit('Roce con ' + rival.character.name, .66 + p.vehicle.weight * .041);
          break;
        }
      }
    }

    results() {
      if (!this.done) return this.ranking();
      const finishers = this.cars.map(car => ({...car}));
      const pending = finishers.filter(car => car.finishTime === null);
      const dt = 1 / 120;
      let clock = this.elapsed;
      // Completar el recorrido de los rivales sin cambiar la partida que acaba de terminar.
      while (pending.some(car => car.finishTime === null)) {
        clock += dt;
        for (const car of pending) {
          if (car.finishTime !== null) continue;
          tickCarTimers(car, dt);
          this.driveRival(car,dt,clock,finishers);
        }
      }
      return finishers.sort((a, b) => a.finishTime - b.finishTime);
    }

    ranking() {
      return [...this.cars].sort((a, b) => {
        if (a.finishTime !== null || b.finishTime !== null) {
          return (a.finishTime ?? Infinity) - (b.finishTime ?? Infinity);
        }
        return b.progress - a.progress;
      });
    }
  }

  function elapsedForBox(car, elapsed) {
    return car.finishTime === null && !car.spin && !car.stunned && elapsed >= car.boxReadyAt;
  }

  globalThis.ATunaGas.racing = {Race, buildGrid, turn, kmh, mysteryBox};
})();
