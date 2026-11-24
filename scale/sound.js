// Sounds for the scale page, all made in the browser with Web Audio: nothing is downloaded.
// Each scene has its own soundscape, faded in and out by the frame's width: shimmering harmonics
// near the Planck length, thin air where nothing has been measured, a buzz among the quarks, a deep thrum in the
// nucleus, bubbling among the atoms, slow wet bubbles among the microbes, a bee, the street,
// wind over the city, a drone in space, a soft chord among the stars and a deep hum at the edge.
// Over them: a note for each stop passed, the puppy's barks, a howl at the Moon and car horns.
// All of it is invented to suit the scene; none of it is a recording of anything. Browsers let
// sound start only after a click, tap or key, so the engine waits for one. The visitor's choice is
// remembered on this device.
const KEY = "scale-sound";
let ac = null, master = null, bed = null, noise = null, layers = [], lastT = 0;
let on = true;
try { on = localStorage.getItem(KEY) !== "off"; } catch { /* storage may be blocked */ }

const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
// 1 between `from` and `to` (log10 metres), easing to 0 over `edge` decades either side.
const band = (lw, from, to, edge = .7) => smooth((lw - from + edge) / edge) * smooth((to + edge - lw) / edge);

function buffer() {
  if (noise) return noise;
  noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}
function noiseSource() { const s = ac.createBufferSource(); s.buffer = buffer(); s.loop = true; s.start(0, Math.random() * 2); return s; }
function osc(type, f, detune = 0) { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune; o.start(); return o; }
function filter(type, f, q = .7) { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
function gain(v = 0) { const g = ac.createGain(); g.gain.value = v; return g; }
// A slow wobble added to a parameter.
function lfo(param, rate, depth) { const o = osc("sine", rate), g = gain(depth); o.connect(g).connect(param); return o; }

// One-off sounds that events use: a tone with a pitch sweep and a decay, or a burst of noise.
function blip(t, { f0, f1 = f0, attack = .004, decay = .08, level = .05, type = "sine", out = bed }) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type;
  o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + attack + decay * .6);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + attack + decay);
  o.connect(g).connect(out); o.start(t); o.stop(t + attack + decay + .02);
}
function puff(t, { f, q = 1, decay = .03, level = .05, type = "highpass" }) {
  const s = ac.createBufferSource(), b = filter(type, f, q), g = ac.createGain(); s.buffer = buffer();
  g.gain.setValueAtTime(level, t); g.gain.exponentialRampToValueAtTime(.0001, t + decay);
  s.connect(b).connect(g).connect(bed); s.start(t, Math.random() * 1.8); s.stop(t + decay + .02);
}

