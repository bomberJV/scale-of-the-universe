// The Moon drawn at its true size as a lit body (journey.js), once it is a few pixels across.
//
// It is lit from the Sun's direction, so it shows its phase as seen from the camera, and it
// keeps the same face towards the Earth, so its near side's maria can be drawn where they are:
// the centre of the near side faces the Earth (the libration, a few degrees, is left out) and
// its pole points where the IAU gives it.
const studioMoon = (() => {
  'use strict';
  const rad = Math.PI / 180;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = v => { const n = Math.hypot(...v) || 1; return v.map(c => c / n); };
  const mixed = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  // North pole, J2000 equatorial (IAU WGCCRE): right ascension 269.99°, declination 66.54°.
  const pole = [Math.cos(66.54 * rad) * Math.cos(269.99 * rad), Math.cos(66.54 * rad) * Math.sin(269.99 * rad), Math.sin(66.54 * rad)];
  // The near side's maria as round patches: selenographic latitude and longitude of the centre
  // and angular radius [deg], from their published centres and diameters; the large irregular
  // ones (Procellarum, Frigoris, Fecunditatis) as a few patches each.
  const maria = [[33, -16, 18], [28, 17, 11], [8.5, 31, 13], [17, 59, 8.5], [-7, 51, 9], [-15, 35, 5.5], [-21, -17, 10],
    [-24, -39, 6.2], [13, 3, 4], [7, -31, 7], [-10, -23, 5], [10, -55, 14], [26, -56, 13], [-3, -42, 10], [38, -45, 9],
    [56, -22, 4.5], [57, 2, 4.5], [56, 26, 4.5], [-4, 54, 6]]
    .map(([lat, lon, r]) => ({ at: [Math.cos(lat * rad) * Math.cos(lon * rad), Math.cos(lat * rad) * Math.sin(lon * rad), Math.sin(lat * rad)], cos: Math.cos(r * rad), edge: Math.cos(r * rad) - Math.cos((r + 2.5) * rad) }));
  const highland = [178, 173, 164], mare = [108, 106, 102];

  const canvas = document.createElement('canvas'); let made = '';
  // Draws the Moon at x, y with radius R [px]. The vectors are units in the screen's axes
  // [right, down, toward the eye]: north the Moon's pole, earthward towards the Earth, sun towards
  // the Sun. toScreen maps a J2000 equatorial direction into those axes.
  function draw(ctx, x, y, R, toScreen, earthward, sun, alpha) {
    if (alpha <= .01) return;
    const t = ctx.getTransform(), dpr = Math.hypot(t.a, t.b) || 1, half = Math.ceil(R * dpr) + 1, side = 2 * half, scale = R * dpr;
    // The Moon's own axes: X towards the Earth, Z its pole, Y completing them.
    const Z = unit(toScreen(pole)), X = unit(earthward.map((v, i) => v - dot(earthward, Z) * Z[i])), Y = cross(Z, X);
    const key = [scale, ...X, ...Z, ...sun].map(v => Math.round(v * 60)).join();
    if (key !== made) {
      made = key;
      if (canvas.width < side || canvas.height < side) { canvas.width = Math.max(canvas.width, side); canvas.height = Math.max(canvas.height, side); }
      const cx = canvas.getContext('2d'), image = cx.createImageData(side, side), d = image.data;
      const offsets = [[-.25, -.25], [.25, -.25], [-.25, .25], [.25, .25]];
      for (let j = 0; j < side; j++) for (let i = 0; i < side; i++) {
        let r = 0, g = 0, b = 0, a = 0;
        for (const [u, v] of offsets) {
          const px = (i + .5 + u - half) / scale, py = (j + .5 + v - half) / scale, rr = px * px + py * py;
          if (rr >= 1) continue;
          const n = [px, py, Math.sqrt(1 - rr)], local = [dot(n, X), dot(n, Y), dot(n, Z)];
          let dark = 0;
          for (const m of maria) dark = Math.max(dark, clamp((dot(local, m.at) - m.cos + m.edge) / m.edge));
          const c = mixed(highland, mare, dark * .85), light = clamp(dot(n, sun) * 1.2 + .03), limb = .7 + .3 * Math.sqrt(n[2]);
          const s = mixed(c.map(v => v * .08 + 5), c.map(v => v * limb), light);
          r += s[0]; g += s[1]; b += s[2]; a++;
        }
        if (a) { const k = (j * side + i) * 4; d[k] = r / a; d[k + 1] = g / a; d[k + 2] = b / a; d[k + 3] = 255 * a / 4; }
      }
      cx.clearRect(0, 0, canvas.width, canvas.height); cx.putImageData(image, 0, 0);
    }
    ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(canvas, 0, 0, side, side, x - half / dpr, y - half / dpr, side / dpr, side / dpr);
    ctx.restore();
  }
  return { draw };
})();
