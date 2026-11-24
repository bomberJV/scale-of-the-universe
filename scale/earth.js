// The Earth as a globe centred on New York, and the label style every scene uses. The city itself
// is in city.js. Measured: the coastlines (Natural Earth 1:110m).
const RAD = Math.PI / 180, TAU = Math.PI * 2, IDENTITY = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
// 1 below `a`, 0 above `b`, on a logarithmic scale.
export const below = (W, a, b) => 1 - ease(Math.log(W / a) / Math.log(b / a));

// The globe turns so that Times Square (Broadway at 45th Street) faces the viewer.
export const HERE = { lat: 40.758, lon: -73.9855 };

// Names are written as red's homepage writes them (/home/red/ink.js): a dot on the thing, a
// leader, and the words on a dark plate, kept off words already in the frame where there is room.
const lines = new Map();
function tag(ctx, x, y, text, alpha, w) {
  if (alpha < .03) return;
  let l = lines.get(text); if (!l) { if (lines.size > 800) lines.clear(); l = [text]; lines.set(text, l); }
  const h = ctx.canvas.height / (ctx.getTransform().d || 1);
  redInk.tag(ctx, l, x, y, w, h, alpha);
}
export { tag };

// Every coastline point as a unit vector, turned so that Times Square faces the viewer:
// x east, y north, z toward the viewer.
const sin0 = Math.sin(HERE.lat * RAD), cos0 = Math.cos(HERE.lat * RAD);
const turned = (lon, lat) => {
  const p = lat * RAD, l = (lon - HERE.lon) * RAD, x = Math.cos(p) * Math.sin(l), y = Math.sin(p), z = Math.cos(p) * Math.cos(l);
  return [x, y * cos0 - z * sin0, y * sin0 + z * cos0];
};
const LAND = atlasLand.map(polygon => polygon.map(ring => {
  const pts = new Float32Array(ring.length * 3); let cx = 0, cy = 0, cz = 0;
  ring.forEach(([lon, lat], i) => { const v = turned(lon, lat); pts.set(v, i * 3); cx += v[0]; cy += v[1]; cz += v[2]; });
  const n = Math.hypot(cx, cy, cz) || 1; cx /= n; cy /= n; cz /= n; let far = 1;
  for (let i = 0; i < pts.length; i += 3) far = Math.min(far, pts[i] * cx + pts[i + 1] * cy + pts[i + 2] * cz);
  // Which way round the ring runs about its own middle: the sign of its vector area along the middle.
  let ax = 0, ay = 0, az = 0;
  for (let i = 0; i < pts.length; i += 3) { const j = (i + 3) % pts.length; ax += pts[i + 1] * pts[j + 2] - pts[i + 2] * pts[j + 1]; ay += pts[i + 2] * pts[j] - pts[i] * pts[j + 2]; az += pts[i] * pts[j + 1] - pts[i + 1] * pts[j]; }
  return { pts, centre: [cx, cy, cz], radius: Math.acos(clamp(far, -1, 1)), sense: Math.sign(ax * cx + ay * cy + az * cz) };
}));
const FLIP = 1;
const GRATICULE = (() => {
  const lines = [];
  for (let lon = -180; lon < 180; lon += 30) lines.push(Array.from({ length: 61 }, (_, i) => turned(lon, -90 + i * 3)));
  for (let lat = -60; lat <= 60; lat += 30) lines.push(Array.from({ length: 121 }, (_, i) => turned(-180 + i * 3, lat)));
  return lines;
})();