// The scenes. Each has a width range (log10 metres), a level, what runs all the time, and what
// happens now and then (events a second at full strength).
function build() {
  const L = (name, from, to, level, make, events = null) => { const out = gain(0); out.connect(bed); make(out); layers.push({ name, from, to, level, out, events }); };
  // Near the Planck length: high partials of one note, each swelling on its own, and glassy plucks.
  L("planck", -36, -33.3, .5, out => {
    [3, 4, 5, 6, 7, 9, 11, 13].forEach((n, i) => { const o = osc("sine", 110 * n, (i % 3 - 1) * 4), g = gain(.02); lfo(g.gain, .05 + i * .023, .018); o.connect(g).connect(out); });
  }, { rate: 1.2, fire: t => blip(t, { f0: 110 * [8, 10, 12, 15, 16, 18][Math.floor(Math.random() * 6)], attack: .002, decay: 1.6, level: .035, type: "triangle" }) });
  // Below what any collider reaches: only thin air, since nothing there has been measured.
  L("unknown", -33.3, -19.6, .5, out => { const n = noiseSource(), b = filter("highpass", 5200), g = gain(.012); n.connect(b).connect(g).connect(out); });
  // Quarks and the proton: a buzz with a fast tremolo, and crackles.
  L("quarks", -19.6, -14.6, .55, out => {
    const b = filter("bandpass", 420, 1.8), g = gain(.07); lfo(g.gain, 11, .035); lfo(b.frequency, .3, 120);
    osc("sawtooth", 58).connect(b); osc("sawtooth", 87.3, 7).connect(b); osc("square", 29, -5).connect(b); b.connect(g).connect(out);
  }, { rate: 7, fire: t => puff(t, { f: 2500 + Math.random() * 3000, decay: .012, level: .06 }) });
  // The nucleus: a deep, pulsing thrum.
  L("nucleus", -14.6, -12.6, .6, out => { const g = gain(.08); lfo(g.gain, 1.3, .05); osc("sine", 41).connect(g); osc("sine", 61.5).connect(g); osc("triangle", 82, 6).connect(g); g.connect(out); });
  // Atoms and air: bubbling and fizz.
  L("atoms", -11.2, -7.3, .6, out => { const n = noiseSource(), b = filter("highpass", 3000), g = gain(.01); n.connect(b).connect(g).connect(out); },
    { rate: 10, fire: t => { const f = 380 + Math.random() * 1100; blip(t, { f0: f, f1: f * 1.7, attack: .003, decay: .07, level: .045 }); } });
  // Microbes: slower, wetter bubbles and a low gurgle.
  L("microbes", -7.3, -3.6, .6, out => { const n = noiseSource(), b = filter("lowpass", 320, 2), g = gain(.025); lfo(g.gain, .23, .02); lfo(b.frequency, .17, 120); n.connect(b).connect(g).connect(out); },
    { rate: 2.6, fire: t => { const f = 160 + Math.random() * 380; blip(t, { f0: f, f1: f * 2.1, attack: .008, decay: .17, level: .07 }); } });
  // The honeybee: a low, round hum (Brandon, 2026-11-20: the buzz was "too high-pitched"). A
  // honeybee's wings beat about 230 times a second; the hum here sits a little below that, with
  // its bright upper harmonics filtered away, coming and going as it flies.
  L("bee", -2.7, -.9, .5, out => {
    const b = filter("lowpass", 420, .8), g = gain(.06); lfo(g.gain, .6, .035);
    const o1 = osc("sawtooth", 170), o2 = osc("sine", 85); lfo(o1.frequency, 5, 4); lfo(o2.frequency, 5, 2);
    const sub = gain(.5); o1.connect(b); o2.connect(sub).connect(b); b.connect(g).connect(out);
  });
  // The street: the city's low hum, a crowd's murmur and footsteps (car horns are set off by the page).
  L("street", -.4, 2.8, .7, out => {
    const n = noiseSource(), low = filter("lowpass", 160), g1 = gain(.08); n.connect(low).connect(g1).connect(out);
    const m = noiseSource(), mid = filter("bandpass", 650, .8), g2 = gain(.018); lfo(g2.gain, .4, .01); lfo(mid.frequency, .21, 200); m.connect(mid).connect(g2).connect(out);
  }, { rate: 1.5, fire: t => puff(t, { f: 900 + Math.random() * 500, q: 2, type: "bandpass", decay: .05, level: .03 }) });
  // Over the city and the Earth: wind.
  L("wind", 3, 7.3, .7, out => { const n = noiseSource(), b = filter("bandpass", 520, .6), g = gain(.05); lfo(b.frequency, .07, 260); lfo(g.gain, .11, .025); n.connect(b).connect(g).connect(out); });
  // Space, from the Moon to the nearest stars: a soft, low drone of pure tones in tune, so that
  // nothing beats or buzzes (Brandon, 2026-11-20: "a weird buzzing as you leave the Earth"; the
  // detuned triangle wave did it), swelling slowly in from the wind.
  L("space", 7.8, 16, .6, out => { const lp = filter("lowpass", 320), g = gain(.045); lfo(g.gain, .05, .015); osc("sine", 55).connect(lp); osc("sine", 82.5).connect(lp); const hi = gain(.35); osc("sine", 110).connect(hi).connect(lp); lp.connect(g).connect(out); });
  // The stars and the Milky Way: a soft chord, and twinkles.
  L("stars", 16, 21.6, .6, out => {
    const g = gain(.022); lfo(g.gain, .09, .01);
    [220, 261.63, 329.63, 392, 493.88].forEach((f, i) => { const o = osc(i % 2 ? "sine" : "triangle", f, (i - 2) * 3), og = gain(.6); lfo(og.gain, .03 + i * .017, .35); o.connect(og).connect(g); });
    g.connect(out);
  }, { rate: .9, fire: t => blip(t, { f0: 1400 + Math.random() * 2200, decay: 1.3, attack: .01, level: .018 }) });
  // Galaxies to the edge of what we can see: a deep hum and a faint hiss.
  L("cosmos", 21.6, 28, .7, out => {
    const g = gain(.07); lfo(g.gain, .04, .03); osc("sine", 36.7).connect(g); osc("sine", 55, 4).connect(g); g.connect(out);
    const n = noiseSource(), b = filter("bandpass", 240, .5), ng = gain(.012); n.connect(b).connect(ng).connect(out);
  });
}

