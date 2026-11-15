(() => {
  const game = globalThis.ATunaGas;
  const bodyInk = '#171c29';
  function poly(ctx, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(...points[i]);
    ctx.closePath();
    ctx.fill();
  }
  function rect(ctx, color, x, y, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  function ellipse(ctx, color, x, y, rx, ry) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function metal(ctx, x, span, color, dark, bright) {
    const g = ctx.createLinearGradient(x, 0, x + span, 0);
    g.addColorStop(0, dark);
    g.addColorStop(.2, color);
    g.addColorStop(.37, bright);
    g.addColorStop(.50, color);
    g.addColorStop(.81, dark);
    g.addColorStop(1, color);
    return g;
  }
  const shells = {
    rocket: [[0,-39],[12,-31],[18,-14],[23,5],[21,23],[11,29],[-11,29],[-21,23],[-23,5],[-18,-14],[-12,-31]],
    stone: [[-20,-24],[-12,-33],[11,-34],[24,-24],[25,13],[15,26],[-14,30],[-25,18],[-26,-14]],
    lantern: [[0,-34],[13,-27],[18,-15],[17,14],[27,24],[20,30],[0,23],[-20,30],[-27,24],[-17,14],[-18,-15],[-13,-27]],
    ribbon: [[-11,-28],[11,-28],[20,-24],[24,-13],[24,6],[18,22],[11,28],[-11,28],[-18,22],[-24,6],[-24,-13],[-20,-24]],
    boiler: [[-11,-32],[11,-32],[23,-22],[26,-8],[25,17],[14,27],[-14,27],[-25,17],[-26,-8],[-23,-22]],
    olive: [[0,-36],[13,-30],[18,-18],[21,12],[19,26],[10,30],[-13,28],[-22,20],[-21,-12],[-15,-24],[-10,-29]]
  };

  function wheel(ctx, car, x, y, front, side, state, time) {
    const huge = car.shape === 'stone' || car.shape === 'olive';
    const w = huge ? 13 : front ? 8 : 11;
    const h = huge ? 24 : 18;
    const hub = car.shape === 'olive' ? '#c9a66e' : car.shape === 'stone' ? '#b3aca2' : '#bacbd0';
    const spin = (time * ((state.speed || 0) * .085 + 1)) % 5;
    ctx.save();
    ctx.translate(x, y);
    if (front) ctx.rotate((state.steer || 0) * .24);
    rect(ctx, bodyInk, -w / 2 - 2, -h / 2, w + 4, h);
    rect(ctx, '#354451', -w / 2, -h / 2 + 1, w, h - 2);
    rect(ctx, '#65717a', -w / 2 + 1, -h / 2 + 2, 2, h - 4);
    for (let row = -h / 2 + 1 + spin; row < h / 2 - 2; row += 5) {
      rect(ctx, '#192732', -w / 2 + 1, row, w - 2, 1.5);
    }
    const hx = side * (w / 2 + 1);
    ellipse(ctx, '#1b2630', hx, 0, 3.6, 6);
    ellipse(ctx, hub, hx, -1, 2.5, 4.5);
    rect(ctx, car.trim, hx - 1, -1, 2, 2);
    ctx.restore();
  }

  const chrome = (ctx,x,w) => metal(ctx,x,w,'#91a9b2','#435767','#ecffff');
  function lamp(ctx, x, y, color) {
    rect(ctx, '#1c2731', x - 4, y - 3, 8, 7);
    rect(ctx, color, x - 3, y - 2, 6, 5);
    rect(ctx, '#fff7ce', x - 2, y - 2, 3, 2);
  }

  function rocket(ctx, c, state) {
    poly(ctx, [[0,-39],[8,-31],[6,-9],[-6,-9],[-9,-27]], metal(ctx,-9,18,'#e7bc66','#a26f52','#fff7a8'));
    for (const s of [-1, 1]) {
      poly(ctx, [[s*6,-20],[s*15,-23],[s*19,9],[s*26,15],[s*19,20],[s*14,15]], '#81394e');
      poly(ctx, [[s*8,-21],[s*13,-21],[s*18,12],[s*13,8]], '#ff9297');
      rect(ctx, chrome(ctx,s*16-3,6), s*16-3, 7, 6, 23);
      rect(ctx, '#192635', s*16-3, 26, 6, 4);
      lamp(ctx,s*11,-22,'#ffdb76');
    }
    rect(ctx, '#75374c', -27, 21, 54, 8);
    rect(ctx, '#ffb26f', -28, 18, 56, 6);
    rect(ctx, '#ffeb9a', -26, 18, 52, 2);
    for(let n=-18;n<=18;n+=7) rect(ctx, '#532b46', n, 21, 2, 2);
    if (state.boost) rect(ctx, '#fcaa4c', -8, 26, 16, 3);
  }

  function stone(ctx, c) {
    for (const [x,y,shade] of [[-19,-24,'#b7b7ad'],[-7,-30,'#d1ccbc'],[8,-28,'#a9aaab'],
      [17,-15,'#93979d'],[-23,-3,'#969da7'],[15,12,'#b2aca0'],[-20,14,'#babeaf'],[-7,24,'#a3a4a0']]) {
      poly(ctx, [[x-6,y-3],[x+2,y-5],[x+8,y],[x+5,y+6],[x-4,y+6],[x-7,y+2]], '#555767');
      poly(ctx, [[x-6,y-4],[x+3,y-6],[x+7,y-2],[x+3,y+4],[x-4,y+3]], shade);
      rect(ctx, '#ddd3ba', x-2,y-5,4,1.5);
    }
    rect(ctx, metal(ctx,-21,42,'#ae7759','#654a4d','#f7c58c'),-21,22,42,6);
    for (const s of [-1,1]) {
      rect(ctx, '#7f5447',s*20-3,-16,6,24);
      rect(ctx,'#f6cc83',s*20-1,1,2,3);
      lamp(ctx,s*13,-24,'#ffe2aa');
    }
  }

  function lantern(ctx,c,state,time) {
    poly(ctx, [[0,-36],[8,-23],[8,-13],[0,-9],[-8,-13],[-8,-23]], '#37274d');
    ellipse(ctx, '#94e6bd',0,-24,4,6);
    ellipse(ctx, '#442b63',2,-26,3.1,5);
    const glow = .72 + .24 * Math.sin(time * 12);
    for (const s of [-1,1]) {
      poly(ctx, [[s*16,8],[s*24,14],[s*31,28],[s*17,26],[s*13,19]], '#443760');
      poly(ctx, [[s*16,9],[s*29,25],[s*22,22],[s*16,16]], '#ae92d7');
      ellipse(ctx, '#b1f4bf3a', s*18,-17,10,11);
      rect(ctx, '#2a293f', s*18-6,-25,12,17);
      rect(ctx, '#70a5a0', s*18-4,-22,8,10);
      ctx.globalAlpha = glow;
      rect(ctx, '#c4ffd0', s*18-3,-22,6,8);
      ctx.globalAlpha = 1;
      rect(ctx, '#1f424e', s*18-1,-21,2,8);
      rect(ctx, '#ded09d', s*18-5,-25,10,2);
    }
  }

  function ribbon(ctx,c,state,time) {
    const flare = Math.sin(time * 15) * (2 + (state.speed || 0) * .012);
    ellipse(ctx,'#f49abb',0,-17,20,10);
    poly(ctx, [[-17,-23],[-8,-31],[8,-31],[17,-23],[11,-16],[0,-12],[-11,-16]], '#ffe9bd');
    for(let i=-3;i<=3;i++) {
      poly(ctx, [[0,-14],[i*4.4,-26+Math.abs(i)],[i*4.4+1,-26+Math.abs(i)]], '#e4aa82');
    }
    for(const s of [-1,1]) {
      poly(ctx, [[s*7,13],[s*14,16],[s*17+flare,28],[s*15+flare,37],[s*10+flare,32]], '#ff9fc5');
      poly(ctx, [[s*13,15],[s*16+flare,28],[s*15+flare,33],[s*14+flare,27]], '#fae0bb');
      lamp(ctx,s*17,-19,'#ffd3e7');
    }
    ellipse(ctx,'#9c3968',0,21,6,5);
    ellipse(ctx,'#ffd278',0,20,3,3);
  }

  function boiler(ctx,c) {
    ellipse(ctx,'#684538',0,-18,18,13);
    ellipse(ctx,metal(ctx,-17,35,'#c78757','#8c503a','#ffce97'),0,-19,17,11);
    ellipse(ctx,'#ffe0a1',0,-20,11,7);
    ellipse(ctx,'#49323a',0,-21,9,5);
    rect(ctx,'#ac684b',-4,-24,8,2);
    for(const s of [-1,1]) {
      const x=s*22;
      rect(ctx,'#383f43',x-4,-14,8,35);
      rect(ctx,metal(ctx,x-3,6,'#4da69a','#2d6665','#8ee9d6'),x-3,-12,6,29);
      rect(ctx,chrome(ctx,x-4,8),x-4,-9,8,3);
      rect(ctx,chrome(ctx,x-4,8),x-4,8,8,3);
      lamp(ctx,s*15,-24,'#ffd384');
    }
    for(let x=-14;x<=14;x+=7) ellipse(ctx,'#ffe6a8',x,22,1.4,1.4);
  }

  function olive(ctx,c,state,time) {
    for(let x=-12;x<=12;x+=4){
      poly(ctx,[[x,17],[x-2,-2],[x+1,-24],[x+3,-25],[x,-2],[x+2,16]],x%8 ? '#75583d' : '#d0aa6f');
    }
    ellipse(ctx,'#dbb57b',0,-24,12,9);
    ellipse(ctx,'#98794f',0,-24,8,6);
    ellipse(ctx,'#caab73',0,-24,5,4);
    ellipse(ctx,'#77583d',0,-24,2,2);
    const sway = Math.sin(time * 14) * 2;
    for(const s of [-1,1]){
      poly(ctx, [[s*13,14],[s*25,11],[s*32+sway,20],[s*23,24],[s*15,21]], '#455a4b');
      poly(ctx, [[s*15,16],[s*28+sway,16],[s*30+sway,20],[s*21,22]], '#acd579');
      rect(ctx,metal(ctx,s*14-2,4,'#b7976c','#6a6650','#f0d193'),s*14-2,-17,4,39);
    }
    for(let n=-12;n<=12;n+=6) rect(ctx,'#efd491',n,23,2,2);
  }

  const detail = {rocket, stone, lantern, ribbon, boiler, olive};

  function drawKart(ctx, car, {x, y, angle = 0, scale = 1, pilot, time = 0, state = {}}) {
    const shake = state.impact ? Math.sin(time * 90) * state.impact * 8 : 0;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;
    ellipse(ctx, '#12172375', 4, 6, 27, 34);
    ctx.translate(shake, state.braking ? -1 : 0);
    if (state.boost) {
      const pulse = 6 * Math.sin(time * 45);
      if(state.bottleBoost){
        for(const side of [-1,1]){
          poly(ctx,[[side*28,17],[side*32,22],[side*34,54+pulse],[side*28,30]],'#ffb65d');
          rect(ctx,'#fff298',side*35-1,25+pulse,2,12);
        }
      }
      for (const n of car.shape === 'rocket' ? [-15,15] : [-8,8]) {
        poly(ctx, [[n-5,25],[n+6,25],[n+4,40],[n,55+pulse],[n-4,40]], car.shape === 'lantern' ? '#6ff2c6' : '#ff9f51');
        poly(ctx, [[n-3,25],[n+3,25],[n,46+pulse]], '#fff3a1');
      }
    }
    for (const s of [-1,1]) {
      wheel(ctx,car,s*20,-17,true,s,state,time);
      wheel(ctx,car,s*22,15,false,s,state,time);
    }
    const shape = shells[car.shape];
    poly(ctx,shape.map(([a,b]) => [a*1.09,b*1.04+2]),bodyInk);
    poly(ctx,shape.map(([a,b]) => [a,b+4]), '#34313c');
    poly(ctx,shape,metal(ctx,-26,52,car.color,'#414050',car.light));
    poly(ctx,shape.map(([a,b]) => [a*.83-1,b*.83-1]),car.color);
    poly(ctx,[[0,-30],[-13,-20],[-17,-7],[-14,-7],[-9,-19]],car.light);
    detail[car.shape](ctx,car,state,time);
    poly(ctx,[[-13,-12],[13,-12],[16,0],[13,14],[-13,14],[-16,0]],'#101c2b');
    poly(ctx,[[-12,8],[12,8],[10,14],[-10,14]],'#80636b');
    rect(ctx,'#c89f91',-10,12,20,2);
    const tail = state.braking ? '#ff896f' : '#d95a5e';
    rect(ctx,tail,-15,20,5,3);
    rect(ctx,tail,10,20,5,3);
    if(state.braking){
      ellipse(ctx,'#f7776160',-13,23,10,7);
      ellipse(ctx,'#f7776160',13,23,10,7);
    }
    if(pilot) game.portrait.drawDriver(ctx,pilot,state,time);
    else {
      rect(ctx,'#5e7f88',-7,-6,14,9);
      rect(ctx,'#afc5c6',-6,-6,12,2);
      rect(ctx,'#3d535e',-5,5,10,5);
    }
    ctx.restore();
  }

  game.drawing = {poly, rect, ellipse, drawKart};
})();
