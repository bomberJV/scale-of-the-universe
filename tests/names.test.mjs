// Every name the zoom below 8 m writes, and every wave in the strip, must open a note when
// pressed: a thing with a name and nothing behind it reads as broken (Brandon, 2026-11-25:
// "things like the nuclear pore and the virus are unlabled and have no info").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = path.join(root, 'scale');
const html = fs.readFileSync(path.join(page, 'index.html'), 'utf8');
const classic = [...html.matchAll(/<script src="([^"]+)" defer><\/script>/g)].map((m) => m[1]);

const any = () => new Proxy(function () {}, {
  get: (_, key) => (key === Symbol.toPrimitive ? () => 0 : any()),
  apply: () => any(),
  construct: () => any(),
});
const storage = { getItem: () => null, setItem() {}, removeItem() {} };
Object.assign(globalThis, {
  window: globalThis, document: any(), matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  requestAnimationFrame: () => 0, cancelAnimationFrame() {}, addEventListener() {}, removeEventListener() {}, localStorage: storage, sessionStorage: storage,
});
for (const src of classic) vm.runInThisContext(fs.readFileSync(path.join(page, src), 'utf8'), { filename: src });
const sizes = vm.runInThisContext('redSizes'), ink = vm.runInThisContext('redInk');
const { noteFor } = await import(pathToFileURL(path.join(page, 'notes.js')));
const { waveNote } = await import(pathToFileURL(path.join(page, 'waves.js')));
// What app.js tells the lettering opens a note.
const opens = (t) => { const n = waveNote(t) || noteFor(t, []); return !!(n && n.body && n.body.length); };
ink.links(opens);

// Every name the zoom has at any width, on a wide frame and a narrow one, at a few moments.
function names() {
  const seen = new Set(), ctx = any();
  sizes.layout({ chrome: 0, press: true });
  for (const [w, h] of [[920, 610], [350, 520]]) {
    for (let l = Math.log10(8); l > -34.8; l -= .04) {
      for (const time of [0, 3.7, 11.3]) { ink.begin(); sizes.zoom(ctx, w, h, 10 ** l, time, null); for (const n of sizes.named()) seen.add(n); }
    }
  }
  return [...seen];
}

test('every name in the zoom below 8 m opens a note', () => {
  const all = names();
  assert.ok(all.length > 60, `only ${all.length} names found`);
  for (const must of ['Nuclear pore', 'Adenovirus', 'Influenza virus', 'SARS-CoV-2', 'Rhinovirus', 'Ribosome']) assert.ok(all.some((n) => n.startsWith(must)), `${must} is never named`);
  // A figure written like a name (an angle on a molecule) opens nothing and is not offered to press.
  const figure = (n) => !/[A-Za-z]{3}/.test(n);
  const without = all.filter((n) => !figure(n) && !opens(n));
  assert.deepEqual(without, [], 'names without a note');
});

test('a named thing in the frame can be pressed, whether or not its name is written', () => {
  const ctx = any();
  sizes.layout({ chrome: 0, press: true });
  const found = new Set();
  for (const W of [1.4e-6, 9.5e-7, 6e-7]) {
    ink.begin(); sizes.zoom(ctx, 920, 610, W, 2, null);
    for (let x = 0; x < 920; x += 8) for (let y = 0; y < 610; y += 8) { const t = sizes.pick(x, y); if (t) found.add(t.split(' · ')[0]); }
  }
  assert.ok(found.has('Nuclear pore'), `the nuclear pore cannot be pressed; found ${[...found].join(', ')}`);
  assert.ok([...found].some((n) => /virus|SARS/.test(n)), `no virus can be pressed; found ${[...found].join(', ')}`);
  assert.ok(found.size >= 4, `only ${[...found].join(', ')} can be pressed`);
  assert.ok(![...found].some((n) => !/[A-Za-z]{3}/.test(n)), 'a bare figure is offered to press');
  assert.equal(sizes.pick(-500, -500), null);
});
