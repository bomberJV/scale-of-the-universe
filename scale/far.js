// Beyond the Milky Way: the Local Group, the galaxy clusters around it, and the edge of what can
// be seen. Everything is placed by its direction in the sky and its distance, and drawn from far
// off with no perspective, so sizes and separations can be compared across the frame.
//
// Measured: the Local Group and the nearby galaxies (the homepage's list in journey.js, which names
// its sources). The clusters are placed from J2000 right ascension and declination, checked on
// 2026-11-18 against Wikipedia's list of Abell clusters. Their distances are the ones NED's
// entries give, as quoted on each cluster's Wikipedia page, rounded to 10 million light-years.
// Sources disagree by 5 to 20 percent this close in: a distance from redshift alone, with the
// Sun's own motion left in, comes out shorter (Hydra 158 against 190, Centaurus 142 against 170).
// The far galaxies sit where they are now (comoving distance, Planck 2018 cosmology), not how
// long their light has travelled: 3C 273 at z = 0.158, JADES-GS-z14-0 at z = 14.18 (ALMA) and
// MoM-z14 at z = 14.44 (Naidu et al. 2025), the farthest confirmed galaxy. The edge is drawn at
// 46.5 billion light-years, the usual figure; the same cosmology gives 45.2.
//
// Past about 100 million light-years the frame fills with the galaxies of two redshift surveys,
// each a dot at its measured place (galaxies.js, written by tools/build_galaxies.py, which says
// how a place is worked out): the 2MASS Redshift Survey over the whole sky out to about 850
// million light-years, and a ninth of the Sloan survey's main sample over a third of the sky
// out to 2.2 billion. Superclusters, walls and voids are those galaxies; they were bands and
// lines here at first (Brandon, 2026-11-25: "why are there just lines instead of super clusters
// of galaxies"). Their names stand where their papers put them (see STRUCTURES).
// Drawn, not measured: the detail inside each galaxy, each cluster's soft glow, Laniakea's edge
// as a sphere and the Boötes Void's as a circle.
const Z = cosmicZoom, RAD = Math.PI / 180, TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = v => { const n = Math.hypot(...v) || 1; return v.map(c => c / n); };
const pointing = (l, b, r = 1) => [r * Math.cos(b * RAD) * Math.cos(l * RAD), r * Math.cos(b * RAD) * Math.sin(l * RAD), r * Math.sin(b * RAD)];
const FONT = '10px ui-monospace, Consolas, monospace';
const between = (size, small, large) => ease((size - small) / (small * 1.4)) * (1 - ease((size - large) / (large * .5)));
// J2000 right ascension and declination to a galactic direction.
const T = [[-.0548755604, -.8734370902, -.4838350155], [.4941094279, -.4448296300, .7469822445], [-.8676661490, -.1980763734, .4559837762]];
const fromSky = (ra, dec, r) => { const v = [Math.cos(dec * RAD) * Math.cos(ra * RAD), Math.cos(dec * RAD) * Math.sin(ra * RAD), Math.sin(dec * RAD)]; return T.map(row => dot(row, v) * r); };

