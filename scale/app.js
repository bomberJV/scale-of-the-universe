// One frame, from the quarks in a proton to the edge of the observable universe. The frame's
// width picks the scene: the small things (the zoom shared with red's homepage, /home/red/sizes.js,
// drawn by small.js), New York and the globe (earth.js), the homepage's
// pull back from the Earth to the Milky Way (cosmicZoom), then the galaxies beyond (far.js).
import { globe, below } from "./earth.js";
import { city as street } from "./city.js";
import { sound } from "./sound.js";
import { NOTES, STOP_NOTES, noteFor } from "./notes.js";
import { air } from "./small.js";
import { waves, waveNote, waveRoom } from "./waves.js";
import { giants } from "./giants.js";
// The shared zoom's words keep clear of this frame's edges; it has no header or rail over it.
redInk.links(t => { const n = waveNote(t) || noteFor(t, cosmicZoom.galaxies || []); return !!(n && n.body); });
redSizes.layout({ chrome: 0 }); redInk.fit(58, 36);                 // resize() makes room for the waves along the bottom
import * as far from "./far.js";

const Z = cosmicZoom, AU = 1.495978707e11, LY = far.LY, EARTH = 6.378137e6, PLANCK = 1.616255e-35;
// The pull back draws the Earth through this; here the Earth is always this page's globe.
globalThis.worldAtlas = { fold(ctx, w, h, { x, y, r }) { globe(ctx, w, h, x, y, r, 1, V); } };

