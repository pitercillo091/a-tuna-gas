(() => {
  const game = globalThis.ATunaGas;
  game.trackSpecs = [];
  const curve = (a, b, c, d, t) =>
    (a * (1 - t) ** 3 + b * (3 * t ** 3 - 6 * t ** 2 + 4) +
      c * (-3 * t ** 3 + 3 * t ** 2 + 3 * t + 1) + d * t ** 3) / 6;

  function sampleProfile(profile, fraction, fallback) {
    if (!profile) return fallback;
    const n = profile.findIndex(([position]) => position > fraction);
    if (n < 1) return profile.at(n < 0 ? -1 : 0)[1];
    const [left, a] = profile[n - 1];
    const [right, b] = profile[n];
    const t = (fraction - left) / (right - left);
    return a + (b - a) * t * t * (3 - 2 * t);
  }

  function createTrack(spec) {
    const count = spec.anchors.length;
    const anchor = i => spec.anchors[(i + count) % count];
    const samples = [];
    for (let i = 0; i < count; i++) {
      const [a, b, c, d] = [i - 1, i, i + 1, i + 2].map(anchor);
      for (let j = 0; j < 24; j++) {
        const t = j / 24;
        samples.push({x: curve(a[0], b[0], c[0], d[0], t),
          y: curve(a[1], b[1], c[1], d[1], t)});
      }
    }
    let total = 0;
    function segment(p, next, s) {
      const dx = next.x - p.x;
      const dy = next.y - p.y;
      return {...p, s, dx, dy, len: Math.hypot(dx, dy), angle: Math.atan2(dy, dx)};
    }
    samples.forEach((p, i) => {
      const edge = segment(p, samples[(i + 1) % samples.length], total);
      Object.assign(p, edge);
      total += p.len;
    });
    const wrap = d => ((d % total) + total) % total;
    const delta = (a, b) => wrap(a - b + total / 2) - total / 2;
    const roadAt = s => sampleProfile(spec.widths, wrap(s) / total, spec.road);
    const elevation = s => sampleProfile(spec.elevations, wrap(s) / total, 0);
    const slope = s => spec.elevations ? (elevation(s + 20) - elevation(s - 20)) / 40 : 0;

    function at(distance, offset = 0) {
      const s = wrap(distance);
      let lo = 0;
      let hi = samples.length - 1;
      while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        if (samples[mid].s <= s) lo = mid;
        else hi = mid - 1;
      }
      const p = samples[lo];
      const ahead = (s - p.s) / p.len;
      return {x: p.x + p.dx * ahead - p.dy / p.len * offset,
        y: p.y + p.dy * ahead + p.dx / p.len * offset, angle: p.angle};
    }

    let branch = [];
    let branchLength = 0;
    const fork = spec.shortcut;
    const branchStart = fork ? fork.start * total : 0;
    const branchEnd = fork ? fork.end * total : 0;
    if (fork) {
      const a = at(branchStart);
      const d = at(branchEnd);
      const handle = Math.hypot(d.x - a.x, d.y - a.y) * .28;
      const b = {x: a.x + Math.cos(a.angle) * handle, y: a.y + Math.sin(a.angle) * handle};
      const c = {x: d.x - Math.cos(d.angle) * handle, y: d.y - Math.sin(d.angle) * handle};
      const points = Array.from({length: 91}, (_, i) => {
        const t = i / 90;
        const u = 1 - t;
        const blend = key => u ** 3 * a[key] + 3 * u * u * t * b[key] +
          3 * u * t * t * c[key] + t ** 3 * d[key];
        return {x: blend('x'), y: blend('y')};
      });
      branch = points.slice(0, -1).map((p, i) => {
        const edge = segment(p, points[i + 1], branchLength);
        branchLength += edge.len;
        return edge;
      });
    }

    function atBranch(distance, offset = 0) {
      const d = Math.max(0, Math.min(branchLength, (distance - branchStart) / (branchEnd - branchStart) * branchLength));
      const p = branch.find(edge => d < edge.s + edge.len) || branch.at(-1);
      return {x: p.x + Math.cos(p.angle) * (d - p.s) - Math.sin(p.angle) * offset,
        y: p.y + Math.sin(p.angle) * (d - p.s) + Math.cos(p.angle) * offset, angle: p.angle};
    }

    function project(x, y, near, onBranch = false) {
      let best2 = Infinity;
      let best;
      function consider(p, rival) {
        const d = ((x - p.x) * p.dx + (y - p.y) * p.dy) / p.len ** 2;
        const t = Math.max(0, Math.min(1, d));
        const along = p.s + p.len * t;
        const s = rival ? branchStart + along / branchLength * (branchEnd - branchStart) : wrap(along);
        if (near !== undefined && Math.abs(delta(s, near)) > 180) return;
        const cx = p.x + t * p.dx;
        const cy = p.y + t * p.dy;
        const dx = x - cx;
        const dy = y - cy;
        const distance2 = dx * dx + dy * dy;
        // A small preference keeps the current lane at the point where both roads meet.
        const score = distance2 + (rival === onBranch ? 0 : 32);
        if (score < best2) {
          best2 = score;
          best = {s, x: cx, y: cy, offset: (dy * p.dx - dx * p.dy) / p.len,
            angle: p.angle, branch: rival, road: rival ? fork.width : roadAt(s)};
        }
      }
      for (const p of samples) {
        if (near !== undefined && Math.abs(delta(p.s, near)) > 180 + p.len) continue;
        consider(p, false);
      }
      if (fork && (near === undefined || (near >= branchStart - 180 && near <= branchEnd + 180))) {
        for (const p of branch) consider(p, true);
      }
      return best;
    }

    return {...spec, samples, total, wrap, delta, at, roadAt, project, elevation, slope, branch,
      branchStart, branchEnd, branchLength, atBranch};
  }
  game.createTrack = createTrack;
})();
