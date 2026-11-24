// Giant stars, set where the Sun is, for scale (Brandon, 2026-11-21: "a giant star in space").
// None of them is there: each is drawn as a faint ball about the Sun, at its real size, to be
// seen against the planets' orbits. Radii in solar radii (6.957 × 10⁸ m): Rigel about 74
// (Shultz et al. 2014); Betelgeuse about 764 (Joyce et al. 2020); Stephenson 2-18 about 2,150
// (Fok et al. 2012), the largest estimate for any star and an uncertain one, so its edge is dashed.
const AU = 1.495978707e11, SUN = 6.957e8, TAU = Math.PI * 2;
const ease = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const GIANTS = [
  { name: 'Rigel', radius: 74, words: 'Rigel · set where the Sun is, it would nearly reach Mercury', short: 'Rigel · would nearly reach Mercury', core: '#dfe9ff', rim: '#8fb4ff' },
  { name: 'Betelgeuse', radius: 764, words: 'Betelgeuse · set where the Sun is, it would reach past Mars', short: 'Betelgeuse · would reach past Mars', core: '#ffd9a8', rim: '#ff8a4a' },
  { name: 'Stephenson 2-18', radius: 2150, words: 'Stephenson 2-18 · the largest star known would reach past Saturn', short: 'Stephenson 2-18 · would reach past Saturn', core: '#ffc0a0', rim: '#e0563a', unsure: true },
];
// For a frame W metres wide in which the Sun is at the middle (from about 6 AU up).
export function giants(ctx, w, h, W) {
  const centred = ease((W / AU - 6.5) / 3); if (centred < .01) return;
  const cx = w / 2, cy = h / 2, shown = [];
  for (const g of GIANTS) {
    const r = g.radius * SUN / W * w, a = centred * ease((r - 10) / 14) * (1 - ease((r - w * .75) / (w * .5)));
    if (a > .01) shown.push([g, r, a]);
  }
  ctx.save();
  // The largest first, so the smaller show inside them.
  for (const [g, r, a] of shown.reverse()) {
    const ball = ctx.createRadialGradient(cx - r * .25, cy - r * .3, r * .05, cx, cy, r);
    ball.addColorStop(0, g.core + '50'); ball.addColorStop(.7, g.rim + '2c'); ball.addColorStop(1, g.rim + '0a');
    ctx.globalAlpha = a; ctx.fillStyle = ball; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    ctx.globalAlpha = a * .8; ctx.strokeStyle = g.rim; ctx.lineWidth = 1.2; ctx.setLineDash(g.unsure ? [6, 6] : []); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    const k = g.name === 'Betelgeuse' ? -.9 : g.name === 'Rigel' ? -2.2 : -.45;       // where on the rim the name hangs
    redInk.tag(ctx, [w < 600 ? g.short : g.words], cx + r * Math.cos(k), cy + r * Math.sin(k), w, h, a);
  }
  ctx.restore();
}