const $ = s => document.querySelector(s);
const canvas = $("#view"), ctx = canvas.getContext("2d"), slider = $("#scale"), play = $("#play");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// The visitor's turn of the scene: a rotation in the frame's own axes (x right, y down, z away),
// applied about the middle of the frame (about the Milky Way, past it).
let R = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], V = R, turnedView = false;
const times = (A, B) => A.map(row => [0, 1, 2].map(j => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));
function turnBy(dx, dy) {
  if (city(10 ** lw) > .5) { lean = clamp(leanAt(10 ** lw) + dy * .005, .15, 1.42); setTurned(true); return; }
  const a = dx * .008, b = dy * .008, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  // Near things follow the pointer: about the frame's vertical axis, then its horizontal one.
  R = times([[1, 0, 0], [0, cb, -sb], [0, sb, cb]], times([[ca, 0, -sa], [0, 1, 0], [sa, 0, ca]], R));
  // Keep it a rotation: rebuild the axes at right angles.
  const n = v => { const l = Math.hypot(...v); return v.map(c => c / l); }, x = n(R[0]), d = x[0] * R[1][0] + x[1] * R[1][1] + x[2] * R[1][2], y = n(R[1].map((c, i) => c - d * x[i]));
  R = [x, y, [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]]];
  limit(10 ** lw); setTurned(true); dirty = true;
}
function setTurned(on) { turnedView = on; $("#level").hidden = !on; if (!on) { R = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; lean = LEAN; } dirty = true; }
// Over the city the camera is locked: it looks up the avenue, so every building's height runs
// straight up the frame beside the street and none can come between the camera and the crossing.
// A drag there only leans it back or forward. Above the city and among the atoms it turns freely.
const GRID = 29 * Math.PI / 180, LEAN = 58 * Math.PI / 180;
let lean = LEAN;
const city = W => below(W, 3e3, 3e4) * (1 - below(W, .2, 1.5));
// Close in, the camera is lower than Midtown's roofs, so it may not look too steeply down: it
// would sit among the towers. Above about 900 m it is over every roof and can look straight down.
const leanAt = W => Math.max(lean, .15 + .67 * below(W, 350, 900));
function cityPose(W = 10 ** lw) {
  // Below a few metres the camera comes down to eye level and looks up the avenue, so the towers
  // stay in view, out of focus, behind the small things.
  const eye = below(W, 1.2, 9), l = leanAt(W) * (1 - eye) + 1.36 * eye, c = Math.cos(l), s = Math.sin(l), g = -GRID;
  return times([[1, 0, 0], [0, c, s], [0, -s, c]], [[Math.cos(g), -Math.sin(g), 0], [Math.sin(g), Math.cos(g), 0], [0, 0, 1]]);
}
// Rotations as quaternions, to blend the visitor's turn into the locked view.
function quat(m) {
  const t = m[0][0] + m[1][1] + m[2][2];
  let q;
  if (t > 0) { const s = Math.sqrt(t + 1) * 2; q = [.25 * s, (m[2][1] - m[1][2]) / s, (m[0][2] - m[2][0]) / s, (m[1][0] - m[0][1]) / s]; }
  else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) { const s = Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2; q = [(m[2][1] - m[1][2]) / s, .25 * s, (m[0][1] + m[1][0]) / s, (m[0][2] + m[2][0]) / s]; }
  else if (m[1][1] > m[2][2]) { const s = Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2; q = [(m[0][2] - m[2][0]) / s, (m[0][1] + m[1][0]) / s, .25 * s, (m[1][2] + m[2][1]) / s]; }
  else { const s = Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2; q = [(m[1][0] - m[0][1]) / s, (m[0][2] + m[2][0]) / s, (m[1][2] + m[2][1]) / s, .25 * s]; }
  return q;
}
function matrix([w, x, y, z]) {
  return [[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]];
}
function blend(A, B, k) {
  if (k <= 0) return A; if (k >= 1) return B;
  const a = quat(A), b = quat(B); let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  if (d < 0) { b.forEach((v, i) => b[i] = -v); d = -d; }
  const t = Math.acos(Math.min(1, d)), s = Math.sin(t), wa = s < 1e-5 ? 1 - k : Math.sin((1 - k) * t) / s, wb = s < 1e-5 ? k : Math.sin(k * t) / s;
  const q = a.map((v, i) => v * wa + b[i] * wb), n = Math.hypot(...q);
  return matrix(q.map(v => v / n));
}
// Nobody goes through the Earth. From space and among the atoms the view turns any way round; while
// there is ground in the frame, the ground at Times Square never leans more than 74 degrees from
// the viewer. Zooming in on the far side of the globe turns New York to the front on the way down.
function limit(W) {
  const most = (Math.PI - (Math.PI - 1.29) * below(W, 1.2e6, 1.4e7) - (1.29 - .55) * below(W, 1e5, 6e5)) * (1 - below(W, .04, .6)) + Math.PI * below(W, .04, .6), tilt = Math.acos(clamp(R[2][2], -1, 1));
  if (tilt <= most) return;
  let ax = R[1][2], ay = -R[0][2]; const l = Math.hypot(ax, ay);
  if (l < 1e-6) { ax = 1; ay = 0; } else { ax /= l; ay /= l; }
  const d = tilt - most, c = Math.cos(d), n = Math.sin(d), t = 1 - c;
  R = times([[c + t * ax * ax, t * ax * ay, n * ay], [t * ax * ay, c + t * ay * ay, -n * ax], [-n * ay, n * ax, c]], R);
}
let w = 0, h = 0, range = null, lw = Math.log10(90), target = null, pace = 2, playing = false, dirty = true, last = 0, clock = 0, speed = 0, seenPuppy = null, honkIn = 6;

// Where the frame stops on the way: a name, the frame's width in metres, and what is in it.
// The small ones are the shared zoom's own stops (smallest first); their widths are set for the
// frame's shape in measure().
const SMALL = redSizes.STOPS.filter(s => s.title).reverse();
const STOPS = [
  ...SMALL.map(s => [s.title, null, s.note]), ["Cars", 22, "A yellow cab, a sedan, an SUV and a pickup, 4.6 to 5.9 m"],
  ["Trucks and buses", 55, "A van, box, garbage and tractor-trailer trucks, and buses, 6 to 18.5 m"], ["Times Square", 90, "Broadway at Seventh Avenue"], ["Titanic", 520, "269 m long, set down on Seventh Avenue for scale"], ["Midtown’s towers", 3200, "The Empire State Building, 443 m, and its tall neighbours"],
  ["Manhattan", 2.6e4, "The grid and Central Park"], ["New York", 7e4, "The five boroughs"], ["Earth", 3.2e7, "12,742 km across"],
  ["Moon", 1.3e9, "384,400 km away"], ["Giant stars", 3.2e12, "Betelgeuse and the largest star known, set where the Sun is"], ["Planets", 1.1e13, "Out to Neptune and Pluto"], ["Nearest stars", 3e17, "Within about 15 light-years"],
  ["Milky Way", null, "100,000 light-years across"], ["Local Group", 4.2e6 * LY, "Andromeda, 2.6 million light-years away"],
  ["Virgo Cluster", 1.3e8 * LY, "The nearest large cluster"], ["Laniakea", 1.5e9 * LY, "Our supercluster, 520 million light-years across"],
  ["Great walls", 4.2e9 * LY, "The CfA2 and Sloan Great Walls, and the Boötes Void"], ["Everything we can see", null, "93 billion light-years across"],
].map(([name, width, note]) => ({ name, width, note }));

