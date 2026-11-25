// Red's homepage: one way of writing on the film's canvases, used by every scene (the engine's
// part names, the flight through the intake, the car, the street, the zoom into a person and
// the reel). One font, size and tracking; capitals that keep units as they are written (mm,
// µm, keV); words on a dark plate with the same padding everywhere; leaders from a dot on the
// thing named; captions at the page's own margin, stacked above the frame-width rail; the
// header and the rail kept clear. Colours are written in the green design, like everywhere
// else; the page's theme (theme.js) turns them for each colour and for light mode.
const redInk = (() => {
  'use strict';
  const TAU = Math.PI * 2;
  const TRACK = '1px', GAP = 8;
  let FONT = '10px ui-monospace, Consolas, monospace', LINE = 16, PX = 8, PY = 3;   // line height; a plate's padding across and up; between stacked plates
  // A size for the words that follow, as a share of the usual (the zoom writes a big thing's
  // name bigger than a small one's); in steps of a twentieth, so a name grows without jitter.
  let K = 1;
  function scale(s = 1) {
    const k = Math.round(clamp(s, .8, 1.8) * 20) / 20; if (k === K) return; K = k;
    FONT = (10 * k).toFixed(1) + 'px ui-monospace, Consolas, monospace'; LINE = 16 * k; PX = 8 * k; PY = 3 * k;
  }
  const INK = '#f2f1e7', DIM = '#a9b7ae', SOFT = '#c3d1c5', PLATE = '#091210', LEADER = '#d9efd7', ACCENT = '#c4fa79';
  const PLATE_ALPHA = .8, LEADER_ALPHA = .45;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // The page's side margin (style.css --pad), so captions line up with the header and the rail.
  const margin = w => clamp(w * .056, 22, 100);
  // The frame's free height: below the header and above the rail, in pixels from each edge.
  // red/story.js measures them; these are for the stills without motion.
  const room = { top: 84, bottom: 64 };
  function fit(top, bottom) { room.top = top; room.bottom = bottom; }

  // What is written in this frame, so later words keep off earlier ones: boxes as x, y, w, h.
  const MAX = 320, taken = new Float32Array(MAX * 4);
  let count = 0, footUsed = 0, headUsed = 0, now = 0, frames = 0, fading = false;
  function begin() { count = 0; footUsed = 0; headUsed = 0; now = performance.now(); frames++; fading = false; }
  // Whether a name is still fading in, so the scene asks for another frame.
  const settling = () => fading;
  // Words never cover words: a name that finds no free place is not written. So that names do
  // not jump about or blink, each keeps the place it had while that stays free, and fades in
  // over a quarter of a second when it comes back. Kept per text.
  const kept = new Map();
  function keptOf(key) {
    let k = kept.get(key);
    if (!k) { if (kept.size > 800) kept.clear(); k = { at: 0, since: now, last: frames }; kept.set(key, k); }
    if (frames - k.last > 3) k.since = now;                         // not written for a frame or two (a scene may begin twice a frame)
    return k;
  }
  function shown(k) { k.last = frames; const a = Math.min(1, .15 + (now - k.since) / 260); if (a < 1) fading = true; return a; }
  function take(x, y, w, h) { if (count >= MAX) return; const o = count++ * 4; taken[o] = x; taken[o + 1] = y; taken[o + 2] = w; taken[o + 3] = h; }
  function free(x, y, w, h) {
    for (let i = 0; i < count; i++) { const o = i * 4; if (x < taken[o] + taken[o + 2] && taken[o] < x + w && y < taken[o + 1] + taken[o + 3] && taken[o + 1] < y + h) return false; }
    return true;
  }

  // Capitals, keeping units as written after a number (76.4 mm, 40 µm, 248 keV, 24 GB) and µ
  // (its capital would be the Greek Μ). Remembered, so a frame makes no new strings.
  const UNIT = /([\d⁰¹²³⁴⁵⁶⁷⁸⁹])([\s ]?)(mm|cm|km|µm|nm|pm|fm|m|keV|GB|ms|rpm|kg)(?![A-Za-zµ])/g;
  const capsMemo = new Map();
  function caps(text) {
    let out = capsMemo.get(text);
    if (out === undefined) {
      out = text.toUpperCase().replace(/Μ/g, 'µ');
      for (const m of text.matchAll(UNIT)) { const at = m.index + m[1].length + m[2].length; out = out.slice(0, at) + m[3] + out.slice(at + m[3].length); }
      if (capsMemo.size > 600) capsMemo.clear();
      capsMemo.set(text, out);
    }
    return out;
  }
  function style(ctx) { ctx.font = FONT; if ('letterSpacing' in ctx) ctx.letterSpacing = TRACK; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; }
  // Widths, remembered per text (the font never changes).
  const widths = new Map();
  function measure(ctx, text) {
    const key = K === 1 ? text : K + text;
    let v = widths.get(key);
    if (v === undefined) { if (widths.size > 900) widths.clear(); v = ctx.measureText(text).width; widths.set(key, v); }
    return v;
  }
  function widest(ctx, lines) { let m = 0; for (let i = 0; i < lines.length; i++) m = Math.max(m, measure(ctx, lines[i])); return m; }
  // A plate's box for lines whose first starts at x, middle at y.
  const plateH = n => n * LINE + 2 * PY;

  // Two kinds of words (Brandon, 2026-11-21: "i would like to see distance labels and angle
  // labels and others labels differently if they're not clickable"). Words that open a note when
  // pressed sit on a plate with a bar of the accent at its left, like a button. Words that
  // open nothing (a measure along a line, an angle, a figure) have no plate: they are written bare
  // with a dark edge, as part of the drawing. A page says which words
  // open a note with links(); without it, names do and figures do not.
  let linked = null; const linkMemo = new Map();
  function links(fn) { linked = fn; linkMemo.clear(); }
  function opens(text) {
    if (!linked) return true;
    let v = linkMemo.get(text);
    if (v === undefined) { if (linkMemo.size > 900) linkMemo.clear(); v = !!linked(text); linkMemo.set(text, v); }
    return v;
  }
  // Lines (already in capitals), the first `strong` in full ink and the rest dimmer.
  // x, y: where the first line starts and its middle. Expects style(ctx) and ctx.save().
  function lines_(ctx, lines, x, y, alpha, strong, tw, plain = false) {
    if (plain || !opens(lines[0])) {
      ctx.globalAlpha = alpha; ctx.lineJoin = 'round'; ctx.lineWidth = 3.2; ctx.strokeStyle = PLATE; ctx.fillStyle = plain ? INK : SOFT;
      for (let i = 0; i < lines.length; i++) { ctx.strokeText(lines[i], x, y + LINE * i); ctx.fillText(lines[i], x, y + LINE * i); }
      return;
    }
    const top = y - LINE / 2 - PY, tall = plateH(lines.length);
    ctx.globalAlpha = alpha * PLATE_ALPHA; ctx.fillStyle = PLATE; ctx.fillRect(x - PX, top, tw + 2 * PX, tall);
    ctx.globalAlpha = alpha * .9; ctx.fillStyle = ACCENT; ctx.fillRect(x - PX, top, 2, tall);
    ctx.globalAlpha = alpha;
    for (let i = 0; i < lines.length; i++) { ctx.fillStyle = i < strong ? INK : DIM; ctx.fillText(lines[i], x, y + LINE * i); }
  }
  function dot(ctx, x, y, alpha) { ctx.globalAlpha = alpha; ctx.fillStyle = ACCENT; ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill(); }
  // A leader: from the dot on the thing, to an elbow, along to the plate.
  function leader(ctx, ax, ay, ex, ey, tx, alpha) {
    ctx.globalAlpha = alpha * LEADER_ALPHA; ctx.strokeStyle = LEADER; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.lineTo(tx, ey); ctx.stroke();
  }

  // One line too wide for the room is written on two: the name, then what follows its " · ".
  // On a narrow frame (a phone) the room is three fifths of its width, so that a name does not
  // run across the whole picture. Remembered per line; `whole` gives back the full line for
  // either half (a press on the second line opens the same note as the first).
  const splitMemo = new Map(), wholes = new Map();
  const roomIn = (w, m) => w < 600 ? Math.min(w - 2 * m - 2 * PX, w * .6) : w - 2 * m - 2 * PX;
  const whole = t => wholes.get(t) || t;
  function fitted(ctx, lines, room) {
    if (lines.length !== 1 || room <= 0 || measure(ctx, lines[0]) <= room) return lines;
    let two = splitMemo.get(lines[0]);
    if (two === undefined) { const at = lines[0].indexOf(' · '); two = at > 0 ? [lines[0].slice(0, at), lines[0].slice(at + 3)] : null; if (splitMemo.size > 400) { splitMemo.clear(); wholes.clear(); } splitMemo.set(lines[0], two); }
    if (two) { wholes.set(two[0], lines[0]); wholes.set(two[1], lines[0]); }   // the one written last owns a tail two names share
    return two || lines;
  }
  // Words (in any case) on a plate at x, y (first line's start and middle); align 'center'
  // centres them on x. Returns false where they would cover words already written, if `avoid`.
  // within: the frame's width, to keep the plate inside it.
  function block(ctx, words, x, y, alpha, { strong = 1, align = 'left', avoid = false, within = 0, plain = false } = {}) {
    if (alpha < .02) return true;
    ctx.save(); style(ctx);
    const lines = fitted(ctx, capsAll(words), within ? roomIn(within, 10) : 0), tw = widest(ctx, lines);
    let left = align === 'center' ? x - tw / 2 : x;
    if (within) left = clamp(left, 10 + PX, within - 10 - PX - tw);
    const bx = left - PX, by = y - LINE / 2 - PY, bw = tw + 2 * PX, bh = plateH(lines.length);
    if (avoid && !free(bx, by, bw, bh)) { ctx.restore(); return false; }
    const k = avoid ? keptOf(lines[0]) : null;
    take(bx, by, bw, bh); lines_(ctx, lines, left, y, alpha * (k ? shown(k) : 1), strong, tw, plain); ctx.restore(); return true;
  }
  // A name for a point on the picture (ax, ay): a dot, a leader and the words on a plate beside
  // it, up and to the right where there is room, else in the next free place round it. Within
  // the frame's free height. Returns whether it found a place.
  const SIDES = [[1, -1], [1, 1], [-1, -1], [-1, 1]];
  // Eight places, each side near then farther; a name keeps its place while it is free.
  const PLACES = [[1, -1, 1], [1, 1, 1], [-1, -1, 1], [-1, 1, 1], [1, -1, 2.2], [1, 1, 2.2], [-1, -1, 2.2], [-1, 1, 2.2]];
  function tag(ctx, words, ax, ay, w, h, alpha, { strong = 1, reach = 18, rise = 24 } = {}) {
    if (alpha < .02) return true;
    ctx.save(); style(ctx);
    reach *= K; rise *= K;
    const m = 10, lines = fitted(ctx, capsAll(words), roomIn(w, m)), tw = widest(ctx, lines), bw = tw + 2 * PX, bh = plateH(lines.length), Kept = keptOf(lines[0]);
    for (let n = 0; n < PLACES.length; n++) {
      const k = (Kept.at + n) % PLACES.length, [sx, sy, far] = PLACES[k], left = clamp(sx > 0 ? ax + reach * far + PX : ax - reach * far - PX - tw, m + PX, w - m - PX - tw);
      const y = clamp(ay + sy * rise * far, room.top + LINE / 2 + PY, h - room.bottom - bh + LINE / 2 + PY);
      const bx = left - PX, by = y - LINE / 2 - PY;
      if (!free(bx, by, bw, bh)) continue;
      take(bx, by, bw, bh); Kept.at = k;
      const a = alpha * shown(Kept), end = left < ax ? bx + bw : bx;      // the plate's near side
      leader(ctx, ax, ay, end + (left < ax ? 8 : -8), y, end, a); dot(ctx, ax, ay, a);
      lines_(ctx, lines, left, y, a, strong, tw);
      ctx.restore(); return true;
    }
    ctx.restore(); return false;
  }
  // A name in a column beside the picture (the engine apart): a leader from the part's dot to
  // the column, the words at x (their start) and y.
  function aside(ctx, words, ax, ay, x, y, right, alpha) {
    if (alpha < .02) return;
    ctx.save(); style(ctx);
    const t = caps(words), tw = measure(ctx, t), end = right ? x - PX : x + tw + PX;
    leader(ctx, ax, ay, end + (right ? -14 : 14), y, end, alpha); dot(ctx, ax, ay, alpha);
    take(x - PX, y - LINE / 2 - PY, tw + 2 * PX, plateH(1));
    lines_(ctx, [t], x, y, alpha, 1, tw); ctx.restore();
  }
  // A caption at the page's margin: at the foot of the frame above the rail (stacked over any
  // caption already there), or at its head under the header. Each of `words` is one line,
  // wrapped to the room; the first `strong` lines in full ink.
  function caption(ctx, w, h, words, alpha, { strong = 1, head = false, max = 560 } = {}) {
    if (alpha < .02) return;
    ctx.save(); style(ctx);
    const x = margin(w), wrapped = wrap(ctx, words, Math.min(max, w - 2 * x), strong), lines = wrapped.lines, tall = plateH(lines.length);
    const y = head ? room.top + headUsed + LINE / 2 + PY : h - room.bottom - 10 - footUsed - tall + LINE / 2 + PY;
    if (head) headUsed += tall + GAP; else footUsed += tall + GAP;
    const tw = widest(ctx, lines);
    take(x - PX, y - LINE / 2 - PY, tw + 2 * PX, tall);
    lines_(ctx, lines, x, y, alpha, wrapped.strong, tw); ctx.restore();
  }
  // Text without a plate, for names on a map and notes on a drawing.
  // keep: later words keep off it too.
  // keep: later words keep off it too, and it is not written where words already are.
  function note(ctx, words, x, y, alpha, align = 'left', tone = SOFT, keep = false) {
    if (alpha < .02) return;
    ctx.save(); style(ctx); ctx.textAlign = align;
    const t = caps(words);
    if (keep) {
      const tw = measure(ctx, t), left = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x;
      if (!free(left - 4, y - LINE / 2, tw + 8, LINE)) { ctx.restore(); return; }
      take(left - 4, y - LINE / 2, tw + 8, LINE); alpha *= shown(keptOf(t));
    }
    ctx.globalAlpha = alpha; ctx.fillStyle = tone; ctx.fillText(t, x, y);
    ctx.restore();
  }
  // A measured figure on a dimension line, centred on x, y.
  const figureLines = new Map();
  function figure(ctx, text, x, y, alpha, within = 0) { let l = figureLines.get(text); if (!l) { if (figureLines.size > 300) figureLines.clear(); l = [text]; figureLines.set(text, l); } return block(ctx, l, x, y, alpha, { align: 'center', within, avoid: true, plain: true }); }
  const figureWidth = (ctx, text) => { ctx.save(); style(ctx); const v = measure(ctx, caps(text)) + 2 * PX; ctx.restore(); return v; };

  // Lines in capitals, remembered per array of words (the scenes keep theirs).
  const capsLines = new WeakMap();
  function capsAll(words) {
    let out = capsLines.get(words);
    if (!out || out.length !== words.length || out.some((t, i) => t !== caps(words[i]))) { out = words.map(caps); capsLines.set(words, out); }
    return out;
  }
  // Wrapped lines, remembered per words and room.
  const wrapMemo = new Map();
  function wrap(ctx, words, room_, strong) {
    const key = words.join('\n') + '|' + Math.round(room_) + '|' + strong;
    let out = wrapMemo.get(key);
    if (out) return out;
    const lines = []; let strongOut = 0;
    words.forEach((line, i) => {
      let now = '';
      for (const word of caps(line).split(' ')) {
        const next = now ? now + ' ' + word : word;
        if (now && measure(ctx, next) > room_) { lines.push(now.replace(/ ·$/, '')); if (i < strong) strongOut++; now = word === '·' ? '' : word; }
        else now = next;
      }
      if (now) { lines.push(now.replace(/^· /, '')); if (i < strong) strongOut++; }
    });
    if (wrapMemo.size > 200) wrapMemo.clear();
    out = { lines, strong: strongOut }; wrapMemo.set(key, out); return out;
  }

  return { FONT, LINE, PX, PY, scale, links, opens, whole, INK, DIM, SOFT, PLATE, LEADER, ACCENT, PLATE_ALPHA, LEADER_ALPHA, room, fit, margin, begin, settling, take, free, caps, style, measure,
    block, tag, aside, caption, note, figure, figureWidth, dot, leader };
})();
