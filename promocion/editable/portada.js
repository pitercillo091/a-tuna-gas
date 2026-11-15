(() => {
  const game = globalThis.ATunaGas;
  const canvas = document.getElementById('poster');
  const ctx = canvas.getContext('2d');
  const {ellipse, poly, rect} = game.drawing;
  const layouts = {
    horizontal: {
      size: [1200, 630], title: [254, 163, 1.03], eyebrow: 76,
      copy: [254, 365, 17, 26], url: [254, 553, 20],
      view: {center: 820, horizon: 213, rise: 329, width: 3.25, car: 1.02}
    },
    cuadrada: {
      size: [1080, 1080], title: [540, 135, 1.26], eyebrow: 43,
      copy: [540, 377, 20, 26], url: [540, 1015, 25],
      view: {center: 540, horizon: 429, rise: 503, width: 4.3, car: 1.22}
    },
    vertical: {
      size: [1080, 1920], title: [540, 252, 1.67], eyebrow: 126,
      copy: [540, 580, 27, 36], url: [540, 1781, 32],
      view: {center: 540, horizon: 715, rise: 948, width: 4.43, car: 1.40}
    }
  };
  const format = new URLSearchParams(location.search).get('formato') || 'horizontal';
  const layout = layouts[format] || layouts.horizontal;
  [canvas.width, canvas.height] = layout.size;
  const w = canvas.width;
  const h = canvas.height;
  const view = layout.view;
  const track = game.tracks[0];
  const racers = [
    ['guitarra', 'adoquin', -480, 63],
    ['andres', 'perol', -400, -62],
    ['pena', 'peineta', -207, 61],
    ['canero', 'olivo', -134, -60],
    ['coki', 'farol', 109, 59],
    ['guitarra-gafas', 'cohete', 248, -13]
  ].map(([pilot, car, distance, lane]) => ({
    character: game.characters.find(item => item.id === pilot),
    vehicle: game.vehicles.find(item => item.id === car),
    distance, lane
  }));

  function project(distance, lane = 0) {
    const scale = 300 / (550 - distance);
    return {
      x: view.center - lane * view.width * scale,
      y: view.horizon + view.rise * scale,
      scale
    };
  }

  function skyline() {
    const sky = ctx.createLinearGradient(0, 0, 0, view.horizon + 120);
    sky.addColorStop(0, '#101827');
    sky.addColorStop(.51, '#233644');
    sky.addColorStop(1, '#de9071');
    rect(ctx, sky, 0, 0, w, h);

    const glow = ctx.createRadialGradient(view.center - 100, view.horizon + 60, 12,
      view.center - 100, view.horizon + 60, Math.min(w * .58, 580));
    glow.addColorStop(0, '#ffcd927e');
    glow.addColorStop(.56, '#f49a593a');
    glow.addColorStop(1, '#f49a5900');
    rect(ctx, glow, 0, 0, w, h);
    for (let i = 0; i < 15; i++) {
      const x = (i * 277 + 13) % w;
      const y = view.horizon * (.20 + (i * 9 % 59) / 100);
      const length = 56 + (i * 93) % 220;
      rect(ctx, i % 3 ? '#df997836' : '#ffd5a852', x, Math.round(y / 4) * 4, length, 3 + i % 2 * 2);
    }
    const ground = project(-660).y + 3;
    poly(ctx, [[0, ground - 22], [w * .11, ground - 61], [w * .23, ground - 43],
      [w * .36, ground - 70], [w * .5, ground - 25], [w * .68, ground - 46],
      [w * .81, ground - 81], [w, ground - 43], [w, ground + 6], [0, ground + 6]], '#454653');

    // The castle sits at the roadside in Lopera. The profile uses its square towers.
    const s = format === 'horizontal' ? .87 : 1.22;
    const x = view.center - 190 * s;
    const y = ground - 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    rect(ctx, '#503f47', -90, -57, 180, 64);
    rect(ctx, '#956953', -86, -52, 168, 58);
    for (const side of [-1, 1]) {
      const left = side * 91 - 27;
      rect(ctx, '#51404a', left, -108, 53, 114);
      rect(ctx, side === -1 ? '#bd8667' : '#a87860', left, -104, 41, 109);
      rect(ctx, '#e5aa79', left + 2, -100, 5, 102);
      for (let tooth = 0; tooth < 3; tooth++) {
        rect(ctx, '#9d725a', left + tooth * 19, -119, 14, 20);
      }
      rect(ctx, '#473845', left + 18, -83, 8, 24);
      rect(ctx, '#493a44', left + 18, -48, 8, 14);
      for (let course = 0; course < 8; course++) {
        rect(ctx, '#573f443c', left, -94 + course * 13, 40, 2);
      }
    }
    for (let tooth = -4; tooth <= 4; tooth++) {
      rect(ctx, '#ba8767', tooth * 15, -66, 11, 17);
    }
    poly(ctx, [[-20, 6], [-20, -20], [-12, -30], [0, -34], [12, -30], [20, -20], [20, 6]], '#473642');
    ctx.restore();
  }

  function course() {
    const map = game.art.scenery(track);
    const texture = document.createElement('canvas');
    const scan = texture.getContext('2d');
    const halfWidth = 620;
    const far = -660;
    const near = 405;
    texture.width = halfWidth * 2;
    texture.height = near - far + 1;
    const mapScale = map.width / track.width;

    // Align each row with its local cross-section of the game circuit before projecting it.
    for (let distance = far; distance <= near; distance += 2) {
      const row = distance - far;
      const origin = track.at(distance);
      const sine = Math.sin(origin.angle);
      const cosine = Math.cos(origin.angle);
      scan.save();
      scan.beginPath();
      scan.rect(0, row, texture.width, 2);
      scan.clip();
      scan.setTransform(sine / mapScale, cosine / mapScale, -cosine / mapScale, sine / mapScale,
        halfWidth - origin.x * sine + origin.y * cosine, row - origin.x * cosine - origin.y * sine);
      scan.drawImage(map, 0, 0);
      scan.restore();
    }

    ctx.imageSmoothingEnabled = false;
    const groundY = Math.floor(project(far).y);
    for (let y = groundY; y < h; y++) {
      const scale = (y - view.horizon) / view.rise;
      const distance = 550 - 300 / scale;
      const row = Math.round(distance) - far;
      if (row < 0 || row >= texture.height) continue;
      const projectedWidth = texture.width * view.width * scale;
      ctx.drawImage(texture, 0, row, texture.width, 1, view.center - projectedWidth / 2,
        y, projectedWidth, 1);
    }

    const haze = ctx.createLinearGradient(0, groundY, 0, h);
    haze.addColorStop(0, '#eab08a6b');
    haze.addColorStop(.20, '#d68b6410');
    haze.addColorStop(.61, '#1c344c16');
    haze.addColorStop(1, '#111a31a8');
    rect(ctx, haze, 0, groundY, w, h - groundY);
    const shade = format === 'horizontal'
      ? ctx.createLinearGradient(0, 0, w * .63, 0)
      : ctx.createLinearGradient(0, 0, 0, view.horizon + 170);
    shade.addColorStop(0, '#101927f2');
    shade.addColorStop(.58, '#111c2db6');
    shade.addColorStop(1, '#101a2900');
    rect(ctx, shade, 0, 0, w, h);
  }

  function speedStreaks() {
    for (let i = 0; i < 32; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const distance = -84 + (i * 73 % 432);
      const lane = side * (104 + (i * 47 % 123));
      const a = project(distance, lane);
      const b = project(distance + 16 + i % 6 * 7, lane);
      const tint = i % 4 === 0 ? '#ffcc83b5' : '#e8a06d60';
      poly(ctx, [[a.x, a.y], [b.x, b.y], [b.x + 4 * b.scale, b.y], [a.x + 1, a.y]], tint);
    }
  }

  function drawRacer(racer) {
    const position = project(racer.distance, racer.lane);
    const scale = position.scale * view.car;
    const {x, y} = position;
    const light = ctx.createRadialGradient(x, y - 4, 1, x, y - 4, 155 * scale);
    light.addColorStop(0, racer.vehicle.light + '80');
    light.addColorStop(1, racer.vehicle.light + '00');
    ellipse(ctx, light, x, y + 7, 155 * scale, 48 * scale);
    const portraitScale = racer.distance < 0 ? 1.48 : 1.35;
    game.sequences.paintFront(ctx, racer, x, y - 86 * scale, scale, 0, portraitScale);
    if (racer.distance < 0) return;
    for (let i = 0; i < 18; i++) {
      const direction = i % 2 === 0 ? 1 : -1;
      const dx = direction * (118 + (i * 23 % 60)) * scale;
      const dy = (i * 17 % 44) * scale;
      const length = (9 + (i * 19 % 27)) * scale;
      poly(ctx, [[x + dx, y - dy], [x + dx + direction * length, y - dy + length * .33],
        [x + dx + direction * (length - 7 * scale), y - dy + length * .33 + 1.5]], i % 3 ? '#ec9f5cc0' : '#fff1a1');
    }
  }

  function title(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.transform(1, 0, -.19, 1, 0, 0);
    ctx.textAlign = 'center';
    const lines = [
      ['A TUNA', 14, 83, ['#fff9e5', '#f5dfbe', '#aebbc4', '#fff7d3']],
      ['GAS', 138, 154, ['#fff3c0', '#ffcd78', '#f5a34d', '#e76f3d']]
    ];
    for (const [word, baseline, size, colors] of lines) {
      ctx.font = size + 'px "Archivo Black"';
      const metal = ctx.createLinearGradient(0, baseline - size * .75, 0, baseline);
      colors.forEach((color, index) => metal.addColorStop([0, .38, .58, 1][index], color));
      ctx.lineJoin = 'round';
      for (let depth = 13; depth >= 1; depth--) {
        ctx.fillStyle = depth > 7 ? '#161a2d' : '#824e4d';
        ctx.fillText(word, depth * .72, baseline + depth);
      }
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#282338';
      ctx.strokeText(word, 0, baseline);
      ctx.fillStyle = metal;
      ctx.fillText(word, 0, baseline);
    }
    for (let i = 0; i < 3; i++) {
      const shine = ctx.createLinearGradient(-183, 0, 171, 0);
      shine.addColorStop(0, '#f58e4d00');
      shine.addColorStop(.26, '#df7c50');
      shine.addColorStop(.75, '#ffe59b');
      shine.addColorStop(1, '#ffe59b00');
      rect(ctx, shine, -182 + i * 19, 159 + i * 7, 351 - i * 36, i === 0 ? 3 : 2);
    }
    ctx.restore();
  }

  function typography() {
    const [x, y, size, leading] = layout.copy;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd18d';
    ctx.font = size + 'px "Space Mono"';
    ctx.fillText('RONDALLA DE LOPERA', x, layout.eyebrow);
    title(...layout.title);

    ctx.font = '800 ' + Math.round(size * 1.2) + 'px Inter';
    ctx.fillText('15 PILOTOS  ·  30 CIRCUITOS', x, y);
    ctx.fillStyle = '#fff5e5';
    ctx.font = '600 ' + size + 'px Inter';
    ctx.fillText('Con PITER, Coki, Cañero y compañía.', x, y + leading * 1.2);
    ctx.fillText('Lopera, Arjona, Baños de la Encina,', x, y + leading * 2.3);
    ctx.fillText('Jaén, Córdoba y otros pueblos.', x, y + leading * 3.25);
    ctx.fillStyle = '#ffcf86';
    ctx.font = '800 ' + size + 'px Inter';
    ctx.fillText('¿Serás capaz de hacer el mejor tiempo?', x, y + leading * 4.55);

    const [urlX, urlY, urlSize] = layout.url;
    if (format !== 'horizontal') {
      const fade = ctx.createLinearGradient(0, urlY - 138, 0, h);
      fade.addColorStop(0, '#10182700');
      fade.addColorStop(.64, '#101827ed');
      fade.addColorStop(1, '#101827');
      rect(ctx, fade, 0, urlY - 138, w, h - urlY + 138);
    }
    ctx.font = '800 ' + urlSize + 'px Inter';
    const url = 'atunagas.aquiestalatuna.es';
    const band = ctx.measureText(url).width + 52;
    rect(ctx, '#141c2de8', urlX - band / 2, urlY - urlSize - 10, band, urlSize + 24);
    rect(ctx, '#eabe79', urlX - band / 2 + 18, urlY - urlSize - 10, band - 36, 2);
    ctx.fillStyle = '#fff4df';
    ctx.fillText(url, urlX, urlY);
  }

  async function paint() {
    await Promise.all([game.art.ready, game.sequences.ready, document.fonts.load('83px "Archivo Black"'),
      document.fonts.load('27px "Space Mono"'), document.fonts.load('600 28px Inter'),
      document.fonts.load('800 28px Inter')]);
    skyline();
    course();
    speedStreaks();
    racers.forEach(drawRacer);
    typography();
    rect(ctx, '#e6ba79', 0, 0, w, 3);
    rect(ctx, '#ce8b5f', 0, h - 4, w, 4);
    window.posterReady = true;
  }
  paint().catch(error => { window.posterError = error.message; console.error(error); });
})();