const list = $("#stops");
STOPS.forEach((s, i) => {
  const li = document.createElement("li"), b = document.createElement("button");
  b.type = "button"; b.dataset.stop = s.name.toLowerCase().replace(/[^a-z]+/g, "-"); b.textContent = s.name;
  b.addEventListener("click", () => travel(Math.log10(STOPS[i].width)));
  li.append(b); list.prepend(li);
});

const two = n => Number(n.toPrecision(2)).toLocaleString("en-US");
function human(W) {
  const ly = W / LY;
  if (W < 1e-18) return two(W / 10 ** Math.floor(Math.log10(W))) + " × 10" + String(Math.floor(Math.log10(W))).replace("-", "⁻").replace(/\d/g, d => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]) + " metres";
  if (W < 1e-15) return two(W * 1e18) + " attometres";
  if (W < 1e-12) return two(W * 1e15) + " femtometres";
  if (W < 1e-9) return two(W * 1e12) + " picometres";
  if (W < 1e-6) return two(W * 1e9) + " nanometres";
  if (W < 1e-3) return two(W * 1e6) + " micrometres";
  if (W < 1e-2) return two(W * 1e3) + " millimetres";
  if (W < 1) return two(W * 100) + " centimetres";
  if (W < 1e3) return two(W) + " metres";
  if (W < 1e9) return two(W / 1e3) + " km";
  if (W < .05 * AU) return two(W / 1e9) + " million km";
  if (ly < .1) return two(W / AU) + " AU";
  if (ly < 1e6) return two(ly) + (two(ly) === "1" ? " light-year" : " light-years");
  if (ly < 1e9) return two(ly / 1e6) + " million light-years";
  return two(ly / 1e9) + " billion light-years";
}

// The pull back runs on its own measure, q. This is the frame's width at each q, to find q for a width.
function measure() {
  const table = new Float64Array(801);
  for (let i = 0; i <= 800; i++) table[i] = Math.log10(Z.span(w, h, i / 800) * AU);
  // The narrowest frame holds a sphere of one Planck length in radius, with room round it.
  range = { table, globe: table[0], galaxy: table[800], min: Math.log10(2 * PLANCK / .8 * Math.max(1, w / h)), max: Math.log10(far.widest(w, h) * LY) };
  STOPS.find(s => s.name === "Milky Way").width = 10 ** range.galaxy; STOPS[STOPS.length - 1].width = 10 ** range.max;
  // The shared zoom stops when the frame's shorter side is a stop's span.
  SMALL.forEach((s, i) => { STOPS[i].width = s.span * w / redSizes.short(w, h); });
  STOPS[0].width = Math.max(STOPS[0].width, 10 ** range.min);
  slider.min = 0; slider.max = 1000;
}
function qFor(l) {
  const t = range.table; let a = 0, b = 800;
  while (b - a > 1) { const m = (a + b) >> 1; if (t[m] < l) a = m; else b = m; }
  return (a + (t[b] > t[a] ? (l - t[a]) / (t[b] - t[a]) : 0)) / 800;
}

