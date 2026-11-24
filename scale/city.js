// New York from one person on a crossing to the five boroughs, through a camera with perspective.
//
// The camera always looks at the same point: 1.3 m above the middle of Seventh Avenue, just south of
// the crossing at Times Square. It stands back from that point by whatever distance makes the frame
// W metres wide there. Over the city it is locked to look up the avenue, so it moves only inside the
// avenue's open corridor: no building, car or person can come between it and the point it looks at.
//
// Measured: the borough outlines (NYC Department of City Planning, as used on the red homepage),
// Manhattan's grid (turned 29° from north, 80 m between streets, 280 m between avenues) and Central
// Park's place on it. Drawn, not measured: the buildings (heights between 20 and 245 m, Midtown's
// tallest are about this), carrying the grid over the whole island, the lit windows and screens, and
// the traffic and people, which are only the right size.
import { tag } from "./earth.js";
import { BOUNDARIES } from "./boundaries.js";

const RAD = Math.PI / 180, TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const below = (W, a, b) => 1 - ease(Math.log(W / a) / Math.log(b / a));
const mixInk = (a, b, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - k) + parseInt(b.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
const hash = (a, b, c = 0) => { const v = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return v - Math.floor(v); };

const HERE = { lat: 40.758, lon: -73.9855 };
const U = newYork.unit, M_LAT = 111200, M_LON = 111320 * Math.cos(newYork.origin[0] * RAD);
const E0 = (HERE.lon - newYork.origin[1]) * M_LON, N0 = (HERE.lat - newYork.origin[0]) * M_LAT;
// Grid axes as east, north: u runs across the avenues, v up them.
const GRID = 29 * RAD, UX = Math.cos(GRID), UY = -Math.sin(GRID), VX = Math.sin(GRID), VY = Math.cos(GRID);
const AVENUE = 280, STREET = 80, ROAD = 9, WALK = 15, CROSS = 5, CURB = 9;
const PARK = [-280 + WALK, 1120 + CURB, 560 - WALK, 5200 - CURB];
const en = (u, v) => [u * UX + v * VX, u * UY + v * VY];
const uv = (e, n) => [e * UX + n * UY, e * VX + n * VY];
export const TARGET = [0, -9.5, 1.3];
const LAT0 = 40.758, LON0 = -73.9855, LONM = 111320 * Math.cos(LAT0 * RAD);
const fromLonLat = (lat, lon) => [(lon - LON0) * LONM, (lat - LAT0) * 111200];

// States and counties from the Census Bureau's 2023 outlines (boundaries.js), as metres east and
// north of Times Square.
const decode = rings => rings.map(r => { const out = new Float64Array(r.length); let x = 0, y = 0; for (let i = 0; i < r.length; i += 2) { x += r[i]; y += r[i + 1]; out[i] = x * BOUNDARIES.unit; out[i + 1] = y * BOUNDARIES.unit; } return out; });
const STATES = BOUNDARIES.states.map(s => ({ ...s, rings: decode(s.rings) }));
// The counties Brandon works in, as he listed them on 2026-11-19: New York City's five, Westchester
// and Orange in New York; Bergen, Essex, Hudson, Middlesex, Monmouth, Morris, Passaic, Somerset,
// Sussex and Union in New Jersey.
export const WORK = new Set(['NJ Bergen County', 'NJ Essex County', 'NJ Hudson County', 'NJ Middlesex County', 'NJ Monmouth County', 'NJ Morris County', 'NJ Passaic County', 'NJ Somerset County', 'NJ Sussex County', 'NJ Union County', 'NY New York County', 'NY Kings County', 'NY Queens County', 'NY Bronx County', 'NY Richmond County', 'NY Westchester County', 'NY Rockland County', 'NY Orange County']);
const COUNTIES = BOUNDARIES.counties.map(c => {
  const rings = decode(c.rings), big = rings.reduce((a, r) => r.length > a.length ? r : a); let e = 0, n = 0, A = 0;
  // Area-weighted centre of the largest ring, for the label.
  for (let i = 0, j = big.length - 2; i < big.length; j = i, i += 2) { const f = big[j] * big[i + 1] - big[i] * big[j + 1]; A += f; e += (big[j] + big[i]) * f; n += (big[j + 1] + big[i + 1]) * f; }
  return { ...c, rings, work: WORK.has(c.state + ' ' + c.name), centre: [e / (3 * A), n / (3 * A)] };
});
// A name on the map, only where no words are written yet (redInk keeps this frame's boxes).
function put(ctx, text, x, y, align, lead = 0) {
  const tw = ctx.measureText(text).width, left = align === 'center' ? x - tw / 2 : x, box = [left - 4 - lead, y - 8, tw + 8 + lead, 16];
  if (!redInk.free(...box)) return false;
  redInk.take(...box); ctx.fillText(text, x, y); return true;
}
function within(rings, e, n) {
  let odd = false;
  for (const r of rings) for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) if ((r[i + 1] > n) !== (r[j + 1] > n) && e < (r[j] - r[i]) * (n - r[i + 1]) / (r[j + 1] - r[i + 1]) + r[i]) odd = !odd;
  return odd;
}
// Names on the map: [text, lat, lon, from, to (frame widths in metres), kind].
const PLACES = [
  ['New Jersey', 40.25, -74.62, 1.2e5, 3e6, 'state'], ['New York', 42.1, -75.0, 2.5e5, 3e6, 'state'], ['New York', 41.25, -74.1, 1.2e5, 2.5e5, 'state'],
  ['Pennsylvania', 40.62, -75.75, 1.4e5, 3e6, 'state'], ['Connecticut', 41.62, -72.75, 1.4e5, 3e6, 'state'], ['Delaware', 39.0, -75.5, 3e5, 3e6, 'state'],
  ['Massachusetts', 42.35, -72.0, 4e5, 3e6, 'state'], ['Rhode Island', 41.65, -71.55, 4e5, 3e6, 'state'], ['Vermont', 44.0, -72.7, 6e5, 3e6, 'state'],
  ['New Hampshire', 43.7, -71.6, 6e5, 3e6, 'state'], ['Maryland', 39.4, -76.75, 5e5, 3e6, 'state'],
  ['Long Island', 40.82, -73.05, 6e4, 6e5, 'land'], ['Jersey Shore', 39.75, -74.13, 1.2e5, 5e5, 'land'],
  ['Atlantic Ocean', 39.9, -72.9, 8e4, 2e6, 'water'], ['Long Island Sound', 41.08, -73.0, 6e4, 5e5, 'water'], ['Hudson River', 40.93, -73.93, 2e4, 2.5e5, 'water'],
  ['New York Harbor', 40.665, -74.045, 1.2e4, 8e4, 'water'], ['Raritan Bay', 40.48, -74.17, 3e4, 2e5, 'water'], ['Delaware River', 40.42, -74.96, 1e5, 6e5, 'water'],
  ['Newark', 40.7357, -74.1724, 2.5e4, 2e5, 'city'], ['Jersey City', 40.7178, -74.0431, 1.5e4, 6e4, 'city'], ['Long Branch', 40.3043, -73.9924, 4e4, 6e5, 'city'],
  ['Trenton', 40.2206, -74.7597, 1e5, 8e5, 'city'], ['Philadelphia', 39.9526, -75.1652, 1.5e5, 1.5e6, 'city'], ['New Haven', 41.3083, -72.9279, 1.5e5, 1e6, 'city'],
  ['White Plains', 41.034, -73.7629, 5e4, 3e5, 'city'], ['Sandy Hook', 40.44, -74.0, 4e4, 3e5, 'land'],
];
// Landmarks, from general reference to about 100 m: [name, lat, lon, from, to, height in m (for the tall ones)].
const LANDMARKS = [
  ['Empire State Building', 40.7484, -73.9857, 400, 4.5e4, 443], ['One World Trade Center', 40.7127, -74.0134, 400, 4.5e4, 541],
  ['Statue of Liberty', 40.6892, -74.0445, 600, 4.5e4, 93], ['Ellis Island', 40.6995, -74.0396, 1500, 1.5e4], ['Brooklyn Bridge', 40.7061, -73.9969, 800, 2.5e4],
  ['Chrysler Building', 40.7516, -73.9755, 400, 1.2e4, 319], ['Grand Central Terminal', 40.7527, -73.9772, 400, 6e3], ['George Washington Bridge', 40.8517, -73.9527, 2e3, 4e4],
  ['Verrazzano-Narrows Bridge', 40.6066, -74.0447, 2e3, 5e4], ['Yankee Stadium', 40.8296, -73.9262, 1e3, 2.5e4], ['Coney Island', 40.5749, -73.9859, 2e3, 4e4],
  ['JFK Airport', 40.6413, -73.7781, 3e3, 7e4], ['LaGuardia Airport', 40.7769, -73.874, 2e3, 4e4], ['Newark Airport', 40.6895, -74.1745, 3e3, 6e4],
  ['MetLife Stadium', 40.8135, -74.0745, 3e3, 4e4],
  // Midtown's tallest (Council on Tall Buildings and Urban Habitat): height to the tip.
  ['Central Park Tower', 40.7663, -73.9809, 350, 9e3, 472], ['111 West 57th Street', 40.7648, -73.9776, 350, 6e3, 435], ['One Vanderbilt', 40.7530, -73.9785, 350, 6e3, 427],
  ['432 Park Avenue', 40.7616, -73.9719, 350, 6e3, 426], ['Bank of America Tower', 40.7553, -73.9843, 250, 6e3, 366], ['30 Rockefeller Plaza', 40.7590, -73.9794, 250, 6e3, 259],
  ['One Times Square', 40.7565, -73.9864, 120, 2500, 111],
].map(([name, lat, lon, from, to, tall]) => { const [e, n] = fromLonLat(lat, lon); return { name, e, n, from, to, tall }; });
// The two tallest stand at their real heights in the skyline: [name, footprint across, along, roof, tip].
const SKYLINE = [['Empire State Building', 120, 57, 381, 443], ['One World Trade Center', 61, 61, 417, 541], ['Chrysler Building', 60, 60, 282, 319], ['Central Park Tower', 40, 55, 472, 472],
  ['111 West 57th Street', 18, 24, 435, 435], ['One Vanderbilt', 60, 60, 397, 427], ['432 Park Avenue', 28, 28, 426, 426], ['Bank of America Tower', 60, 70, 288, 366], ['30 Rockefeller Plaza', 30, 100, 259, 259],
  ['One Times Square', 17, 40, 111, 111]].map(([name, a, b, roof, tip]) => {
  const L = LANDMARKS.find(l => l.name === name), [u, v] = uv(L.e, L.n);
  return { name, u: u - a / 2, v: v - b / 2, bw: a, bh: b, roof, tip };
});
// The Titanic, set down in Seventh Avenue north of the crossing, for scale (Brandon, 2026-11-21:
// "shit like the fucking titanic and buildings"): 269.1 m long, 28.2 m in the beam, 53.3 m from
// keel to funnel tops, 10.5 m of it below her waterline (Encyclopedia Titanica); the avenue is
// 30 m between its buildings, so she just fits, bow toward the crossing. Her shape is drawn in
// blocks: [from, to (metres from the bow), half-width, base, top, ink].
const SHIP = (() => {
  const v0 = 38, L = 269.1, B = 14.1, parts = [], RED = '#7d2b22', BLACK = '#15181b', WHITE = '#e9e5d8', BUFF = '#d8a544', DECK = '#b79a6c';
  const half = t => B * (t < .2 ? Math.sin(t / .2 * Math.PI / 2) ** .8 : t > .82 ? 1 - .5 * ((t - .82) / .18) ** 2 : 1);
  const N = 22;
  for (let k = 0; k < N; k++) {
    const a = k / N, b = (k + 1) / N, hw = Math.max(1.2, half((a + b) / 2)), top = a < .15 || a > .86 ? 22.6 : 20.2;
    parts.push([a * L, b * L, hw, 0, 10.5, RED], [a * L, b * L, hw, 10.5, top, BLACK]);
  }
  parts.push([.2 * L, .8 * L, B - 1.2, 20.2, 28.9, WHITE], [.215 * L, .26 * L, B - 3, 28.9, 31.7, WHITE]);
  for (const f of [86, 123, 160, 197]) parts.push([f - 3.7, f + 3.7, 2.95, 28.9, 48.5, BUFF], [f - 3.7, f + 3.7, 2.95, 48.5, 53.3, BLACK]);
  return { v0, v1: v0 + L, L, B, parts, masts: [[36, 22.6, 62], [228, 22.6, 60]], inks: c => [mixInk(c, '#000000', .12), mixInk(c, '#ffffff', .07), mixInk(c, '#000000', .22), mixInk(c, '#000000', .3), c === BLACK || c === RED ? DECK : mixInk(c, '#ffffff', .12)] };
})();
const underSkyline = (u, v, bw, bh) => SKYLINE.some(t => u < t.u + t.bw + 4 && u + bw > t.u - 4 && v < t.v + t.bh + 4 && v + bh > t.v - 4);

