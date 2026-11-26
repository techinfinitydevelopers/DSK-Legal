// Media metadata (WordPress-style attachment details): alt text, title, caption, description, uploader, dimensions, where it is used.
import fs from 'node:fs';
import path from 'node:path';
import { UPLOAD_DIR, readJson, writeJson, collection } from './store.js';
import { REGISTRY } from './pages.js';

const all = () => readJson('media', {});
const MIME = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', pdf: 'application/pdf' };
const str = (v, n) => String(v ?? '').trim().slice(0, n);

/** Pixel size from the file header (null for PDFs / unreadable files). */
export function dimensions(buf) {
  try {
    if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    if (buf.subarray(0, 3).toString() === 'GIF') return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) };
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
    if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') {
      const t = buf.subarray(12, 16).toString();
      if (t === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
      if (t === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
      if (t === 'VP8L') { const b = buf.readUInt32LE(21); return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }; }
    }
  } catch { /* fall through */ }
  return null;
}

export function recordUpload(name, buf, user, original) {
  const m = all(); m[name] = { ...(m[name] || {}), uploadedBy: user, uploadedAt: new Date().toISOString(), original: str(original, 150), dim: dimensions(buf), title: m[name]?.title || str(original, 150).replace(/\.[^.]+$/, '') };
  writeJson('media', m);
}
export const dropMeta = (name) => { const m = all(); if (m[name]) { delete m[name]; writeJson('media', m); } };
export const metaOf = (name) => all()[name] || {};
/** Public site: alt text per uploaded file, { '/uploads/<file>': alt }. */
export const altMap = () => Object.fromEntries(Object.entries(all()).filter(([, m]) => m && m.alt).map(([f, m]) => [`/uploads/${f}`, m.alt]));

async function usedIn(url) {
  const out = []; const has = (o) => JSON.stringify(o).includes(url);
  for (const p of await collection('people')) if (has(p)) out.push({ kind: 'Team', label: p.name, href: `#/people/${p.slug}` });
  for (const p of await collection('posts')) if (has(p)) out.push({ kind: 'Knowledge', label: p.title, href: `#/posts/${p.slug}` });
  for (const p of await collection('practice')) if (has(p)) out.push({ kind: 'Practice', label: p.name, href: `#/practice/${p.slug}` });
  for (const p of await collection('custom')) if (has(p)) out.push({ kind: 'Page', label: p.title, href: `#/pages/custom/${p.slug}` });
  for (const [id, v] of Object.entries(readJson('pages', {}))) if (has(v)) out.push({ kind: 'Page SEO', label: REGISTRY.find((r) => r.id === id)?.name || id, href: `#/pages/${id}` });
  if (has(readJson('settings', {}))) out.push({ kind: 'Settings', label: 'Site settings', href: '#/settings/general' });
  return out;
}

export async function details(file) {
  const f = path.basename(file); const p = path.join(UPLOAD_DIR, f);
  const st = fs.statSync(p); const ext = f.split('.').pop().toLowerCase(); const url = `/uploads/${f}`;
  const m = all()[f] || {};
  let dim = m.dim;
  if (dim === undefined && ext !== 'pdf') { dim = dimensions(fs.readFileSync(p)); writeJson('media', { ...all(), [f]: { ...m, dim } }); }
  return { name: f, url, size: st.size, type: MIME[ext] || 'application/octet-stream', uploadedAt: m.uploadedAt || st.mtime.toISOString(), uploadedBy: m.uploadedBy || '—', dim: dim || null,
    alt: m.alt || '', title: m.title || '', caption: m.caption || '', description: m.description || '', usedIn: await usedIn(url) };
}
export function saveMeta(file, b = {}) {
  const f = path.basename(file); if (!fs.existsSync(path.join(UPLOAD_DIR, f))) throw new Error('Not found');
  const m = all(); m[f] = { ...(m[f] || {}), alt: str(b.alt, 300), title: str(b.title, 200), caption: str(b.caption, 500), description: str(b.description, 2000) };
  writeJson('media', m);
}