// Every piece of text drawn in the frame is kept with where it is, so pressing it can open its note.
let texts = [];
{
  const fill = ctx.fillText.bind(ctx);
  ctx.fillText = (t, x, y, most) => {
    if (ctx.globalAlpha > .25) {
      const m = ctx.getTransform(), dpr = canvas.width / w || 1, size = parseFloat(/(\d+(?:\.\d+)?)px/.exec(ctx.font)?.[1] || 10), tw = ctx.measureText(t).width;
      const a = ctx.textAlign, b = ctx.textBaseline, x0 = a === "center" ? x - tw / 2 : a === "right" || a === "end" ? x - tw : x;
      const y0 = b === "middle" ? y - size / 2 : b === "top" || b === "hanging" ? y : b === "bottom" ? y - size : y - size * .8;
      const pts = [[x0, y0], [x0 + tw, y0], [x0, y0 + size], [x0 + tw, y0 + size]].map(([px, py]) => [(m.a * px + m.c * py + m.e) / dpr, (m.b * px + m.d * py + m.f) / dpr]);
      texts.push({ t: String(t), x0: Math.min(...pts.map(p => p[0])), x1: Math.max(...pts.map(p => p[0])), y0: Math.min(...pts.map(p => p[1])), y1: Math.max(...pts.map(p => p[1])) });
    }
    return most === undefined ? fill(t, x, y) : fill(t, x, y, most);
  };
}
// The text at a point: the whole name for either line of one written on two (red/ink.js).
function textAt(x, y) {
  for (let i = texts.length - 1; i >= 0; i--) { const r = texts[i]; if (x > r.x0 - 6 && x < r.x1 + 6 && y > r.y0 - 6 && y < r.y1 + 6) return redInk.whole(r.t); }
  return null;
}

function draw() {
  const W = 10 ** lw;
  texts = []; redInk.begin(); redInk.take(0, 0, 220, 86);       // names keep off the frame-width readout
  limit(W); V = blend(R, cityPose(), city(W));
  // Each scene leaves the context as it found it; the frame always starts opaque.
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = "#0c1512"; ctx.fillRect(0, 0, w, h);
  ctx.save();
  seenPuppy = null; cityFound = null;
  if (lw < range.globe) {
    // Water round the city, down to where the frame is all street.
    const water = 1 - below(W, 40, 400);
    if (water > .01) { ctx.globalAlpha = water; ctx.fillStyle = "#0a1826"; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
    const earth = 1 - below(W, 6e4, 3e5);
    if (earth > .01) {
      // Close in, the globe turns about Times Square, which stays in the middle of the frame; far out, about its own centre.
      const r = EARTH / W * w, pin = below(W, 1.2e6, 1.4e7);
      ctx.save(); ctx.globalAlpha = earth; studioScenes.field(ctx, w, h, "#10121c"); ctx.restore(); globe(ctx, w, h, w / 2 + pin * r * V[0][2], h / 2 + pin * r * V[1][2], r, earth, V);
    }
    // The street stays behind the small things, going out of focus the way it would behind a
    // macro lens, until it fades between a hair's width and a virus's.
    const locked = below(W, 3e3, 3e4), Vc = blend(R, cityPose(), locked);
    if (W >= 2) { cityFound = street(ctx, w, h, W, clock, 1, Vc, locked, barking()); seenPuppy = cityFound.puppy; }
    else {
      const keep = 1 - below(W, 5e-6, 2e-3);
      if (keep > .01) {
        const soft = clamp(Math.log10(2 / W) * 4.5, 0, 14), s = clamp(1 / (1 + soft / 4), .3, 1), ow = Math.max(1, Math.round(w * s)), oh = Math.max(1, Math.round(h * s));
        back ??= document.createElement("canvas"); if (back.width !== ow || back.height !== oh) { back.width = ow; back.height = oh; }
        const b = back.getContext("2d"); b.setTransform(s, 0, 0, s, 0, 0); b.globalAlpha = 1; b.fillStyle = "#0c1512"; b.fillRect(0, 0, w, h);
        const seen = street(b, w, h, W, clock, 1, Vc, locked, barking(), soft > 2).puppy;
        seenPuppy = soft > 2 ? null : seen;
        ctx.save(); ctx.globalAlpha = keep; if (soft > .5) ctx.filter = `blur(${(soft * s).toFixed(1)}px)`; ctx.drawImage(back, 0, 0, w, h); ctx.restore();
        // A veil, so what is in focus stands out.
        ctx.save(); ctx.globalAlpha = keep * clamp(soft / 14, 0, .45); ctx.fillStyle = "#0a120f"; ctx.fillRect(0, 0, w, h); ctx.restore();
      }
    }
    if (W < 8) { ctx.save(); air(ctx, w, h, W, clock, V); ctx.restore(); }
  } else if (lw <= range.galaxy) {
    studioScenes.field(ctx, w, h, "#10121c"); Z.beyond(0);
    Z.draw(ctx, w, h, 0, qFor(lw), null, 0, 1, 0, null, turnedView ? V : null);
    giants(ctx, w, h, W);
  } else far.draw(ctx, w, h, W / LY, V);
  ctx.restore();
  // A soft vignette, the same in every scene, and a shade behind the readout in the corner.
  if (!vignette || vignette.w !== w || vignette.h !== h) {
    const c = document.createElement("canvas"); c.width = Math.ceil(w); c.height = Math.ceil(h); const g = c.getContext("2d");
    const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .45, w / 2, h / 2, Math.hypot(w, h) * .62); v.addColorStop(0, "#00000000"); v.addColorStop(1, "#00000070");
    g.fillStyle = v; g.fillRect(0, 0, w, h);
    const corner = g.createRadialGradient(0, 0, 0, 0, 0, 260); corner.addColorStop(0, "#00000080"); corner.addColorStop(1, "#00000000"); g.fillStyle = corner; g.fillRect(0, 0, 260, 200);
    vignette = { w, h, c };
  }
  ctx.drawImage(vignette.c, 0, 0, w, h);
  // The wavelengths that fit this frame, along its lower edge.
  wavesMove = waves(ctx, w, h, W, reduced ? 0 : clock);
  rule(W);
}
let vignette = null, back = null, cityFound = null, wavesMove = false;
// A ruler in the corner: a round length and how long it is at this width.
function rule(W) {
  const want = W * Math.min(.22, 150 / w), e = 10 ** Math.floor(Math.log10(want)), len = [5, 2, 1].map(m => m * e).find(m => m <= want * 1.0001), px = len / W * w, x = 16, y = h - 18;
  ctx.save(); ctx.strokeStyle = "#dfe8dc"; ctx.fillStyle = "#dfe8dc"; ctx.globalAlpha = .8; ctx.lineWidth = 1; ctx.beginPath();
  ctx.moveTo(x + .5, y - 5); ctx.lineTo(x + .5, y + .5); ctx.lineTo(x + px - .5, y + .5); ctx.lineTo(x + px - .5, y - 5); ctx.stroke();
  ctx.font = "10px ui-monospace, Consolas, monospace"; if ("letterSpacing" in ctx) ctx.letterSpacing = ".9px"; ctx.fillText(human(len).replace(/^1 (\w+)s$/, "1 $1").toUpperCase(), x + px + 8, y + 1); ctx.restore();
}