// The boroughs in metres east and north of Times Square.
const BOROUGHS = newYork.boroughs.map(b => ({
  name: b.name,
  rings: b.rings.map(r => { const out = new Float64Array(r.length); for (let i = 0; i < r.length; i += 2) { out[i] = r[i] * U - E0; out[i + 1] = r[i + 1] * U - N0; } return out; }),
}));
const MANHATTAN = BOROUGHS[0].rings;
const CENTRES = BOROUGHS.map(b => {
  const r = b.rings.reduce((a, x) => x.length > a.length ? x : a); let e = 0, n = 0;
  for (let i = 0; i < r.length; i += 2) { e += r[i]; n += r[i + 1]; }
  return [e / (r.length / 2), n / (r.length / 2)];
});
const inside = new Map();
function onIsland(u, v) {
  const key = u * 1e5 + v; if (inside.has(key)) return inside.get(key);
  const [e, n] = en(u, v); let odd = false;
  for (const r of MANHATTAN) for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2)
    if ((r[i + 1] > n) !== (r[j + 1] > n) && e < (r[j] - r[i]) * (n - r[i + 1]) / (r[j + 1] - r[i + 1]) + r[i]) odd = !odd;
  inside.set(key, odd); return odd;
}

// Heights: taller towards Times Square and the blocks south of the park.
function height(u, v, s) {
  const mid = Math.exp(-((u / 900) ** 2 + ((v - 400) / 1500) ** 2));
  return 20 + (s ** 1.7) * (110 + 115 * mid);
}

// Vehicles at real models' sizes, shared with red's street: red/vehicles.js.
const VEHICLES = redVehicles.KINDS;
const INKS = { glass: '#1c2a33', dark: '#1d2422', light: '#f4e7a1', stripe: '#2f63b0' };
const CAR_INKS = ['#d4d9d6', '#7d8a85', '#2a3431', '#a8443a', '#3d5f8f', '#c9ccc8', '#1f2a2f'];
// Traffic: the avenue has a red light, so its vehicles wait south of the crossing and the ones
// that got through drive away north; the cross street moves. One of each larger kind waits in the
// queue. [u, v, kind, ink, moving]
const QUEUE = (() => {
  const out = [], special = { '7,0': 'cab', '7,1': 'bus', '7,3': 'artic', '-7,0': 'sedan', '-7,1': 'box', '3.5,0': 'van', '3.5,1': 'semi', '-3.5,0': 'suv', '-3.5,1': 'pickup', '-3.5,2': 'garbage' };
  for (const lane of [-7, -3.5, 3.5, 7]) {
    let v = -12.5;
    for (let k = 0; k < 9; k++) {
      const h = hash(lane, k), kind = special[lane + ',' + k] || (h < .32 ? 'cab' : h < .55 ? 'suv' : 'sedan'), len = VEHICLES[kind].size[0];
      out.push([lane, v - len / 2, kind, CAR_INKS[Math.floor(hash(k, lane, 3) * CAR_INKS.length)], 0]);
      v -= len + 1.6 + hash(k, lane, 5) * 2.5;
    }
  }
  for (let k = 0; k < 10; k++) out.push([[-7, -3.5, 3.5, 7][k % 4], 30 + k * 37 + hash(k, 2) * 20, ['cab', 'sedan', 'suv', 'cab', 'van'][k % 5], CAR_INKS[k % CAR_INKS.length], 7 + hash(k, 8) * 3]);
  return out;
})();
const ACROSS = Array.from({ length: 8 }, (_, k) => [k % 2 ? 2.5 : -2.5, hash(k, 13) * 560 - 280, ['cab', 'sedan', 'cab', 'suv', 'pickup', 'cab', 'van', 'sedan'][k], CAR_INKS[(k * 3) % CAR_INKS.length], 6 + hash(k, 17) * 3]);
// People on the pavements and two crosswalks: [u, v, speed along, along u?, coat].
const COATS = ['#3b5a78', '#8a3b3b', '#2c2c34', '#6b6f3a', '#9a7b54', '#4a6b5a', '#c9b48a', '#5a4a72'];
const PEOPLE = (() => {
  const out = [];
  for (let k = 0; k < 120; k++) {
    const side = k % 4, s = (hash(k, 31) - .5) * 1.6;
    if (side < 2) out.push([(side ? 1 : -1) * (ROAD + 1.2 + hash(k, 33) * 4.4), (hash(k, 35) - .5) * 300, s || .6, false, COATS[k % COATS.length]]);
    else out.push([(hash(k, 37) - .5) * 520, (side === 2 ? 1 : -1) * (CROSS + .8 + hash(k, 39) * 2.6), s || .6, true, COATS[(k + 3) % COATS.length]]);
  }
  for (let k = 0; k < 9; k++) out.push([-ROAD + hash(k, 41) * 2 * ROAD, 7 + (hash(k, 43) - .5) * 2.4, (k % 2 ? 1 : -1) * (1 + hash(k, 45) * .5), true, COATS[(k + 5) % COATS.length]]);
  return out;
})();
// One person on the south crosswalk, in front of the camera, walking slowly east.
const WALKER = [-.6, -7.2];

// What stands on the street, as red's homepage builds it from NYC's data for a real street
// (/home/red/street.js `things`): here placed by hand round the crossing, at the same sizes.
// Measured or published: LinkNYC's Link at 2.9 m (CityBridge). Drawn, not measured: every other
// size and where each stands. [kind, u, v, a turn or size].
const FURNITURE = (() => {
  const out = [];
  for (const side of [-1, 1]) {
    for (let v = -300; v <= 300; v += 32) if (Math.abs(v) > 12) out.push(['lamp', side * 9.7, v + side * 6]);
    for (let v = -290; v <= 290; v += 71) if (Math.abs(v) > 14) out.push(['hydrant', side * 9.85, v + side * 11]);
    for (let v = -300; v <= 300; v += 9) if (Math.abs(v) > 130) out.push(['tree', side * 10.3, v + side * 3, 18 + hash(v, side) * 22]);
    for (let u = 22; u < 270; u += 8.5) out.push(['tree', side * u, side * 7.4, 15 + hash(u, side, 3) * 25]);
    for (const v of [-150, -40, 60, 130]) out.push(['kiosk', side * 10.4, v + side * 9]);
    for (const v of [12, 34]) out.push(['bench', side * 13, v + side * 4]);
  }
  for (const [u, v] of [[9.8, -5.8], [-9.8, -5.8], [9.8, 5.8], [-9.8, 5.8]]) out.push(['signal', u, v]);
  out.push(['newsstand', 12.4, 28], ['cart', -10.7, 19], ['cart', 10.9, -62], ['shelter', 11, -96], ['subway', -12.3, -47], ['bikes', 38, -7.6]);
  return out;
})();
const FURNITURE_NAMES = { lamp: 'Street lamp', hydrant: 'Fire hydrant', tree: 'Street tree', kiosk: 'LinkNYC kiosk', bench: 'Bench', signal: 'Traffic signal', newsstand: 'Newsstand', cart: 'Hot dog cart', shelter: 'Bus shelter', subway: 'Subway entrance', bikes: 'Citi Bike station' };

