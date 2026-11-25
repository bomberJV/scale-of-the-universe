// The surveys' galaxies (scale/galaxies.js, written by tools/build_galaxies.py): the file reads
// as far.js reads it, the galaxies are where the clusters far.js names are, and the counts the
// page and the note give are the file's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = path.join(root, 'scale');
const { GALAXIES } = await import(pathToFileURL(path.join(page, 'galaxies.js')));

const RAD = Math.PI / 180;
const T = [[-.0548755604, -.8734370902, -.4838350155], [.4941094279, -.4448296300, .7469822445], [-.8676661490, -.1980763734, .4559837762]];
const fromSky = (ra, dec, r) => { const v = [Math.cos(dec * RAD) * Math.cos(ra * RAD), Math.cos(dec * RAD) * Math.sin(ra * RAD), Math.sin(dec * RAD)]; return T.map((row) => (row[0] * v[0] + row[1] * v[1] + row[2] * v[2]) * r); };
function read(s) {
  const bin = Buffer.from(s.data, 'base64'), n = bin.length / 6, at = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) at[i] = bin.readInt16LE(2 * i) * s.unit;
  return at;
}
const within = (at, centre, r) => { let n = 0; for (let i = 0; i < at.length; i += 3) if (Math.hypot(at[i] - centre[0], at[i + 1] - centre[1], at[i + 2] - centre[2]) < r) n++; return n; };
const survey = (key) => GALAXIES.surveys.find((s) => s.key === key);

test('each survey has as many galaxies as it says, all within its reach', () => {
  assert.deepEqual(GALAXIES.surveys.map((s) => s.key), ['2mrs', 'sdss']);
  for (const s of GALAXIES.surveys) {
    const at = read(s);
    assert.equal(at.length / 3, s.count);
    assert.ok(s.count > 30000 && s.count < 140000, `${s.key}: ${s.count} galaxies`);
    let far = 0; for (let i = 0; i < at.length; i += 3) far = Math.max(far, Math.hypot(at[i], at[i + 1], at[i + 2]));
    assert.ok(far <= s.reach + 2 * s.unit, `${s.key}: a galaxy at ${far} ly, past ${s.reach}`);
  }
});

test('the galaxies are where the named clusters are', () => {
  const near = read(survey('2mrs')), deep = read(survey('sdss'));
  // Right ascension, declination and distance as far.js has them.
  for (const [name, ra, dec, d, least] of [['Coma', 194.953, 27.981, 320e6, 120], ['Perseus', 49.652, 41.515, 240e6, 150], ['Hydra', 159.214, -27.526, 190e6, 80], ['Norma', 243.887, -60.908, 220e6, 80]]) {
    const n = within(near, fromSky(ra, dec, d), 40e6);
    assert.ok(n >= least, `${name}: ${n} galaxies within 40 million ly`);
    // Not a uniform haze: the same sphere on the far side of the sky holds far fewer.
    const opposite = within(near, fromSky(ra, dec, -d), 40e6);
    assert.ok(n > 1.5 * opposite, `${name}: ${n} against ${opposite} opposite`);
  }
  assert.ok(within(deep, fromSky(195, 0, 1.03e9), 120e6) >= 120, 'the Sloan Great Wall');
});

test('the page and the note give the counts in the file', () => {
  const said = (n) => n.toLocaleString('en-US');
  const html = fs.readFileSync(path.join(page, 'index.html'), 'utf8'), notes = fs.readFileSync(path.join(page, 'notes.js'), 'utf8');
  for (const s of GALAXIES.surveys) {
    assert.ok(html.includes(said(s.count)), `index.html does not say ${said(s.count)}`);
    assert.ok(notes.includes(said(s.count)), `notes.js does not say ${said(s.count)}`);
  }
});
