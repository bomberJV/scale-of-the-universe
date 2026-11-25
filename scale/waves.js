// Wavelengths, drawn to the frame's scale in a strip of their own under it: a wave shows while
// one of its wavelengths is between a few pixels and most of the frame, so each kind of light,
// each particle's quantum wavelength and the long waves come and go as the frame's width passes
// them (Brandon, 2026-11-21: "instead of just showing a chart of particles, the scale thing
// should show their characteristic quantum wavelengths and the wavelengths of different types of
// light. And big wavelengths too"). They were drawn over the frame's lower edge at first; they
// covered what was there (Brandon, 2026-11-25: "the waves cover up info"), so the strip is a
// canvas of its own, as wide as the frame and at the same scale.
//
// Three families. Light: its wavelength in a vacuum, c / f, or h c / E for a photon of energy E.
// Particles: the Compton wavelength h / (m c), the length at which a particle's quantum nature
// cannot be ignored, from the masses in the Particle Data Group's 2024 review (the neutrinos'
// from KATRIN's 2025 bound, so theirs is a least length); and the de Broglie wavelength h / (m v)
// of a few moving things. Other waves: sound in air at 343 m/s, water, and gravitational waves.
// The lengths are measured or worked out from measured figures; that each is drawn as a plain
// sine wave of a fixed height is drawing. Light's waves move; the rest stand still.
const TAU = Math.PI * 2;
const INK = { gamma: '#d9b3ff', xray: '#b9c6ff', uv: '#a78bfa', violet: '#9b6bff', green: '#5fe36a', red: '#ff4d3d', ir: '#ff8a5c', micro: '#ffc46b', radio: '#7fd6c2', long: '#6fb7d9',
  q: '#f0a070', l: '#8fd0ff', b: '#c4fa79', h: '#ffd86a', moving: '#f2f1e7', sound: '#e6e0c8', water: '#7fb6e6', gravity: '#c9d2e0' };