export const LY = 9.4607e15, EDGE = 46.5e9;
const [S0, S1, S2] = Z.view, CENTRE = Z.centre;
const galaxies = Z.galaxies, andromeda = galaxies.find(g => g.name === 'Andromeda'), triangulum = galaxies.find(g => g.name === 'Triangulum');
const NAMED = new Set(['M32', 'M110', 'M87']);
// Clusters of galaxies: J2000 right ascension and declination [deg] of the Abell catalogue's
// positions (Wikipedia, List of Abell clusters), distance [million light-years], and a rough
// radius. Distances looked up on 2026-11-18: Virgo 54, Centaurus 170, Hydra 190 (58.3 Mpc), Norma
// 221, Perseus 240, Coma 321, Leo about 330, Shapley 650. Fornax, Ophiuchus and Hercules were
// checked against NED the same day in a second pass (commit 19ac38c).
const CLUSTERS = [
  ['Virgo Cluster', 187.706, 12.391, 54, 7], ['Fornax Cluster', 54.621, -35.45, 62, 3], ['Centaurus Cluster', 192.216, -41.306, 170, 5], ['Hydra Cluster', 159.214, -27.526, 190, 5],
  ['Norma Cluster', 243.887, -60.908, 220, 6], ['Perseus Cluster', 49.652, 41.515, 240, 7], ['Leo Cluster', 176.123, 19.839, 330, 5], ['Coma Cluster', 194.953, 27.981, 320, 8],
  ['Ophiuchus Cluster', 258.108, -23.376, 410, 6], ['Hercules Cluster', 241.313, 17.749, 510, 6], ['Shapley Supercluster', 201.978, -31.492, 650, 30],
].map(([name, ra, dec, d, r]) => ({ name, d: d * 1e6, r: r * 1e6, at: fromSky(ra, dec, d * 1e6) }));
// Structures larger than clusters, from where their papers and catalogues put them (looked up on
// 2026-11-19): Laniakea, our supercluster, 520 million ly across with its middle at J2000 10h 32m,
// −46°, 250 million ly away (Tully et al. 2014); its edge is drawn as a sphere, though the real
// one is uneven. The Perseus–Pisces Supercluster, about 300 million ly long, its middle at 1h 50m,
// +36° and 250 million ly, drawn as a band toward the Perseus Cluster at one end. The CfA2 Great
// Wall (Geller and Huchra 1989), drawn through the clusters it holds: Leo, Coma and Hercules. The
// Sloan Great Wall (Gott et al. 2005), 1.37 billion ly long about a billion ly away, along the
// celestial equator from 8.7h to 13.7h. The Boötes Void, 62 Mpc (about 200 million ly) in radius,
// its middle at 14h 50m, +46° and 700 million ly. Structures whose reality is still argued over
// (the Hercules–Corona Borealis Great Wall, the Giant Arc) are left out.
const along = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const STRUCTURES = (() => {
  const cluster = name => CLUSTERS.find(c => c.name === name).at;
  const pp = fromSky(27.5, 36, 250e6), toward = unit(cluster('Perseus Cluster').map((v, i) => v - pp[i]));
  return {
    laniakea: { name: 'Laniakea Supercluster · 520 million ly across', short: 'Laniakea Supercluster', at: fromSky(158, -46, 250e6), r: 260e6 },
    walls: [
      { name: 'Perseus–Pisces Supercluster · about 300 million ly long', short: 'Perseus–Pisces', path: [pp.map((v, i) => v - toward[i] * 150e6), pp, pp.map((v, i) => v + toward[i] * 150e6)], wide: 40e6 },
      { name: 'CfA2 Great Wall · about 500 million ly long', short: 'CfA2 Great Wall', path: [cluster('Leo Cluster'), cluster('Coma Cluster'), cluster('Hercules Cluster')], wide: 60e6 },
      { name: 'Sloan Great Wall · 1.37 billion ly long', short: 'Sloan Great Wall', path: [fromSky(130.5, 0, 1e9), fromSky(168, 0, 1e9), fromSky(205.5, 0, 1e9)], wide: 90e6 },
    ],
    voids: [{ name: 'Boötes Void · about 400 million ly across, almost empty', short: 'Boötes Void', at: fromSky(222.5, 46, 700e6), r: 200e6 }],
  };
})();
// J2000 position and where the thing is now, worked out from its redshift with the Planck 2018
// cosmology: 3C 273 at z = 0.158; JADES-GS-z14-0 at z = 14.1796 (ALMA; Schouws et al. 2025), 290
// million years after the Big Bang; MoM-z14 at z = 14.44 (Naidu et al. 2025), 280 million.
const DISTANT = [
  { name: 'Quasar 3C 273 · 2.2 billion ly', at: fromSky(187.278, 2.052, 2.2e9) },
  { name: 'JADES-GS-z14-0 · seen 290 million years after the Big Bang', short: 'JADES-GS-z14-0', at: fromSky(53.083, -27.856, 33.7e9) },
  { name: 'MoM-z14 · farthest confirmed galaxy, seen 280 million years after the Big Bang', short: 'MoM-z14 · farthest confirmed', at: fromSky(150.093, 2.273, 33.9e9) },
];
const RINGS = [[1e6, '1 million light-years'], [1e7, '10 million light-years'], [1e8, '100 million light-years'], [1e9, '1 billion light-years'], [1e10, '10 billion light-years']];
const lightYears = d => d >= 1e9 ? (Math.round(d / 1e8) / 10) + ' billion ly' : d >= 1e6 ? (d >= 1e8 ? Math.round(d / 1e6) : Math.round(d / 1e5) / 10) + ' million ly' : Math.round(d).toLocaleString('en-US') + ' ly';