/** The Earth as a disc of radius r pixels at x, y. */
export function globe(ctx, w, h, x, y, r, alpha = 1, R = IDENTITY) {
  // A point of the sphere (east, north, toward the viewer) in the frame's axes (right, down, away), turned by R.
  const A = [[R[0][0], -R[0][1], -R[0][2]], [R[1][0], -R[1][1], -R[1][2]], [R[2][0], -R[2][1], -R[2][2]]];
  if (alpha < .01 || r < .5) return;
  ctx.save(); ctx.globalAlpha = alpha;
  if (r < 3) { ctx.fillStyle = '#7fb48a'; ctx.beginPath(); ctx.arc(x, y, Math.max(1, r), 0, TAU); ctx.fill(); ctx.restore(); return; }
  const covers = r > Math.hypot(w, h);
  // The part of the sphere on screen, as an angle from its middle, when the globe is larger than the frame.
  const reach = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)), cap = reach < r ? Math.asin(reach / r) + .02 : Math.PI;
  if (!covers) { const halo = ctx.createRadialGradient(x, y, r * .96, x, y, r * 1.16); halo.addColorStop(0, '#7fc79a55'); halo.addColorStop(1, '#7fc79a00'); ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, r * 1.16, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#0f2a24'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  if (r > 40) {
    ctx.strokeStyle = '#2b4a3f'; ctx.lineWidth = .7; ctx.globalAlpha = alpha * .6; ctx.beginPath();
    for (const line of GRATICULE) { let pen = false; for (const v of line) { if (A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2] > 0) { pen = false; continue; } const sx = x + (A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2]) * r, sy = y + (A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2]) * r; if (pen) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); pen = true; } }
    ctx.stroke(); ctx.globalAlpha = alpha;
  }
  ctx.fillStyle = '#3f7350'; ctx.strokeStyle = '#86b98f'; ctx.lineWidth = .8; ctx.beginPath();
  for (const polygon of LAND) for (const ring of polygon) {
    const c = ring.centre, away = Math.acos(clamp(-(A[2][0] * c[0] + A[2][1] * c[1] + A[2][2] * c[2]), -1, 1));
    if (away - ring.radius > Math.min(cap, Math.PI / 2 + .05)) continue;
    const p = ring.pts; let was = false, from = 0, first = null, swept = 0;
    const step = (sx, sy, behind, start) => {
      // A point on the far side is held at the limb. Two such points in a row are joined round the
      // limb, the short way, so a shape that passes behind the Earth never cuts a chord across it.
      const angle = Math.atan2(sy, sx);
      if (!start) { const d = ((angle - from) % TAU + TAU) % TAU; swept += d > Math.PI ? d - TAU : d; }
      if (behind) { const n = Math.hypot(sx, sy) || 1; sx /= n; sy /= n; }
      if (start) ctx.moveTo(x + sx * r, y + sy * r);
      else if (behind && was) ctx.arc(x, y, r, from, angle, ((angle - from) % TAU + TAU) % TAU > Math.PI);
      else ctx.lineTo(x + sx * r, y + sy * r);
      was = behind; from = angle;
    };
    for (let i = 0; i < p.length; i += 3) {
      const sx = A[0][0] * p[i] + A[0][1] * p[i + 1] + A[0][2] * p[i + 2], sy = A[1][0] * p[i] + A[1][1] * p[i + 1] + A[1][2] * p[i + 2], behind = A[2][0] * p[i] + A[2][1] * p[i + 1] + A[2][2] * p[i + 2] > 0;
      if (!i) first = [sx, sy, behind];
      step(sx, sy, behind, !i);
    }
    if (first) step(first[0], first[1], first[2], false);
    ctx.closePath();
    // A ring that runs right round the middle of the disc holds either the point facing the viewer
    // or the point opposite it. Round the opposite point, the ring drawn flat fills the wrong side,
    // so the whole disc is added once to turn it back.
    if (Math.round(swept / TAU) * ring.sense === FLIP) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); ctx.closePath(); }
  }
  ctx.fill('evenodd'); if (r > 120) { ctx.globalAlpha = alpha * .5; ctx.stroke(); ctx.globalAlpha = alpha; }
  if (!covers) {
    // Daylight from the upper left, and a darker limb.
    const light = ctx.createRadialGradient(x - r * .45, y - r * .5, r * .1, x, y, r * 1.02);
    light.addColorStop(0, '#ffffff22'); light.addColorStop(.55, '#00000000'); light.addColorStop(1, '#000000a0');
    ctx.fillStyle = light; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  ctx.restore(); ctx.restore();
}
