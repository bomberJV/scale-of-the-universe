// The page loads its scripts from three places: its own folder, the homepage modules in
// home/ and the shared stylesheet. These tests check that every file the page asks for is
// here, that the homepage scripts run in the order the page loads them, and that every scene
// module then loads and provides what app.js imports.
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
const modules = fs.readdirSync(page).filter((f) => f.endsWith('.js') && f !== 'app.js');

// A stand-in for the browser: enough for the scripts to define their globals at load time.
function stubBrowser() {
  const any = () => new Proxy(function () {}, {
    get: (_, key) => (key === Symbol.toPrimitive ? () => 0 : any()),
    apply: () => any(),
    construct: () => any(),
  });
  const storage = { getItem: () => null, setItem() {}, removeItem() {} };
  Object.assign(globalThis, {
    window: globalThis,
    document: any(),
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    requestAnimationFrame: () => 0,
    cancelAnimationFrame() {},
    addEventListener() {},
    removeEventListener() {},
    localStorage: storage,
    sessionStorage: storage,
  });
}

test('every local file the page refers to is in the repository', () => {
  const refs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
    .map((m) => m[1])
    .filter((ref) => !/^[a-z]+:/i.test(ref));
  assert.ok(refs.length > 10);
  for (const ref of refs) {
    const target = path.resolve(page, ref);
    assert.ok(target.startsWith(root), `${ref} points outside the repository`);
    assert.ok(fs.existsSync(target), `${ref} is missing`);
  }
});

test('every module a scene imports is in the repository, the ones fetched later too', () => {
  for (const file of fs.readdirSync(page).filter((f) => f.endsWith('.js'))) {
    const text = fs.readFileSync(path.join(page, file), 'utf8');
    for (const [, ref] of text.matchAll(/\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)|\bfrom\s+['"](\.[^'"]+)['"]/g).map((m) => [0, m[1] || m[2]])) {
      assert.ok(fs.existsSync(path.resolve(page, ref)), `${file} imports ${ref}, which is missing`);
    }
  }
});

test('the wavelengths have their own strip, and the frame is not drawn over', () => {
  assert.match(html, /<canvas id="waves"/);
  const app = fs.readFileSync(path.join(page, 'app.js'), 'utf8');
  assert.ok(!/waves\(ctx,/.test(app), 'app.js draws the waves on the frame');
  assert.match(app, /waves\(sctx,/);
});

test('the page loads the homepage scripts from home/', () => {
  assert.ok(classic.length >= 10);
  for (const src of classic) assert.match(src, /^\.\.\/home\//, `${src} should load from home/`);
});

test('the homepage scripts run, and every scene module loads after them', async () => {
  stubBrowser();
  for (const src of classic) {
    vm.runInThisContext(fs.readFileSync(path.join(page, src), 'utf8'), { filename: src });
  }
  for (const name of ['cosmicZoom', 'atlasLand', 'redSizes', 'redInk']) {
    assert.notEqual(vm.runInThisContext(`typeof ${name}`), 'undefined', `${name} is not defined`);
  }
  const loaded = {};
  for (const file of modules) loaded[file] = await import(pathToFileURL(path.join(page, file)));

  const app = fs.readFileSync(path.join(page, 'app.js'), 'utf8');
  const imports = [...app.matchAll(/^import (?:\{([^}]*)\}|\* as \w+) from "\.\/([^"]+)";/gm)];
  assert.ok(imports.length >= 8);
  for (const [, names, file] of imports) {
    assert.ok(loaded[file], `app.js imports ${file}, which did not load`);
    for (const part of (names || '').split(',').map((s) => s.trim()).filter(Boolean)) {
      const name = part.split(/\s+as\s+/)[0];
      assert.ok(name in loaded[file], `${file} does not export ${name}`);
    }
  }
});

test('the state and county outlines are present', async () => {
  const { BOUNDARIES } = await import(pathToFileURL(path.join(page, 'boundaries.js')));
  assert.ok(BOUNDARIES && Object.keys(BOUNDARIES).length > 0);
});