function start() {
  if (!on) return false;
  // On iPhones, Web Audio is silenced by the ring/silent switch unless the page asks for playback.
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch { /* older browsers */ }
  if (!ac) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return false;
    ac = new AC(); master = gain(.55);
    // A gentle limiter so stacked sounds never clip.
    const squash = ac.createDynamicsCompressor(); squash.threshold.value = -14; squash.ratio.value = 6;
    master.connect(squash).connect(ac.destination);
    bed = gain(1); bed.connect(master);
    build(); lastT = ac.currentTime;
  }
  if (ac.state !== "running") {
    ac.resume();
    // Some phones unlock audio only when a sound starts inside the tap itself: play one silent sample.
    const s = ac.createBufferSource(); s.buffer = ac.createBuffer(1, 1, ac.sampleRate); s.connect(ac.destination); s.start(0);
  }
  return true;
}
const ready = () => ac && on && ac.state === "running";

export const sound = {
  get on() { return on; },
  set(value) {
    on = value; try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* ignore */ }
    if (on) start();
    if (ac) bed.gain.setTargetAtTime(on ? 1 : 0, ac.currentTime, .1);
  },
  wake: start,
  // Called every frame with the frame's width as log10 metres.
  frame(lw) {
    if (!ready()) return;
    const t = ac.currentTime, dt = Math.min(.1, t - lastT); lastT = t;
    for (const l of layers) {
      const k = band(lw, l.from, l.to);
      l.out.gain.setTargetAtTime(k * l.level, t, .25);
      if (l.events && k > .02 && Math.random() < l.events.rate * k * dt) l.events.fire(t + .01, lw);
    }
  },
  // A soft note for a stop, higher for smaller things, on a pentatonic scale.
  chime(index, count) {
    if (!ready()) return;
    const steps = [0, 2, 4, 7, 9], n = count - 1 - index, f = 220 * Math.pow(2, (Math.floor(n / 5) * 12 + steps[n % 5]) / 12), t = ac.currentTime;
    for (const [mult, level, type] of [[1, .09, "triangle"], [2, .03, "sine"]]) {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f * mult;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + 1.1);
      o.connect(g).connect(master); o.start(t); o.stop(t + 1.2);
    }
  },
  // A bark: a falling voiced burst with a puff of breath, low and round (Brandon, 2026-11-21: it
  // was "far too high pitched"). `pitch` lifts it a little for a puppy's yip.
  bark({ count = 2, pitch = 1 } = {}) {
    if (!ready()) return;
    const t0 = ac.currentTime + .01;
    for (let i = 0; i < count; i++) {
      const t = t0 + i * .2, o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(330 * pitch, t); o.frequency.exponentialRampToValueAtTime(170 * pitch, t + .15);
      f.type = "lowpass"; f.Q.value = 2; f.frequency.setValueAtTime(1300 * pitch, t); f.frequency.exponentialRampToValueAtTime(450 * pitch, t + .16);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.32, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .2);
      o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + .22);
      const n = ac.createBufferSource(), nf = filter("bandpass", 700 * pitch, 1), ng = ac.createGain();
      n.buffer = buffer(); ng.gain.setValueAtTime(.12, t); ng.gain.exponentialRampToValueAtTime(.0001, t + .09);
      n.connect(nf).connect(ng).connect(master); n.start(t, Math.random()); n.stop(t + .1);
    }
  },
  // A long howl, for the Moon.
  howl() {
    if (!ready()) return;
    const t = ac.currentTime + .02, o = ac.createOscillator(), f = filter("lowpass", 1500, 5), g = ac.createGain(), vib = ac.createOscillator(), depth = ac.createGain();
    o.type = "sawtooth"; o.frequency.setValueAtTime(480, t); o.frequency.linearRampToValueAtTime(760, t + .5); o.frequency.linearRampToValueAtTime(700, t + 1.3); o.frequency.exponentialRampToValueAtTime(420, t + 1.8);
    vib.frequency.value = 6; depth.gain.value = 14; vib.connect(depth).connect(o.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.3, t + .25); g.gain.setValueAtTime(.3, t + 1.3); g.gain.exponentialRampToValueAtTime(.0001, t + 1.9);
    o.connect(f).connect(g).connect(master); o.start(t); vib.start(t); o.stop(t + 2); vib.stop(t + 2);
  },
  // A short two-tone car horn.
  honk() {
    if (!ready()) return;
    const t = ac.currentTime + .02, long = Math.random() < .5 ? .35 : .14;
    for (const f0 of [370, 466]) {
      const o = ac.createOscillator(), f = filter("lowpass", 1700), g = ac.createGain();
      o.type = "square"; o.frequency.value = f0;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.045, t + .015); g.gain.setValueAtTime(.045, t + long); g.gain.linearRampToValueAtTime(0, t + long + .04);
      o.connect(f).connect(g).connect(bed); o.start(t); o.stop(t + long + .06);
    }
  },
  // A small pop, for the sound switch and the side panel.
  pop(pitch = 1) {
    if (!ready()) return;
    blip(ac.currentTime, { f0: 900 * pitch, f1: 1800 * pitch, decay: .12, level: .1, out: master });
  },
};