// The view turns, as one rotation, from the homepage's view of the Milky Way to one that looks
// across the line from the Milky Way to Andromeda, from halfway between the two discs' axes, so
// both discs show open; that line runs along the frame's longer side.
const apart = unit(andromeda.at.map((v, i) => v - CENTRE[i])), flatten = v => unit(v.map((c, i) => c - dot(v, apart) * apart[i]));
let cached = null;
function swing(w, h) {
  const wide = w >= h;
  if (cached?.wide === wide) return cached;
  const milky = flatten([0, 0, 1]); let other = flatten(cross(andromeda.major, andromeda.minor));
  if (dot(milky, other) < 0) other = other.map(v => -v);
  let into = unit(milky.map((v, i) => v + other[i])); if (dot(into, S2) < 0) into = into.map(v => -v);
  const angle = wide ? Math.PI - .3 : Math.PI / 2 + .42, u = cross(into, apart), c = Math.cos(angle), s = Math.sin(angle);
  const R = apart.map((v, i) => c * v - s * u[i]), D = apart.map((v, i) => s * v + c * u[i]);
  const Q = [0, 1, 2].map(i => [0, 1, 2].map(j => S0[j] * R[i] + S1[j] * D[i] + S2[j] * into[i]));
  const turn = Math.acos(clamp((Q[0][0] + Q[1][1] + Q[2][2] - 1) / 2, -1, 1)), axis = unit([Q[2][1] - Q[1][2], Q[0][2] - Q[2][0], Q[1][0] - Q[0][1]]);
  // Where the box round the Milky Way, Andromeda and Triangulum has its middle, from the Milky Way.
  const pts = [CENTRE, andromeda.at, triangulum.at].map(v => [dot(v, R), dot(v, D)]), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const box = [(Math.min(...xs) + Math.max(...xs)) / 2 - pts[0][0], (Math.min(...ys) + Math.max(...ys)) / 2 - pts[0][1]];
  // A second turn, made between 1.6 and 3.6 billion light-years: to look straight down on the
  // plane of the celestial equator, with the middle of the Sloan Great Wall (11.2h on the
  // equator) up the frame. The Sloan survey looked out from the north of the Milky Way's disc,
  // so its galaxies fan out across that plane and the wall lies in it; seen from the first view
  // the fan points at the viewer and the wall is lost in it.
  const R1 = rotated(S0, axis, turn), D1 = rotated(S1, axis, turn), I1 = cross(R1, D1);
  let R2 = unit(fromSky(258, 0, 1)); const D2 = unit(fromSky(168, 0, 1)).map(v => -v); let I2 = cross(R2, D2);
  if (dot(I2, I1) < 0) { R2 = R2.map(v => -v); I2 = I2.map(v => -v); }
  const Q2 = [0, 1, 2].map(i => [0, 1, 2].map(j => R1[j] * R2[i] + D1[j] * D2[i] + I1[j] * I2[i]));
  const turn2 = Math.acos(clamp((Q2[0][0] + Q2[1][1] + Q2[2][2] - 1) / 2, -1, 1)), axis2 = unit([Q2[2][1] - Q2[1][2], Q2[0][2] - Q2[2][0], Q2[1][0] - Q2[0][1]]);
  return cached = { wide, turn, axis, box, turn2, axis2 };
}
function rotated(v, axis, angle) { const c = Math.cos(angle), s = Math.sin(angle), k = cross(axis, v), along = dot(axis, v) * (1 - c); return v.map((x, i) => x * c + k[i] * s + axis[i] * along); }

/** The frame's width [light-years] at which this module takes over from the pull back. */
export const start = (w, h) => Z.span(w, h, 1) / 63241.077;
/** The widest frame: the observable universe with room round it. */
export const widest = (w, h) => 2 * EDGE / .82 * Math.max(1, w / h);