const wiki = t => ['Wikipedia: ' + t.replace(/_/g, ' '), 'https://en.wikipedia.org/wiki/' + t];
const COMPTON = 'The Compton wavelength, h / (m c): the heavier a particle, the shorter it is. Squeeze a particle into less room than this and the energy needed is enough to make new particles, so below it “one particle” stops meaning much.';
// [name, wavelength in metres, the figure as written, family, ink, note, where to read more]
const WAVES = [
  // ——— light ———
  ['Most energetic light seen', 8.9e-22, '9 × 10⁻²² m', 'light', 'gamma', 'In 2021 the LHAASO observatory in Sichuan recorded a gamma ray of 1.4 PeV from the direction of Cygnus: the most energetic light then seen. Its wavelength, h c / E, is about 9 × 10⁻²² m, a millionth of a proton’s width.', wiki('Large_High_Altitude_Air_Shower_Observatory')],
  ['Gamma ray from cobalt-60', 9.3e-13, '0.93 pm', 'light', 'gamma', 'Cobalt-60, used to treat cancer and to sterilise medical equipment, gives off gamma rays of 1.17 and 1.33 MeV. The second has a wavelength of 0.93 pm, far smaller than an atom, which is why gamma rays pass through so much.', wiki('Cobalt-60')],
  ['Medical X-ray', 2.1e-11, 'about 20 pm', 'light', 'xray', 'A chest X-ray uses photons of around 60 keV, about 20 pm in wavelength: shorter than the distance between atoms, so they pass through soft tissue and are stopped more by bone.', wiki('X-ray')],
  ['X-ray that showed DNA’s helix', 1.54e-10, '154 pm', 'light', 'xray', 'Copper’s Kα X-rays, 154 pm, are the workhorse of crystallography: a wavelength about the size of the gaps between atoms, so crystals scatter them into patterns. Rosalind Franklin’s Photo 51 of DNA was taken with them in 1952.', wiki('Photo_51')],
  ['Extreme ultraviolet that prints chips', 1.35e-8, '13.5 nm', 'light', 'uv', 'The newest computer chips are printed with extreme ultraviolet light of 13.5 nm, made by firing a laser at droplets of molten tin. Shorter light draws finer lines.', wiki('Extreme_ultraviolet_lithography')],
  ['Germicidal ultraviolet', 2.54e-7, '254 nm', 'light', 'uv', 'Mercury lamps give off ultraviolet at 254 nm, close to the wavelength DNA absorbs best. It damages the DNA of bacteria and viruses, so it is used to disinfect water, air and surfaces.', wiki('Ultraviolet_germicidal_irradiation')],
  ['Violet light', 4e-7, '400 nm', 'light', 'violet', 'The shortest light the eye sees, about 400 nm. A bacterium is a few of these wavelengths long, which is why an ordinary microscope can just make one out, and cannot show a virus.', wiki('Visible_spectrum')],
  ['Green light', 5.5e-7, '550 nm', 'light', 'green', 'The eye is most sensitive to green light near 555 nm, close to the peak of sunlight at the ground.', wiki('Visible_spectrum')],
  ['Red light', 7e-7, '700 nm', 'light', 'red', 'The longest light the eye sees, about 700 nm. Past it is the infrared.', wiki('Visible_spectrum')],
  ['Infrared in optical fibre', 1.55e-6, '1,550 nm', 'light', 'ir', 'Most of the internet travels as infrared light of 1,550 nm, the wavelength at which glass fibre absorbs least.', wiki('Fiber-optic_communication')],
  ['Heat a body glows with', 9.4e-6, '9.4 µm', 'light', 'ir', 'Everything warm glows. At body temperature, 37 °C, the glow is strongest near 9.4 µm (Wien’s law), which is what a thermal camera sees.', wiki('Black-body_radiation')],
  ['Afterglow of the Big Bang', 1.06e-3, '1.06 mm', 'light', 'micro', 'The cosmic microwave background, light left from 380,000 years after the Big Bang, now cooled to 2.725 K. Its spectrum peaks at a wavelength of 1.06 mm.', wiki('Cosmic_microwave_background')],
  ['Wi-Fi and microwave ovens', .1224, '12 cm', 'light', 'micro', 'Both use microwaves near 2.45 GHz, about 12 cm long. The oven’s metal mesh door has holes far smaller than that, so the waves stay in while light gets out.', wiki('Microwave')],
  ['Hydrogen’s radio line', .2111, '21 cm', 'light', 'micro', 'Cold hydrogen atoms give off radio waves 21.1 cm long when the electron’s spin flips. Astronomers map the Milky Way’s gas with it.', wiki('Hydrogen_line')],
  ['FM radio', 3, '3 m', 'light', 'radio', 'FM stations broadcast near 100 MHz: radio waves about 3 m long, which is why a car’s aerial is about a quarter of that.', wiki('FM_broadcasting')],
  ['Shortwave radio', 30, '30 m', 'light', 'radio', 'Radio near 10 MHz, about 30 m long, bounces off the upper atmosphere and so carries round the world.', wiki('Shortwave_radio')],
  ['AM radio', 300, '300 m', 'light', 'radio', 'AM stations near 1 MHz send waves about 300 m long, longer than most skyscrapers are tall; they bend round hills and buildings.', wiki('AM_broadcasting')],
  ['Radio to submarines', 1.5e4, '15 km', 'light', 'long', 'Very low frequency radio, near 20 kHz with waves about 15 km long, reaches some tens of metres into seawater, so navies use it to signal submarines.', wiki('Very_low_frequency')],
  ['Mains hum', 5e6, '5,000 km', 'light', 'long', 'Power lines carrying alternating current at 60 Hz radiate, faintly, waves 5,000 km long: farther than New York to Los Angeles.', wiki('Extremely_low_frequency')],
  ['Earth’s own radio note', 3.83e7, '38,000 km', 'light', 'long', 'Lightning keeps the space between the ground and the upper atmosphere ringing at 7.83 Hz, the Schumann resonance: a radio wave about as long as the Earth is round.', wiki('Schumann_resonances')],
  // ——— particles: Compton wavelengths ———
  ['Top quark’s quantum wavelength', 7.185e-18, '7.2 × 10⁻¹⁸ m', 'matter', 'q', 'The heaviest particle known, 173 GeV, and so the shortest Compton wavelength. ' + COMPTON, wiki('Compton_wavelength')],
  ['Higgs boson’s quantum wavelength', 9.903e-18, '9.9 × 10⁻¹⁸ m', 'matter', 'h', 'The Higgs boson, 125 GeV. ' + COMPTON, wiki('Compton_wavelength')],
  ['Z boson’s quantum wavelength', 1.3597e-17, '1.36 × 10⁻¹⁷ m', 'matter', 'b', 'The Z boson, 91.2 GeV, one carrier of the weak force. The weak force reaches only about this far because its carriers are so heavy. ' + COMPTON, wiki('Compton_wavelength')],
  ['W boson’s quantum wavelength', 1.5427e-17, '1.54 × 10⁻¹⁷ m', 'matter', 'b', 'The W boson, 80.4 GeV, the other carrier of the weak force. ' + COMPTON, wiki('Compton_wavelength')],
  ['Bottom quark’s quantum wavelength', 2.964e-16, '0.30 fm', 'matter', 'q', 'The bottom quark, 4.18 GeV. ' + COMPTON, wiki('Compton_wavelength')],
  ['Tau’s quantum wavelength', 6.977e-16, '0.70 fm', 'matter', 'l', 'The tau, the heaviest cousin of the electron, 1.78 GeV. ' + COMPTON, wiki('Compton_wavelength')],
  ['Charm quark’s quantum wavelength', 9.74e-16, '0.97 fm', 'matter', 'q', 'The charm quark, 1.27 GeV. ' + COMPTON, wiki('Compton_wavelength')],
  ['Proton’s quantum wavelength', 1.3214e-15, '1.32 fm', 'matter', 'q', 'The proton, 938 MeV: 1.32 fm, close to its own width of 1.7 fm. The neutron’s is almost the same. ' + COMPTON, wiki('Compton_wavelength')],
  ['Muon’s quantum wavelength', 1.1734e-14, '11.7 fm', 'matter', 'l', 'The muon, a heavier cousin of the electron, 106 MeV. ' + COMPTON, wiki('Compton_wavelength')],
  ['Strange quark’s quantum wavelength', 1.326e-14, '13.3 fm', 'matter', 'q', 'The strange quark, 93.5 MeV. ' + COMPTON, wiki('Compton_wavelength')],
  ['Down quark’s quantum wavelength', 2.638e-13, '264 fm', 'matter', 'q', 'The down quark, 4.7 MeV: a quantum wavelength hundreds of times wider than the proton it lives in, which is one way to see that a quark in a proton is nothing like a marble in a bag. ' + COMPTON, wiki('Compton_wavelength')],
  ['Up quark’s quantum wavelength', 5.74e-13, '574 fm', 'matter', 'q', 'The up quark, 2.16 MeV, the lightest quark. ' + COMPTON, wiki('Compton_wavelength')],
  ['Electron’s quantum wavelength', 2.4263e-12, '2.43 pm', 'matter', 'l', 'The electron, 0.511 MeV: 2.43 pm, about a hundredth of an atom’s width. It is also the wavelength of the light made when an electron and its antiparticle meet and vanish. ' + COMPTON, wiki('Compton_wavelength')],
  ['Neutrino’s quantum wavelength', 2.76e-6, 'longer than 2.8 µm', 'matter', 'l', 'Neutrinos are so light that only an upper limit on their mass is known: under 0.45 eV (KATRIN, 2025). So their Compton wavelength is at least 2.8 µm, the size of a bacterium: by far the longest of any particle with mass.', wiki('Neutrino')],
  // ——— moving things: de Broglie wavelengths ———
  ['A person walking, as a wave', 6.8e-36, '7 × 10⁻³⁶ m', 'matter', 'moving', 'Everything that moves has a wavelength, h / (m v). For a 70 kg person at walking pace it is about 7 × 10⁻³⁶ m, shorter than the Planck length, which is why nobody diffracts through a doorway.', wiki('Matter_wave')],
  ['A pitched baseball, as a wave', 1.1e-34, '1.1 × 10⁻³⁴ m', 'matter', 'moving', 'A 145 g baseball at 40 m/s has a de Broglie wavelength, h / (m v), of about 1.1 × 10⁻³⁴ m: only seven times the Planck length.', wiki('Matter_wave')],
  ['A proton in the Large Hadron Collider', 1.8e-19, '1.8 × 10⁻¹⁹ m', 'matter', 'moving', 'The LHC’s protons carry 6.8 TeV each. At that energy a proton’s wavelength is about 1.8 × 10⁻¹⁹ m, which is what lets collisions probe lengths ten thousand times smaller than the proton itself.', wiki('Large_Hadron_Collider')],
  ['A buckyball, as a wave', 2.5e-12, '2.5 pm', 'matter', 'moving', 'In 1999 a Vienna team sent molecules of 60 carbon atoms, moving at about 220 m/s, through a grating and saw them interfere like waves. Their wavelength was 2.5 pm, hundreds of times smaller than the molecule.', wiki('Matter_wave')],
  ['Electron in an electron microscope', 3.7e-12, '3.7 pm', 'matter', 'moving', 'An electron microscope speeds electrons through 100,000 volts, giving them a wavelength of 3.7 pm: a hundred thousand times shorter than visible light, short enough to picture single atoms.', wiki('Transmission_electron_microscopy')],
  ['Slow neutron, as a wave', 1.8e-10, '0.18 nm', 'matter', 'moving', 'Neutrons slowed to room temperature have a wavelength of about 0.18 nm, the spacing of atoms in a crystal, so beams of them are used to find where atoms sit.', wiki('Neutron_diffraction')],
  // ——— other waves ———
  ['Bat’s call', 6.9e-3, '7 mm', 'other', 'sound', 'Sound, not light: a bat calling at 50 kHz sends sound waves 7 mm long, about the size of the insects it hunts. A shorter wave shows smaller things.', wiki('Animal_echolocation')],
  ['Middle C', 1.31, '1.3 m', 'other', 'sound', 'Sound, not light: middle C, 261.6 Hz, is a wave 1.3 m long in air.', wiki('C_(musical_note)')],
  ['Lowest note on a piano', 12.5, '12.5 m', 'other', 'sound', 'Sound, not light: the piano’s bottom A, 27.5 Hz, is a wave 12.5 m long in air, longer than a bus.', wiki('Piano_key_frequencies')],
  ['Ocean swell', 150, '150 m', 'other', 'water', 'Water, not light: swell from a distant storm arrives as waves about 150 m from crest to crest, some ten seconds apart.', wiki('Swell_(ocean)')],
  ['Tsunami', 2e5, '200 km', 'other', 'water', 'Water, not light: in the open ocean a tsunami’s crests are around 200 km apart and under a metre high, crossing at the speed of a jet.', wiki('Tsunami')],
  ['First gravitational wave detected', 2e6, '2,000 km', 'other', 'gravity', 'Not light: a ripple in space itself. The wave LIGO caught on 14 September 2015, from two black holes merging, peaked near 150 Hz: about 2,000 km from crest to crest, and it changed the length of LIGO’s 4 km arms by less than a thousandth of a proton’s width.', wiki('First_observation_of_gravitational_waves')],
  ['Gravitational waves found with pulsars', 1e17, 'about 10 light-years', 'other', 'gravity', 'Not light: in 2023 teams timing pulsars across the Milky Way reported a background of gravitational waves with periods of years, so wavelengths of light-years, probably from pairs of giant black holes circling each other.', wiki('Pulsar_timing_array')],
  ['Sound waves frozen into the galaxies', 4.6e24, '490 million light-years', 'other', 'sound', 'Before atoms formed, sound travelled through the hot young universe. When it cooled the waves stopped, leaving galaxies a little more likely to sit 490 million light-years apart: the largest wave anyone has measured.', wiki('Baryon_acoustic_oscillations')],
].map(([name, length, figure, family, ink, note, read]) => ({ name, length, figure, family, ink: INK[ink], note, read, text: name + ' · ' + figure, lines: [name, figure] }));