function readout() {
  const W = 10 ** lw;
  $("#width").textContent = human(W);
  $("#power").innerHTML = `10<sup>${lw.toFixed(1).replace("-", "−")}</sup> metres`;
  slider.value = Math.round((lw - range.min) / (range.max - range.min) * 1000);
  slider.setAttribute("aria-valuetext", human(W) + " across");
  let best = 0;
  STOPS.forEach((s, i) => { if (Math.abs(Math.log10(s.width) - lw) < Math.abs(Math.log10(STOPS[best].width) - lw)) best = i; });
  // The list runs from the largest stop down to the smallest.
  document.querySelectorAll("#stops button").forEach((b, i) => { if (STOPS.length - 1 - i === best) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
  if ($("#here").textContent !== STOPS[best].name) {
    if ($("#here").textContent) arrive(best);
    $("#here").textContent = STOPS[best].name; $("#here-note").textContent = STOPS[best].note;
    // On a narrow screen the stops are one scrolling row: keep the current one in view.
    const b = list.querySelector("[aria-current]");
    if (b && list.scrollWidth > list.clientWidth) list.scrollTo({ left: b.offsetLeft - (list.clientWidth - b.offsetWidth) / 2, behavior: reduced ? "auto" : "smooth" });
  }
}

// Passing a stop: a note; a howl at the Moon.
let howled = -60;
const now = () => performance.now() / 1000;
function arrive(i) {
  sound.chime(i, STOPS.length);
  const name = STOPS[i].name, t = now();
  if (name === "Moon" && t - howled > 30) { howled = t; setTimeout(() => sound.howl(), 250); return; }
  // The puppy barks only when pressed (or B): barks set off by passing stops and car horns came in
  // at odd moments (Brandon, 2026-11-21: "it comes in awkwardly").
}
function bark(kind = "woof") { lastBark = now(); sound.bark({ count: kind === "yip" ? 1 : 2, pitch: kind === "yip" ? 1.25 : 1 }); dirty = true; }
// How open the puppy's mouth is, for the half second after a bark.
let lastBark = -10;
const barking = () => Math.max(0, 1 - (now() - lastBark) / .5);

function set(l) { lw = clamp(l, range.min, range.max); dirty = true; }
function travel(l) { target = clamp(l, range.min, range.max); pace = Math.max(1.6, Math.abs(target - lw) / 3.2); setPlaying(false); if (reduced) { set(target); target = null; } }
function setPlaying(on) {
  playing = on; play.setAttribute("aria-pressed", String(on)); play.querySelector("span").textContent = on ? "Pause" : "Zoom out";
  if (on) { target = null; if (lw > range.max - .05) set(range.min); }
}

function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
  if (!reduced) clock += dt;
  if (target !== null) {
    const d = target - lw, step = clamp(d * (1 - Math.exp(-dt * 5)), -pace * dt, pace * dt);
    if (Math.abs(d) < .002) { set(target); target = null; } else set(lw + step);
  } else if (playing) { set(lw + .42 * dt); if (lw >= range.max) setPlaying(false); }
  const was = frame.lw ?? lw; speed += ((dt ? (lw - was) / dt : 0) - speed) * Math.min(1, dt * 8); frame.lw = lw;
  const W = 10 ** lw, cityNow = city(W) * (1 - below(W, 4, 30));
  sound.frame(lw);
  // A car horn over Times Square now and then; sometimes the puppy answers.
  if (cityNow > .3 && !reduced) { honkIn -= dt; if (honkIn < 0) { honkIn = 7 + Math.random() * 10; sound.honk(); } }
  // The street and the air move by themselves; past them the frame changes only when the width does.
  const moving = !reduced && !document.hidden && (lw < 3 || (wavesMove && lw < 4.6));
  if (w && range && (dirty || moving)) { draw(); if (dirty) readout(); dirty = redInk.settling(); }
  requestAnimationFrame(frame);
}

function resize() {
  const r = canvas.getBoundingClientRect(), dpr = Math.min(1.65, devicePixelRatio || 1);
  if (!r.width) return;
  w = r.width; h = r.height; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  redInk.fit(58, waveRoom(w).room);
  measure(); set(lw);
}

const soundButton = $("#sound");
function showSound() { soundButton.setAttribute("aria-pressed", String(sound.on)); soundButton.querySelector("span").textContent = sound.on ? "Sound on" : "Sound off"; }
soundButton.addEventListener("click", () => { sound.set(!sound.on); showSound(); if (sound.on) sound.pop(); });
showSound();
// Sound may start only after the visitor clicks, taps or presses a key.
// Phones need the sound to be unlocked inside a tap; try on every kind of press until it runs.
for (const type of ["pointerdown", "pointerup", "touchend", "click", "keydown"]) addEventListener(type, () => sound.wake(), { passive: true, capture: true });

// The side panel with a note.
const panel = $("#note");
let opener = null, noteShown = 0;
function openNote(note, label = "") {
  if (!note) return;
  const shown = ++noteShown, photo = $("#note-photo");
  if (typeof labelPhoto !== "undefined") labelPhoto.fill(photo, note, label, () => shown === noteShown && !panel.hidden); else photo.hidden = true;
  $("#note-kind").textContent = note.kind.toUpperCase();
  $("#note-title").textContent = note.title;
  const body = $("#note-body"); body.replaceChildren(...note.body.map(t => Object.assign(document.createElement("p"), { textContent: t })));
  const facts = $("#note-facts"); facts.replaceChildren(...note.facts.flatMap(([k, v]) => [Object.assign(document.createElement("dt"), { textContent: k }), Object.assign(document.createElement("dd"), { textContent: v })]));
  facts.hidden = !note.facts.length;
  const read = $("#note-read"), list = read.querySelector("ul");
  list.replaceChildren(...note.read.map(([text, href]) => { const li = document.createElement("li"), a = document.createElement("a"); a.href = href; a.textContent = text; a.rel = "noopener"; a.target = "_blank"; li.append(a); return li; }));
  read.hidden = !note.read.length;
  if (panel.hidden) opener = document.activeElement;
  panel.hidden = false; requestAnimationFrame(() => panel.classList.add("open"));
  panel.scrollTop = 0; $("#note-close").focus({ preventScroll: true }); sound.pop(1.3);
}
function closeNote() {
  panel.classList.remove("open"); setTimeout(() => { if (!panel.classList.contains("open")) panel.hidden = true; }, 220);
  (opener && opener.focus ? opener : canvas).focus({ preventScroll: true });
}
$("#note-close").addEventListener("click", closeNote);
addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) closeNote(); });
$("#here-more").addEventListener("click", () => { const key = STOP_NOTES[$("#here").textContent]; if (key) openNote({ key, ...NOTES[key] }); });

