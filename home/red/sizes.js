// The zoom from a street in New York down to the Planck length, shared by red's homepage (after
// the street, red/story.js) and the scale-of-the-universe app (below a few metres,
// projects/play/scale/small.js). One file, so both show the same things the same way.
//
// The way down: a man walking a beagle puppy past on the sidewalk, a honey bee flying past and a
// hair drifting past (the zoom goes by them, never into them), into a droplet from a cough with ragweed pollen and dust beside it, a cheek cell inside the droplet
// with the bacteria of a mouth on it, the cell's nucleus, the nuclear envelope with its pores and
// viruses waiting at them, DNA wound round histones under the envelope, the double helix, one
// adenine–thymine base pair with water round it, adenine's N1 nitrogen atom, the empty space in
// that atom, its nitrogen-14 nucleus, one proton and its quarks, and then one quark, below which
// no object has been measured, only lengths: the smallest change LIGO detects, the smallest
// length a collider has reached, a neutrino's target, the wavelength of the most energetic
// cosmic ray, where theory puts grand unification (dashed), then the Planck length. No objects
// are drawn there, because none has been seen.
//
// Measured: every figure on a dimension line, each in SIZES with where it was looked up (also in
// tools/homepage/RED.md and the scale app's notes), and how many molecules a cubic metre of water
// holds (3.34 × 10²⁸, from 1,000 kg/m³ and 18.015 g/mol). Worked out from measurements: the weak
// force's reach and the length a 13.6 TeV collision reaches. Left out on purpose: the lengths
// only theories name (grand unification, the seesaw, strings) and pictures of the vacuum
// (spacetime foam, particles flickering in and out). Drawn, not measured: every shape beyond those
// figures, colours, motion, and where each thing sits.
//
// Everything is built in metres from simple solids (ellipsoids, tapered rods, flat plates and
// lines) and seen in perspective from an eye 3.02 m from the middle of the frame, so the whole
// scene turns in 3D: `turn` is a 3×3 row-major rotation (the identity when absent) applied on
// top of the zoom's own view. Words and dimension lines are red/ink.js's.
const redSizes = (() => {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const mix = (a, b, t) => a + (b - a) * t;
  const seeded = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const hash = (a, b = 0, c = 0) => { const v = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return v - Math.floor(v); };
  // Words on the drawing are red/ink.js's; these are its lines, made once.
  const lineMemo = new Map(), linesOf = text => { let l = lineMemo.get(text); if (!l) { l = [text]; lineMemo.set(text, l); } return l; };
  const EMPTY_WIDE = ['Empty space', 'The nucleus is about 60,000 times narrower than the atom'], EMPTY_NARROW = ['Empty space', 'The atom is 60,000 times wider', 'than its nucleus'];
  const QUARKS = ['Up', 'Up', 'Down'];

  // ── small 3D kit ─────────────────────────────────────────────────────────────────────────
  const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const mul = (a, b) => { const r = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r.push(a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]); return r; };
  const apply = (m, p) => [m[0] * p[0] + m[1] * p[1] + m[2] * p[2], m[3] * p[0] + m[4] * p[1] + m[5] * p[2], m[6] * p[0] + m[7] * p[1] + m[8] * p[2]];
  const rotX = t => { const c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, c, -s, 0, s, c]; };
  const rotY = t => { const c = Math.cos(t), s = Math.sin(t); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
  const rotZ = t => { const c = Math.cos(t), s = Math.sin(t); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const times = (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = a => times(a, 1 / (Math.hypot(...a) || 1));
  const flat = m => !m ? I3 : Array.isArray(m[0]) ? [...m[0], ...m[1], ...m[2]] : m;
  const T3 = m => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
  const columns = (x, y, z) => [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]];
  // A frame with `out` as its z and `up` (made square to it) as its y.
  const frameOf = (up, out) => { const z = unit(out), y = unit(sub(up, times(z, dot(up, z)))); return columns(cross(y, z), y, z); };
  // Rotations as unit quaternions [w, x, y, z], to ease from one view to another.
  function quatOf(m) {
    const [a, b, c, d, e, f, g, h, i] = m, tr = a + e + i;
    if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; return [s / 4, (h - f) / s, (c - g) / s, (d - b) / s]; }
    if (a > e && a > i) { const s = Math.sqrt(1 + a - e - i) * 2; return [(h - f) / s, s / 4, (b + d) / s, (c + g) / s]; }
    if (e > i) { const s = Math.sqrt(1 + e - a - i) * 2; return [(c - g) / s, (b + d) / s, s / 4, (f + h) / s]; }
    const s = Math.sqrt(1 + i - a - e) * 2; return [(d - b) / s, (c + g) / s, (f + h) / s, s / 4];
  }
  const fromQuat = ([w, x, y, z]) => [1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y), 2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x),
    2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)];
  function slerp(a, b, t) {
    let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    if (d < 0) { b = b.map(c => -c); d = -d; }
    if (d > .9995) { const q = a.map((c, i) => c + (b[i] - c) * t), n = Math.hypot(...q); return q.map(c => c / n); }
    const angle = Math.acos(d), s = Math.sin(angle);
    return a.map((c, i) => c * Math.sin((1 - t) * angle) / s + b[i] * Math.sin(t * angle) / s);
  }
  // Light comes from the upper left of the screen and a little in front.
  const LIGHT = [-.55, -.83], LIGHT3 = unit([-.45, .62, .64]);

  // Tones of a colour, made once each (a canvas colour passes through the theme, which caches).
  const tones = new Map();
  function tone(hex, k) {
    k = Math.round(k * 20) / 20; const key = hex + k; let t = tones.get(key); if (t) return t;
    const n = parseInt(hex.slice(1, 7), 16);
    t = '#' + [n >> 16, n >> 8 & 255, n & 255].map(c => Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k)).toString(16).padStart(2, '0')).join('');
    tones.set(key, t); return t;
  }

  // ── sizes ────────────────────────────────────────────────────────────────────────────────
  // Metres, with where each was looked up (links in tools/homepage/RED.md and the scale app):
  // a beagle puppy, drawn 28 cm at the shoulder (adult beagles are 13 to 15 in, AKC). A worker
  // honey bee is 12 to 15 mm long (PBS Nature), drawn 13 mm. A human hair is about 100 µm across
  // (Microbe Online). Ragweed pollen is about 20 µm. Fine dust is PM2.5 by definition. Coughs throw
  // droplets from under 5 µm to over 100 µm; drawn 140 µm. A cheek (buccal) cell is 47 to 73 µm
  // across with a nucleus of 7 to 9 µm (cytomorphometry of buccal smears, J. Cytology). E. coli is
  // about 2 µm long; Staphylococcus and Streptococcus cells about 1 µm (Microbe Online). A nuclear
  // pore complex is 120 nm across in vertebrates (BioNumbers 103695). Adenovirus is about 90 nm
  // (J. Virol. 2015); influenza and SARS-CoV-2 about 100 nm; rhinovirus about 30 nm; a ribosome
  // about 25 nm. A nucleosome is about 11 × 11 × 6 nm (Suau et al. 1977), its DNA wrapped 1.65
  // turns (Luger et al., Nature 1997). B-DNA is 2 nm across, 3.4 nm a turn (Rotel, Genetics).
  // The A–T pair's atoms follow the standard base geometry (Olson et al., J. Mol. Biol. 313, 2001,
  // as used by 3DNA), set so that adenine's N1 is 2.88 Å from thymine's N3, the ideal B-DNA
  // figure 3DNA gives. Water: O–H 95.7 pm, H–O–H 104.5° (Britannica). Van der Waals radii:
  // nitrogen 155 pm, oxygen 152 pm, hydrogen 120 pm (Bondi 1964). Nitrogen-14's charge radius,
  // 2.5582 fm (Angeli and Marinova 2013); the proton's, 0.84075 fm (CODATA 2022). A quark has
  // shown no size down to 0.43 × 10⁻¹⁸ m (ZEUS, Phys. Lett. B 757, 2016). The Planck length,
  // 1.616255 × 10⁻³⁵ m (CODATA 2018).
  const SIZES = { dog: .28, bee: 13e-3, hair: 100e-6, pollen: 20e-6, dust: 2.5e-6, droplet: 140e-6, cell: 55e-6, nucleus: 8.5e-6, ecoli: 2e-6, coccus: 1e-6,
    pore: 120e-9, adeno: 90e-9, flu: 100e-9, rhino: 30e-9, ribosome: 25e-9, nucleosome: 11e-9, dna: 2e-9, turn: 3.4e-9, hbond: .288e-9, oh: 95.7e-12, angle: 104.5,
    nitrogen: 155e-12, oxygen: 152e-12, hydrogen: 120e-12, nucleus14: 2.5582e-15, proton: .84075e-15, quark: .43e-18, weak: 2.5e-18, ligo: 1e-19, collider: 1.5e-20, neutrino: 4.7e-22, cosmic: 6.2e-28, gut: 2e-32, planck: 1.616255e-35 };
  const WATER = 3.34e28;                                            // molecules a cubic metre of liquid water
  // The street's framing as it hands over (red/street.js APPROACH): an eye 1.05 m up, 2.6 m from
  // a point 0.7 m over the sidewalk, where a 1.75 m figure would fill 70% of the frame's height.
  const HAND = { eye: 1.05, distance: 2.6, aim: .7 };
  const EYE = Math.hypot(HAND.distance, HAND.eye - HAND.aim), PITCH = Math.atan2(HAND.eye - HAND.aim, HAND.distance);
  // How much of the frame's height a 1.75 m figure fills at the street's last framing: 70% on a
  // wide screen; less on a tall one, so that the frame is never under about 2.4 m across and
  // the bicycle fits on a phone (Brandon, 2026-11-21, tests on his phone). red/street.js frames
  // the street by the same rule (`fill`).
  const fillOf = (w, h) => Math.min(.7, .742 * w / h);
  const FRAMING = (() => { const c = Math.cos(PITCH), s = Math.sin(PITCH), D = HAND.distance, E = HAND.eye, at = z => (D * s + (z - E) * c) / (D * c - (z - E) * s); return 1 / (at(1.75) - at(0)); })();

  // ── one frame's view ─────────────────────────────────────────────────────────────────────
  // A placed thing: local points (in its own units, `k` metres each, turned by `rot`) to the screen.
  function placed(view, pos, rot, k) {
    const N = mul(view.R, rot), A = N.map(x => x * k), o = apply(view.R, sub(pos, view.C));
    const v = p => [o[0] + A[0] * p[0] + A[1] * p[1] + A[2] * p[2], o[1] + A[3] * p[0] + A[4] * p[1] + A[5] * p[2], o[2] + A[6] * p[0] + A[7] * p[1] + A[8] * p[2]];
    const s = p => view.screen(v(p));
    // A point of the scene in this thing's own units.
    const local = q => times(apply(T3(rot), sub(q, pos)), 1 / k);
    // Where the line of sight through the middle of the frame meets this thing's plane z = 0.
    const middle = () => { const c = local(view.C), e = apply(T3(N), [0, 0, 1]); return Math.abs(e[2]) < .05 ? c : sub(c, times(e, c[2] / e[2])); };
    return { A, N, o, k, px: view.px * k, v, s, local, middle, view, rot, pos };
  }

  // The builder each thing draws itself with. Shapes go into `items`, painted far to near.
  let SIZE = 0;                                                       // the span of the thing being built, for `fewest`
  function builder(pl, items, dims, names, alpha, focus, time) {
    const { A, px } = pl, P = pl.view.px;
    const B = { pl, time, alpha, focus, px };
    B.as = a => builder(pl, items, dims, names, a, focus, time);
    // The same items, from a frame at `at` (local) turned by `rot` within this one.
    B.child = (at, rot) => builder(placed(pl.view, add(pl.pos, apply(pl.rot, times(at, pl.k))), mul(pl.rot, rot), pl.k), items, dims, names, alpha, focus, time);
    // The same items, from a frame of its own: at `pos` (metres), turned by `rot`, `k` metres a unit.
    B.frame = (pos, rot, k, f = focus) => builder(placed(pl.view, pos, rot, k), items, dims, names, alpha, f, time);
    // A local point in metres, and a local turn as a turn of the scene.
    B.world = p => add(pl.pos, apply(pl.rot, times(p, pl.k)));
    B.turned = r => mul(pl.rot, r);
    // The way to the eye, in local axes.
    B.eye = () => apply(T3(pl.N), [0, 0, 1]);
    // An ellipsoid: centre, semi-axes, colour; o.q turns it in its own frame.
    B.e = (c, r, ink, o = {}) => {
      const M = o.q ? mul(A, o.q) : A, s = pl.s(c), f = s[3] * P;
      const b0 = [M[0] * r[0], M[1] * r[1], M[2] * r[2]].map(x => x * f), b1 = [M[3] * r[0], M[4] * r[1], M[5] * r[2]].map(x => -x * f);
      const xx = dot(b0, b0), xy = dot(b0, b1), yy = dot(b1, b1), m = (xx + yy) / 2, d = Math.sqrt(((xx - yy) / 2) ** 2 + xy * xy);
      const r1 = Math.sqrt(m + d), r2 = Math.sqrt(Math.max(0, m - d)), th = .5 * Math.atan2(2 * xy, xx - yy);
      if (r1 < .3 || (s[0] + r1 < -40 || s[0] - r1 > pl.view.w + 40 || s[1] + r1 < -40 || s[1] - r1 > pl.view.h + 40)) return;
      const a = alpha * (o.alpha ?? 1); if (a < .005) return;
      items.push({ z: s[2] + (o.bias || 0) * pl.k, draw: ctx => blob(ctx, s[0], s[1], r1, Math.max(r2, .35), th, ink, a, o.flat) });
    };
    // A rod tapering from radius ra at a to rb at b, with round ends.
    B.k = (a, ra, b, rb, ink, o = {}) => {
      const p = pl.s(a), q = pl.s(b), r1 = ra * px * p[3], r2 = rb * px * q[3], R = Math.max(r1, r2); if (R < .25) return;
      if (Math.max(p[0], q[0]) + R < -40 || Math.min(p[0], q[0]) - R > pl.view.w + 40 || Math.max(p[1], q[1]) + R < -40 || Math.min(p[1], q[1]) - R > pl.view.h + 40) return;
      const al = alpha * (o.alpha ?? 1); if (al < .005) return;
      items.push({ z: (p[2] + q[2]) / 2 + (o.bias || 0) * pl.k, draw: ctx => rod(ctx, p[0], p[1], Math.max(r1, .3), q[0], q[1], Math.max(r2, .3), ink, al) });
    };
    // Rods along a path, radii at each point.
    B.chain = (pts, radii, ink, o) => { for (let i = 1; i < pts.length; i++) B.k(pts[i - 1], radii[i - 1], pts[i], radii[i], ink, o); };
    // A flat plate; lit by the way it faces.
    B.p = (pts, ink, o = {}) => {
      const a = alpha * (o.alpha ?? 1); if (a < .005) return;
      const s = pts.map(pl.s), v = pts.slice(0, 3).map(pl.v), n = unit(cross(sub(v[1], v[0]), sub(v[2], v[0])));
      const lit = Math.abs(dot(n, LIGHT3)), fill = o.plain ? ink : tone(ink, -.3 + .45 * lit), z = s.reduce((t, p) => t + p[2], 0) / s.length + (o.bias || 0) * pl.k;
      items.push({ z, draw: ctx => { ctx.globalAlpha = a; ctx.fillStyle = fill; ctx.beginPath(); s.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill();
        if (o.edge) { ctx.globalAlpha = a * (o.edgeAlpha ?? .6); ctx.strokeStyle = o.edge; ctx.lineWidth = o.edgeWidth ?? .8; ctx.stroke(); } } });
    };
    // A line through points, `wid` wide (local units), never thinner than o.min pixels.
    B.l = (pts, wid, ink, o = {}) => {
      const a = alpha * (o.alpha ?? 1); if (a < .005 || pts.length < 2) return;
      const s = pts.map(pl.s), lw = Math.max(o.min ?? .7, wid * px * s[0][3]), z = s.reduce((t, p) => t + p[2], 0) / s.length + (o.bias || 0) * pl.k;
      items.push({ z, draw: ctx => { ctx.globalAlpha = a; ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.lineCap = ctx.lineJoin = 'round'; if (o.dash) ctx.setLineDash(o.dash); ctx.beginPath(); s.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); if (o.dash) ctx.setLineDash([]); } });
    };
    // A flat disc (a circle in the plane of e1, e2) as a filled ellipse, painted by `paint`.
    B.disc = (c, e1, e2, radius, paint, z) => {
      const s = pl.s(c), a1 = pl.s(add(c, times(e1, radius))), a2 = pl.s(add(c, times(e2, radius)));
      const m = [a1[0] - s[0], a1[1] - s[1], a2[0] - s[0], a2[1] - s[1]];
      if (Math.abs(m[0] * m[3] - m[1] * m[2]) < .01) return;
      items.push({ z: z ?? s[2], draw: ctx => { ctx.save(); ctx.translate(s[0], s[1]); ctx.transform(m[0], m[1], m[2], m[3], 0, 0); paint(ctx); ctx.restore(); } });
    };
    // A soft shadow on the ground under a thing standing at local (x, 0, z).
    B.shadow = (x, z, rx, rz) => {
      const s = pl.s([x, 0, z]), a1 = pl.s([x + rx, 0, z]), a2 = pl.s([x, 0, z + rz]), m = [a1[0] - s[0], a1[1] - s[1], a2[0] - s[0], a2[1] - s[1]];
      if (Math.max(rx, rz) * px < 2 || Math.abs(m[0] * m[3] - m[1] * m[2]) < .01) return;
      items.push({ z: -1e30, draw: ctx => { ctx.save(); ctx.globalAlpha = alpha * .55; ctx.translate(s[0], s[1]); ctx.transform(m[0], m[1], m[2], m[3], 0, 0);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, '#020504'); g.addColorStop(1, '#02050400'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore(); } });
    };
    // Anything else, drawn at the depth of a local point.
    B.f = (c, draw, bias = 0) => { const s = pl.s(c); items.push({ z: s[2] + bias * pl.k, draw: ctx => draw(ctx, s) }); };
    // A dimension: feature points a and b, measured along the line between them, set out in
    // the direction `dir` to where dot(point, dir) = at. Text is the measured figure.
    B.dim = (a, b, dir, at, text, o = {}) => {
      const f = o.focus ?? focus; if (f < .02) return;
      const A2 = add(a, times(dir, at - dot(a, dir))), B2 = add(b, times(dir, at - dot(b, dir)));
      dims.push({ a: pl.s(a), b: pl.s(b), A: pl.s(A2), B: pl.s(B2), text, alpha: alpha * f, radius: o.radius, short: o.short, size: o.size ?? SIZE });
    };
    // A radius: from the centre c out to the edge point e.
    B.radius = (c, e, text, f = focus) => { if (f > .02) { const p = pl.s(c), q = pl.s(e); dims.push({ a: p, b: q, A: p, B: q, text, alpha: alpha * f, radius: true, size: SIZE }); } };
    B.name = (c, text, o = {}) => { const f = o.focus ?? focus; if (f > .02) names.push({ at: pl.s(c), lines: linesOf(text), alpha: alpha * f, leader: o.leader, size: o.size ?? SIZE }); };
    return B;
  }
  // A shaded ellipse.
  function blob(ctx, x, y, r1, r2, th, ink, alpha, plain) {
    ctx.globalAlpha = alpha;
    if (plain || r1 < 1.5) { ctx.fillStyle = ink; ctx.beginPath(); ctx.ellipse(x, y, r1, r2, th, 0, TAU); ctx.fill(); return; }
    ctx.save(); ctx.translate(x, y); ctx.rotate(th); ctx.scale(r1, r2);
    const c = Math.cos(th), s = Math.sin(th), lx = LIGHT[0] * c + LIGHT[1] * s, ly = -LIGHT[0] * s + LIGHT[1] * c;
    const g = ctx.createRadialGradient(lx * .42, ly * .42, 0, 0, 0, 1);
    g.addColorStop(0, tone(ink, .26)); g.addColorStop(.55, ink); g.addColorStop(1, tone(ink, -.4));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
  }
  // A rod: the outline round two circles, shaded across.
  function rod(ctx, x1, y1, r1, x2, y2, r2, ink, alpha) {
    const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
    if (d <= Math.abs(r1 - r2) + .01) { const big = r1 > r2; blob(ctx, big ? x1 : x2, big ? y1 : y2, Math.max(r1, r2), Math.max(r1, r2), 0, ink, alpha); return; }
    const a = Math.atan2(dy, dx), al = Math.acos(clamp((r1 - r2) / d, -1, 1));
    ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(x1, y1, r1, a + al, a + TAU - al); ctx.arc(x2, y2, r2, a - al, a + al); ctx.closePath();
    const R = Math.max(r1, r2);
    if (R < 2.5) { ctx.fillStyle = ink; ctx.fill(); return; }
    let nx = -dy / d, ny = dx / d; if (nx * LIGHT[0] + ny * LIGHT[1] < 0) { nx = -nx; ny = -ny; }
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, g = ctx.createLinearGradient(mx + nx * R, my + ny * R, mx - nx * R, my - ny * R);
    g.addColorStop(0, tone(ink, .26)); g.addColorStop(.42, ink); g.addColorStop(1, tone(ink, -.4));
    ctx.fillStyle = g; ctx.fill();
  }
  const glow = (ctx, x, y, r, inner, alpha) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, inner); g.addColorStop(1, inner.slice(0, 7) + '00'); ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const ring = (ctx, x, y, r, alpha) => { ctx.globalAlpha = alpha; ctx.strokeStyle = '#c4fa79'; ctx.lineWidth = 1; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.setLineDash([]); };
  const fib = n => Array.from({ length: n }, (_, i) => { const z = 1 - 2 * (i + .5) / n, r = Math.sqrt(1 - z * z), t = i * 2.39996; return [Math.cos(t) * r, z, Math.sin(t) * r]; });
  const SIDES = [-1, 1];
  // How strongly a thing of `size` shows on a frame S metres across its shorter side.
  const presence = (size, S, out = [6, 14]) => { const f = size / S; return ease(Math.log(f / .004) / Math.log(4)) * (1 - ease(Math.log(f / out[0]) / Math.log(out[1] / out[0]))); };
  // 0 → 1 as the frame narrows from `from` to `to` metres.
  const narrowing = (S, from, to) => ease(Math.log(from / S) / Math.log(from / to));
  // In as the frame narrows from a to b, out from c to d.
  const between = (S, a, b, c, d) => narrowing(S, a, b) * (1 - narrowing(S, c, d));
  // An icosahedron's corners and faces (a virus's shell).
  const ICO = (() => {
    const p = (1 + Math.sqrt(5)) / 2, v = [[-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0], [0, -1, p], [0, 1, p], [0, -1, -p], [0, 1, -p], [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1]].map(unit);
    const f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    return { v, f };
  })();
  function icosa(B, c, r, ink, turn, o = {}) {
    const V = ICO.v.map(p => add(c, times(apply(turn, p), r)));
    for (const [a, b, d] of ICO.f) B.p([V[a], V[b], V[d]], ink, { alpha: o.alpha, edge: tone(ink, .4), edgeAlpha: .5, edgeWidth: .6 });
    return V;
  }

  // ── the street: a man walking a beagle puppy past ───────────────────────────────────────
  // World metres: the frame's middle is 0.7 m over the sidewalk, 2.6 m from the eye. A man
  // walks his puppy past, right to left: where they are follows the scroll (the film's mark),
  // and their legs follow the ground they cover, so they stop when the visitor stops. The man is a metre further off than the puppy and a step ahead,
  // on a leash.
  const DOG = { tan: '#c98a4a', black: '#1e1a17', white: '#f2ece0', ear: '#7a4a26', collar: '#e0473c' };
  const MAN = { coat: '#34465f', trousers: '#2f3236', shoe: '#17181a', skin: '#c99a7a', hat: '#8a3a2e' };
  function street(B, t, view) {
    const S = view.S, show = 1 - narrowing(S, .8, .38); if (show < .01) return;
    // In the order of their size (Brandon, 2026-11-21: "bus ... then car bike human dog etc"; the
    // bus and the car are named in the street before the camera comes down, red/story.js): a
    // cyclist rides across first, then the man walks the puppy across, each at its own pace in
    // marks of the film; the birds come after them (`arrive`).
    const A = B.as(B.alpha * show);
    const bike = -(view.at - STREET.bike) / 16 * 4.6;
    if (Math.abs(bike) < 6) {
      const C = A.child([bike, 0, -1.7], rotY(Math.PI)), inFrame = 1 - ease((Math.abs(bike) / (S * view.hx) - .55) / .4);
      A.shadow(bike, -1.7, .95, .2);
      cyclist(C, (6 - bike) / .68, show * inFrame);
    }
    const x = -(view.at - STREET.walk) / 16 * 1.9, man = x - .95;
    if (x < -3.2 || x > 4.2) return;
    const seen = 1 - ease((Math.abs(x) / (S * view.hx) - .5) / .4);
    A.shadow(x, .3, .3, .14); A.shadow(man, -.7, .35, .25);
    const D = A.child([x, 0, .3], rotY(Math.PI)), M = A.child([man, 0, -.7], rotY(Math.PI));
    const hand = walker(M, (3.6 - man) / 1.5 * TAU);
    M.name([.16, 1.36, 0], 'Man walking the puppy · about 1.75 m tall', { size: 3, focus: show * (1 - ease((Math.abs(man) / (S * view.hx) - .5) / .4)), leader: true });
    puppy(D, t, (3.6 - x) / .5 * TAU, show * seen);              // named while it is in the frame
    // The leash, from his hand to the collar, sagging a little.
    const from = B.pl.local(M.world(hand)), to = B.pl.local(D.world([.19, .28, 0])), pts = [];
    for (let k = 0; k <= 12; k++) { const f = k / 12; pts.push([mix(from[0], to[0], f), mix(from[1], to[1], f) - Math.sin(f * Math.PI) * .1, mix(from[2], to[2], f)]); }
    A.l(pts, .012, DOG.collar, { min: 1 });
  }
  // When, in marks from the start of the zoom, the cyclist and the walkers are in the middle of
  // the frame, and when the birds and the rest in the air arrive: after the puppy.
  const STREET = { bike: 14, walk: 36, arrive: 42 };
  // A bicycle about 1.75 m long with 700c wheels (68 cm across with their tyres) and its rider,
  // in the bike's own axes (x ahead, y up). `roll`: how far the wheels have turned, radians.
  // The frame's shape and the rider are drawn.
  function cyclist(B, roll, focus) {
    const R = .34, ink = '#c9372c', dark = '#1b1d20', steel = '#9aa3a8', rear = [-.52, R, 0], front = [.52, R, 0], bb = [-.08, .3, 0], seat = [-.2, .84, 0], head = [.36, .88, 0];
    for (const c of [rear, front]) {
      const rim = []; for (let k = 0; k <= 28; k++) { const a = k / 28 * TAU; rim.push([c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R, 0]); }
      B.l(rim, .034, dark, { min: 1 });
      for (let k = 0; k < 6; k++) { const a = roll + k / 6 * Math.PI; B.l([[c[0] - Math.cos(a) * R * .93, c[1] - Math.sin(a) * R * .93, 0], [c[0] + Math.cos(a) * R * .93, c[1] + Math.sin(a) * R * .93, 0]], .006, steel, { min: .5, alpha: .7 }); }
    }
    for (const [a, b] of [[rear, bb], [bb, seat], [seat, head], [bb, [.34, .78, 0]], [rear, seat], [head, front]]) B.k(a, .017, b, .017, ink);
    B.k(head, .014, [.34, 1.02, 0], .014, dark); B.k([.34, 1.02, -.21], .013, [.34, 1.02, .21], .013, dark);
    B.k(seat, .014, [-.22, .95, 0], .014, dark); B.e([-.23, .97, 0], [.12, .028, .06], dark);
    // The rider: hips on the saddle, leaning to the bars, feet on the pedals half a turn apart.
    const hip = [-.2, 1.04, 0], shoulder = [.1, 1.47, 0], crank = roll * .45;
    for (const sd of SIDES) {
      const ph = crank + (sd > 0 ? 0 : Math.PI), foot = [bb[0] + Math.cos(ph) * .17, bb[1] + Math.sin(ph) * .17, sd * .1], h = [hip[0], hip[1], sd * .09];
      const dx = foot[0] - h[0], dy = foot[1] - h[1], d = Math.min(.89, Math.hypot(dx, dy)), a = Math.atan2(dy, dx) + Math.acos(d / .9), knee = [h[0] + Math.cos(a) * .45, h[1] + Math.sin(a) * .45, sd * .1];
      B.k(h, .08, knee, .062, MAN.trousers); B.k(knee, .058, foot, .044, MAN.trousers); B.e(add(foot, [.05, -.02, 0]), [.13, .045, .05], MAN.shoe);
      B.k([shoulder[0], shoulder[1], sd * .17], .05, [.34, 1.04, sd * .2], .036, '#2f6f8f');
    }
    B.k(hip, .15, shoulder, .16, '#2f6f8f');
    B.k(shoulder, .055, [.17, 1.58, 0], .05, MAN.skin); B.e([.2, 1.67, 0], [.1, .115, .09], MAN.skin); B.e([.19, 1.72, 0], [.125, .085, .105], '#e8e4d8', { bias: .02 });
    B.dim([-.86, 0, 0], [.86, 0, 0], [0, -1, 0], .12, '1.75 m', { size: 3, focus });
    B.name([.4, 1.0, 0], 'Bicycle · about 1.75 m long', { size: 3, focus, leader: true });
  }
  // A man 1.75 m tall in his own axes (x ahead, y up, z to his left), walking: one stride is
  // a cycle of `gait`. Gives back where his right hand is, holding the leash.
  function walker(B, gait) {
    const { coat, trousers, shoe, skin, hat } = MAN, bob = Math.abs(Math.cos(gait)) * .018;
    for (const side of SIDES) {
      const ph = side > 0 ? 0 : Math.PI, a = Math.sin(gait + ph) * .4, bend = Math.max(0, -Math.cos(gait + ph)) * .75;
      const hip = [0, .93 + bob, side * .09], knee = add(hip, [Math.sin(a) * .45, -Math.cos(a) * .45, 0]), k2 = a - bend, ankle = add(knee, [Math.sin(k2) * .43, -Math.cos(k2) * .43, 0]);
      B.k(hip, .082, knee, .064, trousers); B.k(knee, .06, ankle, .045, trousers);
      B.e(add(ankle, [.06, -.04, 0]), [.135, .048, .055], shoe, { q: rotZ(Math.max(0, k2) * -.4) });
    }
    B.e([0, 1.0 + bob, 0], [.12, .12, .17], trousers);
    B.e([.0, 1.25 + bob, 0], [.14, .29, .2], coat);
    B.e([.0, 1.04 + bob, 0], [.15, .13, .2], coat, { bias: .01 });                 // the coat's skirt
    B.k([0, 1.43 + bob, -.19], .07, [0, 1.43 + bob, .19], .07, coat);
    B.k([0, 1.45 + bob, 0], .055, [.01, 1.55 + bob, 0], .05, skin);
    B.e([.02, 1.64 + bob, 0], [.1, .115, .09], skin);
    B.e([0, 1.705 + bob, 0], [.104, .068, .094], hat, { bias: .02 });
    B.e([.118, 1.632 + bob, 0], [.02, .026, .016], tone(skin, -.12), { bias: .02 });
    for (const sd of SIDES) { B.e([.093, 1.665 + bob, sd * .036], [.008, .009, .008], '#1d1410', { bias: .03 }); B.e([.0, 1.64 + bob, sd * .09], [.024, .034, .012], skin); }
    let held = null;
    for (const side of SIDES) {
      const leash = side < 0, b = leash ? -.25 : -Math.sin(gait + (side > 0 ? 0 : Math.PI)) * .35, sh = [0, 1.41 + bob, side * .21];
      const elbow = add(sh, [Math.sin(b) * .3, -Math.cos(b) * .3, side * .02]), fb = b + (leash ? .9 : .25), hand = add(elbow, [Math.sin(fb) * .27, -Math.cos(fb) * .27, 0]);
      B.k(sh, .055, elbow, .048, coat); B.k(elbow, .046, hand, .04, coat); B.e(hand, [.045, .05, .035], skin);
      if (leash) held = hand;
    }
    return held;
  }
  // In his own axes: x ahead, y up, z to his left; metres. 28 cm at the shoulder.
  function puppy(B, t, gait, f) {
    const { tan, black, white } = DOG, bob = Math.abs(Math.sin(gait)) * .012;
    for (const [x, z, ph] of [[.13, .055, 0], [.13, -.055, Math.PI], [-.13, .055, Math.PI], [-.13, -.055, 0]]) {
      const s = Math.sin(gait + ph), lift = Math.max(0, -Math.cos(gait + ph)) * .03;
      const hip = [x, .19 + bob, z], knee = [x + s * .03 - (x < 0 ? .02 : 0), .1 + lift * .5, z], paw = [x + s * .07, .022 + lift, z];
      B.k(hip, .034, knee, .024, x > 0 ? white : tan); B.k(knee, .024, paw, .02, white);
      B.e(add(paw, [.012, -.008, 0]), [.03, .016, .022], white);
    }
    B.e([0, .2 + bob, 0], [.19, .085, .08], tan);
    B.e([-.02, .214 + bob, 0], [.14, .068, .078], black, { bias: .012, alpha: .92 }); // the saddle
    B.e([.13, .19 + bob, 0], [.07, .08, .07], white, { bias: .006 });               // the chest
    B.k([.15, .25 + bob, 0], .05, [.22, .31 + bob, 0], .045, tan);                    // the neck
    const ring = []; for (let k = 0; k <= 16; k++) { const a = k / 16 * TAU; ring.push([.19, .28 + bob + Math.sin(a) * .05, Math.cos(a) * .05]); }
    B.l(ring, .012, DOG.collar, { bias: .02 });
    B.e([.205, .225 + bob, 0], [.008, .012, .004], '#e8c46a', { bias: .06 });       // the tag
    B.e([.25, .335 + bob, 0], [.07, .064, .06], tan);                                 // the head
    B.e([.32, .312 + bob, 0], [.055, .034, .037], white, { bias: .01 });             // the muzzle
    B.e([.286, .37 + bob, 0], [.05, .012, .015], white, { bias: .03 });              // the blaze
    B.e([.374, .318 + bob, 0], [.014, .011, .013], '#2a1d17', { bias: .02 });        // the nose
    for (const s of SIDES) {
      B.e([.3, .35 + bob, s * .034], [.009, .009, .006], '#1d1410', { bias: .03 });
      B.e([.235, .29 + bob, s * .062], [.03, .072, .012], DOG.ear, { q: rotZ(.25), bias: .01 });
    }
    const wag = Math.sin(t * 14) * .07;
    B.k([-.18, .24 + bob, 0], .02, [-.25, .33 + bob, wag * .6], .015, tan); B.k([-.25, .33 + bob, wag * .6], .015, [-.29, .4 + bob, wag], .013, white);
    B.dim([-.06, 0, .08], [-.06, .285, .08], [-1, 0, 0], .42, '28 cm', { focus: f });
    B.name([.05, .48, 0], 'Beagle puppy · about 28 cm at the shoulder', { focus: f, leader: true });
  }

  // ── a pigeon and a sparrow circling, an oak leaf and an acorn falling ──────────────────────────
  // Metres, a bird's own axes: x ahead, y up, z to its left; L is its length, beak to tail.
  // Rock pigeon 30 to 36 cm long with wings 50 to 67 cm across; house sparrow 14 to 16 cm,
  // wings 19 to 25 cm (Cornell Lab, All About Birds). Their shapes and colours are drawn.
  const PIGEON = { L: .32, span: .6, flap: 9, body: '#8d96a2', breast: '#9aa1ab', wing: '#a4acb5', tip: '#3a3d42', bar: '#2b2c30', neck: '#5e8a70', head: '#7d8692', tail: '#7f8894', tailTip: '#2e3034', beak: '#2f2f2f', eye: '#e0892a', head_r: .085 };
  const SPARROW = { L: .16, span: .22, flap: 13, body: '#8c6a4a', breast: '#bcb5aa', wing: '#7a5236', tip: '#3b2a1e', bar: '#efe9df', neck: '#8d8d8d', head: '#8d8d8d', tail: '#5e4430', tailTip: '#4a3526', beak: '#3a3530', eye: '#1a1410', head_r: .1, bib: '#26221e' };
  function flier(B, t, K, a, f, name) {
    const L = K.L, H = B.as(B.alpha * a), q = x => times(x, L);
    H.e(q([0, 0, 0]), q([.26, .14, .13]), K.body);
    H.e(q([.12, -.02, 0]), q([.16, .13, .12]), K.breast, { bias: .01 * L });
    H.e(q([.25, .05, 0]), q([.1, .09, .09]), K.neck, { bias: .01 * L });
    H.e(q([.33, .08, 0]), q([K.head_r, K.head_r, K.head_r * .92]), K.head, { bias: .02 * L });
    if (K.bib) H.e(q([.27, .0, 0]), q([.04, .05, .075]), K.bib, { bias: .015 * L });
    H.k(q([.4, .075, 0]), .02 * L, q([.48, .06, 0]), .005 * L, K.beak);
    for (const sd of SIDES) H.e(q([.36, .1, sd * .065]), q([.016, .016, .01]), K.eye, { bias: .04 * L });
    H.e(q([-.38, -.01, 0]), q([.17, .015, .08]), K.tail, { bias: -.01 * L }); H.e(q([-.5, -.012, 0]), q([.05, .014, .085]), K.tailTip, { bias: -.005 * L });
    // The wings, each two plates (the inner wing and the hand) that beat about the body's axis.
    const beat = Math.sin(t * K.flap) * .85, half = K.span / 2 / L;
    for (const sd of SIDES) {
      // A point x along the body and z out along the wing, the wing raised by `beat` and its
      // hand bent a little behind the beat.
      const fold = Math.sin(t * K.flap - .6) * .35, P = (x, z) => { const ang = beat + (z > .5 ? fold * (z - .5) * 2 : 0); return q([x, z * Math.sin(ang), sd * z * Math.cos(ang)]); };
      const inner = [[.16, .08], [.15, .3], [.11, .52], [-.13, .54], [-.2, .32], [-.21, .08]].map(([x, z]) => P(x, z));
      const outer = [[.11, .52], [.07, half * .72], [0, half * .9], [-.08, half], [-.15, half * .9], [-.2, half * .7], [-.13, .54]].map(([x, z]) => P(x, z));
      H.p(inner, K.wing, { bias: .02 * L }); H.p(outer, K.tip, { bias: .02 * L });
      H.l([P(.04, .18), P(.0, .46)], .03 * L, K.bar, { min: .6 }); H.l([P(-.06, .18), P(-.1, .46)], .03 * L, K.bar, { min: .6 });
    }
    H.dim(q([-.55, -.22, 0]), q([.48, -.22, 0]), [0, -1, 0], -.3 * L, Math.round(L * 100) + ' cm', { focus: f });
    H.name(q([.1, .5, 0]), name, { focus: f, leader: true });
  }
  function pigeon(B, t, view) { const a = between(view.S, 7, 4, .78, .58); if (a > .01) flier(B, t, PIGEON, a, B.focus, 'Rock pigeon · about 32 cm, wings 60 cm across'); }
  function sparrow(B, t, view) { const a = between(view.S, 3, 1.8, .36, .27); if (a > .01) flier(B, t, SPARROW, a, B.focus, 'House sparrow · about 16 cm long'); }
  // How the things in the air move (Brandon, 2026-11-21: "how things come in and where they are
  // placed like the birds flying in and the mosquito it feels kinda clunky"). None crosses the
  // frame with the scroll any more. Each has its own place in the street's air, round the point
  // the zoom closes on, and moves by the clock: the birds circle it, the smaller the closer, the
  // leaf spirals down, the bee and the mosquito hover beside it. So all of them are there
  // together from the start, each is whole in the frame at its own stop, and the frame leaves
  // each behind as it narrows. Their paths and speeds are drawn (the birds fly far slower than
  // birds do). Each gives where it is (metres from that point: x right, y up, z toward the eye),
  // its axes, and how much it shows.
  const heading = (v, bank) => { const X = unit(v), Z = unit(cross(X, [0, 1, 0])), Y = cross(Z, X); return mul([X[0], Y[0], Z[0], X[1], Y[1], Z[1], X[2], Y[2], Z[2]], rotX(bank)); };
  const circling = ({ r, y = 0, period, phase = 0, tilt = .16, dir = 1, bank = .3 }) => time => {
    const th = dir * time / period * TAU + phase, c = Math.cos(th), sn = Math.sin(th), st = Math.sin(tilt), ct = Math.cos(tilt);
    return { at: [r * c, y - r * sn * st + Math.sin(time * .9 + phase) * r * .04, r * sn * ct], rot: heading([-sn * dir, -c * st * dir, c * ct * dir], -bank * dir), show: 1 };
  };
  const FLY = {
    pigeon: circling({ r: .42, y: .05, period: 11, phase: .6 }),
    sparrow: circling({ r: .19, y: -.02, period: 7, phase: 3.4, dir: -1 }),
    // The leaf comes down a slow spiral, turning, and starts again from the top.
    leaf: time => {
      const u = (time / 18) % 1, th = time / 9 * TAU, r = .11;
      return { at: [r * Math.cos(th), .09 - u * .18, r * Math.sin(th) * .8], rot: mul(mul(rotY(-th), rotX(-.6 + .3 * Math.sin(time * 1.3))), rotZ(.5 * Math.sin(time * .8))), show: ease(u / .08) * (1 - ease((u - .92) / .08)) };
    },
    // The acorn drops beside it, slowly, tumbling, and starts again from the top.
    acorn: time => { const u = (time / 7 + .4) % 1; return { at: [-.034, .05 - u * .1, .01], rot: mul(rotZ(.5 + time * .9), rotX(time * .6)), show: ease(u / .1) * (1 - ease((u - .9) / .1)) }; },
    // The dandelion seed drifts where it is, swaying.
    dandelion: time => ({ at: [-.0085 + Math.sin(time * .4) * .0016, .0115 + Math.sin(time * .63) * .001, Math.cos(time * .5) * .001], rot: rotZ(Math.sin(time * .7) * .16), show: 1 }),
    // The bee and the mosquito hover beside the point, heads toward it, drifting a little.
    bee: time => ({ at: [.0098 + Math.sin(time * .7) * .0012, .0046 + Math.sin(time * 1.1) * .0008, .001 + Math.cos(time * .5) * .001], rot: mul(rotY(Math.PI - .45), rotZ(Math.sin(time * .8) * .06)), show: 1 }),
    mosquito: time => ({ at: [-.0082 + Math.sin(time * 1.3) * .0005, -.0066 + Math.sin(time * 2.3) * .0004, .0015 + Math.sin(time * 1.9) * .0004], rot: mul(rotY(.5), rotZ(.1 + Math.sin(time * 1.7) * .06)), show: 1 }),
  };
  // An oak leaf (Brandon, 2026-11-21: "who the fuck knows what a ginkgo leaf is just make it oak
  // or something normal"): about 12 cm long, with rounded lobes, in its autumn brown, turning
  // as it falls. Oaks are among New York's commonest street trees. The outline is drawn: four
  // lobes a side.
  const OAK = (() => {
    const L = .12, side = [];
    for (let k = 0; k <= 44; k++) { const u = k / 44, half = L * .3 * Math.sin(Math.PI * Math.min(1, u * 1.04) ** .85) ** .6 * (.42 + .58 * Math.abs(Math.sin(u * Math.PI * 4.5 + .2)) ** .7); side.push([half, u * L]); }
    return { L, out: [...side, ...side.slice().reverse().map(([x, y]) => [-x, y])] };
  })();
  function leaf(B, t, view) {
    const a = between(view.S, 2, 1.2, .14, .1); if (a < .01) return;
    const H = B.as(B.alpha * a), L = OAK.L;
    H.p(OAK.out.map(([x, y]) => [x, y, 0]), '#b9722c', { edge: '#7c4718', edgeAlpha: .8, edgeWidth: 1 });
    H.l([[0, -.025, .0004], [0, L * .97, .0004]], .0014, '#7c4718', { min: .6 });
    for (let k = 0; k < 4; k++) for (const sd of SIDES) { const y = L * (.16 + k * .2); H.l([[0, y, .0004], [sd * L * .2, y + L * .09, .0004]], .0007, '#8f5520', { min: .5, alpha: .8 }); }
    H.dim([0, 0, 0], [0, L, 0], [1, 0, 0], L * .42, '12 cm', { focus: B.focus });
    H.name([0, L * 1.05, 0], 'Oak leaf · about 12 cm long', { focus: B.focus, leader: true });
  }
  // An acorn, the oak's seed: about 2.5 cm long, in millimetres, its cup uppermost, falling.
  function acorn(B, t, view) {
    const a = between(view.S, .5, .3, .03, .022); if (a < .01) return;
    const H = B.as(B.alpha * a);
    H.e([0, -3, 0], [8, 11, 8], '#9a6a32'); H.e([0, -13.4, 0], [1.2, 1.6, 1.2], '#6e4a22');
    H.e([0, 5.5, 0], [9, 5.2, 9], '#6b5234', { bias: .5 }); H.k([0, 9, 0], 1, [.6, 13.5, 0], .8, '#5a4428');
    H.dim([0, -14.5, 0], [0, 11, 0], [1, 0, 0], 13, '2.5 cm', { focus: B.focus });
    H.name([0, 14, 0], 'Acorn · an oak’s seed, about 2.5 cm', { focus: B.focus, leader: true });
  }
  // A dandelion seed, in millimetres: the seed itself about 3 mm, hanging from a parachute of
  // about a hundred bristles some 12 mm across (40 are drawn), drifting.
  const PAPPUS = fib(80).filter(d => d[1] > .12 && d[1] < .75).slice(0, 40);
  function dandelion(B, t, view) {
    const a = between(view.S, .25, .13, 9e-3, 6e-3); if (a < .01) return;
    const H = B.as(B.alpha * a);
    for (const d of PAPPUS) H.l([[0, 0, 0], times(unit([d[0], d[1] * .6, d[2]]), 6.2)], .05, '#f4f1e6', { min: .5, alpha: .75 });
    H.l([[0, 0, 0], [0, -8.2, 0]], .09, '#d9d2b8', { min: .6 });
    H.k([0, -8, 0], .35, [0, -11, 0], .5, '#8a6a3c');
    H.dim([-6, 3.4, 0], [6, 3.4, 0], [0, 1, 0], 6.5, '12 mm', { focus: B.focus });
    H.name([0, -9.5, 0], 'Dandelion seed · 3 mm, under its parachute', { focus: B.focus, leader: true });
  }

  // ── a honey bee ──────────────────────────────────────────────────────────────────────────
  // Millimetres, the bee's own axes: x ahead, y up, z to its side. 13 mm from the sting to the
  // front of the head. Hovering, its wings a blur of four positions.
  const FUZZ = fib(90);
  function bee(B, t, view) {
    const S = view.S, a = between(S, .6, .3, 1.3e-2, 9e-3); if (a < .01) return;
    const H = B.as(B.alpha * a);
    const leg = '#2a2016', amber = '#d8962e', dark = '#2a1f14';
    for (const s of SIDES) for (let k = 0; k < 3; k++) {
      const hip = [2.2 - k * .8, -1.3, s * .7], knee = [2.6 - k * 1.5, -2.6, s * 2.1], foot = [3.1 - k * 2.4, -3.7 - (k === 2 ? .4 : 0), s * 2.5 + Math.sin(t * 2 + k) * .1];
      H.k(hip, .22, knee, k === 2 ? .3 : .17, leg); H.k(knee, k === 2 ? .3 : .15, foot, .08, leg);
    }
    H.e([-3.3, -.2, 0], [3.4, 2.15, 2.15], amber);
    for (let k = 0; k < 4; k++) { const x = -1.3 - k * 1.25, r = 2.15 * Math.sqrt(Math.max(.05, 1 - ((x + 3.3) / 3.4) ** 2)) + .06; H.e([x, -.2, 0], [.36, r, r], dark, { bias: .3 }); }
    H.e([-6.1, -.3, 0], [.8, .95, .95], dark, { bias: .2 });
    H.k([-6.6, -.4, 0], .14, [-7.2, -.55, 0], .03, dark);
    H.k([-.1, -.1, 0], .5, [.5, 0, 0], .6, '#3a2a18');
    H.e([1.8, .1, 0], [2.0, 1.9, 1.9], '#7d5426');
    if (B.px * .1 > .8) for (const d of FUZZ) { const c = [1.8, .1, 0]; H.l([add(c, times(d, 1.8)), add(c, times(add(d, [0, .15, 0]), 2.25))], .03, '#d8b06a', { alpha: .45, min: .5, bias: .1 }); }
    H.e([4.5, 0, 0], [1.2, 1.55, 1.75], '#2c2118');
    for (const s of SIDES) {
      H.e([4.6, .35, s * 1.35], [.95, 1.2, .45], '#14100c', { bias: .2 });
      H.chain([[5.3, .9, s * .4], [6.2, 2.3, s * .8], [7.3, 1.9, s * 1.4]], [.12, .1, .08], leg);
      // The wings: fore and hind, a blur of four strokes.
      for (const [root, len, wide] of [[[1.9, 1.5, s * .9], 9, 3], [[1.0, 1.4, s * .8], 6.2, 2.1]]) for (let n = 0; n < 4; n++) {
        const up = Math.sin(t * 41 + n * 1.6) * .6 + (n - 1.5) * .25, span = unit([-.82, .2 + up * .5, s * .6]), chord = unit(cross([0, 1, 0], span)), outline = [];
        for (let j = 0; j < 14; j++) { const th = j / 14 * TAU, u = len / 2 + len / 2 * Math.cos(th), v = wide / 2 * Math.sin(th) * (1 - .25 * Math.cos(th)); outline.push(add(root, add(times(span, u), times(chord, v)))); }
        H.p(outline, '#e4f1ff', { alpha: .1, plain: true, edge: '#9aa59a', edgeAlpha: .22, edgeWidth: .5, bias: 2 });
      }
    }
    H.dim([-7.2, -.55, 0], [5.7, 0, 0], [0, -1, 0], 5.4, '13 mm', { focus: B.focus });
    H.name([.5, 4.3, 0], 'Western honey bee worker · 12 to 15 mm', { focus: B.focus, leader: true });
  }

  // ── a mosquito, hovering by the bee ────────────────────────────────────────────────────
  // Millimetres along local x: Culex pipiens, about 5 mm from head to the tip of the abdomen,
  // legs longer than the body, two narrow wings (drawn as a blur).
  function mosquito(B, t, view) {
    const S = view.S, a = between(S, .2, .1, 7e-3, 4.5e-3); if (a < .01) return;
    const H = B.as(B.alpha * a), body = '#8a7a62', dark = '#4a3f30';
    H.k([-3.6, -.1, 0], .22, [-.3, .05, 0], .38, body);                 // abdomen
    H.e([.4, .15, 0], [.75, .6, .55], dark);                              // thorax
    H.e([1.35, .05, 0], [.32, .3, .3], dark);                             // head
    H.k([1.6, 0, 0], .06, [3.2, -.35, 0], .02, dark);                     // proboscis
    for (const s of SIDES) {
      for (let k = 0; k < 3; k++) { const hip = [.6 - k * .35, -.2, s * .3], knee = [1.6 - k * 2.2, -1.6, s * 2.2], foot = [2.6 - k * 4.2, -4.2, s * 3.2]; H.k(hip, .05, knee, .04, dark); H.k(knee, .04, foot, .02, dark); }
      for (let n = 0; n < 3; n++) {
        const up = Math.sin(t * 60 + n * 2.1) * .5, root = [.5, .5, s * .2], span = unit([-.9, .25 + up, s * .5]), chord = unit(cross([0, 1, 0], span)), outline = [];
        for (let j = 0; j < 12; j++) { const th = j / 12 * TAU, u = 1.6 + 1.6 * Math.cos(th), v = .4 * Math.sin(th); outline.push(add(root, add(times(span, u), times(chord, v)))); }
        H.p(outline, '#e4f1ff', { alpha: .1, plain: true, edge: '#9aa59a', edgeAlpha: .2, edgeWidth: .5, bias: 1 });
      }
    }
    H.dim([-3.6, -.1, 0], [1.6, 0, 0], [0, 1, 0], 1.6, '5 mm', { focus: B.focus });
    H.name([-1.5, 1.2, 0], 'Mosquito · about 5 mm long', { focus: B.focus, leader: true });
  }

  // ── a hair ───────────────────────────────────────────────────────────────────────────────
  // Micrometres: one hair 100 µm across along local x, curving gently; once it is wide enough,
  // the cuticle's scales, overlapping like tiles, every 6 µm (drawn).
  const HAIR_INK = '#6b4a2e';
  function hair(B, t, view) {
    const S = view.S, a = between(S, 4e-2, 1.8e-2, 1.6e-4, 1e-4); if (a < .01) return;
    const H = B.as(B.alpha * a), x0 = B.pl.local(view.C)[0], reach = 2.2 * view.W / 1e-6 + 300, n = 36, step = 2 * reach / n, R = 50;
    const at = x => [x, 6e-6 * x * x, 0];
    for (let i = 0; i < n; i++) { const xa = x0 - reach + i * step; H.k(at(xa), R, at(xa + step), R, HAIR_INK); }
    const e = B.eye(), across = unit(cross([1, 0, 0], e)), fine = ease((R * B.px - 25) / 30);
    if (fine > .01) {
      const phi = Math.atan2(e[2], e[1]), spacing = 6;
      for (let x = Math.round((x0 - reach * .6) / spacing) * spacing; x < x0 + reach * .6; x += spacing) {
        const c = at(x), pts = [];
        for (let k = 0; k <= 10; k++) { const th = phi - 1.45 + k * .29; pts.push([c[0] + Math.sin(x * .7 + k) * 1.2 + 1.5 * Math.cos(k * .6), c[1] + Math.cos(th) * R * 1.01, c[2] + Math.sin(th) * R * 1.01]); }
        H.l(pts, .5, tone(HAIR_INK, .3), { alpha: fine * .55, bias: R * 1.2 });
      }
    }
    const c = at(x0 + 40);
    H.dim(add(c, times(across, R)), add(c, times(across, -R)), [1, 0, 0], x0 + 40, '100 µm');
    H.name(add(at(x0 + 300), times(across, R * 1.7)), 'Human hair · about 100 µm across', { leader: true });
  }

  // ── the air: a droplet from a cough, pollen and dust ─────────────────────────────────────
  // Micrometres round the droplet's middle, in the street's own axes.
  const DROP_R = 70;
  const GRAINS = (() => { const r = seeded(11); return Array.from({ length: 7 }, (_, i) => { const a = r() * TAU, d = i ? 140 + r() * 320 : 118, z = (r() - .5) * 160; return [Math.cos(a) * d, Math.sin(a) * d * .7 - (i ? 0 : 30), z, .85 + r() * .3]; }); })();
  const DUST = (() => { const r = seeded(7); return Array.from({ length: 70 }, () => [(r() - .5) * 1800, (r() - .5) * 1200, (r() - .5) * 900, .3 + r() * 1.3, r(), r()]); })();
  const SPINES = fib(46);
  function air(B, t, view) {
    const S = view.S;
    // Fine dust, as soft specks, never smaller than a pixel.
    const dust = between(S, 5e-3, 2e-3, 1.5e-5, 7e-6);
    if (dust > .01) for (const [i, [x, y, z, r, p, q]] of DUST.entries()) {
      const c = [x + Math.sin(t * .3 + p * 9) * 18, y + Math.cos(t * .27 + q * 9) * 14, z];
      B.f(c, (ctx, s) => { const rr = Math.max(.9, r * B.px * s[3]); glow(ctx, s[0], s[1], rr * 2.2, '#d9efd7cc', B.alpha * dust * (.35 + q * .5)); });
      if (i === 3) B.name(c, 'Fine dust, PM2.5 · under 2.5 µm', { size: 4.5e-6, focus: dust * focusOf(index.droplet, S), leader: true });
    }
    // Seeds, grains and spores, each at its own size (Brandon, 2026-11-21: "add seeds and spores
    // and grain sizes"): a poppy seed about 1 mm; a grain of sand, 0.5 mm (sand is 0.06 to 2 mm
    // by the Wentworth scale); a grain of table salt, a cube about 0.3 mm; a grain of silt, 30 µm
    // (silt is 4 to 62 µm); a mushroom spore about 10 µm; a mould spore about 3 µm. Wind carries
    // all of them but the poppy seed and the salt, which are here for their size. Each is named
    // from when the frame is about its size until it is some twenty times that.
    const near = size => (1 - ease((-Math.log(S / size) - .4) / .4)) * (1 - ease((Math.log(S / size) - 2.9) / .6));
    const speck = (c, radii, ink, size, name, figure, o = {}) => {
      const a = between(S, size * 60, size * 30, size * .8, size * .5); if (a < .01) return;
      const G = B.as(B.alpha * a), d = [c[0] + Math.sin(t * .31 + size * 1e5) * radii[0] * .25, c[1] + Math.cos(t * .27 + size * 1e5) * radii[0] * .2, c[2]];
      if (o.cube) { const h = radii[0], C = G.child(d, mul(rotY(.6), rotX(.35))), q = (pts, k) => C.p(pts, tone(ink, k), { plain: true, edge: '#ffffff', edgeAlpha: .25, edgeWidth: .6 });
        for (const [ax, sg, k] of [[2, 1, 0], [2, -1, -.2], [0, 1, -.14], [0, -1, -.24], [1, 1, .1], [1, -1, -.3]]) {       // six faces; the nearer are painted last
          const u = (ax + 1) % 3, v = (ax + 2) % 3, pt = (a, b) => { const o = [0, 0, 0]; o[ax] = sg * h; o[u] = a * h; o[v] = b * h; return o; };
          q([pt(-1, -1), pt(1, -1), pt(1, 1), pt(-1, 1)], k);
        } }
      else { G.e(d, radii, ink, { q: rotZ(o.turn || 0) }); if (o.lump) G.e(add(d, o.lump), times(radii, .62), tone(ink, -.06)); }
      const f = near(size);
      G.dim([d[0] - radii[0], d[1], d[2]], [d[0] + radii[0], d[1], d[2]], [0, -1, 0], -(d[1] - radii[1] * 1.5), figure, { size: size * 1.6, focus: f });
      G.name([d[0] + radii[0] * .7, d[1] + radii[1] * 1.1, d[2]], name, { size: size * 1.6, focus: f, leader: true });
    };
    speck([2100, -1500, 300], [520, 400, 360], '#59616e', 1e-3, 'Poppy seed · about 1 mm', '1 mm', { turn: .4 });
    speck([-1150, 1050, -200], [255, 205, 190], '#d8c49a', 5e-4, 'Grain of sand · about 0.5 mm', '0.5 mm', { turn: -.3, lump: [70, -40, 60] });
    speck([760, -900, 150], [150, 150, 150], '#eef1f4', 3e-4, 'Grain of table salt · a cube about 0.3 mm', '0.3 mm', { cube: true });
    speck([172, -124, 40], [15, 12, 11], '#b7a488', 3e-5, 'Grain of silt · about 30 µm', '30 µm', { turn: .5, lump: [4, 3, 3] });
    speck([-131, 96, 20], [5, 3.6, 3.6], '#8a6248', 1e-5, 'Mushroom spore · about 10 µm', '10 µm', { turn: .7 });
    speck([101, 99, -10], [1.5, 1.5, 1.5], '#86a37e', 3e-6, 'Mould spore · about 3 µm', '3 µm');
    // Ragweed pollen: a ball about 20 µm across, covered in short spines.
    const pollen = between(S, 3.5e-3, 1.2e-3, 2.5e-5, 1.2e-5);
    if (pollen > .01) for (const [i, [x, y, z, k]] of GRAINS.entries()) {
      const r = 9.5 * k, c = [x, y, z], P = B.as(B.alpha * pollen);
      P.e(c, [r, r, r], '#d9c46a');
      if (r * B.px > 5) for (const d of SPINES) P.k(add(c, times(d, r * .96)), r * .11, add(c, times(d, r * 1.24)), r * .02, '#efe0a0');
      if (!i) { P.dim([x - r, y, z], [x + r, y, z], [0, -1, 0], -(y - r - 9), '20 µm', { size: 3.6e-5 }); P.name([x + r * .8, y + r * 1.3, z], 'Ragweed pollen · about 20 µm', { size: 3.6e-5, leader: true }); }
    }
    // The droplet: a ball of water from a cough, 140 µm across; inside it, a faint tint.
    const drop = narrowing(S, 4e-3, 1.5e-3) * (1 - narrowing(S, 2.5e-6, 1.2e-6)); if (drop < .01) return;
    const inside = Math.hypot(...B.pl.local(view.C)) < DROP_R, diag = Math.hypot(view.w, view.h);
    B.f([0, 0, 0], (ctx, s) => {
      const r = DROP_R * B.px * s[3];
      if (r > diag * 2.5) { if (inside) { ctx.globalAlpha = B.alpha * drop * .2; ctx.fillStyle = '#1d4a60'; ctx.fillRect(0, 0, view.w, view.h); } return; }
      const g = ctx.createRadialGradient(s[0] - r * .3, s[1] - r * .35, r * .05, s[0], s[1], r);
      g.addColorStop(0, '#bfe6ff2a'); g.addColorStop(.7, '#5aa0c814'); g.addColorStop(.95, '#9fd6ff38'); g.addColorStop(1, '#e8f6ff66');
      ctx.globalAlpha = B.alpha * drop; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s[0], s[1], r, 0, TAU); ctx.fill();
    }, -DROP_R * 3);
    B.f([0, 0, 0], (ctx, s) => {
      const r = DROP_R * B.px * s[3]; if (r > diag * 2.5) return;
      ctx.globalAlpha = B.alpha * drop * .55; ctx.strokeStyle = '#d8f0ff'; ctx.lineWidth = Math.max(1, r * .008); ctx.beginPath(); ctx.arc(s[0], s[1], r, 0, TAU); ctx.stroke();
      ctx.globalAlpha = B.alpha * drop * .5; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(s[0] - r * .38, s[1] - r * .45, r * .15, r * .07, -.6, 0, TAU); ctx.fill();
      ctx.globalAlpha = B.alpha * drop * .3; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, r * .022); ctx.beginPath(); ctx.arc(s[0], s[1], r * .9, Math.PI * .15, Math.PI * .55); ctx.stroke();
    }, DROP_R * 3);
    const f = focusOf(index.droplet, S);
    B.dim([-DROP_R, 0, 0], [DROP_R, 0, 0], [0, -1, 0], DROP_R + 22, '140 µm', { focus: f });
    B.name([DROP_R * .55, DROP_R * 1.05, 0], 'Droplet from a cough · about 140 µm', { focus: f, leader: true });
  }

  // ── a cheek cell ─────────────────────────────────────────────────────────────────────────
  // Micrometres, in the cell's axes: it lies flat in x, y, about 2 µm thick, 55 µm across, its
  // nucleus bulging above it. Organelles round the nucleus; bacteria from the mouth on top.
  const CELL_R = 27, NUC = { c: [4.2, 0, .3], r: [4.3, 4.3, 2.2] }, NUCLEOLUS = { c: [5.4, -1.2, .6], r: [1.1, 1.1, .85] };
  const CELL_EDGE = Array.from({ length: 48 }, (_, i) => { const t = i / 48 * TAU; return [Math.cos(t) * CELL_R * (1 + .12 * Math.sin(3 * t + 1) + .07 * Math.sin(7 * t)) + 3, Math.sin(t) * CELL_R * (.86 + .1 * Math.cos(2 * t) + .06 * Math.sin(5 * t + 2))]; });
  const MITO = Array.from({ length: 24 }, (_, i) => { const a = hash(i, 1) * TAU, d = 6 + hash(i, 2) * 13, len = 1 + hash(i, 3), ang = hash(i, 5) * TAU, c = [NUC.c[0] + Math.cos(a) * d, NUC.c[1] + Math.sin(a) * d * .85, (hash(i, 4) - .5) * .5]; return { a: add(c, [Math.cos(ang) * len / 2, Math.sin(ang) * len / 2, 0]), b: add(c, [-Math.cos(ang) * len / 2, -Math.sin(ang) * len / 2, 0]), c }; });
  const VESICLES = Array.from({ length: 46 }, (_, i) => { const a = hash(i, 11) * TAU, d = 5.6 + hash(i, 12) * 15; return [NUC.c[0] + Math.cos(a) * d, NUC.c[1] + Math.sin(a) * d * .85, (hash(i, 13) - .5) * .6, .12 + hash(i, 14) * .3]; });
  const GRANULES = Array.from({ length: 380 }, (_, i) => { const a = hash(i, 51) * TAU, d = Math.sqrt(hash(i, 52)) * CELL_R * .9; return [Math.cos(a) * d + 3, Math.sin(a) * d * .86, -.95]; });
  const STREP = Array.from({ length: 10 }, (_, i) => [-12 + i * .92, 6.5 + Math.sin(i * .6) * .6, 1.5]);
  const STAPH = Array.from({ length: 14 }, (_, i) => { const a = i * 2.4, d = Math.sqrt(i) * .62; return [13 + Math.cos(a) * d, -5 + Math.sin(a) * d, 1.55 + (i % 3) * .3]; });
  const ECOLI = [[-4.5, -7.6, .4], [11.5, 6.6, 2.1], [-15, -12, 1.2]];
  // More of what a cheek cell holds: bundles of keratin filaments (a cheek cell is a lining
  // cell full of them) running across it; the microridges in its surface, fingerprint-like and
  // about 0.3 µm wide (Uehara and others on buccal epithelium); a centrosome by the nucleus with
  // microtubules spreading from it; and lysosomes. Where and how many are drawn.
  const KERATIN = Array.from({ length: 34 }, (_, i) => { const a = hash(i, 61) * Math.PI, y0 = (hash(i, 62) - .5) * CELL_R * 1.5, pts = [];
    for (let s = -12; s <= 12; s++) { const x = s * 2.3, y = y0 + Math.sin(s * .45 + i) * 1.4 + hash(i, s, 63) * .5; const p = [Math.cos(a) * x - Math.sin(a) * y + 3, Math.sin(a) * x + Math.cos(a) * y, -.5 + hash(i, 64) * .6]; if (Math.hypot((p[0] - 3) / CELL_R, p[1] / (CELL_R * .86)) < .9) pts.push(p); }
    return pts; }).filter(p => p.length > 3);
  const RIDGES = Array.from({ length: 26 }, (_, i) => { const c = [hash(i, 71) * 40 - 17, (hash(i, 72) - .5) * 36], a = hash(i, 73) * TAU, pts = [];
    for (let s = 0; s <= 14; s++) { const u = s / 14, ang = a + Math.sin(u * 3 + i) * .9; pts.push([c[0] + Math.cos(ang) * (u * 5 - 2.5) + Math.sin(u * 5) * .6, c[1] + Math.sin(ang) * (u * 5 - 2.5), 1.02]); }
    return pts; }).filter(p => p.every(q => Math.hypot((q[0] - 3) / CELL_R, q[1] / (CELL_R * .86)) < .85));
  const CENTROSOME = [NUC.c[0] - 6.4, NUC.c[1] + 2.2, .2];
  const TUBULES = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * TAU + hash(i, 81) * .2, len = 9 + hash(i, 82) * 12, pts = [];
    for (let s = 0; s <= 10; s++) { const u = s / 10; pts.push([CENTROSOME[0] + Math.cos(a + Math.sin(u * 2 + i) * .15) * len * u, CENTROSOME[1] + Math.sin(a + Math.sin(u * 2 + i) * .15) * len * u * .86, .2 - u * .3]); }
    return pts; });
  const LYSOSOMES = Array.from({ length: 14 }, (_, i) => { const a = hash(i, 91) * TAU, d = 7 + hash(i, 92) * 12; return [NUC.c[0] + Math.cos(a) * d, NUC.c[1] + Math.sin(a) * d * .85, (hash(i, 93) - .5) * .5, .25 + hash(i, 94) * .2]; });
  function cell(B, t, view) {
    const S = view.S, whole = between(S, 1.2e-3, 4e-4, 1.4e-6, 6e-7); if (whole < .01) return;
    const C = B.as(B.alpha * whole), cellF = focusOf(index.cell, S), nucF = focusOf(index.nucleus, S);
    // The floor of the cell, under everything in it, and the membrane over it (faint).
    C.p(CELL_EDGE.map(([x, y]) => [x, y, -1]), '#4a2a42', { alpha: .85, edge: '#e3a9c4', edgeAlpha: .55, edgeWidth: 1.2, plain: true });
    if (B.px * CELL_R > 60) { const g = between(S, 3e-4, 1.2e-4, 3e-6, 1.6e-6); for (const p of GRANULES) C.f(p, (ctx, s) => { ctx.globalAlpha = C.alpha * g * .4; ctx.fillStyle = '#c995b0'; ctx.fillRect(s[0], s[1], 1.2, 1.2); }); }
    const fibres = between(S, 3e-4, 1.4e-4, 3e-6, 1.6e-6);
    if (fibres > .01) {
      for (const k of KERATIN) C.l(k, .09, '#e9b9a0', { alpha: fibres * .45, min: .5 });
      for (const k of RIDGES) C.l(k, .3, '#ffd8ea', { alpha: fibres * .3, min: .5, bias: 1.2 });
    }
    C.p(CELL_EDGE.map(([x, y]) => [x, y, 1]), '#7a4a6a', { alpha: .18, edge: '#ffd8ea', edgeAlpha: .4, edgeWidth: .8, plain: true, bias: 1 });
    // The nucleus, the membrane over it, the nucleolus seen through it.
    const nuc = between(S, 5e-4, 1.6e-4, 1.8e-6, 9e-7);
    C.e(NUC.c, NUC.r, '#5d4c9c', { alpha: nuc * .95 });
    C.e(NUCLEOLUS.c, NUCLEOLUS.r, '#8a6fd6', { alpha: nuc * .45, bias: 2.4 });
    C.e(NUC.c, [5.2, 5.2, 2.9], '#7a4a6a', { alpha: nuc * .14, bias: .8 });
    // Organelles: mitochondria with their folds, vesicles, the rough ER round the nucleus, the Golgi.
    const org = between(S, 2.2e-4, 8e-5, 2.6e-6, 1.3e-6), O = C.as(C.alpha * org);
    if (org > .01) {
      for (const m of MITO) {
        O.k(m.a, .28, m.b, .28, '#c4644a');
        if (.28 * B.px > 6) { const d = unit(sub(m.b, m.a)), n = [-d[1], d[0], 0]; for (let k = 1; k < 7; k++) { const p = add(m.a, times(sub(m.b, m.a), k / 7)); O.l([add(p, times(n, (k % 2 ? .22 : -.22))), add(add(p, times(d, .05)), times(n, k % 2 ? -.04 : .04))], .03, '#ffb08f', { alpha: .8, bias: .4 }); } }
      }
      for (const [x, y, z, r] of VESICLES) O.e([x, y, z], [r, r, r * .8], hash(x, y) > .7 ? '#5a2e4a' : '#e6a1d0', { alpha: .8 });
      for (const [x, y, z, r] of LYSOSOMES) O.e([x, y, z], [r, r, r * .9], '#3d2440', { alpha: .9 });
      for (const tb of TUBULES) O.l(tb, .025, '#9fd8c8', { alpha: .5, min: .5 });
      for (const sd of [-1, 1]) O.k(add(CENTROSOME, [sd * .12, -.2, 0]), .1, add(CENTROSOME, [sd * .12 + (sd > 0 ? .4 : 0), .2, sd > 0 ? .3 : 0]), .1, '#bff0e0');
      for (let k = 0; k < 6; k++) { const rr = 5.1 + k * .32, pts = []; for (let s = 0; s <= 50; s++) { const a = Math.PI * (.55 + s / 50 * .9), wob = Math.sin(s * .9 + k * 2) * .06; pts.push([NUC.c[0] + Math.cos(a) * (rr + wob), NUC.c[1] + Math.sin(a) * (rr + wob), -.1]); } O.l(pts, .06, '#c98fb0', { alpha: .7, min: .5 }); }
      for (let k = 0; k < 5; k++) { const pts = []; for (let s = 0; s <= 16; s++) { const a = Math.PI * (1.12 + s / 16 * .7); pts.push([-4.5 + Math.cos(a) * (1.3 - k * .08), 7 + k * .32 + Math.sin(a) * (1.3 - k * .08), .1]); } O.l(pts, .18, '#e6a1d0', { alpha: .8 }); }
      const m0 = MITO.reduce((a, m) => Math.hypot(...sub(m.c, NUC.c)) < Math.hypot(...sub(a.c, NUC.c)) ? m : a);
      O.name(m0.c, 'Mitochondrion · about 1 to 2 µm', { size: 2.7e-6, focus: nucF, leader: true });
      O.name([-4.5, 8.6, .1], 'Golgi apparatus', { size: 5e-6, focus: nucF, leader: true });
      O.name(CENTROSOME, 'Centrosome · microtubules spread from it', { size: 5e-6, focus: nucF, leader: true });
      O.name(LYSOSOMES[2].slice(0, 3), 'Lysosome · about 0.5 µm', { size: 9e-7, focus: nucF, leader: true });
      O.name(KERATIN[4][Math.floor(KERATIN[4].length / 2)], 'Keratin filaments · 10 nm thick, in bundles', { focus: cellF * fibres, leader: true });
    }
    // Bacteria from the mouth on the cell: a chain of streptococci, a cluster of staphylococci,
    // E. coli with their flagella (two with bacteriophages landed on them).
    const bug = between(S, 2.4e-4, 9e-5, 1.6e-6, 8e-7), G = C.as(C.alpha * bug);
    if (bug > .01) {
      for (const [i, p] of STREP.entries()) G.e(p, [.5, .43, .43], '#8f78d8', { q: rotZ(Math.sin(i * .6) * .4) });
      for (const p of STAPH) G.e(p, [.5, .5, .5], '#e8c46a');
      for (const [n, [x, y, ang]] of ECOLI.entries()) {
        const d = [Math.cos(ang + t * .02), Math.sin(ang + t * .02), 0], a = add([x, y, 1.5], times(d, -.8)), b = add([x, y, 1.5], times(d, .8));
        for (let f = 0; f < 4; f++) { const pts = []; for (let s = 0; s <= 24; s++) { const u = s / 24; pts.push(add(add(a, times(d, -u * 5)), [-d[1] * ((f - 1.5) * .25 + Math.sin(u * 14 - t * 5 + f) * .35 * u), d[0] * ((f - 1.5) * .25 + Math.sin(u * 14 - t * 5 + f) * .35 * u), .1 * f])); } G.l(pts, .025, '#b5ee62', { alpha: .7, min: .5 }); }
        G.k(a, .45, b, .45, '#7fae4a');
        if (n < 2) for (let p = 0; p < 3; p++) phage(G, add(add([x, y, 1.95], times(d, -.5 + p * .5)), [0, 0, 0]), (p - 1) * .35, d);
        if (!n) { G.dim(a, b, [0, -1, 0], -(y - 1.1), '2 µm', { focus: nucF, short: true, size: 3.6e-6 }); G.name(add(b, [.5, .8, 0]), 'E. coli · about 2 µm long', { size: 3.6e-6, focus: nucF, leader: true }); }
      }
      G.name(STREP[6], 'Streptococcus · about 1 µm each, in chains', { size: 4e-6, focus: nucF, leader: true });
      G.name(STAPH[0], 'Staphylococcus aureus · about 1 µm each', { size: 2.5e-6, focus: nucF, leader: true });
    }
    C.dim([-CELL_R + 3, 0, -1], [CELL_R + 3, 0, -1], [0, -1, 0], CELL_R * 1.05, '55 µm', { focus: cellF });
    C.name([-14, 20, 1], 'Cheek cell · from the inside of a mouth', { focus: cellF, leader: true });
    C.dim([NUC.c[0] - NUC.r[0], NUC.c[1], NUC.c[2]], [NUC.c[0] + NUC.r[0], NUC.c[1], NUC.c[2]], [0, -1, 0], -(NUC.c[1] - NUC.r[1] - 1.4), '8.5 µm', { focus: nucF * nuc });
    C.name([NUC.c[0] + 2.4, NUC.c[1] + 4.6, 2.6], 'Cell nucleus · about 8.5 µm', { size: 1.5e-5, focus: nucF * nuc, leader: true });
  }
  // A bacteriophage T4 on a surface (micrometres): a head about 120 × 86 nm on a 140 nm tail, legs splayed.
  function phage(B, foot, lean, d) {
    const up = unit([Math.sin(lean) * d[0], Math.sin(lean) * d[1], 1]), base = add(foot, times(up, .02)), top = add(base, times(up, .14));
    B.k(base, .011, top, .011, '#8fa0e0'); B.e(add(top, times(up, .06)), [.043, .043, .06], '#b9c8ff', { q: frameOf([1, 0, 0], up) });
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, o = [Math.cos(a) * .09, Math.sin(a) * .09, -.02]; B.l([base, add(base, add(o, times(up, .04))), add(foot, times(o, 1.4))], .006, '#a8b6f0', { min: .4 }); }
  }

  // ── at the nucleus: its envelope, the pores in it, viruses waiting ──────────────────────
  // Nanometres, on the top of the nucleus: the envelope as a sheet, nuclear pores 120 nm across
  // in it (how many and where, drawn), each a ring of eight with a plug in its middle. An
  // adenovirus docks at the one under the middle of the frame; influenza, SARS-CoV-2 and
  // rhinoviruses wait nearby with ribosomes.
  const PORES = (() => { const out = [[0, 0]]; for (let j = -7; j <= 7; j++) for (let i = -7; i <= 7; i++) { if (!i && !j) continue; out.push([(i + (j & 1) * .5) * 430 + (hash(i, j, 11) - .5) * 160, j * 372 + (hash(i, j, 12) - .5) * 160]); } return out; })();
  const ADENO = (() => { const p = PORES.reduce((a, q) => Math.hypot(q[0] + 380, q[1] - 300) < Math.hypot(a[0] + 380, a[1] - 300) ? q : a); return [p[0], p[1], 74]; })();
  const VIRUSES = [['flu', [-680, -170, 150]], ['covid', [300, -200, 170]], ['flu', [560, 330, 260]], ['rhino', [150, 260, 70]], ['rhino', [188, 236, 78]], ['rhino', [170, 292, 92]], ['covid', [-420, -330, 210]]];
  const RIBOSOMES = (() => { const r = seeded(29), out = []; while (out.length < 34) { const p = [(r() - .5) * 1700, (r() - .5) * 1300, 30 + r() * 200]; if (Math.hypot(p[0], p[1]) > 120 && Math.hypot(...sub(p, ADENO)) > 110 && VIRUSES.every(([, c]) => Math.hypot(...sub(p, c)) > 90)) out.push(p); } return out; })();
  const FLU_SPIKES = fib(64), COVID_SPIKES = fib(28);
  function envelope(B, t, view) {
    const S = view.S, a = between(S, 7e-6, 3.2e-6, 240e-9, 90e-9), vir = between(S, 3e-6, 1.4e-6, 110e-9, 55e-9); if (a < .01 && vir < .01) return;
    const here = B.pl.middle(), R = Math.min(.62 * Math.hypot(view.W, view.W * view.h / view.w) / 1e-9, 1600), sheet = '#7f6aa8', pore = '#b9a6e0';
    if (a > .01) {
      B.disc([here[0], here[1], 0], [1, 0, 0], [0, 1, 0], R, ctx => { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, sheet + 'e0'); g.addColorStop(.75, sheet + 'c0'); g.addColorStop(1, sheet + '00'); ctx.globalAlpha = B.alpha * a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); }, B.pl.s([0, 0, -30])[2]);
      const fine = ease((B.px * 120 - 14) / 20);
      for (const [x, y] of PORES) {
        const far = Math.hypot(x - here[0], y - here[1]) / R; if (far > .95) continue;
        const al = a * (1 - ease((far - .7) / .25)), P = B.as(B.alpha * al);
        if (fine < .5) { P.f([x, y, 0], (ctx, s) => { ctx.globalAlpha = P.alpha; ctx.strokeStyle = pore; ctx.lineWidth = Math.max(1, 25 * B.px); ctx.beginPath(); ctx.arc(s[0], s[1], 47 * B.px * s[3], 0, TAU); ctx.stroke(); }, 1); continue; }
        for (let k = 0; k < 8; k++) {
          const u = k / 8 * TAU + .2, c = [x + Math.cos(u) * 46, y + Math.sin(u) * 46, 8];
          P.e(c, [14, 14, 10], pore);
          P.l([c, [x + Math.cos(u) * 62, y + Math.sin(u) * 62, 50]], 3, tone(pore, .2), { alpha: .6, min: .5 });
        }
        P.e([x, y, 2], [17, 17, 9], tone(sheet, -.45));
      }
      B.dim([-60, 0, 10], [60, 0, 10], [0, -1, 0], -92, '120 nm');
      B.name([33, -33, 12], 'Nuclear pore · in the nucleus’s envelope', { size: 2.2e-7, leader: true });
      B.name([-420, 260, 0], 'Nuclear envelope · two membranes round the DNA', { leader: true });
      // A microtubule over the envelope, 25 nm across, and a kinesin walking along it with a
      // vesicle: two heads stepping 8 nm at a time on a stalk about 80 nm long (Vale 2003).
      // Where they are is drawn.
      const MT = 230, kin = ((t * 16) % 560) - 300, step = (t * 2) % 2, lead = step < 1 ? 1 : 0, Y = -150;
      B.k([-1600, Y, MT], 12.5, [1600, Y, MT], 12.5, '#7fc8b4', { alpha: .9 });
      for (let x = -1600; x < 1600; x += 8) if (Math.abs(x - kin) < 400 && B.px * 8 > 3) B.f([x, Y, MT + 12.5], (ctx, s) => { ctx.globalAlpha = B.alpha * a * .35; ctx.fillStyle = '#c9f0e4'; ctx.fillRect(s[0] - .5, s[1] - .5, 1, 1); });
      const h1 = [kin - 4 + lead * 8, Y, MT + 16], h2 = [kin + 4 - lead * 8, Y, MT + 16 + Math.sin(step * Math.PI) * 6], hip = [kin, Y, MT + 32];
      B.e(h1, [5, 3, 3.5], '#ffcf6a'); B.e(h2, [5, 3, 3.5], '#ffcf6a'); B.k(h1, 1.4, hip, 1.4, '#ffcf6a'); B.k(h2, 1.4, hip, 1.4, '#ffcf6a');
      B.k(hip, 1.6, [kin, Y, MT + 105], 1.6, '#f1b45a'); B.e([kin, Y, MT + 155], [50, 50, 50], '#e6a1d0', { alpha: .85 });
      B.name([kin + 30, Y, MT + 60], 'Kinesin · walking a vesicle along a microtubule, 8 nm a step', { size: 1.8e-7, leader: true });
    }
    if (vir < .01) return;
    const V = B.as(B.alpha * vir), spin = t * .05;
    // The adenovirus over the pore: its shell, with a fibre and knob at each corner.
    const ac = ADENO, corners = icosa(V, ac, 45, '#6fbf8a', mul(rotZ(.3 + spin), rotX(.55)));
    for (const v of corners) { const d = unit(sub(v, ac)), end = add(v, times(d, 28)); V.k(v, 1.3, end, 1.1, '#b8f0c8'); V.e(end, [4.5, 4.5, 4.5], '#b8f0c8'); }
    V.dim([ac[0] - 45, ac[1], ac[2]], [ac[0] + 45, ac[1], ac[2]], [0, 1, 0], ac[1] + 110, '90 nm');
    V.name([ac[0] - 20, ac[1] + 30, ac[2] + 30], 'Adenovirus · about 90 nm, docking at a pore', { size: 1.6e-7, leader: true });
    // Of several alike (two influenza viruses, three rhinoviruses, the ribosomes), the one named is
    // the one nearest the middle of the frame: naming the first in the list left the one in view
    // without a name whenever the first was outside the frame.
    const off = p => { const q = V.pl.s(p); return Math.max(Math.abs(q[0] - view.w / 2) / view.w, Math.abs(q[1] - view.h / 2) / view.h); };   // as a share of the frame, so one inside it wins
    const nearest = {};
    for (const [n, [kind, c0]] of VIRUSES.entries()) if (nearest[kind] === undefined || off(c0) < off(VIRUSES[nearest[kind]][1])) nearest[kind] = n;
    for (const [n, [kind, c0]] of VIRUSES.entries()) {
      const c = add(c0, [Math.sin(t * .4 + n) * 4, Math.cos(t * .3 + n) * 4, 0]), q = mul(rotZ(n + spin), rotX(n * .7));
      if (kind === 'flu') { V.e(c, [50, 50, 50], '#5f8fbf'); FLU_SPIKES.forEach((d0, k) => { const d = apply(q, d0); V.k(add(c, times(d, 48)), 2.4, add(c, times(d, 62)), 2.8, k % 6 ? '#9fd0ff' : '#ffd36a'); }); }
      else if (kind === 'covid') { V.e(c, [45, 45, 45], '#b85a4a'); COVID_SPIKES.forEach(d0 => { const d = apply(q, d0); V.k(add(c, times(d, 43)), 1.7, add(c, times(d, 55)), 1.7, '#ff8f7a'); V.e(add(c, times(d, 59)), [5, 5, 5], '#ff8f7a'); }); }
      else icosa(V, c, 15, '#ffd36a', q);
      if (nearest[kind] === n) V.name(add(c, [0, kind === 'rhino' ? 6 : 20, 0]), { flu: 'Influenza virus · about 100 nm', covid: 'SARS-CoV-2 · about 100 nm', rhino: 'Rhinovirus · about 30 nm' }[kind], { leader: true, size: kind === 'rhino' ? 5.4e-8 : 1.8e-7 });
    }
    const ribosome = RIBOSOMES.reduce((a, p) => off(p) < off(a) ? p : a);
    for (const p of RIBOSOMES) { V.e(p, [12.5, 12.5, 12.5], '#f2d27a'); V.e(add(p, [5, 4, 5]), [8, 8, 8], '#c9a240', { bias: 2 }); if (p === ribosome) V.name(p, 'Ribosome · about 25 nm', { leader: true, size: 4.5e-8 }); }
  }

  // ── the frames things are drawn in ───────────────────────────────────────────────────────
  const BEE_ROT = mul(rotY(Math.PI + .2), rotZ(.06)), HAIR_ROT = mul(rotZ(.62), rotY(.35)), CELL_ROT = mul(rotX(-.55), rotY(.25));
  // On the top of the nucleus, a little to one side: the point the zoom goes through its envelope.
  const T_ENV = (() => { const u = NUC.c[0] - 1, v = NUC.c[1] - .6; return [u, v, NUC.c[2] + NUC.r[2] * Math.sqrt(1 - ((u - NUC.c[0]) / NUC.r[0]) ** 2 - ((v - NUC.c[1]) / NUC.r[1]) ** 2)]; })();
  const ENV_N = unit([(T_ENV[0] - NUC.c[0]) / NUC.r[0] ** 2, (T_ENV[1] - NUC.c[1]) / NUC.r[1] ** 2, (T_ENV[2] - NUC.c[2]) / NUC.r[2] ** 2]);
  const ENV_ROT = mul(mul(CELL_ROT, frameOf([0, 1, 0], ENV_N)), rotZ(.18)), CHAIN_ROT = mul(ENV_ROT, rotZ(-.3));
  // The view the zoom settles into inside the droplet: a three-quarter look onto the cell, from a
  // little above. What lies under the envelope is placed along that line of sight, so that going
  // down into it the frame stays over the same place.
  const DEEP = mul(mul(rotX(.3), rotY(-.36)), T3(CELL_ROT)), TOWARD_EYE = apply(T3(DEEP), [0, 0, 1]), OUT = apply(ENV_ROT, [0, 0, 1]);
  const under = depth => times(TOWARD_EYE, -depth / dot(TOWARD_EYE, OUT));

  // ── DNA wound round histones ─────────────────────────────────────────────────────────────
  // Nanometres, inside the nucleus under the pore: a string of nucleosomes, each a core of
  // histones with DNA wound 1.65 turns round it in a left-handed coil (radius 4.18 nm and pitch
  // 2.39 nm, drawn), about 11 nm across and 6 thick; the DNA between them straight. The DNA the
  // zoom goes into runs from (−6.8, 0, 0) to (6.8, 0, 0): four turns of 3.4 nm.
  const COIL = { R: 4.18, pitch: -2.39, turns: 1.65 }, LINKER = 6.8;
  const CHAIN = (() => {
    const { R, pitch, turns } = COIL, half = turns * Math.PI, rise = pitch / TAU;
    const coilAt = (c, th, mid) => add(c, [R * Math.cos(th), R * Math.sin(th), rise * (th - mid)]);
    const tangentAt = th => unit([-R * Math.sin(th), R * Math.cos(th), rise]);
    // A nucleosome whose coil leaves at `exit` heading `dir`, or arrives at `entry` heading `dir`.
    const fromExit = (exit, dir) => { const th = Math.atan2(-dir[0], dir[1]), mid = th - half; return { c: sub(exit, [R * Math.cos(th), R * Math.sin(th), rise * half]), from: th - 2 * half, to: th, mid }; };
    const fromEntry = (entry, dir) => { const th = Math.atan2(-dir[0], dir[1]), mid = th + half; return { c: sub(entry, [R * Math.cos(th), R * Math.sin(th), -rise * half]), from: th, to: th + 2 * half, mid }; };
    const entryOf = n => coilAt(n.c, n.from, n.mid), exitOf = n => coilAt(n.c, n.to, n.mid);
    const n1 = fromExit([-LINKER, 0, 0], [1, 0, 0]), n2 = fromEntry([LINKER, 0, 0], [1, 0, 0]);
    const n0 = fromExit(sub(entryOf(n1), times(tangentAt(n1.from), 14)), tangentAt(n1.from)), n3 = fromEntry(add(exitOf(n2), times(tangentAt(n2.to), 30)), tangentAt(n2.to));
    // More of the string either way: linkers 12 to 24 nm, bending as they go (drawn).
    // Each one further from the eye than the last, so the string falls away behind the DNA the
    // zoom goes into rather than across it.
    const r = seeded(13), turn = (d, a) => unit([d[0] * Math.cos(a) - d[1] * Math.sin(a), d[0] * Math.sin(a) + d[1] * Math.cos(a), 0]);
    const away = apply(T3(CHAIN_ROT), TOWARD_EYE), back = (n, k) => { n.c = sub(n.c, times(away, 9 + 7 * k)); };
    const before = [], after = [];
    let first = n0; for (let k = 0; k < 4; k++) { const d = turn(tangentAt(first.from), (r() - .5) * 1.1), n = fromExit(sub(entryOf(first), times(d, 16 + r() * 10)), d); back(n, k); before.unshift(n); first = n; }
    let last = n3; for (let k = 0; k < 4; k++) { const d = turn(tangentAt(last.to), (r() - .5) * 1.1), n = fromEntry(add(exitOf(last), times(d, 16 + r() * 10)), d); back(n, k); after.push(n); last = n; }
    const nucleosomes = [...before, n0, n1, n2, n3, ...after], target = before.length + 1;
    // The DNA's path, every base pair (0.34 nm): its points and the axes round it.
    const path = [];
    const coil = n => { const step = .34 / Math.hypot(R, rise); for (let th = n.from; th <= n.to + 1e-9; th += step) { const p = coilAt(n.c, th, n.mid), t = tangentAt(th), out = unit(sub(p, add(n.c, [0, 0, rise * (th - n.mid)]))); path.push({ p, t, a: out, b: cross(t, out) }); } };
    const line = (p, q, mine) => { const t = unit(sub(q, p)), last = path[path.length - 1].a, a = unit(sub(last, times(t, dot(last, t)))), b = cross(t, a), n = Math.round(Math.hypot(...sub(q, p)) / .34); for (let i = 1; i < n; i++) path.push({ p: add(p, times(sub(q, p), i / n)), t, a, b, mine }); };
    nucleosomes.forEach((n, k) => { coil(n); if (k < nucleosomes.length - 1) line(k === target ? [-LINKER, 0, 0] : exitOf(n), k === target ? [LINKER, 0, 0] : entryOf(nucleosomes[k + 1]), k === target); });
    const rr = seeded(5); path.forEach((s, i) => { s.s = i * .34; s.base = Math.floor(rr() * 4); });
    // The pair the zoom goes into: the base pair at the middle of the measured stretch.
    let middle = 0; path.forEach((s, i) => { if (s.mine && Math.abs(s.p[0]) < Math.abs(path[middle].p[0]) + (path[middle].mine ? 0 : 1e9)) middle = i; });
    path[middle].base = 0;                                             // adenine on the first strand
    return { nucleosomes, path, middle, cores: [n1, n2].map(n => n.c) };
  })();
  const BASE_INKS = ['#ffcf6a', '#7fe3c2', '#ff9d8a', '#b8a6ff'];
  const strandAt = (s, k) => { const u = s.s / 3.4 * TAU + k * 2.4; return add(s.p, add(times(s.a, Math.cos(u) * .95), times(s.b, Math.sin(u) * .95))); };
  function chromatin(B, t, view) {
    const S = view.S, a = narrowing(S, 330e-9, 140e-9); if (a < .01) return;
    const cores = a * presence(SIZES.nucleosome, S, [12, 30]), strands = a * presence(SIZES.dna, S, [1, 3]), detail = ease((B.px - 6) / 6);
    // At the DNA itself, the rest steps back; at the base pair, its own atoms take over.
    // Looking down the helix at the base pair, only its backbone stays round it, faint.
    const pairness = narrowing(S, 5e-9, 2.6e-9), Sn = S / 1e-9;
    const rest = (1 - .86 * narrowing(S, 24e-9, 11e-9)) * (1 - narrowing(S, 4e-9, 2.2e-9)), atoms = narrowing(S, 5e-9, 3e-9);
    const alphaOf = s => s.mine ? 1 : rest * (1 - ease((Math.hypot(...s.p) - 2.4 * Sn) / (1.6 * Sn)));
    for (const n of CHAIN.nucleosomes) B.e(n.c, [3.3, 3.3, 2.9], '#7d9cc4', { alpha: cores * rest });
    const { path } = CHAIN, w = view.w, h = view.h, on = s => { const q = B.pl.s(s.p); return q[0] > -60 && q[0] < w + 60 && q[1] > -60 && q[1] < h + 60; };
    if (detail < 1) for (let i = 3; i < path.length; i += 3) if (on(path[i])) B.as(B.alpha * strands * (1 - detail) * alphaOf(path[i])).k(path[i - 3].p, 1, path[i].p, 1, '#9fc2e6');
    // Until a nanometre is 40 px, the strands go as short lines four base pairs long and each
    // base as a thin line, flat: a rod for every base pair of everything in the frame is
    // thousands of shaded shapes a frame, too many for a phone.
    if (detail > 0 && B.px < 40) {
      const bases = ease((B.px * .14 - .6) / .6);
      for (let i = 4; i < path.length; i += 4) {
        const s = path[i]; if (!on(s) && !on(path[i - 4])) continue;
        const k = alphaOf(s) * (1 - .72 * pairness); if (k < .01) continue;
        const al = B.alpha * strands * detail * k, A = [], Z = [], ink = [];
        for (let j = i - 4; j <= i; j++) { A.push(B.pl.s(strandAt(path[j], 0))); Z.push(B.pl.s(strandAt(path[j], 1))); ink.push(path[j].base); }
        const lw = Math.max(.8, .36 * B.px), bw = Math.max(.5, .14 * B.px);
        // One shape for the run: the bases first, then both strands over them.
        B.f(s.p, ctx => {
          ctx.globalAlpha = al; ctx.lineCap = ctx.lineJoin = 'round';
          if (bases > .01) { ctx.globalAlpha = al * bases; ctx.lineWidth = bw; for (let n = 1; n < 5; n++) { const a = A[n], z = Z[n], mx = (a[0] + z[0]) / 2, my = (a[1] + z[1]) / 2; ctx.strokeStyle = BASE_INKS[ink[n]]; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(mx, my); ctx.stroke(); ctx.strokeStyle = BASE_INKS[3 - ink[n]]; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(z[0], z[1]); ctx.stroke(); } ctx.globalAlpha = al; }
          ctx.lineWidth = lw;
          for (const [pts, colour] of [[A, '#9fd0ff'], [Z, '#ff9d8a']]) { ctx.strokeStyle = colour; ctx.beginPath(); pts.forEach((q, n) => n ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); }
        });
      }
    } else if (detail > 0) {
      for (let i = 1; i < path.length; i++) {
        const s = path[i]; if (!on(s)) continue;
        const own = i === CHAIN.middle, k = alphaOf(s) * (own ? 1 - narrowing(S, 9e-10, 5e-10) : (1 - .72 * pairness) * (1 - narrowing(S, 2.6e-9, 1.6e-9))); if (k < .01) continue;
        const D = B.as(B.alpha * strands * detail * k), pa = strandAt(path[i - 1], 0), qa = strandAt(s, 0), pb = strandAt(path[i - 1], 1), qb = strandAt(s, 1), m = times(add(qa, qb), .5);
        // Shaded rods for the DNA the zoom goes into; flat lines for the rest, which is faint.
        const R = s.mine ? D.k : (p, ra, q, rb, ink) => D.l([p, q], ra * 2, ink, { min: .6 });
        R(pa, .18, qa, .18, '#9fd0ff'); R(pb, .18, qb, .18, '#ff9d8a');
        if ((own && atoms > .3) || (!own && pairness > .6)) continue;   // that pair is drawn atom by atom (pair())
        R(qa, .07, m, .07, BASE_INKS[s.base]); R(m, .07, qb, .07, BASE_INKS[3 - s.base]);
      }
    }
    const n2 = CHAIN.cores[1];
    B.dim(sub(n2, [5.5, 0, 0]), add(n2, [5.5, 0, 0]), [0, 1, 0], n2[1] + 7.2, '11 nm');
    B.name(add(n2, [0, 9.6, 0]), 'Nucleosome · DNA wound round histones');
    B.name(n2, 'Histone core · eight proteins', { size: 1.2e-8, leader: true });
    const n0 = CHAIN.nucleosomes[2].c;
    B.name(n0, 'Chromatin · DNA on its histones', { focus: between(S, 400e-9, 200e-9, 70e-9, 45e-9) * a, leader: true });
  }
  // The DNA itself, measured: 2 nm across, 3.4 nm a turn.
  function dnaMarks(B) {
    B.dim([-3.4, 1, 0], [-3.4, -1, 0], [-1, 0, 0], 5.4, '2 nm');
    B.dim([-1.7, -1, 0], [1.7, -1, 0], [0, -1, 0], 2.5, '3.4 nm a turn');
    B.name([0, -3.9, 0], 'DNA · its double helix');
    B.name([-3.4, 1, 0], 'Sugar–phosphate backbone', { leader: true });
    B.name([.6, 0, 0], 'Base pairs · about 10 a turn', { leader: true });
  }

  // ── one base pair, atom by atom ──────────────────────────────────────────────────────────
  // Ångströms in the pair's own frame (Olson et al. 2001): adenine as given; thymine turned
  // half round its x axis, as the second base of a pair is, and set 0.08 Å nearer so that
  // adenine's N1 is 2.88 Å from thymine's N3. Hydrogens drawn only where they bond across.
  const ADENINE = [['C', -2.479, 5.346, "C1'"], ['N', -1.291, 4.498, 'N9'], ['C', .024, 4.897, 'C8'], ['N', .877, 3.902, 'N7'], ['C', .071, 2.771, 'C5'], ['C', .369, 1.398, 'C6'], ['N', 1.611, .909, 'N6'], ['N', -.668, .532, 'N1'], ['C', -1.912, 1.023, 'C2'], ['N', -2.32, 2.29, 'N3'], ['C', -1.267, 3.124, 'C4']];
  const THYMINE = [["C1'", -2.481, 5.354, 'C'], ['N1', -1.284, 4.5, 'N'], ['C2', -1.462, 3.135, 'C'], ['O2', -2.562, 2.608, 'O'], ['N3', -.298, 2.407, 'N'], ['C4', .994, 2.897, 'C'], ['O4', 1.944, 2.119, 'O'], ['C5', 1.106, 4.338, 'C'], ['C7', 2.466, 4.961, 'C'], ['C6', -.024, 5.057, 'C']].map(([name, x, y, el]) => [el, x, -y + .083, name]);
  const ATOM_OF = name => [...ADENINE, ...THYMINE].find(a => a[3] === name);
  const N1A = ADENINE[7], N3T = THYMINE[4], N6A = ADENINE[6], O4T = THYMINE[6];
  const toward = (a, b, d) => { const v = [b[1] - a[1], b[2] - a[2]], k = d / Math.hypot(...v); return ['H', a[1] + v[0] * k, a[2] + v[1] * k]; };
  const H3 = toward(N3T, N1A, 1.01), H61 = toward(N6A, O4T, 1.01);
  const CPK = { N: ['#6a8cff', 1.55], C: ['#9aa3ad', 1.7], O: ['#ff5a4a', 1.52], H: ['#f2f2f2', 1.2] };
  const BONDS = (() => { const out = []; for (const base of [ADENINE, THYMINE]) for (let i = 0; i < base.length; i++) for (let j = i + 1; j < base.length; j++) if (Math.hypot(base[i][1] - base[j][1], base[i][2] - base[j][2]) < 1.62) out.push([base[i], base[j]]); out.push([N3T, H3], [N6A, H61]); return out; })();
  // The pair's frame in the chain's nanometres: y toward adenine's backbone, x toward the
  // major groove, z along the helix; its origin on the helix's axis.
  const PAIR = (() => {
    const s = CHAIN.path[CHAIN.middle], P1 = strandAt(s, 0), P2 = strandAt(s, 1), M = times(add(P1, P2), .5);
    let Y = sub(P1, P2); Y = unit(sub(Y, times(s.t, dot(Y, s.t))));
    let X = sub(s.p, M); X = unit(sub(sub(X, times(s.t, dot(X, s.t))), times(Y, dot(X, Y))));
    const rot = columns(X, Y, cross(X, Y)), at = ([, x, y], z = 0) => add(s.p, apply(rot, [x * .1, y * .1, z * .1]));
    return { s, P1, P2, rot, at, X, Y };
  })();
  // A water molecule beside the pair, in the major groove near adenine's N7 (drawn), in the pair's Å.
  const WATER_AT = [5.2, -1.6, 1.2];
  function pair(B, t, view) {
    const S = view.S, show = between(S, 5e-9, 3e-9, 6e-10, 3.5e-10); if (show < .01) return;
    const P = B.as(B.alpha * show), at = a => PAIR.at(a);
    // The sugars between the backbone and each base.
    P.k(PAIR.P1, .05, at(ADENINE[0]), .04, '#9fd0ff'); P.k(PAIR.P2, .05, at(THYMINE[0]), .04, '#ff9d8a');
    for (const [a, b] of BONDS) P.k(at(a), .018, at(b), .018, '#c9d2dc');
    for (const a of [...ADENINE, ...THYMINE, H3, H61]) { const [ink, r] = CPK[a[0]]; P.e(at(a), [r * .036, r * .036, r * .036], ink, { bias: .02 }); }
    // The two hydrogen bonds that hold A to T, as dashes.
    for (const [h, to] of [[H3, N1A], [H61, O4T]]) P.l([at(h), at(to)], .012, '#9fe0ff', { dash: [3, 4], alpha: .9, min: 1.6, bias: .05 });
    const f = B.focus;
    P.dim(at(N1A), at(N3T), times(PAIR.X, -1), dot(at(N1A), times(PAIR.X, -1)) + .4, '0.29 nm', { short: true });
    P.name(at(['', -.5, 5.6]), 'Adenine · C₅H₅N₅', { leader: true });
    P.name(at(['', -.5, -5.2]), 'Thymine · C₅H₆N₂O₂', { leader: true });
    P.name(at(['', -2.6, -.9]), 'Hydrogen bonds · two, A to T', { leader: true, focus: f * .9 });
    // The water molecule beside it, measured.
    const wpos = B.world(PAIR.at(['', WATER_AT[0], WATER_AT[1]], WATER_AT[2])), wrot = B.turned(mul(PAIR.rot, mul(rotY(.5), rotZ(2.1))));
    water(B.frame(wpos, wrot, 1e-12, f), t, view);
  }
  // In picometres: the oxygen at the middle, the hydrogens 95.7 pm from it at 104.5°, each
  // atom drawn to its van der Waals radius as a cloud of its electrons.
  const HALF = SIZES.angle / 2 * Math.PI / 180, OH = SIZES.oh / 1e-12, H_AT = SIDES.map(s => [s * OH * Math.sin(HALF), -OH * Math.cos(HALF), 0]);
  // wash: how strongly the glow fills in (less once the cloud is wider than the frame).
  function cloud(ctx, x, y, r, alpha, seed, time, ink = '#9fd0ff', wash = 1, dots = 360) {
    glow(ctx, x, y, r * 1.25, ink + 'b0', alpha * .55 * wash);
    const rnd = seeded(seed); ctx.fillStyle = '#e6f3ff'; ctx.globalAlpha = alpha * .7;
    for (let i = 0; i < dots; i++) { const t = rnd() * TAU, s = -Math.log(1 - rnd() * .97) * r * .38, wob = Math.sin(time * 3 + i) * .02 * r; ctx.fillRect(x + Math.cos(t) * (s + wob), y + Math.sin(t) * (s + wob), 1.1, 1.1); }
  }
  function water(B, t, view) {
    const S = view.S, show = narrowing(S, 3e-9, 1.8e-9) * presence(SIZES.oxygen * 2, S, [3, 14]); if (show < .01) return;
    const rO = SIZES.oxygen / 1e-12 * B.px, rH = SIZES.hydrogen / 1e-12 * B.px, wash = 1 - .7 * ease((rO * 1.25 - view.w) / view.w);
    B.f([0, 0, 0], (ctx, s) => cloud(ctx, s[0], s[1], rO * s[3], B.alpha * show, 70, t, '#9fd0ff', wash));
    H_AT.forEach((p, k) => B.f(p, (ctx, s) => cloud(ctx, s[0], s[1], rH * s[3], B.alpha * show * .8, 80 + k, t, '#ffd0c4', wash), -40));
    for (const p of H_AT) B.l([[0, 0, 0], p], 6, '#f2f1e7', { alpha: show * .35 * Math.max(B.focus, .3) * (1 - ease((6 * B.px - 4) / 8)), min: .8, bias: 200 });
    for (const [p, ink] of [[[0, 0, 0], '#ffd9a0'], ...H_AT.map(p => [p, '#ffb09a'])]) B.f(p, (ctx, s) => glow(ctx, s[0], s[1], 4, ink + 'ff', B.alpha * show), 210);
    if (B.focus > .02) {
      B.dim([0, 0, 0], H_AT[1], unit([Math.cos(HALF), Math.sin(HALF), 0]), 60, '95.7 pm');
      B.f([0, 0, 0], (ctx, s) => {
        const p = H_AT.map(B.pl.s), a0 = Math.atan2(p[0][1] - s[1], p[0][0] - s[0]), a1 = Math.atan2(p[1][1] - s[1], p[1][0] - s[0]), r = 38 * B.px * s[3];
        let lo = Math.min(a0, a1), hi = Math.max(a0, a1); if (hi - lo > Math.PI) [lo, hi] = [hi, lo + TAU];
        ctx.globalAlpha = B.alpha * B.focus * show * .9; ctx.strokeStyle = '#c4fa79'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(s[0], s[1], r, lo, hi); ctx.stroke();
      }, 220);
      B.name([0, -78, 0], '104.5°', { focus: B.focus * show });
      B.name([0, 210, 0], 'Water molecule · H₂O', { focus: B.focus * show });
    }
  }
  // The water round the DNA, one molecule deep: as many as a slab 0.31 nm thick holds, at their
  // true size; where each is and how it is turned, drawn. Not inside the DNA.
  function liquid(items, view, time) {
    const S = view.S, show = between(S, 2.6e-9, 1.5e-9, 2.4e-10, 1.4e-10); if (show < .01) return;
    const P = THINGS[index.pair], pos = add(P.pos, apply(P.rot, times(PAIR.s.p, 1e-9))), rot = mul(P.rot, PAIR.rot), pl = placed(view, pos, rot, 1e-12), here = pl.local(view.C);
    const X = view.W / 1e-12 * .75, Y = X * view.h / view.w, Z = 155, water = [WATER_AT[0] * 100, WATER_AT[1] * 100, WATER_AT[2] * 100];
    const count = Math.min(400, Math.round(WATER * (2 * X) * (2 * Y) * (2 * Z) * 1e-36)), r = seeded(41);
    const rO = SIZES.oxygen / 1e-12 * pl.px, rH = SIZES.hydrogen / 1e-12 * pl.px;
    for (let i = 0; i < count; i++) {
      const p = [here[0] + (r() - .5) * 2 * X, here[1] + (r() - .5) * 2 * Y, (r() - .5) * 2 * Z], spin = r() * TAU + time * (r() - .5) * .8, tilt = r() * Math.PI;
      if (Math.hypot(p[0], p[1]) < 1200 || Math.hypot(...sub(p, water)) < 330) continue;      // not in the DNA, not over the measured one
      const q = mul(rotY(spin), rotX(tilt)), atoms = [[p, rO, '#9fd0ff'], ...H_AT.map(h => [add(p, apply(q, h)), rH, '#ffd0c4'])];
      for (const [c, rad, ink] of atoms) { const s = pl.s(c); if (s[0] < -rad * 2 || s[0] > view.w + rad * 2 || s[1] < -rad * 2 || s[1] > view.h + rad * 2) continue; items.push({ z: s[2], draw: ctx => glow(ctx, s[0], s[1], rad * s[3] * 1.15, ink + '90', show * .35) }); }
    }
  }

  // ── adenine's N1: the nitrogen atom ──────────────────────────────────────────────────────
  // Picometres round N1, in the pair's frame: its seven electrons as a cloud 155 pm in radius,
  // its neighbours' clouds overlapping it.
  const NEIGHBOURS = [...ADENINE, ...THYMINE, H3, H61].filter(a => a !== N1A && Math.hypot(a[1] - N1A[1], a[2] - N1A[2]) < 6).map((a, i) => [[(a[1] - N1A[1]) * 100, (a[2] - N1A[2]) * 100, 0], CPK[a[0]][1] * 100, a[0] === 'H' ? '#ffd0c4' : a[0] === 'O' ? '#ffb4a8' : '#9fd0ff', 90 + i]);
  // Two of them named: the nearest carbon, bonded to N1, and thymine's hydrogen across the
  // hydrogen bond.
  const NEAR_C = (() => { const c = ADENINE.filter(a => a[0] === 'C').reduce((b, a) => Math.hypot(a[1] - N1A[1], a[2] - N1A[2]) < Math.hypot(b[1] - N1A[1], b[2] - N1A[2]) ? a : b); return { at: [(c[1] - N1A[1]) * 100, (c[2] - N1A[2]) * 100, 0], d: Math.hypot(c[1] - N1A[1], c[2] - N1A[2]) * 100 }; })();
  const ACROSS = [(H3[1] - N1A[1]) * 100, (H3[2] - N1A[2]) * 100, 0];
  function atom(B, t, view) {
    const S = view.S, show = narrowing(S, 1.3e-9, 6.5e-10) * presence(SIZES.nitrogen * 2, S, [3, 14]); if (show < .01) return;
    const rN = SIZES.nitrogen / 1e-12 * B.px, wash = 1 - .7 * ease((rN * 1.25 - view.w) / view.w);
    for (const [p, r, ink, seed] of NEIGHBOURS) B.f(p, (ctx, s) => cloud(ctx, s[0], s[1], r * B.px * s[3], B.alpha * show * .42, seed, t, ink, wash, 180), -30);
    B.f([0, 0, 0], (ctx, s) => cloud(ctx, s[0], s[1], rN * s[3], B.alpha * show, 71, t, '#9fd0ff', wash, 420));
    B.f([0, 0, 0], (ctx, s) => glow(ctx, s[0], s[1], 4, '#ffd9a0ff', B.alpha * show), 210);
    if (B.focus > .02) {
      B.f([0, 0, 0], (ctx, s) => ring(ctx, s[0], s[1], rN * s[3], B.alpha * show * .5 * B.focus), 230);
      B.radius([0, 0, 0], [-SIZES.nitrogen / 1e-12 * .707, SIZES.nitrogen / 1e-12 * .707, 0], '155 pm radius');
      B.name([0, 210, 0], 'Nitrogen atom · N1 of adenine, 7 electrons');
      B.name(NEAR_C.at, 'Carbon atom · bonded to it, ' + Math.round(NEAR_C.d) + ' pm away', { size: 4e-10, leader: true });
      B.name(ACROSS, 'Hydrogen atom · thymine’s, across the hydrogen bond', { size: 3e-10, leader: true });
    }
  }

  // ── one electron ─────────────────────────────────────────────────────────────────────────
  // Picometres. An electron has shown no size (under 10⁻¹⁸ m in collisions), so it is drawn as
  // a point; in the atom it is not at one place but spread through the cloud, and where the
  // point sits, 55 pm from the nucleus, is drawn.
  function electron(B, t, view) {
    const S = view.S, show = narrowing(S, 5e-10, 2.4e-10) * (1 - narrowing(S, 2.5e-11, 1.2e-11)); if (show < .01) return;
    const r = clamp(Math.min(view.w, view.h) * .012, 4, 9), pulse = 1 + .12 * Math.sin(t * 2.2);
    B.f([0, 0, 0], (ctx, s) => { glow(ctx, s[0], s[1], r * 6 * pulse, '#9fd0ff50', B.alpha * show); glow(ctx, s[0], s[1], r * 1.6, '#e6f4ffff', B.alpha * show); }, 240);
    const ends = view.end === 'electron' ? ease(Math.log(1.6e-10 / S) / Math.log(2)) : 0, f = Math.max(B.focus, ends);
    const narrow = view.w < 600;
    B.name([0, 0, 0], narrow ? 'Electron · no size found' : 'Electron · drawn as a point; it has shown no size', { focus: f, size: 4e-11, leader: true });
    if (ends > .02) {
      if (!narrow) B.dim([0, 0, 0], [-38, -40, 0], [.7071, -.7071, 0], 9, '55 pm to the nucleus', { focus: ends, size: 3e-11 });
      B.name([-38, -40, 0], narrow ? 'Nucleus · 55 pm that way' : 'Nitrogen nucleus · 20,000 times smaller than this frame', { focus: ends, size: 3e-11, leader: true });
      B.name([24, -16, 0], narrow ? 'Electron cloud' : 'Electron cloud · where the atom’s seven are likely to be', { focus: ends, size: 3e-11, leader: true });
    }
  }

  // ── the nucleus, a proton ────────────────────────────────────────────────────────────────
  // In femtometres: nitrogen-14's seven protons and seven neutrons, each drawn 0.84 fm in
  // radius; 2.56 fm the nucleus's charge radius. Then one proton and its three quarks.
  const NUCLEONS = (() => { const r = seeded(91), pts = fib(12).map(p => times(p, 1.7)); pts.push([.36, .3, .2], [-.34, -.32, -.24]); return pts.map((p, i) => [p, i % 2 === 0 ? 'p' : 'n', r()]); })();
  let PROTON = NUCLEONS[0], NEUTRON = NUCLEONS[1];
  const PLANE = mul(rotX(.5), rotZ(.3));
  // Where the proton's quarks are at `t`, round its middle, in femtometres.
  const quarks = t => [0, 1, 2].map(i => { const a = i / 3 * TAU + t * .35 + Math.sin(t * 1.7 + i) * .3, r = .84; return apply(PLANE, [Math.cos(a) * r * .45, Math.sin(a) * r * .45, Math.sin(t + i) * r * .12]); });
  function nucleus(B, t, view) {
    const S = view.S, show = presence(SIZES.nucleus14 * 2, S, [3, 8]), held = THINGS[index.nucleus14].span * HOLD_RATE, into = ease(Math.log(held / S) / Math.log(held / THINGS[index.proton].span)), pFocus = focusOf(index.proton, S);
    const gone = 1 - narrowing(S, 5e-16, 1.2e-16);                      // past the proton, the quark's field takes over
    if ((show < .01 && pFocus < .01 && into < .01) || gone < .01) return;
    B.f([0, 0, 0], (ctx, s) => glow(ctx, s[0], s[1], 2.56 * 1.6 * B.px * s[3], '#ffd9a0aa', B.alpha * show * .35), -10);
    for (const [p, kind, ph] of NUCLEONS) {
      const own = p === PROTON[0], c = own ? p : add(p, times([Math.sin(t * 2 + ph * 9), Math.cos(t * 2.3 + ph * 7), Math.sin(t * 1.7 + ph * 5)], .05));
      const a = own ? Math.max(show, into) * (1 - into * .8) : show * (1 - into);
      if (a > .01) B.e(c, [.84, .84, .84], kind === 'p' ? '#ef8f78' : '#c9cbbf', { alpha: a });
    }
    if (B.focus > .02) {
      B.f([0, 0, 0], (ctx, s) => ring(ctx, s[0], s[1], 2.56 * B.px * s[3], B.alpha * B.focus * .5), 10);
      B.radius([0, 0, 0], [-2.56, 0, 0], '2.56 fm charge radius');
      B.name([0, 3.7, 0], 'Nitrogen-14 nucleus · 7 protons, 7 neutrons');
      B.name(add(PROTON[0], [0, .9, 0]), 'Proton · about 1.7 fm across', { size: 3e-15, focus: B.focus * (1 - into), leader: true });
      B.name(add(NEUTRON[0], [0, -.9, 0]), 'Neutron · no charge, as heavy as a proton', { size: 3e-15, focus: B.focus * (1 - into), leader: true });
    }
    // The proton: its quarks and the gluon field between them.
    if (into > .01) {
      const c = PROTON[0], r = .84, k = into * gone, qs = quarks(t).map(q => add(c, q));
      B.f(c, (ctx, s) => glow(ctx, s[0], s[1], r * 1.3 * B.px * s[3], '#ffb09ab0', B.alpha * k * .5), 2);
      const sq = qs.map(B.pl.s), R = r * B.px;
      B.f(c, ctx => {
        ctx.globalAlpha = B.alpha * k * .8; ctx.strokeStyle = '#ffe3a8'; ctx.lineWidth = Math.max(1, Math.min(R * .02, 6));
        // The field between them as lattice QCD computes it for three quarks: one Y-shaped tube
        // that meets at a junction, drawn as a soft band (Takahashi et al. 2004).
        const J = [(sq[0][0] + sq[1][0] + sq[2][0]) / 3, (sq[0][1] + sq[1][1] + sq[2][1]) / 3];
        ctx.lineCap = 'round';
        for (const [lw, a] of [[Math.max(4, Math.min(R * .16, 90)), .18], [Math.max(1.5, Math.min(R * .05, 24)), .35]]) {
          ctx.globalAlpha = B.alpha * k * a; ctx.lineWidth = lw; ctx.beginPath();
          for (const q of sq) { ctx.moveTo(J[0], J[1]); ctx.lineTo(q[0], q[1]); }
          ctx.stroke();
        }
        sq.forEach(q => glow(ctx, q[0], q[1], Math.max(3, Math.min(R * .1, 60)), '#fff1d8ff', B.alpha * k));
        if (into > .2) for (let i = 0; i < 3; i++) redInk.note(ctx, QUARKS[i] + ' quark', sq[i][0], sq[i][1] + Math.max(14, Math.min(R * .16, 40)), B.alpha * clamp((into - .2) * 2.5) * gone, 'center', redInk.INK, true);
      }, 3);
      B.name(times(add(add(qs[0], qs[1]), qs[2]), 1 / 3), 'Gluon field · holds the three quarks together', { focus: clamp((into - .3) * 2) * gone, leader: true });
      if (pFocus > .02) {
        B.f(c, (ctx, s) => ring(ctx, s[0], s[1], R * s[3], B.alpha * pFocus * .5), 4);
        B.radius(c, add(c, [r, 0, 0]), '0.84 fm charge radius', pFocus);
        B.name(add(c, [0, r * 1.35, 0]), 'Proton · two up quarks, one down', { focus: pFocus });
      }
    }
  }

  // ── below the proton ─────────────────────────────────────────────────────────────────────
  // One quark, which has shown no size, and the lengths measured or worked out from measurements
  // that mark the way down, as solid rings round it: the weak force's reach, the quark's upper
  // bound, the smallest change LIGO detects in its arms (about a ten-thousandth of a proton's
  // width), the smallest length a collider has reached, a neutrino's target at 1 GeV (its
  // cross-section, about 0.7 × 10⁻³⁸ cm² a nucleon, as a disc), the reduced wavelength ħc/E of
  // the most energetic particle seen (the Fly's Eye cosmic ray of 1991, 3.2 × 10²⁰ eV), where
  // grand unified theories put the forces' meeting (about 10¹⁶ GeV; theory, dashed), and the
  // Planck length, built from measured constants (Brandon, 2026-11-21: "add sizes back between
  // the quark and planck length"). No objects are drawn between: none has been seen.
  const MARKS = [
    [SIZES.weak, 'Reach of the weak force', 'about 2.5 × 10⁻¹⁸ m', 'm'],
    [SIZES.quark, 'A quark is smaller than this', '0.43 × 10⁻¹⁸ m', 'm'],
    [SIZES.ligo, 'Smallest change LIGO detects in its 4 km arms', 'about 10⁻¹⁹ m', 'm'],
    [SIZES.collider, 'Smallest length a collider has reached', 'about 1.5 × 10⁻²⁰ m', 'm'],
    [SIZES.neutrino, 'A neutrino’s target at 1 GeV · its cross-section, as a disc', 'radius about 5 × 10⁻²² m', 'm'],
    [SIZES.cosmic, 'Wavelength of the most energetic particle seen (a cosmic ray, 1991)', '6 × 10⁻²⁸ m', 'm'],
    [SIZES.gut, 'Where the forces may unite · theory, not measured', 'about 2 × 10⁻³² m', 't'],
    [SIZES.planck, 'Planck length', '1.6 × 10⁻³⁵ m', 'p'],
  ].map(([size, name, figure, kind]) => ({ size, name: [name], figure, kind }));
  // What the frame says, by width: [from, to, words].
  const CAPTIONS = [
    [2e-22, 1e-26, ['Below every collider', 'Only lengths are known here, from particles’ energies · no objects']],
    [1e-28, 6e-31, ['Nothing measured', 'No experiment reaches this far down']],
    [9e-35, 1e-36, ['The Planck length', 'Built from G, ħ and c · no tested theory describes shorter lengths']],
  ];
  const INNER = ['Innermost electrons · most likely about 8 pm out'];
  const NUCLEUS_HERE = ['Nitrogen-14 nucleus · here, 5 fm across, too small to see'], NUCLEUS_HERE_NARROW = ['Nitrogen-14 nucleus', 'Here, too small to see'];
  const INSIDE = ['Inside the proton · 1.7 fm across, two up quarks and a down'], INSIDE_NARROW = ['Inside the proton', '1.7 fm across'];
  const QUARK_NAME = ['Up quark · drawn as a ball; no size has been found'], QUARK_NAME_NARROW = ['Up quark', 'A ball: no size has been found'];
  const KIND_INK = { q: '#f0a070', l: '#8fd0ff', b: '#c4fa79', h: '#ffd86a', p: '#b79cff' };
  // A ball with light on it, for a particle: r pixels.
  function ball(ctx, x, y, r, ink, alpha, hollow) {
    ctx.globalAlpha = alpha;
    if (hollow) { ctx.strokeStyle = ink; ctx.lineWidth = 1.2; ctx.setLineDash([2.5, 2.5]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = alpha * .25; }
    const g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(.35, ink); g.addColorStop(1, tone(ink, -.55));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  function deeper(ctx, view, time, dims, names) {
    const { w, h, W, px, R } = view, show = ease(Math.log(SIZES.proton * .9 / W) / Math.log(3)); if (show < .01) return;
    const cx = w / 2, cy = h / 2, largest = Math.max(w, h);
    // A direction in the scene to the screen (y down).
    const turn = v => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], -(R[3] * v[0] + R[4] * v[1] + R[5] * v[2]), R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
    ctx.save();
    // A deep field behind it all.
    const field = ctx.createRadialGradient(cx, cy, 0, cx, cy, largest * .75);
    field.addColorStop(0, '#1f1622'); field.addColorStop(.55, '#0f1019'); field.addColorStop(1, '#090b10');
    ctx.globalAlpha = show; ctx.fillStyle = field; ctx.fillRect(0, 0, w, h);
    // The quark, as a ball: no size has been found, so its size on the screen is not a size.
    const qr = clamp(Math.min(w, h) * .03, 12, 26);
    glow(ctx, cx, cy, qr * 3.2, '#ffe6c840', show); ball(ctx, cx, cy, qr, KIND_INK.q, show);
    // Each length as a sphere: a faint body, a lit rim, its outline and one great circle; measured
    // ones carry a dimension line out to them.
    for (const m of MARKS) {
      const r = m.size * px, alpha = show * ease((r - 5) / 16) * (1 - ease((r - .7 * largest) / (.4 * largest))); if (alpha < .02) continue;
      const ink = m.kind === 'p' ? '#e9c79a' : m.kind === 't' ? '#9fc3ff' : '#c4fa79', faint = m.kind === 't';
      const body = ctx.createRadialGradient(cx - r * .35, cy - r * .4, r * .05, cx, cy, r);
      body.addColorStop(0, ink + (faint ? '0c' : '18')); body.addColorStop(.85, ink + '06'); body.addColorStop(1, ink + (faint ? '1c' : '30'));
      ctx.globalAlpha = alpha; ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
      ctx.globalAlpha = alpha * (faint ? .6 : .7); ctx.strokeStyle = ink; ctx.lineWidth = m.kind === 'p' ? 1.4 : 1; ctx.setLineDash(faint ? [6, 5] : []);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
      ctx.globalAlpha *= .55; ctx.setLineDash([2, 5]); ctx.beginPath();
      for (let i = 0; i <= 72; i++) { const t = i / 72 * TAU, q = turn([Math.cos(t), Math.sin(t) * .34, Math.sin(t) * .94]); i ? ctx.lineTo(cx + q[0] * r, cy + q[1] * r) : ctx.moveTo(cx + q[0] * r, cy + q[1] * r); }
      ctx.stroke(); ctx.setLineDash([]);
      const e = [cx + r * .7071, cy - r * .7071];
      dims.push({ a: [cx, cy], b: e, A: [cx, cy], B: e, text: m.figure, alpha: alpha * (faint ? .7 : 1), radius: true });
      names.push({ at: [cx - r * .7071, cy - r * .7071], lines: m.name, alpha, leader: true });
    }
    // Inside the proton, on the way down to one of its quarks: say where the frame is.
    const inside = show * ease(Math.log(THINGS[index.proton].span / 2 / W) / Math.log(2)) * (1 - ease(Math.log(THINGS[index.quark].span * 12 / W) / Math.log(3)));
    if (inside > .02) names.push({ at: [w / 2, redInk.room.top + 40], lines: w < 600 ? INSIDE_NARROW : INSIDE, alpha: inside, leader: false });
    const quark = show * (1 - ease(Math.log(2e-19 / W) / Math.log(3)));
    if (quark > .02) names.push({ at: [cx, cy], lines: w < 600 ? QUARK_NAME_NARROW : QUARK_NAME, alpha: quark, leader: true });
    for (const [from, to, words] of CAPTIONS) redInk.caption(ctx, w, h, words, show * ease(Math.log(from / W) / Math.log(2.2)) * (1 - ease(Math.log(to * 2.2 / W) / Math.log(2.2))));
    ctx.restore();
  }

  // ── the things ───────────────────────────────────────────────────────────────────────────
  // Each: `span` (the frame's shorter side when the zoom stops at it; the street's is the
  // street's framing, worked out for the screen), `travel` and `hold` (film marks to get there
  // and to stay, on red's homepage), `unit` (metres a local unit), `c` (the middle of its
  // drawing, local), `d` (where it sits, metres, from the one before), `rot` (its axes in the
  // street's: x to the right, y up, z toward the eye), `title` and `note` (the scale app's list
  // of stops), and `build`, which draws it and fades it in and out itself.
  const PAIR_ROT = mul(CHAIN_ROT, PAIR.rot), N1_AT = PAIR.at(N1A);
  const THINGS = [
    { key: 'street', span: null, travel: 10, hold: 44, unit: 1, c: [0, HAND.aim, 0], d: [0, 0, 0], rot: I3, build: street, street: true },
    { key: 'pigeon', title: 'Rock pigeon', note: 'About 32 cm long, wings 60 cm across', span: 1.1, travel: 14, hold: 8, unit: 1, c: [0, 0, 0], d: [0, 0, 0], rot: I3, build: pigeon, aside: true, fly: FLY.pigeon },
    { key: 'sparrow', title: 'House sparrow', note: 'About 16 cm long', span: .5, travel: 12, hold: 8, unit: 1, c: [0, 0, 0], d: [0, 0, 0], rot: I3, build: sparrow, aside: true, fly: FLY.sparrow },
    { key: 'leaf', title: 'Oak leaf', note: 'About 12 cm long', span: .3, travel: 12, hold: 8, unit: 1, c: [0, 0, 0], d: [0, 0, 0], rot: I3, build: leaf, aside: true, fly: FLY.leaf },
    { key: 'bee', title: 'Honey bee', note: 'A worker, 12 to 15 millimetres', span: 3.4e-2, travel: 14, unit: 1e-3, c: [0, 0, 0], d: [.004, HAND.aim + .012, .04], rot: BEE_ROT, build: bee, aside: true, fly: FLY.bee },
    // A stop with nothing of its own to build: the grain is drawn with the droplet's air.
    { key: 'sand', title: 'Grain of sand', note: 'About half a millimetre', span: 3e-3, travel: 12, unit: 1e-6, c: [0, 0, 0], d: [0, 0, 0], rot: I3, build: null, aside: true },
    { key: 'hair', title: 'Human hair', note: 'About 100 micrometres across', span: 5e-4, travel: 14, unit: 1e-6, c: [0, 0, 0], d: [-2.6e-3, -1.8e-3, -5e-3], rot: HAIR_ROT, build: hair, aside: true },
    { key: 'droplet', title: 'Cough droplet', note: 'With ragweed pollen and dust beside it', span: 3.4e-4, travel: 10, unit: 1e-6, c: [0, 0, 0], d: [230e-6, 120e-6, 160e-6], rot: I3, build: air },
    { key: 'cell', title: 'Cheek cell', note: 'With the bacteria of a mouth', span: 9e-5, travel: 14, unit: 1e-6, c: [3, 0, 0], d: [-14e-6, 9e-6, 6e-6], rot: CELL_ROT, build: cell },
    { key: 'nucleus', title: 'Cell nucleus', note: 'About 8.5 micrometres', span: 1.6e-5, travel: 14, unit: 1e-6, c: NUC.c, d: [0, 0, 0], rot: CELL_ROT, build: null },
    { key: 'pore', title: 'Nuclear pore', note: 'Viruses waiting at the nucleus', span: 5e-7, travel: 18, unit: 1e-9, c: [0, 0, 0], d: apply(CELL_ROT, times(T_ENV, 1e-6)), rot: ENV_ROT, build: envelope },
    { key: 'nucleosome', title: 'Nucleosome', note: 'DNA wound round eight histones', span: 3.6e-8, travel: 14, unit: 1e-9, c: [0, COIL.R, 0], d: under(60e-9), rot: CHAIN_ROT, build: chromatin },
    { key: 'dna', title: 'DNA', note: 'The double helix, 2 nm wide', span: 9e-9, travel: 10, unit: 1e-9, c: [0, 0, 0], d: [0, 0, 0], rot: CHAIN_ROT, build: dnaMarks },
    { key: 'pair', title: 'Base pair', note: 'Adenine held to thymine', span: 1.6e-9, travel: 10, unit: 1e-9, c: PAIR.s.p, d: [0, 0, 0], rot: CHAIN_ROT, build: pair },
    { key: 'atom', title: 'Nitrogen atom', note: 'N1 of the adenine', span: 4.5e-10, travel: 9, unit: 1e-12, c: [0, 0, 0], d: apply(CHAIN_ROT, times(N1_AT, 1e-9)), rot: PAIR_ROT, build: atom },
    // One of the atom's electrons, 55 pm from the nucleus (about where nitrogen's outer electrons
    // are most likely to be found), where red's homepage ends its zoom (`end`); the scale app
    // passes it on the way to the nucleus. `off`: where it is from the atom's middle, picometres.
    { key: 'electron', span: 6e-11, travel: 12, hold: 16, unit: 1e-12, c: [0, 0, 0], d: [0, 0, 0], off: [38, 40, 0], rot: PAIR_ROT, build: electron, aside: true },
    { key: 'empty', title: 'Empty space', note: 'Between its electrons and its nucleus', span: 1e-11, travel: 12, unit: 1e-12, c: [0, 0, 0], d: [0, 0, 0], rot: PAIR_ROT, build: null },
    { key: 'nucleus14', title: 'Nitrogen-14 nucleus', note: 'Seven protons, seven neutrons', span: 1.3e-14, travel: 12, unit: 1e-15, c: [0, 0, 0], d: [0, 0, 0], rot: I3, build: nucleus },
    { key: 'proton', title: 'Proton', note: 'Two up quarks and a down', span: 3.2e-15, travel: 10, unit: 1e-15, c: [0, 0, 0], d: null, rot: I3, build: null },
    { key: 'quark', title: 'Up quark', note: 'No size found: under 0.43 × 10⁻¹⁸ metres', span: 2.5e-18, travel: 12, hold: 16, unit: 1e-15, c: [0, 0, 0], d: [0, 0, 0], rot: I3, build: null },
    { key: 'ligo', title: 'LIGO’s smallest change', note: 'About 10⁻¹⁹ metres', span: 4e-19, travel: 8, unit: 1e-15, c: [0, 0, 0], d: [0, 0, 0], rot: I3, build: null },
    { key: 'collider', title: 'Collider limit', note: 'About 10⁻²⁰ metres', span: 6e-20, travel: 8, unit: 1e-15, c: [0, 0, 0], d: [0, 0, 0], rot: I3, build: null },
    { key: 'neutrino', title: 'A neutrino’s target', note: 'About 5 × 10⁻²² metres', span: 1.9e-21, travel: 8, unit: 1e-15, c: [0, 0, 0], d: [0, 0, 0], rot: I3, build: null },
    { key: 'cosmic', title: 'Most energetic particle', note: 'Its wavelength: 6 × 10⁻²⁸ metres', span: 2.4e-27, travel: 12, unit: 1e-15, c: [0, 0, 0], d: [0, 0, 0], rot: I3, build: null },
    { key: 'gut', title: 'Grand unification', note: 'Theory: about 2 × 10⁻³² metres', span: 8e-32, travel: 10, unit: 1e-15, c: [0, 0, 0], d: [0, 0, 0], rot: I3, build: null },
    { key: 'planck', title: 'Planck length', note: '1.6 × 10⁻³⁵ metres', span: 4.2e-35, travel: 16, unit: 1e-15, c: [0, 0, 0], d: [0, 0, 0], rot: I3, build: null },
    // In the air with no stop of their own.
    { key: 'acorn', span: .07, unit: 1e-3, c: [0, 0, 0], d: [0, 0, 0], rot: I3, build: acorn, aside: true, fly: FLY.acorn, stop: false },
    { key: 'dandelion', span: 3e-2, unit: 1e-3, c: [0, 0, 0], d: [0, 0, 0], rot: I3, build: dandelion, aside: true, fly: FLY.dandelion, stop: false },
    { key: 'mosquito', span: 1.2e-2, unit: 1e-3, c: [0, 0, 0], d: [0, 0, 0], rot: I3, build: mosquito, aside: true, fly: FLY.mosquito, stop: false },
  ];
  const HOLD = 5, HOLD_RATE = .85;
  const index = Object.fromEntries(THINGS.map((t, i) => [t.key, i]));
  // The proton is the nucleus's proton nearest the eye in the deep view.
  const PAIR_VIEW = mul(rotX(.32), T3(PAIR_ROT)), Q_STREET = quatOf(rotX(PITCH)), Q_DEEP = quatOf(DEEP), Q_PAIR = quatOf(PAIR_VIEW), PAIR_EYE = apply(T3(PAIR_VIEW), [0, 0, 1]);
  {
    PROTON = NUCLEONS.reduce((best, n) => n[1] === 'p' && dot(n[0], PAIR_EYE) > dot(best[0], PAIR_EYE) ? n : best, NUCLEONS[0]);
    THINGS[index.proton].d = times(PROTON[0], 1e-15);
    NEUTRON = NUCLEONS.reduce((best, n) => n[1] === 'n' && dot(n[0], PAIR_EYE) > dot(best[0], PAIR_EYE) ? n : best, NUCLEONS[1]);
  }
  // Where each sits, worked out back from the proton (at 0) so the smallest stay precise.
  (() => {
    let p = [0, 0, 0];
    for (let i = THINGS.length - 1; i >= index.proton; i--) THINGS[i].pos = [0, 0, 0];
    p = sub(p, THINGS[index.proton].d);
    for (let i = index.proton - 1; i >= 0; i--) { THINGS[i].pos = p; p = sub(p, THINGS[i].d); }
    for (const t of THINGS) if (t.off) t.pos = add(THINGS[index.atom].pos, times(apply(t.rot, t.off), t.unit));
    for (const t of THINGS) t.centre = add(t.pos, times(apply(t.rot, t.c), t.unit));
  })();
  const STOPS = THINGS.filter(t => t.stop !== false).map(({ key, span, travel, hold, title, note }) => ({ key, span, travel, hold: hold ?? HOLD, title, note }));
  // Red's film in marks from the start of the zoom (red/story.js keeps the same schedule): each
  // stop's travel, eased in log width, to its span, then its hold, narrowing by 15%. `centre`
  // is the middle of each stop's hold, where whatever passes by crosses the middle of the frame.
  const SCHEDULE = (() => {
    const knots = [[0, null]], centre = []; let m = 0;
    for (const [i, t] of THINGS.entries()) { if (t.stop === false) continue; const hold = t.hold ?? HOLD; m += t.travel; knots.push([m, t.span, 1]); centre[i] = m + hold / 2; m += hold; knots.push([m, t.span, HOLD_RATE]); }
    return { knots, centre };
  })();
  // Where the film is, for a frame S wide: the schedule run backwards (the scale app, which
  // has no marks of its own, moves its passers-by with this).
  function marksAt(S) {
    const K = SCHEDULE.knots, at = k => (K[k][1] ?? THINGS[0].span) * (K[k][2] ?? 1);
    if (S >= at(0)) return K[1][0];
    for (let k = 1; k < K.length; k++) {
      const a = at(k - 1), b = at(k); if (S < b || a === b) continue;
      const t = clamp(Math.log(S / a) / Math.log(b / a)), u = .5 - Math.sin(Math.asin(1 - 2 * t) / 3);
      return K[k - 1][0] + u * (K[k][0] - K[k - 1][0]);
    }
    return K[K.length - 1][0];
  }
  // Where the frame's middle is when the zoom has closed on the proton's first quark, which moves.
  const quarkAt = t => add(THINGS[index.proton].pos, times(quarks(t)[0], 1e-15));

  // The frame's usable shorter side, in pixels: the screen less what covers it (on red's
  // homepage, the header and the rail; layout() sets it for a page without them).
  let CHROME = 120;
  // press: the page opens a note when a named thing is pressed (see pick), so more names are
  // written where there is room and the named things left without one are marked with a dot.
  let PRESS = false;
  const layout = ({ chrome = 120, press = false } = {}) => { CHROME = chrome; PRESS = press; };
  const short = (w, h) => Math.max(160, Math.min(w, h - CHROME));
  // The street's last framing, as a shorter side: a 1.75 m figure would fill `fillOf` of the frame's height.
  const first = (w, h) => EYE * short(w, h) / (FRAMING * fillOf(w, h) * h);
  // The middle of the frame for a frame `S` metres on its shorter side: at a thing while the
  // zoom stays there, moving to the next as the frame narrows to it.
  // Things beside the way (the birds, the bee, the hair, the electron) are not on it: the zoom
  // goes past them. `end`: the path stops at that thing after the last one before it (red's
  // homepage ends on the electron).
  const PATH = THINGS.filter(t => !t.aside), ENDS = new Map();
  const pathTo = end => { if (!end) return PATH; if (!ENDS.has(end)) ENDS.set(end, THINGS.slice(0, index[end]).filter(t => !t.aside).concat(THINGS[index[end]])); return ENDS.get(end); };
  function centreAt(S, PATH = pathTo()) {
    if (S >= PATH[0].span) return PATH[0].centre;
    for (let i = 0; i < PATH.length - 1; i++) {
      const a = PATH[i], b = PATH[i + 1], hi = a.span * HOLD_RATE;
      if (S >= hi) return a.centre;
      if (S > b.span) { const t = ease(Math.log(S / hi) / Math.log(b.span / hi)); return add(a.centre, times(sub(b.centre, a.centre), t)); }
    }
    return PATH[PATH.length - 1].centre;
  }
  // How much thing i is named and measured: from when it is about one and a half times the
  // frame until it is a tenth of it, so the next thing down is named while this one still is
  // and each can be seen against the other (Brandon, 2026-11-20: "there should always be
  // multiple labled objects in frame"), and no longer than that (2026-11-21: "those lables
  // linger a litter weirdly").
  const focusOf = (i, S) => { const span = THINGS[i].span; if (!span) return 0; const d = Math.log(S / (span * .92)); return (1 - ease((-d - .25) / .35)) * (1 - ease((d - 2.1) / .6)); };
  // The zoom's own view: the street's, a little down, until the droplet; then it eases round to
  // the three-quarter view onto the cell.
  // From the DNA to the base pair it turns again, to look down the helix onto the pair.
  const baseView = S => S > THINGS[index.dna].span ? fromQuat(slerp(Q_STREET, Q_DEEP, narrowing(S, THINGS[index.droplet].span, THINGS[index.cell].span)))
    : fromQuat(slerp(Q_DEEP, Q_PAIR, narrowing(S, THINGS[index.dna].span, THINGS[index.pair].span * 1.2)));

  // ── the ground ───────────────────────────────────────────────────────────────────────────
  // The sidewalk under the frame's middle, as a measuring grid in powers of ten.
  function ground(ctx, view) {
    const S = view.S, show = 1 - narrowing(S, .55, .25); if (show < .01) return null;
    const k = Math.log10(S / 1.2), g = 10 ** Math.floor(k), fine = 1 - (k - Math.floor(k)), C = view.C, y0 = THINGS[0].pos[1], Rg = Math.min(view.W * .95, 2.4);
    const at = (x, z) => view.screen(apply(view.R, [x - C[0], y0 - C[1], z - C[2]]));
    const P = THINGS[0].pos;
    ctx.save();
    { const o = at(P[0], P[2]), a = at(P[0] + Rg, P[2]), b = at(P[0], P[2] + Rg); ctx.translate(o[0], o[1]); ctx.transform(a[0] - o[0], a[1] - o[1], b[0] - o[0], b[1] - o[1], 0, 0);
      const fill = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); fill.addColorStop(0, '#16201b'); fill.addColorStop(1, '#16201b00'); ctx.globalAlpha = show * .55; ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); }
    ctx.restore(); ctx.save();
    ctx.lineWidth = 1;
    for (const [step, weight] of [[g, .26 * fine], [g * 10, .38]]) {
      if (weight < .01) continue;
      for (const axis of [0, 1]) {
        const c0 = axis ? P[2] : P[0], c1 = axis ? P[0] : P[2];
        for (let u = Math.ceil((c0 - Rg) / step) * step; u <= c0 + Rg; u += step) {
          if (step === g && Math.abs(Math.round(u / (g * 10)) * g * 10 - u) < g * .01) continue;        // under a heavier line
          const off = u - c0, half = Math.sqrt(Math.max(0, Rg * Rg - off * off)); if (half <= 0) continue;
          const p = axis ? at(c1 - half, u) : at(u, c1 - half), q = axis ? at(c1 + half, u) : at(u, c1 + half), peak = weight * show * (1 - (off / Rg) ** 2);
          const line = ctx.createLinearGradient(p[0], p[1], q[0], q[1]); line.addColorStop(0, '#a9b7ae00'); line.addColorStop(.5, '#a9b7ae' + Math.round(clamp(peak) * 255).toString(16).padStart(2, '0')); line.addColorStop(1, '#a9b7ae00');
          ctx.strokeStyle = line; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        }
      }
    }
    ctx.restore();
    return { show, step: fine > .15 ? g : g * 10 };
  }
  const lengthName = m => { const [s, n] = [[1, 'm'], [1e-2, 'cm'], [1e-3, 'mm']].find(([s]) => m >= s * .999) || [1e-3, 'mm']; return Math.round(m / s * 100) / 100 + ' ' + n; };

  // ── the marks ────────────────────────────────────────────────────────────────────────────
  let bounds = [84, 58];                                            // labels stay below the header and above the rail
  // How much of a measure shows: it goes with its line, fading as the line's middle nears the
  // frame's edge and gone once that has left (its figure used to be held at the edge), and
  // fading as the line gets too short to read.
  function dimShows(d, w, h) {
    const lx = d.B[0] - d.A[0], ly = d.B[1] - d.A[1], len = Math.hypot(lx, ly), mx = (d.A[0] + d.B[0]) / 2, my = (d.A[1] + d.B[1]) / 2;
    return (1 - ease((Math.max(Math.abs(mx - w / 2) / (w / 2), Math.abs(my - h / 2) / (h / 2)) - .86) / .14)) * (d.short ? ease((len - 3) / 7) : ease((len - 8) / 22));
  }
  // How much of a name shows: it goes with its point, fading as the point nears the edge of the
  // frame's free height and gone once the point has left (it used to be held at the edge,
  // pointing off the frame).
  const nameShows = (n, w, h) => 1 - ease((Math.max(Math.abs(n.at[0] - w / 2) / (w / 2), Math.abs(n.at[1] - (bounds[0] + h - bounds[1]) / 2) / ((h - bounds[0] - bounds[1]) / 2)) - .84) / .16);
  function dimension(ctx, d, w, h) {
    const { a, b, A, B: E } = d, lx = E[0] - A[0], ly = E[1] - A[1], len = Math.hypot(lx, ly);
    // A measure goes with its line: it fades as the line's middle nears the frame's edge and is
    // not drawn once that has left (its figure used to be held at the edge).
    const show = d.alpha; if (show < .02) return;                  // zoom() has already faded it toward the frame's edge
    const ux = lx / len, uy = ly / len;
    ctx.save(); ctx.globalAlpha = show * .9; ctx.strokeStyle = redInk.ACCENT; ctx.lineWidth = 1; ctx.lineCap = 'butt'; ctx.beginPath();
    for (const [f, e] of [[a, A], [b, E]]) { const ex = e[0] - f[0], ey = e[1] - f[1], el = Math.hypot(ex, ey); if (el < 6) continue; const nx = ex / el, ny = ey / el; ctx.moveTo(f[0] + nx * 4, f[1] + ny * 4); ctx.lineTo(e[0] + nx * 5, e[1] + ny * 5); }
    ctx.moveTo(A[0] - ux * 4, A[1] - uy * 4); ctx.lineTo(E[0] + ux * 4, E[1] + uy * 4);
    const tx = (ux - uy) * 3.6, ty = (uy + ux) * 3.6;
    for (const e of d.radius ? [A] : [A, E]) { ctx.moveTo(e[0] - tx, e[1] - ty); ctx.lineTo(e[0] + tx, e[1] + ty); }
    ctx.stroke();
    if (d.radius) { ctx.fillStyle = redInk.ACCENT; ctx.beginPath(); ctx.moveTo(E[0], E[1]); ctx.lineTo(E[0] - ux * 8 - uy * 3, E[1] - uy * 8 + ux * 3); ctx.lineTo(E[0] - ux * 8 + uy * 3, E[1] - uy * 8 - ux * 3); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(A[0], A[1], 2, 0, TAU); ctx.fill(); }
    // The figure (red/ink.js): on the line where it fits, beside it where it does not.
    const I = redInk, tw = I.figureWidth(ctx, d.text) - 2 * I.PX; let x = (A[0] + E[0]) / 2, y = (A[1] + E[1]) / 2;
    if (len < tw + 18 || d.radius) { let nx = -uy, ny = ux; if (ny > 0) { nx = -nx; ny = -ny; } x += nx * (tw / 2 * Math.abs(ux) + 14); y += ny * 13; if (d.radius) { x = E[0] + ux * (tw / 2 + 12) + nx * 6; y = E[1] + uy * 10 + ny * 10; } }
    x = clamp(x, tw / 2 + 8 + I.PX, w - tw / 2 - 8 - I.PX); y = clamp(y, bounds[0], h - bounds[1]);
    ctx.restore();
    I.figure(ctx, d.text, x, y, show, w);
  }
  // A thing's name (red/ink.js): on a leader where it is set beside the thing, else centred
  // over it, moved up or down off words already written.
  const steps = new Map();
  function label(ctx, n, w, h) {
    if (n.alpha < .03) return false;
    const I = redInk;
    const alpha = n.alpha;                                          // zoom() has already faded it toward the frame's edge
    if (n.leader) return I.tag(ctx, n.lines, n.at[0], n.at[1], w, h, alpha);
    // Above the point, then higher or lower in steps; the step that worked last frame first, and
    // nowhere at all rather than over other words.
    const x = clamp(n.at[0], 10, w - 10), y0 = clamp(n.at[1] - 10, bounds[0], h - bounds[1]), key = n.lines[0], from = steps.get(key) || 0;
    for (let i = 0; i < 6; i++) { const k = (from + i) % 6, y = clamp(y0 + [0, -24, 24, -48, 48, -72][k], bounds[0], h - bounds[1]); if (I.block(ctx, n.lines, x, y, alpha, { align: 'center', avoid: true, within: w })) { steps.set(key, k); return true; } }
    return false;
  }

  // ── a frame ──────────────────────────────────────────────────────────────────────────────
  // W: the frame's width in metres. turn: the viewer's turn, 3×3 row-major. o.street draws the
  // street's own things (the puppy and the grid on the sidewalk; red's homepage has no other
  // street up close). o.centre, o.only (keys drawn) and o.measured (keys measured, all drawn
  // ones when absent) are for the still.
  // No more than a few names and measures at once (Brandon, 2026-11-20: "the labels get busy
  // by the dna atom"): those most in view, of things about the frame's size or a few times
  // smaller, kept a little longer once shown so that they do not swap back and forth.
  // One that loses its place fades out over a fifth of a second instead of vanishing.
  const lastShown = new Map(); let fadeAt = 0, fadeStep = 0;
  function fewest(list, most, S, key) {
    if (lastShown.size > 400) lastShown.clear();
    const score = x => x.alpha * (1 - .1 * Math.abs(Math.log(S * .4 / (x.size || S * .4)))) + ((lastShown.get(key(x)) || 0) > .5 ? .3 : 0);
    const kept = list.length <= most ? list : list.map(x => [score(x), x]).sort((a, b) => b[0] - a[0]).slice(0, most).map(e => e[1]);
    const out = [];
    for (const x of list) {
      const k = key(x), on = kept.includes(x), was = lastShown.get(k) ?? (on ? 1 : 0), now = on ? Math.min(1, was + fadeStep * 1.5) : Math.max(0, was - fadeStep);
      lastShown.set(k, now);
      if (now > .02) { if (now < 1) x.alpha *= now; out.push(x); }
    }
    return out;
  }
  function zoom(ctx, w, h, W, time, turn, o = {}) {
    const S = W * short(w, h) / w, S0 = first(w, h); THINGS[0].span = S0;
    { const t = performance.now(); fadeStep = Math.min(.5, Math.max(0, (t - fadeAt) / 200)); fadeAt = t; }
    let C = o.centre || centreAt(S, pathTo(o.end));
    const closing = o.centre ? 0 : narrowing(S, THINGS[index.proton].span * HOLD_RATE, THINGS[index.quark].span);
    if (closing > 0) C = add(times(C, 1 - closing), times(quarkAt(time), closing));
    const base = baseView(S), hx = .5 * w / short(w, h), hy = .5 * h / short(w, h);
    const view = { R: mul(flat(turn), base), px: w / W, cx: w / 2, cy: h / 2, C, w, h, W, S, D: EYE, hx, hy, at: o.at ?? marksAt(S), end: o.end };
    view.screen = q => { const f = view.D / Math.max(view.D * .1, view.D - q[2]); return [view.cx + q[0] * view.px * f, view.cy - q[1] * view.px * f, q[2], f]; };
    // What is in the air sits round the point the zoom closes on (the droplet), moving by the
    // clock; it is named while it is inside the frame.
    const seen = [], HUB = THINGS[index.droplet].pos;
    for (const [i, t] of THINGS.entries()) if (t.fly) {
      const f = t.fly(time), arrived = ease((view.at - STREET.arrive) / 10); t.pos = add(HUB, f.at); t.rot = f.rot; t.shows = f.show * arrived;
      f.show *= arrived;
      const q = view.screen(apply(view.R, sub(t.pos, C)));
      seen[i] = f.show * (1 - ease((Math.max(Math.abs(q[0] - w / 2) / (w / 2), Math.abs(q[1] - h / 2) / (h / 2)) - .7) / .3)) * (1 - ease((-Math.log(S / t.span) - .5) / .4)) * (1 - ease((Math.log(S / t.span) - 2.6) / .7));
    }
    const items = [], dims = [], names = [];
    bounds = o.only ? [16, 16] : [redInk.room.top + 12, redInk.room.bottom + 14];
    const grid = o.street ? ground(ctx, view) : null;
    for (const [i, thing] of THINGS.entries()) {
      if (!thing.build || (thing.street && !o.street) || (o.only && !o.only.includes(thing.key))) continue;
      const pl = placed(view, thing.pos, thing.rot, thing.unit), focus = o.only ? ((o.measured || o.only).includes(thing.key) ? 1 : 0) : thing.fly ? seen[i] : focusOf(i, S);
      SIZE = thing.span; thing.build(builder(pl, items, dims, names, thing.fly ? thing.shows : 1, focus, time), time, view); SIZE = 0;
    }
    liquid(items, view, time);
    items.sort((a, b) => a.z - b.z);
    ctx.save(); for (const it of items) it.draw(ctx); ctx.restore();
    ctx.globalAlpha = 1;
    // Between the atom's electrons and its nucleus there is nothing to draw.
    const empty = o.end ? 0 : ease(Math.log(1.2e-10 / S) / Math.log(3)) * (1 - ease(Math.log(2.5e-13 / S) / Math.log(3)));
    if (empty > .02) {
      // The nucleus is there, at the middle, far too small to see: a point marks it.
      const n = placed(view, THINGS[index.nucleus14].pos, I3, 1e-15).s([0, 0, 0]);
      ctx.save(); ctx.globalAlpha = empty; ctx.fillStyle = '#ffd9a0'; ctx.beginPath(); ctx.arc(n[0], n[1], 1.5, 0, TAU); ctx.fill(); ctx.restore();
      names.push({ at: [n[0], n[1]], lines: w < 600 ? NUCLEUS_HERE_NARROW : NUCLEUS_HERE, alpha: empty, leader: true });
      // N's two innermost electrons are most likely about 8 pm out (a₀ over its screened charge, 6.7).
      const k = empty * ease(Math.log(S / 3e-12) / Math.log(2));
      if (k > .02) names.push({ at: [n[0] + 8e-12 * view.px * .7, n[1] - 8e-12 * view.px * .7], lines: INNER, alpha: k, leader: true });
      redInk.block(ctx, w < 520 ? EMPTY_NARROW : EMPTY_WIDE, w / 2, h / 2 + 70, empty, { align: 'center' });
    }
    deeper(ctx, view, time, dims, names);
    // Names and measures scale with their thing as it shows on screen (Brandon, 2026-11-20: "The
    // labels need to scale with the objects"): the usual size for a thing about a quarter of the
    // frame across, up to 1.5 times for one filling it, down to 0.85 for a speck.
    const sized = x => redInk.scale(x.size ? clamp(Math.pow(x.size * view.px / (Math.min(w, h) * .6), .3), .85, 1.5) : 1);
    // Only what is in the frame is a candidate. The few written used to be chosen before this was
    // known, so names of things outside the frame took the places and the thing in the middle
    // went unnamed (Brandon, 2026-11-25: "things like the nuclear pore and the virus are
    // unlabled").
    all = names.map(n => n.lines[0]);
    for (const d of dims) d.alpha *= dimShows(d, w, h);
    for (const n of names) n.alpha *= nameShows(n, w, h);
    // Every named thing in the frame can be pressed, whether or not its name is among the few written.
    picks = o.only ? [] : names.filter(n => n.alpha > .15 && redInk.opens(n.lines[0])).map(n => ({ x: n.at[0], y: n.at[1], r: clamp((n.size || S * .15) * view.px * .5, 16, 64), text: n.lines[0] }));
    for (const d of o.only ? dims : fewest(dims, w < 600 ? 2 : 3, S, d => d.text)) { sized(d); dimension(ctx, d, w, h); }
    const written = new Set();
    for (const n of o.only ? names : fewest(names, w < 600 ? 3 : PRESS ? 5 : 4, S, n => n.lines[0])) { sized(n); if (label(ctx, n, w, h)) written.add(n.lines[0]); }
    redInk.scale(1);
    // A named thing whose name is not written is marked with the dot a name's leader starts from: pressing it opens its note.
    // (With a dark edge, so it shows on a thing of its own colour.)
    if (PRESS) { ctx.save(); for (const p of picks) if (!written.has(p.text)) { ctx.globalAlpha = .75; ctx.fillStyle = redInk.PLATE; ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, TAU); ctx.fill(); redInk.dot(ctx, p.x, p.y, .9); } ctx.restore(); }
    // The grid's square, in the corner.
    if (grid && grid.show > .05 && !o.only) redInk.note(ctx, 'Grid ' + lengthName(grid.step), w - redInk.margin(w), redInk.room.top + 10, grid.show * .8, 'right', redInk.DIM);
  }
  // The named thing at a point of the last frame drawn (the name as written, for its note), or null.
  let picks = [], all = [];
  function pick(x, y) {
    let best = null, least = 1;
    for (const p of picks) { const d = Math.hypot(x - p.x, y - p.y) / p.r; if (d < least) { least = d; best = p; } }
    return best ? best.text : null;
  }
  // Every name the last frame had, in view or not (for the check that each has a note).
  const named = () => all.slice();
  // Without motion: the DNA, one base pair atom by atom and a water molecule beside it, measured.
  function still(ctx, w, h) {
    const P = THINGS[index.pair], W = P.span * w / short(w, h);
    zoom(ctx, w, h, W, 2.2, null, { centre: P.centre, only: ['pair', 'nucleosome'], measured: ['pair'] });
  }

  return { zoom, still, layout, short, first, pick, named, STOPS, SIZES, THINGS, centreAt };
})();