// ── the surveys' galaxies ──────────────────────────────────────────────────────────────────
// Fetched once, when the frame first heads out past the Earth: null until then, false if the
// file could not be had (the superstructures are then drawn as bands, as they were at first).
let web = null, asked = false;
/** Fetch the surveys' galaxies; `then` is called when they are ready to draw. */
export function load(then) {
  if (asked) return; asked = true;
  import('./galaxies.js').then(m => {
    web = m.GALAXIES.surveys.map(s => {
      const bin = atob(s.data), n = bin.length / 6, at = new Float32Array(n * 3);
      for (let i = 0; i < n * 3; i++) { const v = bin.charCodeAt(2 * i) | bin.charCodeAt(2 * i + 1) << 8; at[i] = (v > 32767 ? v - 65536 : v) * s.unit; }
      return { key: s.key, name: s.name, count: n, at };
    });
    then && then();
  }).catch(() => { web = false; then && then(); });
}
// The dots are added up in a grid of the frame's pixels and the sums turned into light, so a
// hundred thousand cost a few milliseconds and crowded places glow instead of clipping. The
// picture is kept until the view changes.
// Seen through, a ball of galaxies is a blur: every wall has a crowd in front of it and behind.
// So the galaxies near the plane through the Milky Way that faces the viewer are drawn at full
// strength and the rest fainter the farther they are in front of it or behind, the way a slice
// of a redshift survey is plotted. Turning the view turns the slice, and walls come and go.
let pane = null, paneKey = '', sums = null, image = null;
const TONES = new Uint32Array(2049);
function dots(ctx, w, h, right, down, px, ox, oy, W, alpha) {
  const s = Math.min(1.65, ctx.getTransform().a || 1, Math.sqrt(1.4e6 / (w * h))), bw = Math.max(2, Math.round(w * s)), bh = Math.max(2, Math.round(h * s));
  pane ??= document.createElement('canvas');
  // The dots' two colours, faint and crowded, as the page's theme turns them: the site's theme
  // changes every colour a canvas is given (in light mode the sky is pale and the galaxies dark),
  // but these pixels are written directly, so the colours are passed through a context first.
  const pen = pane.getContext('2d'), inked = c => { pen.fillStyle = c; const v = String(pen.fillStyle); return /^#[0-9a-f]{6}$/i.test(v) ? v : c; };
  const faint = inked('#c4cce8'), crowded = inked('#fff2d6'), rgb = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const key = [bw, bh, px, ox, oy, right, down, faint, crowded].join();
  if (key !== paneKey) {
    paneKey = key;
    if (pane.width !== bw || pane.height !== bh) { pane.width = bw; pane.height = bh; sums = new Float32Array(bw * bh); image = pane.getContext('2d').createImageData(bw, bh); }
    sums.fill(0);
    // A galaxy is a soft dot about three pixels across while there are few enough light-years to
    // a pixel to tell them apart, and a single pixel's worth of light once they crowd.
    const wide = clamp(1 - Math.log(1 / px / 5e5) / Math.log(6), 0, 1), side = .5 * wide, corner = .18 * wide * wide, k = px * s;
    const ax = right[0] * k, ay = right[1] * k, az = right[2] * k, bx = down[0] * k, by = down[1] * k, bz = down[2] * k, x0 = ox * s, y0 = oy * s;
    const into = cross(right, down), thick = 1 / (.11 * W * clamp(w / 900, .45, 1)) ** 2, FAINT = .1;   // a narrow frame crowds sooner: a thinner slice
    for (const set of web) {
      // The near survey holds every galaxy it found and the far one a ninth of its own, so from
      // far out the near one would be a white ball in the middle: it is turned down as the frame widens.
      const a = set.at, lum = set.key === '2mrs' ? 1 - .62 * ease(Math.log(W / 1.2e9) / Math.log(3.5)) : 1;
      for (let i = 0; i < a.length; i += 3) {
        const x = x0 + a[i] * ax + a[i + 1] * ay + a[i + 2] * az, y = y0 + a[i] * bx + a[i + 1] * by + a[i + 2] * bz;
        if (x < 1 || y < 1 || x >= bw - 2 || y >= bh - 2) continue;
        const deep = a[i] * into[0] + a[i + 1] * into[1] + a[i + 2] * into[2], q = lum * (FAINT + (1 - FAINT) * Math.exp(-deep * deep * thick));
        const xi = x | 0, yi = y | 0, fx = x - xi, fy = y - yi, o = yi * bw + xi;
        // The dot's light is shared between the four pixels round its place, so it does not jump as the view turns.
        sums[o] += q * (1 - fx) * (1 - fy); sums[o + 1] += q * fx * (1 - fy); sums[o + bw] += q * (1 - fx) * fy; sums[o + bw + 1] += q * fx * fy;
        if (side > .02) {
          const c = (fx < .5 ? o : o + 1) + (fy < .5 ? 0 : bw), e = q * side, n = q * corner;
          sums[c - 1] += e; sums[c + 1] += e; sums[c - bw] += e; sums[c + bw] += e;
          sums[c - bw - 1] += n; sums[c - bw + 1] += n; sums[c + bw - 1] += n; sums[c + bw + 1] += n;
        }
      }
    }
    // From sums to light: faint where there is one galaxy, bright and warmer where there are many.
    // How bright a sum is depends on how crowded the picture is (a phone's frame holds the same
    // galaxies in a seventh of the pixels): a pixel with the usual sum comes out at about a third.
    let lit = 0, total = 0;
    for (let i = 0; i < sums.length; i++) { const v = sums[i]; if (v > 0) { lit++; total += v; } }
    const gain = clamp(.45 / Math.pow(total / (lit || 1), .8), .05, 1.5), out = new Uint32Array(image.data.buffer);
    // (A table from sum to colour, 64 steps to a galaxy's worth of light, saves working it out for every pixel.)
    const lo = rgb(faint), hi = rgb(crowded);
    for (let n = 1; n < TONES.length; n++) {
      const t = 1 - Math.exp(-Math.pow(n / 64, .8) * gain);
      TONES[n] = (255 * t) << 24 | (lo[2] + (hi[2] - lo[2]) * t) << 16 | (lo[1] + (hi[1] - lo[1]) * t) << 8 | (lo[0] + (hi[0] - lo[0]) * t);
    }
    for (let i = 0; i < sums.length; i++) { const v = sums[i]; out[i] = v > 0 ? TONES[Math.min(TONES.length - 1, (v * 64 + 1) | 0)] : 0; }
    pen.putImageData(image, 0, 0);
  }
  ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(pane, 0, 0, w, h); ctx.restore();
}

const SIDE = new Map();
export function draw(ctx, w, h, W, R = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
  const W1 = start(w, h), px = w / W, largest = Math.max(w, h), home = Z.finished(w, h), sw = swing(w, h);
  // The turn and the move to the Local Group's middle are done by 1.6 million light-years across.
  const t = ease(Math.log(W / W1) / Math.log(1.6e6 / W1)), t2 = web ? ease(Math.log(W / 1.6e9) / Math.log(2.25)) : 0;
  let r0 = rotated(S0, sw.axis, sw.turn * t), d0 = rotated(S1, sw.axis, sw.turn * t);
  if (t2 > 0) { r0 = rotated(r0, sw.axis2, sw.turn2 * t2); d0 = rotated(d0, sw.axis2, sw.turn2 * t2); }
  const i0 = cross(r0, d0);
  // The visitor's own turn comes last, about the Milky Way.
  const right = r0.map((v, i) => R[0][0] * v + R[0][1] * d0[i] + R[0][2] * i0[i]), down = r0.map((v, i) => R[1][0] * v + R[1][1] * d0[i] + R[1][2] * i0[i]);
  // The Milky Way moves toward its place in the Local Group's frame only as fast as the frame
  // widens, so it stays in view all the way out.
  const move = ease(clamp(.3 * w / (Math.hypot(...sw.box) * px))) * ease(Math.log(W / W1) / Math.log(1.6));
  const mx = home.x + (w / 2 - sw.box[0] * px - home.x) * move, my = home.y + (h / 2 - sw.box[1] * px - home.y) * move;
  const at = v => [mx + (dot(v, right) - dot(CENTRE, right)) * px, my + (dot(v, down) - dot(CENTRE, down)) * px];
  const disc = 50000 * px, notes = ease(Math.log(W / W1) / Math.log(4)), boxes = [[0, h - 40, w, h], [0, 0, w, 24], [0, 0, 190, 78]], labels = [];
  Z.beyond(ease(Math.log(W / W1) / Math.log(1.8)));

  // The Milky Way: the homepage's model while it is large enough to show, then one small picture.
  const model = ease((disc - 22) / 30);
  if (model > 0) Z.draw(ctx, w, h, 0, 1, null, 0, 1, 0, { x: mx, y: my, r: home.poseRadius * disc / home.discRadius, normal: Z.axis, fit: 1 }, [[dot(right, S0), dot(right, S1), dot(right, S2)], [dot(down, S0), dot(down, S1), dot(down, S2)]]);
  if (model < 1) {
    ctx.save(); ctx.globalAlpha = 1 - model; studioScenes.field(ctx, w, h, '#10121c');
    const r = Math.max(disc, 1.6), glow = ctx.createRadialGradient(mx, my, 0, mx, my, Math.max(r * .4, 2.4));
    glow.addColorStop(0, '#fff4dc'); glow.addColorStop(.35, '#ffe2b49a'); glow.addColorStop(1, '#d8dcf000'); ctx.fillStyle = glow; ctx.fillRect(mx - r, my - r, 2 * r, 2 * r);
    if (disc > 2) { ctx.transform(right[0] * disc, down[0] * disc, right[1] * disc, down[1] * disc, mx, my); ctx.drawImage(Z.picture('spiral'), -1, -1, 2, 2); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - model) * .55; ctx.drawImage(Z.picture('spiral'), -1, -1, 2, 2); }
    ctx.restore();
  }
  boxes.push([mx - Math.max(8, disc * 1.1), my - Math.max(8, disc * 1.1), mx + Math.max(8, disc * 1.1), my + Math.max(8, disc * 1.1)]);

  // The surveys' galaxies, from where the nearest of them come into the frame.
  const mapped = web ? ease(Math.log(W / 5e7) / Math.log(3)) : 0;
  if (mapped > .01) dots(ctx, w, h, right, down, px, mx - dot(CENTRE, right) * px, my - dot(CENTRE, down) * px, W, mapped);

  // Circles of fixed radius around the Milky Way, in its plane.
  ctx.save(); ctx.lineWidth = .8; ctx.strokeStyle = '#9fb3c8';
  for (const [r, name] of RINGS) {
    const alpha = between(r * px, 34, 1.25 * largest) * notes; if (alpha < .02) continue;
    ctx.globalAlpha = alpha * .3; ctx.setLineDash([2, 5]); ctx.beginPath(); let best = null;
    for (let i = 0; i <= 120; i++) { const [x, y] = at(pointing(i * 3, 0, r).map((c, j) => c + CENTRE[j])); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); if (x > 70 && x < w - 70 && y > 60 && y < h - 90 && (!best || x - y * .4 > best[0] - best[1] * .4)) best = [x, y]; }
    ctx.stroke(); ctx.setLineDash([]);
    if (best) labels.push({ text: name, x: best[0], y: best[1] - 9, alpha: alpha * .8, ink: '#aebfd2', gap: 6, rank: 5 });
  }
  ctx.restore();

  // The galaxies. Once a galaxy is within a few pixels of the Milky Way it is part of the same dot.
  for (const g of galaxies) {
    const [x, y] = at(g.at), radius = g.size / 2 * px, merged = ease((Math.hypot(x - mx, y - my) - 3) / 6);
    if (merged < .01 || x < -radius - 4 || x > w + radius + 4 || y < -radius - 4 || y > h + radius + 4) continue;
    ctx.save(); ctx.globalAlpha = merged;
    if (g.kind === 'dwarf' || radius < 2) {
      const r = Math.max(1.3, radius * 1.3), f = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8);
      f.addColorStop(0, '#f6efdf'); f.addColorStop(.35, '#e8dfcc90'); f.addColorStop(1, '#e8dfcc00'); ctx.fillStyle = f; ctx.fillRect(x - r * 1.8, y - r * 1.8, r * 3.6, r * 3.6);
    } else {
      const r = Math.max(2.2, radius * (g.kind === 'spiral' ? .34 : .4)), f = ctx.createRadialGradient(x, y, 0, x, y, r);
      f.addColorStop(0, g.kind === 'spiral' ? '#fff4dc' : '#eef0ff'); f.addColorStop(.3, g.kind === 'spiral' ? '#ffe2b49a' : '#dde2fa80'); f.addColorStop(1, '#d8dcf000'); ctx.fillStyle = f; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
      let ux = dot(g.major, right), uy = dot(g.major, down), vx = dot(g.minor, right), vy = dot(g.minor, down);
      if (g.kind === 'cloud') { const n = Math.hypot(ux, uy) || 1; [ux, uy] = [ux / n, uy / n]; [vx, vy] = [-uy * .72, ux * .72]; }
      ctx.transform(ux * radius, uy * radius, vx * radius, vy * radius, x, y); ctx.drawImage(Z.picture(g.kind), -1, -1, 2, 2);
      if (g.kind === 'spiral' && radius < 90) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = merged * .55; ctx.drawImage(Z.picture(g.kind), -1, -1, 2, 2); }
      if (radius > 4) boxes.push([x - radius * .8, y - radius * .8, x + radius * .8, y + radius * .8]);
    }
    ctx.restore();
    if (g.big || NAMED.has(g.name)) labels.push({ text: g.name + ' · ' + lightYears(g.d), x, y, alpha: notes * merged * ease((Math.hypot(x - mx, y - my) - 60) / 30) * (g.big ? 1 : .72) * (1 - ease(Math.log(W / 6e7) / Math.log(2.5))), ink: g.big ? '#d9e2f0' : '#a9b8cc', gap: Math.max(radius, 3) + 6, rank: g.big ? 1 : 3 });
  }

  // Clusters of galaxies, each as one soft patch of its rough size.
  const clustered = ease(Math.log(W / 4e7) / Math.log(3));
  if (clustered > .01) for (const c of CLUSTERS) {
    const [x, y] = at(c.at), r = Math.max(3, c.r * px), merged = ease((Math.hypot(x - mx, y - my) - 6) / 10);
    if (x < -r || x > w + r || y < -r || y > h + r || merged < .01) continue;
    const f = ctx.createRadialGradient(x, y, 0, x, y, r); f.addColorStop(0, '#f3e6d0d0'); f.addColorStop(.4, '#d9c8e860'); f.addColorStop(1, '#b9b4e000');
    // Among its own galaxies a cluster needs only a faint glow to be found by.
    ctx.save(); ctx.globalAlpha = clustered * merged * (web ? .4 : 1); ctx.fillStyle = f; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
    labels.push({ text: c.name + ' · ' + lightYears(c.d), x, y, alpha: clustered * merged * ease((Math.hypot(x - mx, y - my) - 40) / 30), ink: '#e4d6ee', gap: Math.min(r, 14) + 5, rank: 2 });
  }
  // Superclusters, great walls and voids, from about 300 million light-years across to 20 billion.
  const huge = ease(Math.log(W / 1.5e8) / Math.log(3)) * (1 - ease(Math.log(W / 2e10) / Math.log(2.5)));
  if (huge > .01) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const L = STRUCTURES.laniakea, [lx, ly] = at(L.at), lr = L.r * px;
    if (lr > 20) {
      const f = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr); f.addColorStop(0, '#c4fa7910'); f.addColorStop(1, '#c4fa7904');
      ctx.globalAlpha = huge; ctx.fillStyle = f; ctx.beginPath(); ctx.arc(lx, ly, lr, 0, TAU); ctx.fill();
      ctx.globalAlpha = huge * (web ? .45 : .7); ctx.strokeStyle = '#c4fa79'; ctx.lineWidth = 1; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]);
      labels.push({ text: w < 600 ? L.short : L.name, x: lx + lr * .7071, y: ly - lr * .7071, alpha: huge, ink: '#d8f7b8', gap: 6, rank: 1 });
    }
    for (const v of STRUCTURES.voids) {
      const [x, y] = at(v.at), r = v.r * px; if (r < 6) continue;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
      if (!web) { ctx.globalAlpha = huge * .35; ctx.fillStyle = '#05060a'; ctx.fill(); }
      ctx.globalAlpha = huge * (web ? .4 : .6); ctx.strokeStyle = '#8a93b8'; ctx.lineWidth = 1; ctx.setLineDash([2, 4]); ctx.stroke(); ctx.setLineDash([]);
      labels.push({ text: w < 600 ? v.short : v.name, x, y, alpha: huge, ink: '#b8c0dc', gap: 4, rank: 2 });
    }
    for (const s of STRUCTURES.walls) {
      const pts = []; for (let i = 0; i < s.path.length - 1; i++) for (let k = 0; k < 12; k++) pts.push(at(along(s.path[i], s.path[i + 1], k / 12)));
      pts.push(at(s.path[s.path.length - 1]));
      const wide = Math.max(3, s.wide * px);
      // With the galaxies in the frame a wall is its galaxies, and only its name is written.
      if (!web) for (const [lw, a, ink] of [[wide, .1, '#d9c8e8'], [Math.max(1.2, wide * .45), .14, '#e4d6ee'], [Math.max(1, wide * .12), .4, '#f3e6d0']]) {
        ctx.globalAlpha = huge * a; ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
      }
      const [x, y] = pts[Math.floor(pts.length / 2)];
      labels.push({ text: w < 600 ? s.short : s.name, x, y, alpha: huge, ink: '#e8dcf4', gap: (web ? Math.min(wide, 24) : wide) / 2 + 6, rank: 1 });
    }
    ctx.restore();
  }
  const deep = ease(Math.log(W / 1.5e9) / Math.log(3));
  if (deep > .01) for (const d of DISTANT) {
    const [x, y] = at(d.at), merged = ease((Math.hypot(x - mx, y - my) - 6) / 10); if (merged < .01) continue;
    ctx.save(); ctx.globalAlpha = deep * merged; ctx.strokeStyle = '#e9c79a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 4.5); ctx.lineTo(x + 4.5, y); ctx.lineTo(x, y + 4.5); ctx.lineTo(x - 4.5, y); ctx.closePath(); ctx.stroke(); ctx.restore();
    labels.push({ text: w < 600 && d.short ? d.short : d.name, x, y, alpha: deep * merged * ease((Math.hypot(x - mx, y - my) - 40) / 30), ink: '#ecd3ae', gap: 10, rank: 2 });
  }

  // The edge of the observable universe: a sphere around us, so a circle from any side.
  const edge = EDGE * px, seen = ease((edge - 30) / 60);
  if (seen > .01 && edge < 3 * largest) {
    ctx.save(); ctx.globalAlpha = seen; ctx.strokeStyle = '#e9c79a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(mx, my, edge, 0, TAU); ctx.stroke();
    // Beyond it nothing can be seen yet: the frame is darker there.
    ctx.globalAlpha = seen * .55; ctx.fillStyle = '#07080d'; ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.arc(mx, my, edge, 0, TAU, true); ctx.fill('evenodd'); ctx.restore();
    const a = -Math.PI * (w >= h ? .25 : .5);
    labels.push({ text: w < 600 ? 'Edge of the observable universe' : 'Edge of the observable universe · 46.5 billion ly away', x: mx + Math.cos(a) * edge, y: my + Math.sin(a) * edge, alpha: seen, ink: '#ecd3ae', gap: 8, rank: 0 });
  }
  labels.push({ text: W > 3e8 ? 'You are here' : 'Milky Way · you are here', x: mx, y: my, alpha: notes, ink: '#ecd3ae', gap: Math.max(disc, 4) + 6, rank: 0, free: true });

  // Names, the most important first, each on whichever side of its mark is free.
  ctx.save(); ctx.font = FONT; ctx.textBaseline = 'middle';
  // What the dots are, in the frame's lower corner; pressing it opens the note that says how they were mapped.
  if (mapped > .3) {
    // (On a narrow frame the ruler has the lower edge, so it goes in the upper corner.)
    const text = w < 600 ? 'Each dot · one galaxy' : 'Each dot · one galaxy, where two surveys measured it', tw = ctx.measureText(text).width, ty = w < 600 ? 14 : h - 17;
    ctx.globalAlpha = mapped * .7; ctx.fillStyle = '#0b0d15'; ctx.fillRect(w - 21 - tw, ty - 8, tw + 10, 16);
    ctx.globalAlpha = mapped * .9; ctx.lineWidth = 2.6; ctx.strokeStyle = '#12121ca8'; ctx.strokeText(text, w - 16 - tw, ty); ctx.fillStyle = '#c9d3e6'; ctx.fillText(text, w - 16 - tw, ty);
  }
  for (const l of labels.sort((a, b) => a.rank - b.rank)) {
    if (l.alpha < .03 || l.x < 4 || l.x > w - 4 || l.y < 4 || l.y > h - 4) continue;
    // The side it had last frame first, so names do not jump from side to side.
    const width = ctx.measureText(l.text).width + 4, g = l.gap, from = SIDE.get(l.text) || 0;
    const sides = [[g, 0], [-g - width, 0], [g * .6, 13], [g * .6, -13], [-g * .6 - width, 13], [-g * .6 - width, -13], [-width / 2, g + 9], [-width / 2, -g - 9]];
    for (let n = 0; n < sides.length; n++) {
      const k = (from + n) % sides.length, [dx, dy] = sides[k], b = [l.x + dx - 2, l.y + dy - 7, l.x + dx + width, l.y + dy + 7];
      if (b[2] > w - 6 || b[0] < 6 || b[1] < 6 || b[3] > h - 6 || boxes.some((o, i) => !(l.free && i === 3) && b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])) continue;
      SIDE.set(l.text, k); boxes.push(b);
      // Among the dots a name needs a plate under it to be read.
      if (mapped > .05) { ctx.globalAlpha = l.alpha * mapped * .7; ctx.fillStyle = '#0b0d15'; ctx.fillRect(b[0] - 3, b[1], width + 6, 14); }
      ctx.globalAlpha = l.alpha; ctx.lineWidth = 2.6; ctx.strokeStyle = '#12121ca8'; ctx.strokeText(l.text, b[0] + 2, b[1] + 7); ctx.fillStyle = l.ink; ctx.fillText(l.text, b[0] + 2, b[1] + 7); break;
    }
  }
  ctx.restore();
}
