// The model of the Milky Way (home/galaxy.js) and the stars round the Sun. Close in, the Sun's
// neighborhood is left to the cataloged stars; from far out it must be part of the disc like
// any other (Brandon, 2026-11-25: "the part of the galaxy we zoom out of seems like a random
// block just inserted into the galaxy, not part of a spiral").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
vm.runInThisContext(fs.readFileSync(path.join(root, 'home/galaxy.js'), 'utf8'), { filename: 'galaxy.js' });
const m = vm.runInThisContext('milkyWay');
const journey = fs.readFileSync(path.join(root, 'home/journey.js'), 'utf8');
const far = (i) => Math.hypot(m.X[i], m.Y[i], m.Z[i]);
// How many of the model's dots within `reach` light-years of the Sun are drawn when the gap is `gap`.
const drawn = (reach, gap) => { let n = 0; for (let i = 0; i < m.count; i++) if (far(i) < reach && m.near[i] > gap) n++; return n; };

test('close in, no model dot stands among the nearest cataloged stars', () => {
  assert.equal(m.near.length, m.count);
  assert.equal(drawn(2500, 1), 0);
});

test('from far out there is no gap round the Sun: the disc there is as full as beside it', () => {
  // The same area of disc at the Sun's distance from the center, a quarter turn round it.
  let beside = 0;
  for (let i = 0; i < m.count; i++) if (Math.hypot(m.X[i] - m.sunToCentre, m.Y[i] - m.sunToCentre) < 4500) beside++;
  const here = drawn(4500, 0);
  assert.ok(here > 150, `only ${here} dots within 4,500 light-years of the Sun`);
  assert.ok(here > .4 * beside && here < 2.5 * beside, `${here} round the Sun against ${beside} beside it`);
  // More dots come in the wider the frame, the nearest last.
  assert.ok(drawn(6500, 1) < drawn(6500, .5) && drawn(6500, .5) < drawn(6500, 0));
  assert.ok(drawn(2500, .5) < .5 * drawn(2500, 0));
});

test('both ways of drawing the disc close the gap, and the stars settle into dots', () => {
  assert.match(journey, /attribute float n;/);                       // the graphics card's dots
  assert.match(journey, /uniform1f\(where\.gap,gap\)/);
  assert.match(journey, /if\(near<=gap\)continue/);                  // the dots drawn one by one
  assert.match(journey, /const settled=/);
  // The brightness limit keeps rising past the catalog's own table.
  assert.match(journey, /limits=\[\.\.\.starCatalog\.limits,/);
});
