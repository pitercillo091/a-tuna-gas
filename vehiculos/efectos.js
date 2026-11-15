(() => {
  const game = globalThis.ATunaGas;
  const {ellipse, rect} = game.drawing;
  function effects(ctx, car, time) {
    if (car.boxPulse > 0) {
      const phase = 1 - car.boxPulse / .42;
      ctx.save();
      ctx.globalAlpha = 1 - phase;
      ctx.strokeStyle = '#ffda88';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(car.x, car.y, 26 + 100 * phase, 20 + 74 * phase, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (car.boxSlow > 0) {
      ellipse(ctx, '#ac3d5865', car.x, car.y + 7, 29, 20);
      for (let i = 0; i < 4; i++) {
        const x = car.x - 21 + i * 13;
        const y = car.y + 16 + Math.sin(time * 11 + i) * 6;
        rect(ctx, '#fa765e', x, y, 4, 3);
      }
    }
    const angle = car.angle;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const slip = car.drifting ? 1 : car.braking ? .55 : 0;
    const exhaust = car.throttle && car.speed > 35;
    if (slip || exhaust) {
      const color = exhaust && !slip && car.vehicle.shape === 'boiler' ? '#acf4df' : '#efd4ab';
      ctx.save();
      for (let i = 0; i < (slip ? 9 : 4); i++) {
        const phase = (time * (slip ? 2.2 : 1.4) + i * .131) % 1;
        const trail = 24 + phase * (slip ? 70 : 47);
        const side = (i % 2 ? 1 : -1) * (12 + phase * 9);
        const x = car.x - dx * trail - dy * side;
        const y = car.y - dy * trail + dx * side;
        ctx.globalAlpha = (1 - phase) * (slip ? .56 : .32);
        ellipse(ctx, color, x, y, 3 + phase * 8, 2.5 + phase * 6);
        if (car.drifting && car.driftCharge > .3) {
          rect(ctx, '#ffba5e', x + 1, y + 3, 2, 2);
        }
      }
      ctx.restore();
    }
    if (car.impact > 0) {
      const phase = 1 - car.impact / .34;
      ctx.save();
      ctx.globalAlpha = 1 - phase;
      for (let i = 0; i < 9; i++) {
        const a = i * 2.399 + angle;
        const radius = 23 + phase * (22 + (i % 3) * 15);
        const x = car.x + Math.cos(a) * radius;
        const y = car.y + Math.sin(a) * radius;
        rect(ctx, i % 2 ? '#fff1aa' : '#fa9165', x, y, i % 3 + 2, 2);
      }
      ctx.restore();
    }
  }

  function labels(ctx, cars, player, camX, camY, scale, w, h) {
    const fontSize = w > 520 ? 12 : 10;
    const height = fontSize + 5;
    const positions = [player, ...cars.filter(rival => rival !== player).sort((a,b) => a.index - b.index)]
      .map(car => ({car, x: (car.x - camX) * scale, y: (car.y - camY) * scale}))
      .filter(({x,y}) => x > 6 && x < w - 6 && y > 48 && y < h - 7);
    const occupied = positions.map(({x,y}) =>
      ({left:x - 21 * scale, top:y - 24 * scale, right:x + 21 * scale, bottom:y + 20 * scale}));
    const collides = (label, other) => label.left < other.right + 3 && label.right > other.left - 3 &&
      label.top < other.bottom + 3 && label.bottom > other.top - 3;
    ctx.font = '800 ' + fontSize + 'px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const {car,x,y} of positions) {
      const name = car.character.name;
      const width = Math.ceil(ctx.measureText(name).width) + 12;
      const candidates = [
        [0,-35 * scale - height],[0,33 * scale],
        [-30 * scale - width / 2,-height / 2],[30 * scale + width / 2,-height / 2],
        [-33 * scale,-48 * scale - height],[36 * scale,-48 * scale - height],
        [-36 * scale,44 * scale],[36 * scale,44 * scale],[0,-63 * scale - height]
      ];
      const label = candidates.map(([dx,dy]) => {
        const left = Math.round(Math.max(4, Math.min(w - width - 4,x + dx - width / 2)));
        const top = Math.round(y + dy);
        return {left, right:left + width, top, bottom:top + height};
      }).find(rect => rect.top > 45 && rect.bottom < h - 5 && !occupied.some(other => collides(rect,other)));
      if (!label) continue;
      const {left,top} = label;
      occupied.push(label);
      const cx = left + width / 2;
      const cy = top + height / 2;
      const angle = Math.atan2(cy - y,cx - x);
      ctx.strokeStyle = car === player ? '#ffe299' : '#d2d7dd90';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * 23 * scale, y + Math.sin(angle) * 21 * scale);
      ctx.lineTo(cx,cy);
      ctx.stroke();
      rect(ctx, '#141c2af0', left, top, width, height);
      rect(ctx, car === player ? '#ffcf68' : car.vehicle.light, left, top, width, 2);
      ctx.fillStyle = car === player ? '#ffe8a9' : '#fbf6e8';
      ctx.fillText(name, cx, top + height * .57);
    }
  }
  game.raceEffects = {effects, labels};
})();
