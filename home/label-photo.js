// A picture for every label's note, on the homepage films and in the scale app.
// A few notes name a chosen Wikimedia Commons file. Every other note uses the lead picture of
// the Wikipedia article it links to (or, failing that, of the article a search for its name
// finds first). Only freely licensed pictures are used, always with their author and licence.
// The browser asks Wikipedia itself; nothing about the visitor is sent.
const labelPhoto = (() => {
  'use strict';
  const API = 'https://en.wikipedia.org/w/api.php';
  // Chosen pictures, by note key. [Commons file, caption]
  const CHOSEN = {
    jupiter: ['Jupiter and its shrunken Great Red Spot.jpg', 'Jupiter imaged by the Hubble Space Telescope in 2014.'],
    earth: ['The Earth seen from Apollo 17.jpg', 'Earth photographed by the Apollo 17 crew.'],
    moon: ['FullMoon2010.jpg', 'The full Moon, photographed through a telescope.'],
    'milky way': ['Milky Way Arch.jpg', 'The Milky Way seen from Earth at Cerro Paranal. This is a sky panorama, not a view from outside the galaxy.'],
    'e. coli': ['E. coli Bacteria (7316101966).jpg', 'A scanning electron micrograph of E. coli bacteria; this is microscopy, not a naked-eye view.'],
  };
  const cache = new Map();
  const plain = html => new DOMParser().parseFromString(html || '', 'text/html').body.textContent.replace(/\s+/g, ' ').trim();
  const short = (t, n = 90) => t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;

  async function ask(params) {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 7000);
    try {
      const query = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', origin: '*', ...params });
      const response = await fetch(API + '?' + query, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      return response.ok ? await response.json() : null;
    } catch { return null; } finally { clearTimeout(timer); }
  }
  // The lead picture of an article, or of the first article a search finds. Wikipedia only
  // offers freely licensed files here (pilicense=free).
  async function leadPicture(source) {
    const params = { prop: 'pageimages', piprop: 'name', pilicense: 'free', redirects: '1' };
    const data = await ask(source.article ? { ...params, titles: source.article }
      : { ...params, generator: 'search', gsrsearch: source.search, gsrnamespace: '0', gsrlimit: '1' });
    const page = (data?.query?.pages || []).find(p => p.pageimage);
    return page ? { file: page.pageimage, article: page.title } : null;
  }
  async function fileInfo(file) {
    const data = await ask({ titles: 'File:' + file, prop: 'imageinfo', iiprop: 'url|extmetadata|mime', iiurlwidth: '640', iiextmetadatafilter: 'Artist|Credit|LicenseShortName|LicenseUrl' });
    const info = data?.query?.pages?.[0]?.imageinfo?.[0];
    if (!info || !/^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(info.mime)) return null;
    if (!/^https:\/\/upload\.wikimedia\.org\//.test(info.thumburl || '') || !/^https:\/\/(commons|en)\.wikipedia\.org\/|^https:\/\/commons\.wikimedia\.org\//.test(info.descriptionurl || '')) return null;
    const meta = info.extmetadata || {}, credit = short(plain(meta.Artist?.value) || plain(meta.Credit?.value)), licence = plain(meta.LicenseShortName?.value);
    if (!credit || !licence) return null;
    return { src: info.thumburl, width: info.thumbwidth, height: info.thumbheight, href: info.descriptionurl, credit, licence, licenceUrl: /^https:\/\//.test(meta.LicenseUrl?.value || '') ? meta.LicenseUrl.value : null };
  }
  // Where a note's picture comes from, in order of preference.
  function sources(note, label) {
    const out = [], chosen = CHOSEN[note.key] || CHOSEN[String(note.title || '').toLowerCase()];
    if (note.photo?.file) out.push({ file: note.photo.file, caption: note.photo.caption });
    else if (chosen) out.push({ file: chosen[0], caption: chosen[1] });
    for (const [, href] of note.read || []) {
      const article = /^https:\/\/en\.wikipedia\.org\/wiki\/([^?#]+)/.exec(href || '');
      if (article) { out.push({ article: decodeURIComponent(article[1]).replace(/_/g, ' ') }); continue; }
      const search = /^https:\/\/en\.wikipedia\.org\/w\/index\.php\?(.*)$/.exec(href || '');
      if (search) { const q = new URLSearchParams(search[1]).get('search'); if (q) out.push({ search: q }); }
    }
    // Nothing to follow: search for the note's title, then for the label as drawn.
    for (const text of [note.title, label]) {
      const name = String(text || '').replace(/^theory · /i, '').split(' · ')[0].trim();
      if (name && !out.some(s => (s.search || '').toLowerCase() === name.toLowerCase())) out.push({ search: name });
    }
    return out.slice(0, 4);
  }
  // A picture for a note: { src, width, height, href, credit, licence, licenceUrl, caption }, or null.
  function find(note, label) {
    if (!note || note.photo === false) return Promise.resolve(null);
    const list = sources(note, label), key = JSON.stringify(list);
    if (!cache.has(key)) cache.set(key, (async () => {
      for (const s of list) {
        const lead = s.file ? { file: s.file } : await leadPicture(s);
        if (!lead) continue;
        const info = await fileInfo(lead.file);
        if (!info) continue;
        return { ...info, caption: s.caption || (lead.article ? `From Wikipedia’s article on ${lead.article}.` : '') };
      }
      return null;
    })());
    return cache.get(key);
  }
  // A figure that holds its space while the picture loads, and goes away if none is found.
  function fill(figure, note, label, still = () => true) {
    figure.replaceChildren(); figure.hidden = false; figure.classList.add('label-photo', 'loading');
    const frame = document.createElement('div'); frame.className = 'label-photo-frame'; figure.append(frame);
    return find(note, label).then(p => {
      if (!still()) return;
      if (!p) { figure.hidden = true; figure.classList.remove('loading'); return; }
      if (p.width && p.height) frame.style.aspectRatio = `${p.width} / ${p.height}`;
      const img = document.createElement('img'); img.alt = note.title || label || ''; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
      const caption = document.createElement('figcaption'); caption.append(p.caption ? p.caption + ' ' : '');
      const source = Object.assign(document.createElement('a'), { href: p.href, target: '_blank', rel: 'noopener noreferrer', textContent: p.credit + ' · ' + p.licence }); caption.append(source);
      if (p.licenceUrl) caption.append(' ', Object.assign(document.createElement('a'), { href: p.licenceUrl, target: '_blank', rel: 'noopener noreferrer', textContent: 'Licence' }));
      img.addEventListener('load', () => { if (still()) figure.classList.remove('loading'); });
      img.addEventListener('error', () => { if (still()) figure.hidden = true; });
      frame.append(img); figure.append(caption); img.src = p.src;
    });
  }
  return { find, fill };
})();
