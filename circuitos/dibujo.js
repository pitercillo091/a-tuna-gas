(() => {
  const game = globalThis.ATunaGas;
  const {tracks, vehicles, characters} = game;
  const lopera = tracks[0];
  const {poly, rect, ellipse, drawKart} = game.drawing;
  const TAU = Math.PI * 2;
  const asphalt = '#384955';
  const sand = '#c39865';
  const cream = '#efcf91';
  const blue = '#547a84';
  const ready = Promise.all(characters.map(pilot => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { game.portrait.preparePortrait(pilot.id, img); resolve(); };
    img.onerror = () => reject(new Error('No se pudo cargar ' + pilot.portrait));
    img.src = pilot.portrait;
  })));

  function randomGenerator(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function line(ctx, points, color, width = 1, closed = false) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
    if (closed) ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function plaza(ctx, x, y, width, height) {
    rect(ctx, '#415752', x + 8, y + 8, width, height);
    rect(ctx, '#8a7556', x - 4, y - 4, width + 8, height + 8);
    rect(ctx, '#c79d70', x, y, width, height);
    for (let py = y + 4; py < y + height - 6; py += 10) {
      for (let px = x + 4 + ((py - y) % 20 > 10 ? 7 : 0); px < x + width - 14; px += 14) {
        rect(ctx, (px + py) % 4 === 0 ? '#d7ad7d' : '#bf976b', px, py, 12, 8);
      }
    }
  }

  function house(ctx, x, y, width, height, palette, sign) {
    const [roofShadow, roofLight, roofMid, plaster] = palette;
    poly(ctx, [[x,y],[x+width+10,y+4],[x+width+19,y+height+31],[x+17,y+height+35]], '#263c3e78');
    rect(ctx, '#403e3b', x - 2, y, width + 4, height + 17);
    rect(ctx, plaster, x, y + 2, width, height + 13);
    rect(ctx, '#aa825f', x + width - 5, y + 5, 5, height + 10);
    rect(ctx, roofShadow, x - 4, y - 2, width + 8, height + 4);
    rect(ctx, roofLight, x - 2, y - 2, width + 4, Math.round(height * .46));
    rect(ctx, roofMid, x - 2, y + Math.round(height * .46), width + 4, Math.round(height * .54));
    for (let py = y + 1; py < y + height - 2; py += 6) {
      for (let px = x + (py % 2 ? 3 : 0); px < x + width - 3; px += 8) {
        rect(ctx, py < y + height * .46 ? roofMid : roofShadow, px, py, 6, 1);
      }
    }
    rect(ctx, roofLight, x - 3, y + Math.round(height * .46) - 1, width + 6, 3);
    rect(ctx, '#e9b78b', x, y + height, width - 5, 2);
    for (let px = x + 8; px < x + width - 5; px += 19) {
      rect(ctx, '#735d50', px, y + height + 4, 7, 7);
      rect(ctx, '#3d5057', px + 1, y + height + 4, 5, 5);
      rect(ctx, '#e3b266', px - 1, y + height + 11, 9, 2);
    }
    if (sign) {
      const face = x + width * .5;
      rect(ctx, '#344f50', face - 24, y + height + 2, 48, 11);
      ctx.fillStyle = '#ffe4a3';
      ctx.textAlign = 'center';
      ctx.font = 'bold 7px monospace';
      ctx.fillText(sign, face, y + height + 9);
    }
  }

  function tree(ctx, x, y, scale, rand) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(scale, scale);
    ellipse(ctx, '#29434a70', 8, 5, 20, 13);
    rect(ctx, '#745b45', -3, -5, 7, 15);
    const leaves = [[-17,-14],[-13,-24],[-4,-26],[1,-29],[14,-25],[22,-18],[21,-7],[15,1],[4,4],[-9,2],[-17,-4]];
    poly(ctx, leaves, '#2d4548');
    ellipse(ctx, '#466055', -4, -14, 14, 12);
    ellipse(ctx, '#567862', 6, -20, 12, 9);
    ellipse(ctx, '#65856a', -6, -19, 9, 5);
    for (let n = 0; n < 15; n++) {
      const px = Math.round(rand() * 25 - 12);
      const py = Math.round(rand() * 15 - 24);
      rect(ctx, n % 4 ? '#719077' : '#9aa97b', px, py, n % 2 + 2, 1);
    }
    ctx.restore();
  }

  function tent(ctx, x, y, color) {
    rect(ctx, '#3e4b4980', x + 4, y + 4, 39, 30);
    rect(ctx, '#5a4846', x, y, 38, 26);
    rect(ctx, color, x - 2, y - 3, 42, 24);
    for (let i = 0; i < 6; i += 2) rect(ctx, '#e8c785', x - 2 + 7 * i, y - 3, 7, 24);
    rect(ctx, '#6d5650', x - 2, y + 18, 42, 4);
    rect(ctx, '#b6885c', x + 3, y + 21, 32, 4);
  }

  function bunting(ctx, a, b) {
    const points = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      points.push({x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * 10});
    }
    line(ctx, points, '#382f35', 1.4);
    points.slice(1, -1).forEach((p, i) => poly(ctx,
      [[p.x, p.y], [p.x + 7, p.y + .4], [p.x + 3.5, p.y + 9]],
      ['#e9aa63', '#df7474', '#88c1a9', '#f2d297'][i % 4]));
    for (const [x, y] of [a, b]) {
      rect(ctx, '#424344', x - 1, y, 3, 16);
      rect(ctx, '#f9d488', x - 2, y - 2, 5, 4);
    }
  }

  function chevrons(ctx, x, y, angle, length, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const count = Math.round(length / 11);
    for (let i = 0; i < count; i++) {
      const px = -length / 2 + i * 11;
      poly(ctx, [[px-3,-10],[px+2,-10],[px+8,0],[px+2,10],[px-3,10],[px+3,0]], color);
    }
    ctx.restore();
  }

  function roadRibbon(ctx, track, color, margin) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const side of [-1,1]) {
      track.samples.forEach(({s}, i) => {
        const point = track.at(s, side * (track.roadAt(s) + margin));
        if (i === 0) ctx.moveTo(point.x,point.y);
        else ctx.lineTo(point.x,point.y);
      });
      ctx.closePath();
    }
    ctx.fill('evenodd');
  }

  function renderWorld(track, scale = 1) {
    const skin = track.palette || {ground: '#587669', flecks: ['#607d6a', '#4e6e61', '#648070', '#72856b'],
      road: asphalt, shoulder: sand, texture: ['#435660', '#31434f'],
      curbA: '#e2bf88', curbB: '#9c5b57', lane: '#7f8a80', highlight: '#ffcc65'};
    const isLopera = track.region === 'lopera';
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(track.width * scale);
    canvas.height = Math.ceil(track.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale,scale);
    const rand = randomGenerator(4729);
    rect(ctx, skin.ground, 0, 0, track.width, track.height);
    for (let i = 0; i < 4600; i++) {
      rect(ctx, skin.flecks[i % 4],
        Math.round(rand() * track.width), Math.round(rand() * track.height),
        3 + Math.round(rand() * 22), 1 + Math.round(rand() * 4));
    }

    for (let j = 0; j < 11; j++) {
      for (let i = 0; i < 18; i++) {
        const x = 210 + i * 105 + (j % 2) * 34 + rand() * 24;
        const y = 150 + j * 124 + rand() * 25;
        const inTown = isLopera ? (x > 640 && x < 1690 && y > 910) || (x > 680 && x < 1420 && y > 600 && y < 900) : x > 715 && x < 1750 && y > 420 && y < 1500;
        const near = track.project(x, y);
        if (!inTown && Math.abs(near.offset) > near.road + 59) {
          ellipse(ctx, '#78856b', x, y, 36, 22);
          ellipse(ctx, '#566c58', x, y, 29, 17);
          tree(ctx, x, y, 1 + rand() * .6, rand);
        }
      }
    }

    const tools={plaza, house, tree, tent, bunting, rand};
    if (!isLopera) {
      if (game.scenes[track.region]) game.scenes[track.region](ctx,tools);
      else game.landmarks.paint(ctx,track,tools);
    } else {
    plaza(ctx, 675, 928, 885, 171);
    plaza(ctx, 720, 1392, 830, 160);
    plaza(ctx, 738, 635, 515, 252);
    const palettes = [
      ['#623f3e','#bd775f','#a76551','#e5bea0'], ['#55434a','#9d6663','#815552','#d9aa83'],
      ['#87443c','#d78b62','#ba654d','#f3ce99'], ['#4e5654','#779f93','#648078','#e1bd87']
    ];
    for (const [x, y, w, h, c, sign] of [
      [735,948,105,69,2], [855,953,88,63,1,'TALLER'], [956,940,130,78,0],
      [1100,936,89,83,2,'LOPERA'], [1208,953,119,70,0], [1340,932,82,86,1],
      [1444,945,91,64,2], [755,1444,111,84,1], [893,1434,97,92,0],
      [1010,1438,122,88,2], [1150,1448,88,76,3], [1268,1437,111,90,0], [1402,1445,104,73,1],
      [768,659,103,82,2], [891,654,104,88,0], [1004,658,91,82,1], [1122,646,102,92,2]
    ]) house(ctx, x, y, w, h, palettes[c], sign);
    for (const [x, y, color] of [
      [710,1060,'#a85455'],[790,1054,blue],[990,1058,'#a85455'],[1060,1062,blue],
      [1210,1057,'#a85455'],[1430,1065,blue],[800,789,blue],[866,813,'#a85455'],[1106,806,blue],[1176,797,'#a85455']
    ]) tent(ctx, x, y, color);
    for (const [x, y] of [[925,1073],[1150,1064],[1374,1062],[779,1419],[976,1415],[1277,1414],[1505,1421],
      [771,846],[1021,850],[1212,862]]) tree(ctx, x, y, .95, rand);
    ellipse(ctx, '#534e4a', 992, 795, 42, 28);
    ellipse(ctx, '#e4c498', 992, 789, 40, 25);
    ellipse(ctx, '#537c81', 992, 789, 31, 17);
    ellipse(ctx, '#8bbaba', 992, 790, 19, 8);
    ellipse(ctx, '#e0cfad', 992, 785, 7, 4);
    }

    if (isLopera) game.landmarks.paint(ctx,track,tools);
    ctx.lineJoin = 'round';
    roadRibbon(ctx, track, '#393a46', 42);
    roadRibbon(ctx, track, '#836e59', 37);
    roadRibbon(ctx, track, skin.shoulder, 33);
    roadRibbon(ctx, track, '#574f49', 10);
    roadRibbon(ctx, track, skin.road, 0);
    for (let i = 0; i < 5500; i++) {
      const s = rand() * track.total;
      const p = track.at(s, (rand() - .5) * (2 * track.roadAt(s) - 13));
      rect(ctx, skin.texture[i % 3 ? 0 : 1], p.x | 0, p.y | 0, i % 4 + 1, 1);
    }
    for (const side of [-1, 1]) {
      const outside = Array.from({length: 420}, (_, i) => {
        const s = i * track.total / 420;
        return track.at(s, side * (track.roadAt(s) - 1));
      });
      line(ctx, outside, '#273944', 3, true);
      for (let s = 0, i = 0; s < track.total; s += 13, i++) {
        line(ctx, [track.at(s, side * (track.roadAt(s) + 5)), track.at(s + 12, side * (track.roadAt(s + 12) + 5))],
          i % 2 ? skin.curbB : skin.curbA, 10);
      }
      for (let s = 0; s < track.total; s += 33) {
        const p = track.at(s, side * (track.roadAt(s) + 23));
        ellipse(ctx, '#a8825d', p.x, p.y, 4, 2);
      }
    }
    for (let s = 45; s < track.total - 32; s += 74) {
      line(ctx, [track.at(s), track.at(s + 23)], skin.lane, 3);
    }

    if (track.crossings) {
      // Each approach is repainted through the junction, covering overlapping curb markings.
      const approaches=track.crossings.map(center => {
        const s=center*track.total;
        return {points:Array.from({length:37},(_,i)=>track.at(s-162+i*9)), width:track.roadAt(s)};
      });
      ctx.save();
      ctx.lineCap='butt';
      for(const {points,width} of approaches) line(ctx,points,skin.road,width*2-2);
      for(const frac of track.crossings) {
        const s=frac*track.total;
        for(const d of [-113,110]){
          const p=track.at(s+d);
          chevrons(ctx,p.x,p.y,p.angle,31,'#e5cc88');
        }
      }
      ctx.restore();
    }

    if (track.region === 'arjona') {
      for (let s = 20; s < track.total; s += 18) {
        if (track.roadAt(s) > 84) continue;
        ctx.save();
        const p = track.at(s);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        for (let y = -track.roadAt(s) + 8; y < track.roadAt(s) - 4; y += 13) {
          const shift = Math.round(y) % 3;
          rect(ctx, shift ? '#59576a' : '#45465a', shift * 2, y, 12, 1.5);
        }
        ctx.restore();
      }
    }

    if (track.shortcut) {
      const branch = [...track.branch, track.atBranch(track.branchEnd)];
      line(ctx, branch, '#47364c', track.shortcut.width * 2 + 13);
      line(ctx, branch, '#a17b80', track.shortcut.width * 2 + 7);
      line(ctx, branch, '#675569', track.shortcut.width * 2);
      game.scenes.gates(ctx, track);
    }

    if (track.elevations) {
      for (let s = 0; s < track.total - 32; s += 118) {
        const grade = track.slope(s);
        if (Math.abs(grade) < .035) continue;
        const sign = track.at(s, track.roadAt(s) + 20);
        chevrons(ctx, sign.x, sign.y, sign.angle, 25, grade > 0 ? '#f7c274' : '#d2e6bd');
      }
    }
    if (track.region==='banos') {
      for (const [fraction,name] of (track.direction===2?[[.635,'BAJADA'],[.306,'SUBIDA'],[.879,'RECTA DEL MOLINO']]:[[.365,'SUBIDA'],[.694,'BAJADA'],[.121,'RECTA DEL MOLINO']])) {
        const s = fraction * track.total;
        const p = track.at(s, -track.roadAt(s) - 21);
        ctx.save();
        ctx.translate(p.x,p.y);
        ctx.rotate(p.angle);
        rect(ctx, '#4d4040',-82,-15,164,27);
        rect(ctx, '#f0c883',-81,-14,162,2);
        ctx.font='bold 11px monospace';
        ctx.textAlign='center';
        ctx.fillStyle='#fae5b5';
        ctx.fillText(name,0,2);
        ctx.restore();
      }
    }

    game.landmarks.rails(ctx,track);
    for(const [fraction,name] of track.sectors || []){
      const s=fraction*track.total;
      const p=track.at(s,-track.roadAt(s)-14);
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(Math.cos(p.angle) < 0 ? p.angle+Math.PI : p.angle);
      ctx.font='bold 11px monospace';
      const w=ctx.measureText(name).width+18;
      rect(ctx,'#282833df',-w/2,-12,w,19);
      rect(ctx,skin.highlight,-w/2,-12,w,2);
      ctx.fillStyle='#fff1d4';
      ctx.textAlign='center';
      ctx.fillText(name,0,1);
      ctx.restore();
    }
    const start = track.at(0);
    ctx.save();
    ctx.translate(start.x, start.y);
    ctx.rotate(start.angle);
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 16; row++) rect(ctx, (col + row) % 2 ? '#252f3a' : '#f8dfa3', col * 9 - 13, row * (track.roadAt(0) * 2 / 16) - track.roadAt(0), 9, track.roadAt(0) * 2 / 16 + .4);
    }
    ctx.font = '900 21px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e6c889';
    ctx.fillText(track.name.toLocaleUpperCase('es'),29,68);
    ctx.restore();
    for (let i = 0; i < 8; i++) {
      for (const side of i===7?[-1]:[-1,1]) {
        const s=-60-i*46;
        const p = track.at(s,side*Math.min(35,track.roadAt(s)*.46));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        line(ctx, [{x: -13, y:-18},{x: -24, y:-18},{x:-24,y:18},{x:-13,y:18}], '#a3a095', 2);
        ctx.restore();
      }
    }

    if (isLopera) for (const [a,b] of [[[730,1116],[875,1120]],[[885,1120],[1035,1110]],[[1044,1110],[1196,1111]],
      [[1207,1111],[1362,1112]],[[1373,1112],[1527,1114]],[[774,1387],[934,1390]],[[947,1389],[1097,1389]],
      [[1111,1389],[1260,1390]],[[1274,1390],[1425,1385]],[[1492,675],[1610,704]],[[335,925],[432,927]]]) {
      bunting(ctx, a, b);
    }

    for (const [i, s] of [.146, .289, .397, .522, .669, .81, .942].entries()) {
      const d = s * track.total;
      const p = track.at(d, (i % 2 ? -1 : 1) * (track.roadAt(d) + 26));
      rect(ctx, '#6b5945', p.x - 3, p.y - 4, 5, 30);
      ellipse(ctx, '#704b46', p.x, p.y + 1, 22, 16);
      rect(ctx, '#e5ba76', p.x - 18, p.y - 10, 36, 21);
      chevrons(ctx, p.x, p.y, p.angle, 22, '#82534b');
    }
    return canvas;
  }
  let currentWorld;
  let currentTrack;
  const previews = new Map();
  const previewScale=matchMedia('(pointer:coarse)').matches?.19:.26;
  const worldScale=matchMedia('(pointer:coarse)').matches?.65:1;
  function scenery(track) {
    if (currentTrack !== track) {
      if(currentWorld) {currentWorld.width=0; currentWorld.height=0;}
      currentWorld=renderWorld(track,worldScale);
      currentTrack=track;
    }
    return currentWorld;
  }
  function previewWorld(track) {
    if(!previews.has(track.id)){
      if(previews.size>=16){const key=previews.keys().next().value;previews.get(key).width=0;previews.delete(key);}
      previews.set(track.id,renderWorld(track,previewScale));
    }
    return previews.get(track.id);
  }

  function drawObstacle(ctx, obstacle) {
    const {x, y, type} = obstacle;
    ellipse(ctx, '#1c2c366c', x + 3, y + 5, 15, 13);
    if (type === 'barrel') {
      rect(ctx, '#573d3a', x - 11, y - 9, 22, 18);
      ellipse(ctx, '#9f6650', x, y - 3, 12, 12);
      ellipse(ctx, '#e49461', x, y - 6, 10, 8);
      ellipse(ctx, '#b4724d', x, y - 6, 7, 5);
      rect(ctx, '#ebc987', x - 11, y + 2, 22, 3);
    } else if (type === 'jar') {
      ellipse(ctx,'#9b5445',x,y,12,13);
      ellipse(ctx,'#d79068',x-1,y-2,10,11);
      ellipse(ctx,'#503c43',x,y-10,6,4);
      rect(ctx,'#f2b37a',x-6,y-7,11,2);
      rect(ctx,'#a25c4b',x-8,y+4,15,2);
    } else if (type === 'reeds' || type === 'basket') {
      ellipse(ctx,'#5b4b3f',x,y+1,14,11);
      for(let i=-8;i<=8;i+=4) {
        rect(ctx,type==='reeds'?'#a6b371':'#c99660',x+i,y-8+(i%3),3,17);
      }
      rect(ctx,'#705741',x-11,y+4,22,3);
    } else if (type === 'stone' || type === 'mosaic') {
      poly(ctx,[[x-12,y-5],[x-7,y-11],[x+8,y-10],[x+13,y+5],[x+5,y+11],[x-11,y+7]],'#8a7772');
      poly(ctx,[[x-12,y-5],[x-7,y-11],[x+8,y-10],[x+8,y],[x-8,y+2]],type==='mosaic'?'#71a89b':'#c2a98d');
      rect(ctx,'#e9d1a8',x-4,y-7,8,2);
    } else if (type === 'flower') {
      poly(ctx,[[x-12,y-5],[x+12,y-5],[x+8,y+11],[x-8,y+11]],'#b46d58');
      ellipse(ctx,'#514153',x,y-6,12,6);
      for (const [dx,dy] of [[-7,-8],[4,-7],[0,-14],[7,-12],[-5,-14]]) {
        ellipse(ctx,'#88aa78',x+dx,y+dy,4,4);
        ellipse(ctx,'#f5a1b7',x+dx,y+dy-3,3,2.5);
      }
    } else if (type === 'stand') {
      rect(ctx,'#713e58',x-15,y-12,30,23);
      rect(ctx,'#d98d9b',x-15,y-13,30,13);
      for(let d=-13;d<15;d+=9) rect(ctx,'#f2cea3',x+d,y-13,4,13);
      rect(ctx,'#e8ba91',x-13,y+6,26,3);
    } else if (type === 'sack' || type === 'bale') {
      ellipse(ctx,'#695042',x,y,14,13);
      ellipse(ctx,type === 'sack' ? '#d4b789' : '#dca95e',x,y-3,12,11);
      for (let n=-7;n<=8;n+=5) rect(ctx,'#ad8159',x-8,y+n,16,1);
      rect(ctx,'#795c48',x-1,y-12,2,18);
    } else {
      rect(ctx, '#4c4440', x - 13, y - 12, 26, 25);
      rect(ctx, '#b98552', x - 11, y - 11, 22, 20);
      rect(ctx, '#d5a362', x - 8, y - 8, 16, 13);
      line(ctx, [{x:x-9,y:y-9},{x:x+8,y:y+6}], '#916245', 3);
      line(ctx, [{x:x+9,y:y-9},{x:x-8,y:y+6}], '#ecb978', 3);
    }
  }

  function renderCover(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    rect(ctx, '#48665f', 0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(525, 290);
    ctx.rotate(-.33);
    ctx.scale(1.48, 1.48);
    ctx.translate(-1070, -1160);
    ctx.drawImage(scenery(lopera),0,0,lopera.width,lopera.height);
    for (const [s, offset, car, pilot, zoom] of [
      [-142, 47, 4, 0, 1.15], [-32, -44, 2, 7, 1.25], [69, 38, 0, 3, 1.61], [176, -31, 5, 11, 1.14]
    ]) {
      const p = lopera.at(s, offset);
      line(ctx, [{x:p.x-53,y:p.y-11},{x:p.x-26,y:p.y-11}], '#e7d59a90', 2);
      line(ctx, [{x:p.x-65,y:p.y+8},{x:p.x-35,y:p.y+8}], '#e7d59a90', 2);
      drawKart(ctx, vehicles[car], {...p, scale: zoom, angle: p.angle + Math.PI / 2 + .06,
        pilot: characters[pilot], time: s * .037, state: {boost: car === 0, speed: 240}});
    }
    ctx.restore();
  }

  function drawRace(canvas, mini, race) {
    const ctx = canvas.getContext('2d');
    const ratio = canvas.width / canvas.height;
    const {track, player: p} = race;
    const baseHeight = ratio < 1.25 ? 530 : 548;
    const spread=Math.min(140,(race.cars.length-6)*15);
    const visibleHeight=baseHeight+spread*Math.max(0,1-race.elapsed*.65);
    const visibleWidth = ratio * visibleHeight;
    const projectedX = p.x + Math.cos(p.movementAngle) * Math.max(0, p.speed) * .23;
    const projectedY = p.y + Math.sin(p.movementAngle) * Math.max(0, p.speed) * .23;
    const camX = Math.round(Math.max(0, Math.min(track.width - visibleWidth, projectedX - visibleWidth / 2)));
    const camY = Math.round(Math.max(0, Math.min(track.height - visibleHeight, projectedY - visibleHeight / 2)));
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(scenery(track),camX*worldScale,camY*worldScale,visibleWidth*worldScale,visibleHeight*worldScale,0,0,canvas.width,canvas.height);
    const scale = canvas.height / visibleHeight;
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-camX, -camY);
    race.hazards.forEach(obstacle => drawObstacle(ctx, obstacle));
    for(const item of race.trackItems.entries) if(item.active) game.roadObjects.draw(ctx,item,race.elapsed);
    const cars = race.cars.filter(car => car.x > camX - 72 && car.x < camX + visibleWidth + 72 &&
      car.y > camY - 72 && car.y < camY + visibleHeight + 72).sort((a, b) => a.y - b.y);
    for (const car of cars) game.raceEffects.effects(ctx, car, race.elapsed);
    for (const car of cars) {
      if (car.shield) {
        ellipse(ctx, '#84f1d54d', car.x, car.y, 37, 33);
        ctx.strokeStyle = '#a9f8e0';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      drawKart(ctx, car.vehicle, {x: car.x, y: car.y, scale: car === p ? 1.04 : .99,
        angle: car.angle + Math.PI / 2 + (car.spin ? (1-car.spin/game.roadObjects.spikeDuration)*Math.PI*4 : 0), pilot: car.character,
        time: race.elapsed, state: car});
    }
    ctx.restore();
    game.raceEffects.labels(ctx, cars, p, camX, camY, scale, canvas.width, canvas.height);
    drawMap(mini, race);
  }

  function mapTransform(track, w, h, pad) {
    const k = Math.min((w - 2 * pad) / track.width, (h - 2 * pad) / track.height);
    return ({x,y}) => ({x: (w - track.width * k) / 2 + x * k, y: (h - track.height * k) / 2 + y * k});
  }

  const miniPaths = new Map();
  function drawMap(canvas, race) {
    const ctx = canvas.getContext('2d');
    const {track} = race;
    const plot = mapTransform(track, canvas.width, canvas.height, 1);
    if (!miniPaths.has(track.id)) {
      miniPaths.set(track.id, {main: track.samples.map(plot), branch: track.branch.map(plot)});
    }
    const path = miniPaths.get(track.id);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    line(ctx, path.main, '#748487', 4, true);
    line(ctx, path.main, '#bbcbba', 1.2, true);
    if (path.branch.length) line(ctx, path.branch, '#f4bf81', 1.1);
    for (const car of race.cars) {
      const p = plot(car);
      ctx.beginPath();
      ctx.arc(p.x, p.y, car === race.player ? 3.4 : 2, 0, TAU);
      ctx.fillStyle = car === race.player ? '#ffcd68' : '#e88a8a';
      ctx.fill();
    }
  }

  function trackPreview(canvas, track) {
    const ctx = canvas.getContext('2d');
    const fit = mapTransform(track, canvas.width, canvas.height, 0);
    const a = fit({x:0,y:0});
    const b = fit({x:track.width,y:track.height});
    ctx.fillStyle = track.palette?.ground || '#587669';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(previewWorld(track), a.x, a.y, b.x - a.x, b.y - a.y);
    line(ctx, track.samples.map(fit), '#efd4b0', 1.2, true);
    if (track.shortcut) line(ctx, track.branch.map(fit), '#f9b182', 1.6);
  }

  function landmarkPreview(canvas, track) {
    const ctx = canvas.getContext('2d');
    const [x,y] = track.landmark;
    const h = 445;
    const w = h * canvas.width / canvas.height;
    ctx.drawImage(previewWorld(track), Math.max(0, Math.min(track.width - w, x - w / 2))*previewScale,
      Math.max(0, Math.min(track.height - h, y - h / 2))*previewScale, w*previewScale, h*previewScale,
      0, 0, canvas.width, canvas.height);
  }

  function preview(canvas, vehicle, pilot, scale) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawKart(ctx, vehicle, {x: canvas.width / 2, y: canvas.height / 2, angle: Math.PI / 3.2,
      scale, pilot});
  }

  game.art = {ready, renderCover, drawRace, preview, scenery, trackPreview, landmarkPreview};
})();