// Lit windows: a tile of 8 bays (4 m) by 12 storeys (3.6 m), at 8 or 24 pixels a storey. Near walls
// get every window drawn in perspective; farther ones get this tile laid on the wall in patches
// (wallWindows), which is cheaper and looks the same.
const TILES = {};
function tile(ctx, cell) {
  if (TILES[cell]) return TILES[cell];
  const c = document.createElement('canvas'); c.width = 8 * cell; c.height = 12 * cell; const g = c.getContext('2d');
  for (let i = 0; i < 8; i++) for (let j = 0; j < 12; j++) {
    const r = hash(i, j, 7);
    if (r > .7) g.fillStyle = r > .96 ? '#a8cfe0' : r > .86 ? '#f7e2ae' : '#f2c77a'; else if (r > .25) g.fillStyle = '#20342acc'; else continue;
    g.fillRect((i + .2) * cell, (j + .25) * cell, .6 * cell, .5 * cell);
  }
  return TILES[cell] = ctx.createPattern(c, 'repeat');
}
// Lays the window tile on one wall. `p(s, z)` gives the screen point at a fraction s along the wall
// and z up it. A flat tile cannot follow perspective over a whole wall, so the wall is split into
// patches until a flat fit is within about a pixel at each patch's corners; each patch is filled in the
// tile's own coordinates through ctx.transform (no pattern transforms, which phones handle
// unevenly). Where storeys shrink below a few pixels the windows fade into the wall's glow
// rather than flicker.
function wallWindows(ctx, w, h, p, L, top, off, lift, a0) {
  const patch = (s0, s1, q0, q1, n) => {
    const A = p(s0, q0), B = p(s1, q0), D = p(s0, q1), C = p(s1, q1);
    const xs = [A[0], B[0], C[0], D[0]], ys = [A[1], B[1], C[1], D[1]];
    if (Math.max(...xs) < 0 || Math.min(...xs) > w || Math.max(...ys) < 0 || Math.min(...ys) > h) return;
    const dS = (s1 - s0) * L, dZ = (q1 - q0) * top;
    if (Math.max(Math.hypot(D[0] - A[0], D[1] - A[1]), Math.hypot(C[0] - B[0], C[1] - B[1])) / dZ * 3.6 < 3) return;
    if (Math.hypot(C[0] - B[0] - D[0] + A[0], C[1] - B[1] - D[1] + A[1]) > 1.2 && n < 8) {
      if (Math.hypot(B[0] - A[0], B[1] - A[1]) > Math.hypot(D[0] - A[0], D[1] - A[1])) { const m = (s0 + s1) / 2; patch(s0, m, q0, q1, n + 1); patch(m, s1, q0, q1, n + 1); }
      else { const m = (q0 + q1) / 2; patch(s0, s1, q0, m, n + 1); patch(s0, s1, m, q1, n + 1); }
      return;
    }
    const storey = Math.min(Math.hypot(D[0] - A[0], D[1] - A[1]), Math.hypot(C[0] - B[0], C[1] - B[1])) / dZ * 3.6;
    const a = a0 * ease((storey - 3) / 3); if (a < .02) return;
    const cell = storey > 9 ? 24 : 8, kx = cell / 4, ky = cell / 3.6;
    // Tile pixel (tx, ty) ↔ wall metres: tx = (S + off)·kx, ty = −(Z + lift)·ky.
    const ux = (B[0] - A[0]) / (dS * kx), uy = (B[1] - A[1]) / (dS * kx), vx = -(D[0] - A[0]) / (dZ * ky), vy = -(D[1] - A[1]) / (dZ * ky);
    if (Math.abs(ux * vy - uy * vx) < 1e-7) return;
    const tx0 = (s0 * L + off) * kx, ty0 = -(q0 * top + lift) * ky;
    ctx.save(); ctx.transform(ux, uy, vx, vy, A[0] - tx0 * ux - ty0 * vx, A[1] - tx0 * uy - ty0 * vy);
    ctx.globalAlpha = a; ctx.fillStyle = tile(ctx, cell); ctx.fillRect(tx0, ty0 - dZ * ky, dS * kx, dZ * ky);
    ctx.restore();
  };
  // Whole bays and whole storeys only, as the drawn windows have them.
  const bays = Math.floor(L / 4) * 4 / L, floors = Math.floor(top / 3.6) * 3.6 / top;
  if (bays > 0 && floors > 3.6 / top) patch(0, bays, 3.6 / top, floors, 0);
}
const LIT = ['#f2c77a', '#f7e2ae', '#a8cfe0'];
// A wall too far away for its windows to show takes on their glow instead.
const WALLS = ['#17261e', '#1d2f25', '#142019', '#111c16'], GLOW = '#38422e';
const SCREENS = ['#ff4f7b', '#3fd0ff', '#ffd24a', '#a46bff', '#ff8a3d', '#5dfc9b', '#ffffff'];
// Street furniture's faces: south, east, north, west (darker round the sides), then the top.
const METAL = ['#2f3d37', '#35443d', '#2a3732', '#26322d', '#3a4a42'];
const solid = (ink, k = 1) => [0, 1, 2, 3, 4].map(i => mixInk(ink, i === 4 ? '#ffffff' : '#000000', i === 4 ? .12 : [.1, 0, .25, .35][i] * k));

