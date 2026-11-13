// Serves index.html with per-page SEO tags filled in, so crawlers and link previews see them without running JS.
import fs from 'node:fs';
import { seoFor } from './pages.js';
import { getSettings } from './settings.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let cache = { file: '', mtime: 0, html: '' };
const read = (file) => { const m = fs.statSync(file).mtimeMs; if (cache.file !== file || cache.mtime !== m) cache = { file, mtime: m, html: fs.readFileSync(file, 'utf8') }; return cache.html; };

export async function renderIndex(file, pathname) {
  const st = getSettings(); const seo = await seoFor(pathname);
  if (pathname.startsWith('/admin')) seo.noindex = true;
  const abs = (u) => (u && st.siteUrl && u.startsWith('/') ? st.siteUrl + u : u);
  const canonical = st.siteUrl ? st.siteUrl + (pathname.replace(/\/$/, '') || '/') : '';
  const tags = [
    `<meta property="og:site_name" content="${esc(st.siteName)}" />`, `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(seo.title)}" />`, `<meta property="og:description" content="${esc(seo.description)}" />`,
    seo.ogImage ? `<meta property="og:image" content="${esc(abs(seo.ogImage))}" />` : '', canonical ? `<meta property="og:url" content="${esc(canonical)}" /><link rel="canonical" href="${esc(canonical)}" />` : '',
    `<meta name="twitter:card" content="${seo.ogImage ? 'summary_large_image' : 'summary'}" />`, seo.noindex ? '<meta name="robots" content="noindex,nofollow" />' : '',
  ].filter(Boolean).join('\n    ');
  let html = read(file);
  if (seo.title) html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(seo.title)}</title>`);
  html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(seo.description)}" />`);
  return html.replace('</head>', `    ${tags}\n  </head>`);
}