const KINDS = { light: 'Light · measured', matter: 'Quantum wavelength · worked out from a measured mass', other: 'A wave that is not light' };
// The note for a wave's name as written in the frame.
export function waveNote(text) {
  const key = String(text).split(' · ')[0].toLowerCase().replace(/’/g, "'"), found = WAVES.find(v => v.name.toLowerCase().replace(/’/g, "'") === key);
  return found ? { key: 'wave ' + key, title: found.name, kind: KINDS[found.family], body: [found.note], read: [found.read], facts: [['Wavelength', found.figure]] } : null;
}

const ease = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
// Which wave is in which lane: a wave keeps its lane while it shows, so none jumps.
const lanes = [null, null, null];
// The strip for a frame w wide: how many lanes, how far apart, the waves' height and the strip's.
export function waveRoom(w) {
  const narrow = w < 700, count = narrow ? 2 : 3, amp = 8, pitch = narrow ? 48 : 46, head = 22;
  return { narrow, count, amp, pitch, head, tall: head + count * pitch + 6 };
}
// Where each lane was drawn last, for a press.
let rows = [];
/** The name of the wave in the lane at a point of the strip, or null. */
export function waveAt(x, y) { const r = rows.find(r => y >= r.top && y < r.top + r.tall); return r ? r.text : null; }
// Draws the strip (w by h pixels) for a frame W metres wide; says whether any of the waves moves.
export function waves(ctx, w, h, W, time) {
  const I = redInk, px = w / W, { narrow, count, amp, pitch, head } = waveRoom(w), edge = narrow ? 14 : 24;
  const strength = v => { const l = v.length * px; return ease((l - 16) / 16) * (1 - ease((l - .68 * w) / (.2 * w))); };
  const score = v => { const a = strength(v); return a <= 0 ? 0 : a * (1 - Math.min(1, Math.abs(Math.log(v.length * px / (w * .2))) / 3) * .5); };
  // Keep the waves that still show; give free lanes to the best of the rest; let a strong
  // newcomer take the lane of one that has all but gone.
  for (let k = 0; k < 3; k++) if (lanes[k] && (k >= count || strength(lanes[k]) <= .01)) lanes[k] = null;
  const waiting = WAVES.filter(v => !lanes.includes(v) && score(v) > .02).sort((a, b) => score(b) - score(a));
  for (let k = 0; k < count && waiting.length; k++) if (!lanes[k]) lanes[k] = waiting.shift();
  for (const v of waiting) { if (strength(v) < .6) break; let weakest = 0; for (let k = 1; k < count; k++) if (strength(lanes[k]) < strength(lanes[weakest])) weakest = k; if (strength(lanes[weakest]) < .15) lanes[weakest] = v; }
  let moves = false;
  ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = '#0a1210'; ctx.fillRect(0, 0, w, h);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // What the strip is, at its head; and that nothing marked fits, when nothing does.
  I.style(ctx); ctx.globalAlpha = .8; ctx.fillStyle = I.DIM;
  ctx.fillText('WAVELENGTHS AT THIS SCALE', edge, head / 2 + 2);
  // Names first, so the waves can pass behind every word.
  const marks = [], plates = [];
  rows = [];
  for (let k = 0; k < count; k++) {
    const v = lanes[k]; if (!v) continue;
    // A lane: the name on its plate, under it one wavelength marked from crest to crest between
    // two ticks, and the wave. On a narrow strip the figure is written apart from the name: at
    // the far end of the name's row, or after the mark, wherever there is room.
    const a = strength(v), l = v.length * px, top = head + k * pitch, ty = top + 11, yb = top + 25, y0 = yb + 4 + amp, x1 = edge;
    I.style(ctx); const words = narrow ? v.lines.slice(0, 1) : [v.text], tw = I.measure(ctx, I.caps(words[0]));
    I.block(ctx, words, edge + I.PX, ty, a);
    if (narrow) {
      const fw = I.measure(ctx, I.caps(v.figure));
      if (edge + tw + 2 * I.PX + 12 + fw < w - edge) I.note(ctx, v.figure, w - edge, ty, a, 'right', I.DIM);
      else if (x1 + l + 10 + fw < w - edge) I.note(ctx, v.figure, x1 + l + 10, yb, a, 'left', I.DIM);
    }
    plates.push([edge - 2, ty - I.LINE / 2 - I.PY - 2, tw + 2 * I.PX + 4, I.LINE + 2 * I.PY + 3]);
    marks.push({ v, a, l, y0, yb, x1 }); rows.push({ top, tall: pitch, text: v.text });
  }
  // When no wave fits the frame, the nearest shorter and longer ones are named, to press.
  if (!marks.length) {
    const fits = v => v.length * px, shorter = WAVES.filter(v => fits(v) < 32).sort((a, b) => b.length - a.length)[0], longer = WAVES.filter(v => fits(v) > .68 * w).sort((a, b) => a.length - b.length)[0];
    [[shorter, 'Next shorter'], [longer, 'Next longer']].filter(e => e[0]).forEach(([v, lead], k) => {
      const top = head + k * pitch, ty = top + 13, lw = I.measure(ctx, I.caps(lead));
      I.note(ctx, lead, edge, ty, .8, 'left', I.DIM);
      if (narrow) I.block(ctx, v.lines.slice(0, 1), edge + I.PX, ty + 21, .85); else I.block(ctx, [v.text], edge + lw + 12 + I.PX, ty, .85);
      rows.push({ top, tall: pitch, text: v.text });
    });
  }
  const clear = (x, y) => plates.every(p => x < p[0] || x > p[0] + p[2] || y < p[1] || y > p[1] + p[3]);
  for (const { v, a, l, y0, yb, x1 } of marks) {
    const light = v.family === 'light';
    ctx.globalAlpha = a * .9; ctx.strokeStyle = v.ink; ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x1, yb - 3); ctx.lineTo(x1, yb + 4); ctx.moveTo(x1, yb); ctx.lineTo(x1 + l, yb); ctx.moveTo(x1 + l, yb - 3); ctx.lineTo(x1 + l, yb + 4); ctx.stroke();
    // The wave across the whole strip, with a crest under the first tick.
    const phase = light && time ? time * 28 / l * TAU : 0, step = Math.max(1.5, Math.min(4, l / 16));
    if (light && time) moves = true;
    for (const [width, alpha] of [[5, .14], [1.6, .9]]) {
      ctx.globalAlpha = a * alpha; ctx.lineWidth = width; ctx.setLineDash(v.family === 'matter' && width < 2 ? [7, 5] : v.family === 'other' && width < 2 ? [2, 4] : []);
      ctx.beginPath(); let pen = false;
      for (let x = -4; x <= w + 4; x += step) {
        const y = y0 - amp * Math.cos((x - x1) / l * TAU - phase);
        if (!clear(x, y)) { pen = false; continue; }
        if (pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true; }
      }
      ctx.stroke();
    }
  }
  ctx.restore();
  return moves;
}