/** The city, W metres across the frame at the point the camera looks at. */
export function city(ctx, w, h, W, time, alpha, V, lock, bark = 0, quiet = false) {
  const found = { puppy: null };
  if (alpha < .01) return found;
  // Every drawn object, with its box on screen, so a press on it can name it.
  let pick = null;
  const objects = found.objects = [];
  const mark = name => (x0, y0, x1, y1) => objects.push([x0, y0, x1, y1, name]);
  // On a tall screen the lens is set by the height as well, so the view up and down is never much
  // wider than across; the camera stands back to keep W metres across the width.
  const cx = w / 2, cy = h / 2, fov = (30 + 32 * lock) * RAD, F = Math.max(w, h * .8) / 2 / Math.tan(fov / 2), d = W / 2 * F / (w / 2), NEAR = Math.max(.05, d * .03);
  const [Te, Tn] = en(TARGET[0], TARGET[1]), Tz = TARGET[2];
  // A point east, north and up, in the camera's axes (right, down, ahead).
  const view = (e, n, z) => { const x = e - Te, y = Tn - n, q = Tz - z; return [V[0][0] * x + V[0][1] * y + V[0][2] * q, V[1][0] * x + V[1][1] * y + V[1][2] * q, V[2][0] * x + V[2][1] * y + V[2][2] * q + d]; };
  const at = (u, v, z = 0) => { const [e, n] = en(u, v); return view(e, n, z); };
  const scr = p => [cx + p[0] * F / p[2], cy + p[1] * F / p[2]];
  // The camera, east, north and up, and where it stands on the grid.
  const ahead = [V[2][0], -V[2][1], -V[2][2]], cam = [Te - ahead[0] * d, Tn - ahead[1] * d, Tz - ahead[2] * d], [cu, cv] = uv(cam[0], cam[1]);
  // Sutherland–Hodgman against the plane just in front of the camera; returns the kept points.
  function clip(points) {
    const out = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length], ia = a[2] > NEAR, ib = b[2] > NEAR;
      if (ia) out.push(a);
      if (ia !== ib) { const t = (NEAR - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]); }
    }
    return out;
  }
  function path(points) {
    // Sutherland–Hodgman against the plane just in front of the camera.
    const out = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length], ia = a[2] > NEAR, ib = b[2] > NEAR;
      if (ia) out.push(a);
      if (ia !== ib) { const t = (NEAR - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]); }
    }
    if (out.length < 3) return false;
    for (let i = 0; i < out.length; i++) { const [x, y] = scr(out[i]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.closePath(); return true;
  }
  function segment(a, b) {
    if (a[2] <= NEAR && b[2] <= NEAR) return;
    if (a[2] <= NEAR) { const t = (NEAR - a[2]) / (b[2] - a[2]); a = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]; }
    if (b[2] <= NEAR) { const t = (NEAR - b[2]) / (a[2] - b[2]); b = [b[0] + (a[0] - b[0]) * t, b[1] + (a[1] - b[1]) * t, NEAR]; }
    const p = scr(a), q = scr(b); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]);
  }
  const labels = [];
  const label = (p, text, a) => { if (a > .02 && p[2] > NEAR) { const [x, y] = scr(p); if (x > -40 && x < w + 40 && y > -40 && y < h + 40) labels.push([x, y, text, a]); } };

  ctx.save(); ctx.globalAlpha = alpha;
  // Where the screen sees ground and where it sees sky: the sign of each ray's fall.
  const fall = (X, Y) => V[0][2] * (X - cx) + V[1][2] * (Y - cy) + V[2][2] * F;
  const corners = [[0, 0], [w, 0], [w, h], [0, h]];
  const half = sign => { const out = []; for (let i = 0; i < 4; i++) { const a = corners[i], b = corners[(i + 1) % 4], fa = fall(...a) * sign, fb = fall(...b) * sign; if (fa > 0) out.push(a); if ((fa > 0) !== (fb > 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } } return out; };
  const sky = half(-1);
  if (sky.length > 2 && lock > .01) {
    // The horizon's height on screen, for the glow over the city.
    const hy = Math.max(...sky.map(p => p[1])), g = ctx.createLinearGradient(0, hy - h * .6, 0, hy);
    g.addColorStop(0, '#070b14'); g.addColorStop(.7, '#102028'); g.addColorStop(1, '#2c3c34');
    ctx.globalAlpha = alpha * lock; ctx.fillStyle = g; ctx.beginPath(); sky.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.fill(); ctx.globalAlpha = alpha;
  }
  const ground = half(1);
  const water = below(W, 6e4, 2e5);
  if (ground.length > 2 && water > .01) {
    ctx.globalAlpha = alpha * water; ctx.fillStyle = '#0a1724'; ctx.beginPath(); ground.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.fill(); ctx.globalAlpha = alpha;
  }

  // The region: sea, then the states, the county lines, and the counties Brandon works in.
  const region = (1 - below(W, 2.2e4, 5e4)) * below(W, 2e6, 4.5e6);
  if (region > .01) {
    const shape = r => { const pts = []; for (let i = 0; i < r.length; i += 2) pts.push(view(r[i], r[i + 1], 0)); return pts; };
    ctx.globalAlpha = alpha * region; ctx.fillStyle = '#0a1724'; ctx.fillRect(0, 0, w, h);
    ctx.beginPath(); for (const st of STATES) for (const r of st.rings) path(shape(r)); ctx.fillStyle = '#17281f'; ctx.fill('evenodd');
    const lines = ease(Math.log(4e6 / W) / Math.log(3));
    ctx.beginPath(); for (const c of COUNTIES) if (!c.work) for (const r of c.rings) path(shape(r));
    ctx.globalAlpha = alpha * region * lines * .35; ctx.strokeStyle = '#6f9a7a'; ctx.lineWidth = .7; ctx.stroke();
    ctx.beginPath(); for (const c of COUNTIES) if (c.work) for (const r of c.rings) path(shape(r));
    ctx.globalAlpha = alpha * region * .24; ctx.fillStyle = '#c4fa79'; ctx.fill('evenodd');
    ctx.globalAlpha = alpha * region * .85; ctx.strokeStyle = '#c4fa79'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); for (const st of STATES) for (const r of st.rings) path(shape(r));
    ctx.globalAlpha = alpha * region * .7; ctx.strokeStyle = '#a9cdb2'; ctx.lineWidth = 1.3; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = alpha;
  }
  // The five boroughs.
  const outline = below(W, 3e5, 2.5e6) * (1 - region * .85);
  const ring = r => { const pts = []; for (let i = 0; i < r.length; i += 2) pts.push(view(r[i], r[i + 1], 0)); return pts; };
  ctx.beginPath(); for (const b of BOROUGHS) for (const r of b.rings) path(ring(r));
  ctx.globalAlpha = alpha * outline; ctx.fillStyle = '#1b3125'; ctx.fill('evenodd');
  ctx.globalAlpha = alpha * outline * .7; ctx.strokeStyle = '#5f8f6c'; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = alpha;

  // The ground the camera can see, on the grid, with room for tall buildings standing just outside it.
  const hit = (X, Y) => {
    const r = [X - cx, Y - cy, F], e = V[0][0] * r[0] + V[1][0] * r[1] + V[2][0] * r[2], n = -(V[0][1] * r[0] + V[1][1] * r[1] + V[2][1] * r[2]), z = -(V[0][2] * r[0] + V[1][2] * r[1] + V[2][2] * r[2]);
    const far = Math.max(2.4 * W, 2000), flat = Math.hypot(e, n) || 1e-9;
    const t = z < -1e-9 ? Math.min(-cam[2] / z, far / flat) : far / flat;
    return [cam[0] + e * t, cam[1] + n * t];
  };
  const seen = [[0, 0], [w, 0], [w, h], [0, h], [cx, 0], [cx, h], [0, cy], [w, cy]].map(([X, Y]) => uv(...hit(X, Y)));
  seen.push([cu, cv]);
  const pad = 260, umin = Math.min(...seen.map(p => p[0])) - pad, umax = Math.max(...seen.map(p => p[0])) + pad, vmin = Math.min(...seen.map(p => p[1])) - pad, vmax = Math.max(...seen.map(p => p[1])) + pad;
  const i0 = Math.max(Math.floor(umin / AVENUE), -12), i1 = Math.min(Math.ceil(umax / AVENUE), 12), j0 = Math.max(Math.floor(vmin / STREET), -150), j1 = Math.min(Math.ceil(vmax / STREET), 150);

  const avenues = below(W, 2.2e4, 4.5e4), streets = below(W, 7e3, 1.4e4), blocks = below(W, 1.2e4, 2.6e4), paving = below(W, 2400, 5200), detail = below(W, 500, 1100), near = below(W, 150, 350);
  // Vehicles stay until they are a pixel or two long.
  const traffic = below(W, 1800, 3600);
  const ship = below(W, 9e3, 1.8e4) * (1 - below(W, 28, 70));        // not at street level: she comes in as the camera rises
  const things = [];
  if (avenues > .01) {
    ctx.save(); ctx.beginPath(); for (const r of MANHATTAN) path(ring(r)); ctx.clip('evenodd');
    if (paving > .04) {
      ctx.globalAlpha = alpha * paving; ctx.fillStyle = '#111a17'; ctx.fillRect(0, 0, w, h);
      // Pavements and the plots, block by block.
      ctx.beginPath();
      for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) { const u = i * AVENUE + WALK - 6, v = j * STREET + CURB - 4, m = at(u + AVENUE / 2, v + STREET / 2); if (m[2] > NEAR && 60 * F / m[2] < 2) continue; path([at(u, v), at(u + AVENUE - 2 * WALK + 12, v), at(u + AVENUE - 2 * WALK + 12, v + STREET - 2 * CURB + 8), at(u, v + STREET - 2 * CURB + 8)]); }
      ctx.fillStyle = '#1e2a25'; ctx.fill();
    }
    ctx.globalAlpha = alpha * avenues * (1 - paving * .85); ctx.strokeStyle = '#3d5a47'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = i0; i <= i1; i++) segment(at(i * AVENUE, vmin), at(i * AVENUE, vmax));
    ctx.stroke();
    if (streets > .01) { ctx.globalAlpha = alpha * streets * (1 - paving * .85) * .6; ctx.beginPath(); for (let j = j0; j <= j1; j++) segment(at(umin, j * STREET), at(umax, j * STREET)); ctx.stroke(); }
    // Central Park.
    ctx.globalAlpha = alpha * avenues; ctx.fillStyle = '#24492f'; ctx.beginPath(); path([at(PARK[0], PARK[1]), at(PARK[2], PARK[1]), at(PARK[2], PARK[3]), at(PARK[0], PARK[3])]); ctx.fill();
    if (blocks > .01) {
      // Trees in the park, as soft dots, once they would show.
      ctx.globalAlpha = alpha * blocks * .55; ctx.fillStyle = '#2f6a3c'; ctx.beginPath();
      for (let k = 0; k < 700; k++) { const p = at(PARK[0] + hash(k, 1) * (PARK[2] - PARK[0]), PARK[1] + hash(k, 2) * (PARK[3] - PARK[1])); if (p[2] < NEAR) continue; const [x, y] = scr(p), r = (5 + hash(k, 3) * 6) * F / p[2]; if (r < .6 || x < -r || x > w + r || y < -r || y > h + r) continue; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
      ctx.fill();
    }
    if (detail > .01) {
      // Lane lines, the double yellow, stop lines and crosswalks at the crossing.
      ctx.globalAlpha = alpha * detail * .6; ctx.fillStyle = '#c9d6cc'; ctx.beginPath();
      for (const lane of [-5.3, -1.8, 1.8, 5.3]) for (let v = Math.max(vmin, -400); v < Math.min(vmax, 400); v += 12) { if (Math.abs(v) < 12) continue; path([at(lane - .08, v), at(lane + .08, v), at(lane + .08, v + 3), at(lane - .08, v + 3)]); }
      for (const side of [-1, 1]) for (let k = -8; k < 8; k++) path([at(k * 1.1 + .1, side * 7 - 1.5), at(k * 1.1 + .65, side * 7 - 1.5), at(k * 1.1 + .65, side * 7 + 1.5), at(k * 1.1 + .1, side * 7 + 1.5)]);
      for (const side of [-1, 1]) for (let k = -4; k < 4; k++) path([at(side * 12 - 1.6, k * 1.1 + .1), at(side * 12 + 1.6, k * 1.1 + .1), at(side * 12 + 1.6, k * 1.1 + .65), at(side * 12 - 1.6, k * 1.1 + .65)]);
      path([at(-ROAD, -10.5), at(0, -10.5), at(0, -10.1), at(-ROAD, -10.1)]); path([at(0, -10.5), at(ROAD, -10.5), at(ROAD, -10.1), at(0, -10.1)]);
      ctx.fill();
      ctx.fillStyle = '#d8b13a'; ctx.beginPath();
      for (let v = Math.max(vmin, -600); v < Math.min(vmax, 600); v += 6) { if (Math.abs(v) < 9) continue; path([at(-.25, v), at(-.12, v), at(-.12, v + 6), at(-.25, v + 6)]); path([at(.12, v), at(.25, v), at(.25, v + 6), at(.12, v + 6)]); }
      ctx.fill();
    }
    ctx.restore();

    // Buildings, block by block: one mass for a far block, its plots once they are a few pixels wide.
    const tilt = Math.hypot(V[0][2], V[1][2]);
    if (blocks > .04 && tilt > .02) {
      for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) {
        const u = i * AVENUE + WALK, v = j * STREET + CURB, bw = AVENUE - 2 * WALK, bh = STREET - 2 * CURB;
        if (u + bw > PARK[0] - 1 && u < PARK[2] + 1 && v + bh > PARK[1] - 1 && v < PARK[3] + 1) continue;
        if (!onIsland(u + bw / 2, v + bh / 2)) continue;
        const skip = (a0, b0, a1, b1) => underSkyline(a0, b0, a1 - a0, b1 - b0);
        const mid = at(u + bw / 2, v + bh / 2, 40); if (mid[2] < -300) continue;
        const plotPx = 36 * F / Math.max(NEAR, mid[2]);
        // Too far to be more than a speck: the ground's colour stands in for it.
        if (plotPx < 2) continue;
        // Far: one mass per block at a middling height. Nearer: four masses. Near: every plot.
        // The same plots decide every level of detail: a block's mass, or a quarter's, is as tall as
        // the average of the buildings it stands for, so nothing jumps as the level changes.
        const plotTop = (a, b) => height(u + (a + .5) * bw / 7, v + (b + .5) * bh / 2, hash(i * 7 + a, j * 2 + b));
        const mean = (a0, a1, b0, b1) => { let sum = 0, n = 0; for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) { sum += plotTop(a, b); n++; } return sum / n; };
        const sky = underSkyline(u, v, bw, bh);
        if (plotPx < 7 && !sky) things.push({ kind: 'tower', u: u + 4, v: v + 4, bw: bw - 8, bh: bh - 8, top: mean(0, 6, 0, 1), s: .5, key: i * 1000 + j });
        else if (plotPx < 26 && !sky) for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) things.push({ kind: 'tower', u: u + a * bw / 2 + 2, v: v + b * bh / 2 + 1.5, bw: bw / 2 - 4, bh: bh / 2 - 3, top: mean(a ? 3 : 0, a ? 6 : 3, b, b), s: .5, key: (i * 1000 + j) * 20 + 15 + a * 2 + b });
        else for (let a = 0; a < 7; a++) for (let b = 0; b < 2; b++) if (!sky || !skip(u + a * bw / 7, v + b * bh / 2, u + (a + 1) * bw / 7, v + (b + 1) * bh / 2)) things.push({ kind: 'tower', u: u + a * bw / 7 + .8, v: v + b * bh / 2 + .8, bw: bw / 7 - 1.6, bh: bh / 2 - 1.6, top: plotTop(a, b), s: hash(i * 7 + a, j * 2 + b), key: (i * 1000 + j) * 20 + a * 2 + b });
      }
    }
    if (blocks > .04 && tilt > .02) {
      SKYLINE.forEach((t, i) => { if (at(t.u + t.bw / 2, t.v + t.bh / 2, 0)[2] > -500) things.push({ kind: 'tower', u: t.u, v: t.v, bw: t.bw, bh: t.bh, top: t.roof, tip: t.tip, s: .9, key: 9e8 + i, name: t.name }); });
      // The Statue of Liberty on its island: pedestal, then the figure.
      const lib = LANDMARKS.find(l => l.name === 'Statue of Liberty'), [lu, lv] = uv(lib.e, lib.n);
      things.push({ kind: 'statue', u: lu - 14, v: lv - 14, bw: 28, bh: 28, name: 'Statue of Liberty' });
    }
    // The Titanic: each block of her stands like a building, nearest last.
    if (ship > .01) for (const [a, b, hw, z0, top, ink] of SHIP.parts) things.push({ kind: 'solid', u: -hw, v: SHIP.v0 + a, bw: 2 * hw, bh: b - a, z0, top, inks: SHIP.inks(ink), shade: ship, name: 'Titanic' });
    if (traffic > .01) {
      const named = new Set();
      for (const [lane, start, type, ink, speed] of QUEUE) { const V = VEHICLES[type], first = !speed && !named.has(type) && named.add(type); const cv = speed ? 14 + (start + speed * time) % 600 : start; if (cv > SHIP.v0 - 6 && cv < SHIP.v1 + 4) continue; things.push({ kind: 'car', u: lane, v: cv, type, ink, along: 'v', dir: 1, stopped: !speed, label: first ? V.name : null }); }
      for (const [lane, start, type, ink, speed] of ACROSS) { const u = ((start - speed * time + 280) % 560 + 560) % 560 - 280; things.push({ kind: 'car', u, v: lane, type, ink, along: 'u', dir: lane > 0 ? -1 : 1, stopped: false }); }
    }
    if (detail > .01) {
      for (const [u, v, speed, across, coat] of PEOPLE) {
        let pu = u, pv = v;
        if (across && Math.abs(v) > 6) pu = ((u + speed * time + 260) % 520 + 520) % 520 - 260;
        else if (across) pu = ((u + speed * time + ROAD) % (2 * ROAD) + 2 * ROAD) % (2 * ROAD) - ROAD;
        else pv = ((v + speed * time + 150) % 300 + 300) % 300 - 150;
        // Keep the corridor the camera moves in clear: nobody stands in the avenue south of the crossing.
        if (Math.abs(pu) < ROAD && pv < -9) continue;
        if (Math.abs(pu) < SHIP.B + 1 && pv > SHIP.v0 - 2 && pv < SHIP.v1 + 2) continue;      // nor inside the ship
        things.push({ kind: 'person', u: pu, v: pv, coat, phase: hash(u, v) * TAU, walking: true });
      }
      // The person on the south crosswalk walks a puppy, who trots on the side they are heading to.
      const swing = (time * .07) % 2, way = swing < 1 ? -1 : 1, wu = WALKER[0] - 2.5 + Math.abs(swing - 1) * 5;
      things.push({ kind: 'dog', u: wu + way * .75, v: WALKER[1] + .3, way, hand: [wu + way * .22, WALKER[1] + .05] });
      things.push({ kind: 'person', u: wu, v: WALKER[1], coat: '#3b5a78', phase: 0, walking: true, label: 'Average American man · 175 cm', tall: 1.754 / 1.7 });
    }
    if (near > .01) for (const [what, u, v, k] of FURNITURE) things.push({ kind: 'furniture', what, u, v, k });
  }

  // Everything that stands up, farthest first.
  for (const t of things) { const c = at(t.u + (t.bw || 0) / 2, t.v + (t.bh || 0) / 2, 0); t.depth = Math.hypot(c[0], c[1], c[2]); }
  things.sort((a, b) => b.depth - a.depth);
  for (const t of things) {
    if (t.kind === 'tower') tower(t); else if (t.kind === 'solid') { pick = mark(t.name); box(t.u, t.v, t.bw, t.bh, t.top, t.inks, t.shade, t.z0); pick = null; } else if (t.kind === 'statue') statue(t); else if (t.kind === 'car') car(t); else if (t.kind === 'dog') dog(t); else if (t.kind === 'furniture') furniture(t); else person(t);
  }

  function box(u, v, bw, bh, top, inks, shade = 1, z0 = 0) {
    // Corners at the ground and at the top, in the camera's axes. A wall that passes behind the
    // camera is cut at the plane just in front of it, never dropped whole.
    const c = [[u, v], [u + bw, v], [u + bw, v + bh], [u, v + bh]], base = c.map(([a, b]) => at(a, b, z0)), roof = c.map(([a, b]) => at(a, b, top));
    const all = base.concat(roof);
    if (all.every(p => p[2] < NEAR)) return null;
    const front = all.every(p => p[2] > NEAR);
    let pb = null, pr = null;
    if (front) {
      pb = base.map(scr); pr = roof.map(scr); const xs = pb.concat(pr).map(p => p[0]), ys = pb.concat(pr).map(p => p[1]);
      if (Math.max(...xs) < 0 || Math.min(...xs) > w || Math.max(...ys) < 0 || Math.min(...ys) > h) return null;
    }
    // Which walls face the camera: south, east, north, west.
    const faces = [cv < v, cu > u + bw, cv > v + bh, cu < u];
    ctx.globalAlpha = alpha * shade;
    if (front) {
      // Wholly in front of the camera: the corners on screen are enough.
      const quad = (A, B, C, D) => { ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.lineTo(D[0], D[1]); ctx.closePath(); };
      for (let k = 0; k < 4; k++) if (faces[k]) { const j = (k + 1) % 4; quad(pb[k], pb[j], pr[j], pr[k]); ctx.fillStyle = inks[k]; ctx.fill(); }
      if (cam[2] > top) { quad(pr[0], pr[1], pr[2], pr[3]); ctx.fillStyle = inks[4]; ctx.fill(); }
      if (pick) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const q of pb) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; } for (const q of pr) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; } pick(x0, y0, x1, y1); }
    } else {
      for (let k = 0; k < 4; k++) if (faces[k]) { const j = (k + 1) % 4; ctx.beginPath(); if (path([base[k], base[j], roof[j], roof[k]])) { ctx.fillStyle = inks[k]; ctx.fill(); } }
      if (cam[2] > top) { ctx.beginPath(); if (path(roof)) { ctx.fillStyle = inks[4]; ctx.fill(); } }
    }
    return { base, roof, faces, pb, pr, front };
  }

  function statue(t) {
    pick = mark(t.name);
    box(t.u, t.v, t.bw, t.bh, 47, ['#9a967f', '#a7a38c', '#8a8670', '#7f7b66', '#b3af97'], blocks);
    box(t.u + 9, t.v + 9, 10, 10, 93, ['#4f9a84', '#5aa98f', '#468a76', '#3f7d6b', '#62b39a'], blocks, 1, 47);
    pick = null;
    const torch = at(t.u + 16, t.v + 12, 96); if (torch[2] > NEAR) { const [x, y] = scr(torch); ctx.globalAlpha = alpha * blocks; ctx.fillStyle = '#ffd56a'; ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, 3 * F / torch[2]), 0, TAU); ctx.fill(); }
  }
  function tower(t) {
    pick = mark(t.name || 'Midtown office tower');
    const top = t.top ?? height(t.u, t.v, t.s), mid = at(t.u + t.bw / 2, t.v + t.bh / 2, 0);
    // Windows: one storey is about 3.6 m, one bay about 4 m, drawn once a storey is 3 pixels high.
    // A building beside or above the camera is cut by box() at the near plane, not dropped here.
    const storey0 = 3.6 * F / Math.max(NEAR, mid[2]), lit = (1 - ease((storey0 - 1) / 2.5)) * ease(storey0 / .6) * (.4 + .4 * hash(t.key, 2));
    const b = box(t.u, t.v, t.bw, t.bh, top, [...WALLS.map(c => lit > .02 ? mixInk(c, GLOW, lit) : c), t.s > .6 ? '#2b4433' : '#243a2c'], blocks);
    if (!b) { pick = null; return; }
    pick = null;
    const { base, roof, faces } = b;
    if (t.tip) { ctx.globalAlpha = alpha * blocks; ctx.strokeStyle = '#cfe0d4'; ctx.lineWidth = Math.max(1, 3 * F / Math.max(NEAR, base[0][2])); ctx.beginPath(); segment(at(t.u + t.bw / 2, t.v + t.bh / 2, t.top), at(t.u + t.bw / 2, t.v + t.bh / 2, t.tip)); ctx.stroke(); }
    const storey = 3.6 * F / Math.max(NEAR, Math.min(...base.map(p => p[2])));
    if (storey < 3) return;
    const fade = ease((storey - 3) / 3) * blocks, paths = [new Path2D(), new Path2D(), new Path2D()], dim = new Path2D();
    const screens = Math.abs(t.u + t.bw / 2) < 330 && t.v + t.bh / 2 > -150 && t.v + t.bh / 2 < 130;
    for (let k = 0; k < 4; k++) {
      if (!faces[k]) continue;
      const j = (k + 1) % 4, A = base[k], S = base[j], T = roof[k], L = k % 2 ? t.bh : t.bw, nb = Math.max(1, Math.floor(L / 4)), nf = Math.floor(top / 3.6);
      const q = (s, z) => [A[0] + (S[0] - A[0]) * s + (T[0] - A[0]) * z, A[1] + (S[1] - A[1]) * s + (T[1] - A[1]) * z, A[2] + (S[2] - A[2]) * s + (T[2] - A[2]) * z], p = (s, z) => scr(q(s, z));
      // A wall that passes behind the camera has each window cut at the near plane.
      const inFront = [A, S, T, roof[j]].every(c => c[2] > NEAR);
      const win = (path, s0, s1, z0, z1) => {
        let pts = [q(s0, z0), q(s1, z0), q(s1, z1), q(s0, z1)];
        if (!inFront) { if (pts.every(c => c[2] <= NEAR)) return; pts = clip(pts); if (pts.length < 3) return; }
        pts.forEach((c, i) => { const [x, y] = scr(c); i ? path.lineTo(x, y) : path.moveTo(x, y); }); path.closePath();
      };
      // How big a storey is at this wall's nearest corner decides how its windows are drawn.
      const close = 3.6 * F / Math.max(NEAR, Math.min(A[2], S[2], T[2], roof[j][2]));
      if (close < 16 && inFront) {
        if (close * nb * nf / 3 < 60) continue;
        const off = Math.floor(hash(t.key, k, 5) * 8) * 4, lift = Math.floor(hash(k, t.key, 6) * 12) * 3.6;
        wallWindows(ctx, w, h, p, L, top, off, lift, alpha * blocks);
      } else {
        // Every window drawn, lit or not exactly as the tile has it on this wall, so a wall looks
        // the same whichever way it is drawn as the view turns.
        const off = Math.floor(hash(t.key, k, 5) * 8) * 4, lift = Math.floor(hash(k, t.key, 6) * 12) * 3.6;
        for (let f = 1; f < nf; f++) for (let n = 0; n < Math.floor(L / 4); n++) {
          const i = (n + off / 4) % 8, j = ((-(f + 1) - Math.round(lift / 3.6)) % 12 + 12) % 12, r = hash(i, j, 7);
          const s0 = (n * 4 + .8) / L, s1 = (n * 4 + 3.2) / L, z0 = (f * 3.6 + .9) / top, z1 = (f * 3.6 + 2.7) / top;
          if (r > .7) win(paths[r > .96 ? 2 : r > .86 ? 1 : 0], s0, s1, z0, z1); else if (r > .25) win(dim, s0, s1, z0, z1);
        }
      }
      if (screens) {
        // Times Square's screens on the lowest floors, changing every few seconds.
        for (let n = 0; n < 2; n++) {
          if (hash(t.key, n, 9) < .35) continue;
          const s0 = .1 + n * .45 + hash(t.key, n, 2) * .1, s1 = s0 + .25, z0 = (5 + hash(t.key, n) * 4) / top, z1 = Math.min(.95, (11 + hash(n, t.key) * 9) / top);
          const ink = SCREENS[Math.floor(hash(t.key + n, k, Math.floor(time / 4 + hash(n, t.key) * 3)) * SCREENS.length)];
          const sp = new Path2D(); win(sp, s0, s1, z0, z1);
          ctx.globalAlpha = alpha * fade * .78; ctx.fillStyle = ink; ctx.fill(sp);
          ctx.globalAlpha = alpha * fade * .22; ctx.shadowColor = ink; ctx.shadowBlur = 24; ctx.fill(sp); ctx.shadowBlur = 0;
          // Now and then a screen shows a paw print.
          if (hash(t.key + n, k, Math.floor(time / 4 + hash(n, t.key) * 3) + 7) < .22) {
            const sc = (s0 + s1) / 2, zc = (z0 + z1) / 2, ds = (s1 - s0), dz = (z1 - z0); if (q(sc, zc)[2] < NEAR * 4) continue; const c0 = p(sc, zc), r0 = Math.hypot(...[0, 1].map(i => p(sc + ds * .1, zc)[i] - c0[i]));
            if (r0 > 1.2) {
              ctx.globalAlpha = alpha * fade * .9; ctx.fillStyle = '#ffffff';
              const pad = p(sc, zc - dz * .12); ctx.beginPath(); ctx.ellipse(pad[0], pad[1], r0 * 1.25, r0 * 1.05, 0, 0, TAU); ctx.fill();
              for (const [a, b] of [[-.24, .1], [-.09, .24], [.09, .24], [.24, .1]]) { const toe = p(sc + ds * a, zc + dz * b); ctx.beginPath(); ctx.arc(toe[0], toe[1], r0 * .55, 0, TAU); ctx.fill(); }
            }
          }
        }
      }
    }
    ctx.globalAlpha = alpha * fade * .8; ctx.fillStyle = '#20342a'; ctx.fill(dim);
    paths.forEach((path, i) => { ctx.globalAlpha = alpha * fade; ctx.fillStyle = LIT[i]; ctx.fill(path); });
  }

  // A vehicle: its boxes, then the bands painted on its sides, then its rear lights.
  function car(t) {
    const T = VEHICLES[t.type], [L, Wd, H] = T.size, ink = T.ink || t.ink, along = t.along === 'v', d = t.dir;
    const rear = (along ? t.v : t.u) - d * L / 2;
    const span = (x0, x1, inset) => { const a = rear + d * x0 * L, b = rear + d * x1 * L, lo = Math.min(a, b), len = Math.abs(b - a), c = (along ? t.u : t.v) - Wd / 2 + inset * Wd, wd = Wd * (1 - 2 * inset); return along ? [c, lo, wd, len] : [lo, c, len, wd]; };
    const tone = k => k === 'body' ? ink : k === 'cab' ? (T.cab || ink) : INKS[k];
    pick = mark(T.name.split(' · ')[0]);
    let main = null;
    for (const [x0, x1, inset, z0, z1, side, top] of T.parts) {
      const [u, v, bw, bh] = span(x0, x1, inset), inks = solid(tone(side)); inks[4] = solid(tone(top))[4];
      const b = box(u, v, bw, bh, z1 * H, inks, traffic, z0 * H); if (!main && b) main = b;
    }
    if (T.bands && main?.front) for (const [x0, x1, z0, z1, k] of T.bands) {
      const [u, v, bw, bh] = span(x0, x1, -.004), c = [[u, v], [u + bw, v], [u + bw, v + bh], [u, v + bh]], faces = [cv < v, cu > u + bw, cv > v + bh, cu < u];
      ctx.globalAlpha = alpha * traffic; ctx.fillStyle = tone(k);
      for (let f = 0; f < 4; f++) if (faces[f]) { const g = (f + 1) % 4, q = [at(...c[f], z0 * H), at(...c[g], z0 * H), at(...c[g], z1 * H), at(...c[f], z1 * H)]; if (q.some(p => p[2] < NEAR)) continue; ctx.beginPath(); q.map(scr).forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); }
    }
    pick = null;
    // Rear lights, bright when waiting at the light.
    const [u, v, bw, bh] = span(0, 1, 0), corners = [[u, v], [u + bw, v], [u + bw, v + bh], [u, v + bh]], back = along ? (d > 0 ? 0 : 2) : (d > 0 ? 3 : 1), faces = [cv < v, cu > u + bw, cv > v + bh, cu < u];
    if (faces[back] && main?.front) {
      const A = corners[back], B = corners[(back + 1) % 4], r = Math.max(.8, .12 * F / Math.max(NEAR, main.base[back][2]));
      ctx.fillStyle = t.stopped ? '#ff3b30' : '#a8302a';
      for (const s of [.12, .88]) { const p = at(A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s, H * .3); if (p[2] < NEAR) continue; const [x, y] = scr(p); ctx.globalAlpha = alpha * traffic; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); if (t.stopped) { ctx.globalAlpha = alpha * traffic * .25; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, TAU); ctx.fill(); } }
    }
    if (t.label) label(at(t.u, t.v, H * 1.05), t.label, ease(Math.log(L * 9 / W) / Math.log(2.2)) * traffic);
  }

  // Street furniture: boxes for the solid things, round poles and lit globes for the rest.
  function pole(u, v, z0, z1, r, ink, a = 1) {
    const p = at(u, v, z0), q = at(u, v, z1); if (p[2] < NEAR && q[2] < NEAR) return null;
    const k = F / Math.max(NEAR, Math.min(p[2], q[2]));
    ctx.globalAlpha = alpha * near * a; ctx.strokeStyle = ink; ctx.lineWidth = Math.max(.6, 2 * r * k); ctx.lineCap = 'round'; ctx.beginPath(); segment(p, q); ctx.stroke();
    return p[2] > NEAR && q[2] > NEAR ? [scr(p), scr(q)] : null;
  }
  function ball(u, v, z, r, ink, a = 1, flat = 1) {
    const p = at(u, v, z); if (p[2] < NEAR) return null;
    const [x, y] = scr(p), R = r * F / p[2]; if (R < .5 || x < -R || x > w + R || y < -R || y > h + R) return null;
    const g = ctx.createRadialGradient(x - R * .35, y - R * .35, R * .05, x, y, R); g.addColorStop(0, mixInk(ink, '#ffffff', .25)); g.addColorStop(.6, ink); g.addColorStop(1, mixInk(ink, '#000000', .45));
    ctx.globalAlpha = alpha * near * a; ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, R, R * flat, 0, 0, TAU); ctx.fill();
    return [x, y, R];
  }
  function lit(u, v, z, r, ink, a = 1) {
    const p = at(u, v, z); if (p[2] < NEAR) return;
    const [x, y] = scr(p), R = Math.max(1, r * F / p[2]);
    ctx.globalAlpha = alpha * near * a; ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(x, y, 0, x, y, R * 5); g.addColorStop(0, ink + '70'); g.addColorStop(1, ink + '00'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R * 5, 0, TAU); ctx.fill();
  }
  function furniture(t) {
    const { what, u, v } = t, base = at(u, v, 0); if (base[2] < NEAR * 2) return;
    const k = F / base[2]; if (k < 1.2) return;
    pick = mark(FURNITURE_NAMES[what]);
    const s = u > 0 ? 1 : -1;                                                     // the side of the avenue; toward the road is -s
    if (what === 'lamp') { pole(u, v, 0, 8.6, .09, '#3a4842'); pole(u, v, 8.5, 8.5, .05, '#3a4842'); const p = at(u, v, 8.6), q = at(u - s * 1.6, v, 8.55); ctx.lineWidth = Math.max(.6, .1 * k); ctx.beginPath(); segment(p, q); ctx.stroke(); lit(u - s * 1.6, v, 8.4, .18, '#ffd59a', .95); }
    else if (what === 'tree') { const h = 5 + t.k * .28, cr = 1.6 + t.k * .08; pole(u, v, 0, h * .45, .03 + t.k * .004, '#3b2e22'); for (const [du, dv, dz, f] of [[0, 0, .72, 1], [.6, .3, .62, .7], [-.5, .4, .66, .72], [.2, -.6, .82, .62]]) ball(u + du * cr * .6, v + dv * cr * .6, h * dz, cr * f, '#2f5f3a', .92); }
    else if (what === 'hydrant') { box(u - .11, v - .11, .22, .22, .62, solid('#b8362c'), near); ball(u, v, .66, .13, '#c94236'); pole(u - .2, v, .48, .48, .05, '#b8362c'); }
    else if (what === 'kiosk') { box(u - .15, v - .43, .3, .86, 2.9, solid('#1c2622'), near); const p = at(u - s * .16, v, 1.65); if (p[2] > NEAR) { const S1 = scr(at(u - s * .16, v - .36, .95)), S2 = scr(at(u - s * .16, v + .36, 2.35)); ctx.globalAlpha = alpha * near * .9; ctx.fillStyle = '#7fd0ff'; ctx.fillRect(Math.min(S1[0], S2[0]), Math.min(S1[1], S2[1]), Math.abs(S2[0] - S1[0]) + 1, Math.abs(S2[1] - S1[1])); } }
    else if (what === 'bench') { box(u - .24, v - .9, .48, 1.8, .47, METAL, near); box(u + s * .2, v - .9, .06, 1.8, .86, METAL, near); }
    else if (what === 'signal') {
      pole(u, v, 0, 3.4, .07, '#3a4842'); box(u - .17, v - .17, .34, .34, 4.3, solid('#2c2b20'), near, 3.3);
      const red = (time % 60) < 40, face = v > 0 ? -1 : 1;                       // the avenue waits; the cross street goes
      for (const [z, ink, on] of [[4.05, '#ff3b30', red], [3.8, '#ffcc33', false], [3.55, '#3dff8a', !red]]) lit(u, v + face * .18, z, .08, on ? ink : '#2a2a22', on ? 1 : .8);
    }
    else if (what === 'newsstand') { box(u - .72, v - 1.7, 1.44, 3.4, 2.45, solid('#2e5a44'), near); box(u - .9, v - 1.85, 1.8, 3.7, 2.58, METAL, near, 2.45); }
    else if (what === 'cart') { box(u - .45, v - .8, .9, 1.6, .95, solid('#c8ccc6'), near, .25); pole(u, v, .95, 2.2, .03, '#555'); ball(u, v, 2.25, 1.1, (Math.floor(time) % 2 ? '#e8b31d' : '#d9472f'), .95, .38); ball(u - .3, v + .7, .25, .25, '#1a1a1a'); }
    else if (what === 'shelter') { for (const [du, dv] of [[-.7, -2.6], [.7, -2.6], [-.7, 2.6], [.7, 2.6]]) pole(u + du, v + dv, 0, 2.55, .04, '#3a4842'); box(u - .82, v - 2.7, 1.64, 5.4, 2.68, METAL, near, 2.55); box(u + s * .7, v - 2.6, .04, 5.2, 2.4, solid('#6f9fb0', .4).map(c => c), near * .45, .15); }
    else if (what === 'subway') { for (const dv of [-3, -1.5, 0, 1.5, 3]) for (const du of [-.85, .85]) pole(u + du, v + dv, 0, 1.05, .025, '#2e5a44'); for (const du of [-.85, .85]) pole(u + du, v, 1.05, 1.05, .03, '#2e5a44'); for (const du of [-.95, .95]) { pole(u + du, v - 3.1, 0, 2.15, .04, '#2e5a44'); lit(u + du, v - 3.1, 2.3, .17, '#5dfc9b'); } }
    else if (what === 'bikes') { box(u - 9, v - .22, 18, .44, .05, METAL, near); box(u - 9.3, v - .25, .25, .5, 1.9, solid('#2a7ac0'), near); for (let n = 0; n < 22; n++) { const du = -8.4 + n * .78; pole(u + du, v, .05, .8, .05, '#55605a'); if (hash(n, 4) < .6) { ball(u + du, v + .35, .33, .33, '#1a1d1c', .9); ball(u + du, v + 1.45, .33, .33, '#1a1d1c', .9); pole(u + du, v + .45, .4, 1.0, .03, '#2a7ac0'); pole(u + du, v + 1.2, .4, .95, .03, '#2a7ac0'); } } }
    pick = null;
    // A box round it on screen, for pressing it.
    const foot = scr(base), head = scr(at(u, v, what === 'lamp' ? 8.6 : what === 'tree' ? 9 : what === 'signal' ? 4.3 : 2.4)), r = Math.max(6, 1.2 * k);
    objects.push([Math.min(foot[0], head[0]) - r, Math.min(foot[1], head[1]) - r, Math.max(foot[0], head[0]) + r, Math.max(foot[1], head[1]) + r, FURNITURE_NAMES[what]]);
  }

  // A puppy about 30 cm tall at the shoulder, on a leash: drawn from points in the street, so he
  // is the right size and in the right place however the camera leans.
  function dog(t) {
    const way = t.way, P = (du, dv, z) => at(t.u + way * du, t.v + dv, z), feet = P(0, 0, 0);
    if (feet[2] < NEAR * 2) return;
    const k = F / feet[2]; if (k * .3 < 2) return;
    const S = p => scr(p), wagA = Math.sin(time * 14) * .14, trot = Math.sin(time * 9) * .04;
    ctx.save(); ctx.globalAlpha = alpha * detail; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // The leash, sagging from the person's hand to his collar.
    const hand = S(at(t.hand[0], t.hand[1], .85)), collar = S(P(.2, 0, .34)), sag = S(at((t.hand[0] + t.u + way * .2) / 2, (t.hand[1] + t.v) / 2, .35));
    ctx.strokeStyle = '#e0473c'; ctx.lineWidth = Math.max(.6, .015 * k); ctx.beginPath(); ctx.moveTo(...hand); ctx.quadraticCurveTo(sag[0], sag[1], ...collar); ctx.stroke();
    // Legs, trotting.
    ctx.strokeStyle = '#f2ece0'; ctx.lineWidth = Math.max(1, .05 * k);
    for (const [du, dv, ph] of [[.14, -.06, 0], [.14, .06, Math.PI], [-.15, -.06, Math.PI], [-.15, .06, 0]]) { const top = S(P(du, dv, .2)), foot = S(P(du + Math.sin(time * 9 + ph) * .05, dv, 0)); ctx.beginPath(); ctx.moveTo(...top); ctx.lineTo(...foot); ctx.stroke(); }
    // Tail, wagging side to side.
    const tb = S(P(-.22, 0, .3)), tt = S(P(-.32, wagA * way, .42));
    ctx.strokeStyle = '#1e1a17'; ctx.lineWidth = Math.max(1, .04 * k); ctx.beginPath(); ctx.moveTo(...tb); ctx.lineTo(...tt); ctx.stroke(); ctx.fillStyle = '#f2ece0'; ctx.beginPath(); ctx.arc(tt[0], tt[1], Math.max(.8, .025 * k), 0, TAU); ctx.fill();
    // Body: a capsule from rump to chest.
    const rump = S(P(-.17, 0, .27 + trot)), chest = S(P(.16, 0, .28 + trot));
    ctx.strokeStyle = '#c98a4a'; ctx.lineWidth = Math.max(2, .17 * k); ctx.beginPath(); ctx.moveTo(...rump); ctx.lineTo(...chest); ctx.stroke();
    // The beagle's black saddle along his back.
    const s0 = S(P(-.15, 0, .3 + trot)), s1 = S(P(.08, 0, .31 + trot)); ctx.strokeStyle = '#1e1a17'; ctx.lineWidth = Math.max(1.5, .11 * k); ctx.beginPath(); ctx.moveTo(...s0); ctx.lineTo(...s1); ctx.stroke();
    ctx.strokeStyle = '#f2ece0'; ctx.lineWidth = Math.max(1, .08 * k); ctx.beginPath(); const c1 = S(P(.12, 0, .24 + trot)), c2 = S(P(.19, 0, .29 + trot)); ctx.moveTo(...c1); ctx.lineTo(...c2); ctx.stroke();
    // Collar, head, ear, snout, nose, eye.
    const head = S(P(.27, 0, .4 + trot)), snout = S(P(.37, 0, .37 + trot)), ear = S(P(.24, way > 0 ? -.05 : .05, .4 + trot)), eye = S(P(.31, way > 0 ? -.05 : .05, .43 + trot));
    const dot = (p, r, ink) => { ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(.6, r * k), 0, TAU); ctx.fill(); };
    ctx.strokeStyle = '#e0473c'; ctx.lineWidth = Math.max(1, .03 * k); ctx.beginPath(); ctx.moveTo(...S(P(.2, 0, .28 + trot))); ctx.lineTo(...S(P(.22, 0, .38 + trot))); ctx.stroke();
    dot(head, .085, '#c98a4a'); dot(snout, .05, '#f2ece0'); dot(S(P(.415, 0, .37 + trot)), .018, '#2a1d17');
    ctx.fillStyle = '#7a4a26'; ctx.beginPath(); ctx.ellipse(ear[0], ear[1] + .05 * k, Math.max(.6, .035 * k), Math.max(.9, .085 * k), 0, 0, TAU); ctx.fill();
    dot(eye, .012, '#1d1410');
    // Barking.
    if (bark > .02 && k * .3 > 10 && !quiet) {
      ctx.globalAlpha = alpha * detail * bark; ctx.font = `700 ${Math.round(Math.min(14, 6 + k * .02))}px ui-monospace, Consolas, monospace`; ctx.fillStyle = '#fbf6ea'; ctx.textAlign = 'center';
      ctx.fillText('WOOF', snout[0] + way * .25 * k, snout[1] - .2 * k);
    }
    ctx.restore();
    found.puppy = [head[0], head[1], .3 * k];
    objects.push([Math.min(rump[0], snout[0]) - .1 * k, head[1] - .1 * k, Math.max(rump[0], snout[0]) + .1 * k, S(P(0, 0, 0))[1], 'Beagle puppy']);
    label(P(0, 0, .5), 'Beagle puppy · about 28 cm tall', below(W, 5, 12) * detail);
  }

  function person(t) {
    const feet = at(t.u, t.v, 0); if (feet[2] < NEAR * 2) return;
    const k = F / feet[2]; if (k * 1.7 < 1.2) return;
    const q = t.tall || 1, P = z => scr(at(t.u, t.v, z * q)), [fx, fy] = P(0), [hx, hy] = P(.9), [sx, sy] = P(1.45), [nx, ny] = P(1.62);
    if (fx < -20 || fx > w + 20 || ny > h + 20 || fy < -20) return;
    const step = t.walking ? Math.sin(time * 6 + t.phase) * .16 * k : 0;
    ctx.globalAlpha = alpha * detail; ctx.lineCap = 'round';
    ctx.strokeStyle = '#1d1f24'; ctx.lineWidth = Math.max(.8, .14 * k); ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(fx - step, fy); ctx.moveTo(hx, hy); ctx.lineTo(fx + step, fy); ctx.stroke();
    ctx.strokeStyle = t.coat; ctx.lineWidth = Math.max(1, .42 * k); ctx.beginPath(); ctx.moveTo(hx, hy - .05 * k); ctx.lineTo(sx, sy); ctx.stroke();
    ctx.fillStyle = '#c99c7a'; ctx.beginPath(); ctx.arc(nx, ny, Math.max(.6, .11 * k), 0, TAU); ctx.fill();
    if (k * 1.7 > 30) { ctx.fillStyle = '#2a2118'; ctx.beginPath(); ctx.arc(nx, ny - .03 * k, .1 * k, Math.PI, TAU); ctx.fill(); }
    objects.push([Math.min(fx, nx) - .2 * k, ny - .15 * k, Math.max(fx, nx) + .2 * k, fy, t.label ? 'Average American man' : 'Pedestrian']);
    if (t.label) label(at(t.u, t.v, 1.78), t.label, below(W, 9, 20) * detail);
  }

  // Names.
  const names = below(W, 1.2e5, 2.2e5) * (1 - below(W, 9e3, 1.8e4));
  if (names > .01) {
    ctx.save(); ctx.font = '10px ui-monospace, Consolas, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#d9efd7'; if ('letterSpacing' in ctx) ctx.letterSpacing = '1.4px';
    BOROUGHS.forEach((b, i) => { const p = view(CENTRES[i][0], CENTRES[i][1], 0); if (p[2] > NEAR) { ctx.globalAlpha = alpha * names * .9; put(ctx, b.name.toUpperCase(), ...scr(p), 'center'); } });
    ctx.restore();
  }
  // Places, counties and landmarks.
  const band = (from, to) => (1 - below(W, from / 1.6, from)) * below(W, to, to * 1.6);
  if (region > .01) {
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ink = { state: '#e6f1e2', land: '#cfe6c9', water: '#8fb8e6', city: '#d9efd7' };
    for (const [text, lat, lon, from, to, kind] of PLACES) {
      const a = band(from, to) * region; if (a < .02) continue;
      const p = view(...fromLonLat(lat, lon), 0); if (p[2] < NEAR) continue;
      const [x, y] = scr(p); if (x < -80 || x > w + 80 || y < -20 || y > h + 20) continue;
      ctx.globalAlpha = alpha * a * (kind === 'state' ? .9 : .8); ctx.fillStyle = ink[kind];
      ctx.font = kind === 'state' ? '600 11px ui-monospace, Consolas, monospace' : kind === 'water' ? 'italic 11px Georgia, serif' : '10px ui-monospace, Consolas, monospace';
      if ('letterSpacing' in ctx) ctx.letterSpacing = kind === 'state' ? '3px' : kind === 'water' ? '.5px' : '1.2px';
      if (kind === 'city') { ctx.textAlign = 'left'; if (put(ctx, text.toUpperCase(), x + 7, y, 'left', 9)) { ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill(); } ctx.textAlign = 'center'; }
      else put(ctx, kind === 'water' ? text : text.toUpperCase(), x, y, 'center');
    }
    // The counties Brandon works in, named outside New York City (whose boroughs are named already).
    const names = band(3e4, 5e5) * region;
    if (names > .02) {
      ctx.font = '600 9px ui-monospace, Consolas, monospace'; if ('letterSpacing' in ctx) ctx.letterSpacing = '1.6px'; ctx.fillStyle = '#e8ffc0';
      for (const c of COUNTIES) { if (!c.work || ['Kings County', 'Queens County', 'Bronx County', 'Richmond County', 'New York County'].includes(c.name)) continue; const p = view(c.centre[0], c.centre[1], 0); if (p[2] < NEAR) continue; ctx.globalAlpha = alpha * names * .9; put(ctx, c.name.replace(' County', '').toUpperCase(), ...scr(p), 'center'); }
    }
    ctx.restore();
    // The key.
    const key = region * ease((W - 2e4) / 2e4);
    if (key > .02 && !quiet) { ctx.save(); ctx.globalAlpha = alpha * key; ctx.fillStyle = '#c4fa7940'; ctx.strokeStyle = '#c4fa79'; ctx.fillRect(16, h - 48, 12, 12); ctx.strokeRect(16.5, h - 47.5, 11, 11); ctx.font = '10px ui-monospace, Consolas, monospace'; if ('letterSpacing' in ctx) ctx.letterSpacing = '1.2px'; ctx.fillStyle = '#e8ffc0'; ctx.textBaseline = 'middle'; ctx.fillText('COUNTIES I WORK IN', 36, h - 42); ctx.restore(); }
  }
  for (const L of LANDMARKS) {
    const a = band(L.from, L.to); if (a < .02) continue;
    const top = view(L.e, L.n, L.tall && W < 6e3 ? L.tall : 0); if (top[2] < NEAR) continue;
    const [x, y] = scr(top); if (x < -40 || x > w + 40 || y < -40 || y > h + 40) continue;
    ctx.save(); ctx.globalAlpha = alpha * a; ctx.strokeStyle = '#c4fa79'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, TAU); ctx.stroke(); ctx.restore();
    objects.push([x - 9, y - 9, x + 9, y + 9, L.name]);
    labels.push([x, y, L.name, a]);
  }
  if (ship > .01) {
    // Her masts and their stays, and her name.
    ctx.save(); ctx.globalAlpha = alpha * ship * .9; ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 1; ctx.beginPath();
    for (const [m, z0, z1] of SHIP.masts) { segment(at(0, SHIP.v0 + m, z0), at(0, SHIP.v0 + m, z1)); }
    segment(at(0, SHIP.v0 + 36, 62), at(0, SHIP.v0 + 228, 60)); segment(at(0, SHIP.v0 + 36, 62), at(0, SHIP.v0 + 2, 22.6));
    ctx.stroke(); ctx.restore();
    label(at(0, SHIP.v0 + 60, 34), w < 600 ? 'Titanic · 269 m long, for scale' : 'Titanic · 269 m long, set down on Seventh Avenue for scale', ship);
  }
  label(at(0, 0, 0), 'Times Square', below(W, 2600, 5200) * (1 - below(W, 140, 300)));
  label(at(140, 3160, 0), 'Central Park · 4 km long', below(W, 3.2e4, 6e4) * (1 - below(W, 2600, 5200)));
  const dot = (1 - below(W, 2e5, 4e5)) * below(W, 6e6, 1.2e7);
  if (dot > .01) { const [x, y] = scr(at(0, 0, 0)); ctx.globalAlpha = alpha * dot; ctx.fillStyle = '#c4fa79'; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fill(); label(at(0, 0, 0), 'New York City', dot); }
  ctx.restore();
  if (!quiet) for (const l of labels) tag(ctx, l[0], l[1], l[2], l[3] * alpha, w);
  // What is under a point of the frame: a drawn object, else the county or state on the ground.
  found.pick = (x, y) => {
    for (let i = objects.length - 1; i >= 0; i--) { const o = objects[i]; if (x >= o[0] && x <= o[2] && y >= o[1] && y <= o[3]) return o[4]; }
    if (fall(x, y) <= 0) return null;
    const [e, n] = hit(x, y);
    if (W > 8e3) { for (const c of COUNTIES) if (within(c.rings, e, n)) return c.name + ', ' + c.state; for (const st of STATES) if (within(st.rings, e, n)) return st.name; }
    return null;
  };
  return found;
}