slider.addEventListener("input", () => { target = null; setPlaying(false); set(range.min + slider.value / 1000 * (range.max - range.min)); });
play.addEventListener("click", () => setPlaying(!playing));
canvas.addEventListener("wheel", e => { e.preventDefault(); target = null; setPlaying(false); set(lw + clamp(e.deltaY, -120, 120) * .0016); }, { passive: false });
canvas.addEventListener("keydown", e => {
  const turn = { a: [-24, 0], d: [24, 0], w: [0, -24], s: [0, 24] }[e.key];
  if (turn) { turnBy(...turn); e.preventDefault(); return; }
  if (e.key === "0") { setTurned(false); e.preventDefault(); return; }
  if ((e.key === "b" || e.key === "B") && seenPuppy) { bark(); e.preventDefault(); return; }
  const step = { ArrowUp: -.15, "+": -.15, "=": -.15, ArrowDown: .15, "-": .15, PageUp: -1, PageDown: 1 }[e.key];
  if (step) { target = null; setPlaying(false); set(lw + step); e.preventDefault(); }
  else if (e.key === "Home") { travel(range.min); e.preventDefault(); } else if (e.key === "End") { travel(range.max); e.preventDefault(); }
});
// A drag turns the scene; two fingers pinch the frame. A double click or "Level view" undoes the turn.
const touches = new Map(); let pinch = 0;
let pressAt = null;
canvas.addEventListener("pointerdown", e => {
  canvas.setPointerCapture(e.pointerId); touches.set(e.pointerId, [e.clientX, e.clientY]); pinch = 0;
  pressAt = touches.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
  // Pressing the puppy on the crosswalk makes him bark.
  if (seenPuppy) { const r = canvas.getBoundingClientRect(), [x, y, size] = seenPuppy; if (Math.hypot(e.clientX - r.left - x, e.clientY - r.top - y) < Math.max(14, size * .8)) bark(); }
});
canvas.addEventListener("pointermove", e => {
  const was = touches.get(e.pointerId); if (!was) return;
  touches.set(e.pointerId, [e.clientX, e.clientY]);
  if (touches.size === 1) { if (e.clientX !== was[0] || e.clientY !== was[1]) turnBy(e.clientX - was[0], e.clientY - was[1]); return; }
  if (touches.size !== 2) return;
  const [a, b] = [...touches.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
  if (pinch) { target = null; setPlaying(false); set(lw + Math.log10(pinch / d)); }
  pinch = d;
});
for (const type of ["pointerup", "pointercancel"]) canvas.addEventListener(type, e => {
  touches.delete(e.pointerId); pinch = 0;
  // A press that did not drag, on a name or a description, opens its note.
  if (type === "pointerup" && pressAt && Math.hypot(e.clientX - pressAt.x, e.clientY - pressAt.y) < 6 && performance.now() - pressAt.t < 600) {
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, hit = textAt(x, y) || (cityFound && cityFound.pick ? cityFound.pick(x, y) : null);
    if (hit) openNote(waveNote(hit) || noteFor(hit, cosmicZoom.galaxies || []), hit);
  }
  pressAt = null;
});
canvas.addEventListener("pointermove", e => {
  if (e.pointerType !== "mouse" || e.buttons) return;
  const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, hit = textAt(x, y) || (cityFound && cityFound.pick ? cityFound.pick(x, y) : null);
  canvas.style.cursor = hit && (waveNote(hit) || noteFor(hit)) ? "pointer" : "";
});
canvas.addEventListener("dblclick", () => setTurned(false));
$("#level").addEventListener("click", () => setTurned(false));

Z.onFrame(() => { dirty = true; });
if (typeof pageTheme !== "undefined") pageTheme.onChange(() => { dirty = true; });
new ResizeObserver(resize).observe(canvas);
requestAnimationFrame(frame);
