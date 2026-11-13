// Everything that needs a writable disk: admin API, uploads, published content, form intake, SEO head, sitemap. Mounted only when the CMS is enabled.
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import cmsRouter from './routes.js';
import { collection, peekCollection, UPLOAD_DIR, PRIVATE_DIR, submissions, saveSubmissions, uid } from './store.js';
import { bootstrapAdmin } from './auth.js';
import { notifySubmission } from './mail.js';
import { getSettings } from './settings.js';
import { REGISTRY, seoFor, savedPages } from './pages.js';
import { renderIndex } from './head.js';
import { savedMenu, footerMenus } from './menu.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const t = (v, n) => String(v ?? '').slice(0, n).trim();
const hits = new Map();
const limited = (ip, max = 8) => { const now = Date.now(); const a = (hits.get(ip) || []).filter((x) => now - x < 3600e3); a.push(now); hits.set(ip, a); return a.length > max; };

export async function mountCms(app, dist) {
  bootstrapAdmin();
  await Promise.all(['people', 'posts', 'practice', 'custom', 'jobs'].map(collection)); // seed + warm the cache
  app.use('/api/admin', cmsRouter((slug) => { const p = peekCollection('people').find((x) => x.slug === slug); return p && { name: p.name, level: p.level, office: p.office, slug: p.slug }; }));
  app.use('/uploads', express.static(UPLOAD_DIR, { setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff') }));

  /** Content the public site overlays on its built-in data (empty arrays are ignored client-side). */
  app.get('/api/content', async (req, res) => {
    const [people, practice, posts, custom, jobs] = await Promise.all([collection('people'), collection('practice'), collection('posts'), collection('custom'), collection('jobs')]);
    const live = posts.filter((p) => p.published !== false);
    const st = getSettings(); const page = req.query.path ? await seoFor(String(req.query.path)) : null;
    res.set('Cache-Control', 'no-cache').json({
      people, practice,
      knowledge: live.map((p) => ({ title: p.title, href: `https://dsklegal.com/${p.slug}/`, date: p.date, excerpt: p.excerpt, type: p.type, authors: p.authors, summary: p.summary })),
      articles: live.map((p) => ({ slug: p.slug, title: p.title, pdf: p.pdf, blocks: p.blocks })),
      custom: custom.filter((c) => c.published !== false).map((c) => ({ slug: c.slug, title: c.title, lede: c.lede, blocks: c.blocks })),
      jobs: jobs.filter((j) => j.published !== false && !(j.closingDate && j.closingDate < new Date().toISOString().slice(0, 10))).map(({ slug, title, jobId, department, office, type, experience, summary, responsibilities, requirements, postedOn, closingDate }) => ({ slug, title, jobId, department, office, type, experience, summary, responsibilities, requirements, postedOn, closingDate })),
      menu: savedMenu(), footerMenus: footerMenus(),
      site: { contactEmail: st.contactEmail, phone: st.phone, siteName: st.siteName }, seo: page,
    });
  });

  app.post('/api/subscribe', (req, res) => {
    const email = t(req.body?.email, 200);
    if (!EMAIL.test(email)) return res.status(400).json({ error: 'Valid email required' });
    if (limited(req.ip, 20)) return res.status(429).json({ error: 'Too many requests' });
    const all = submissions();
    if (!all.some((s) => s.type === 'subscribe' && s.data.email.toLowerCase() === email.toLowerCase())) saveSubmissions([{ id: uid(), type: 'subscribe', at: new Date().toISOString(), read: false, data: { email } }, ...all]);
    res.json({ ok: true });
  });

  app.post('/api/forms/:type', express.json({ limit: '8mb' }), (req, res) => {
    const type = req.params.type;
    if (!['contact', 'internship', 'job'].includes(type)) return res.status(404).json({ error: 'Unknown form' });
    if (limited(req.ip)) return res.status(429).json({ error: 'Too many submissions. Please try later.' });
    const body = req.body || {};
    if (body.website) return res.json({ ok: true }); // honeypot
    const fields = {};
    for (const [k, v] of Object.entries(body.fields || {}).slice(0, 120)) fields[t(k, 80)] = t(Array.isArray(v) ? v.join(', ') : v, 4000);
    if (type === 'contact' && (!fields.name || !EMAIL.test(fields.email || '') || !fields.message)) return res.status(400).json({ error: 'Name, valid email and message are required.' });
    const sub = { id: uid(), type, at: new Date().toISOString(), read: false, data: fields };
    const cv = body.cv;
    if (cv?.data) {
      const m = /^data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(cv.data);
      const ext = m && { 'application/pdf': 'pdf', 'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx', 'application/rtf': 'rtf', 'text/rtf': 'rtf' }[m[1]];
      const buf = ext && Buffer.from(m[2], 'base64');
      if (!buf || buf.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'CV must be a PDF, DOC, DOCX or RTF up to 5 MB.' });
      sub.cv = `${sub.id}.${ext}`; sub.cvName = t(cv.name, 120).replace(/[^\w. -]/g, '_') || sub.cv;
      fs.writeFileSync(path.join(PRIVATE_DIR, sub.cv), buf);
    }
    saveSubmissions([sub, ...submissions()]);
    res.json({ ok: true });
    notifySubmission(sub).catch(() => {}); // email after responding; the result is recorded on the entry
  });

  // Absolute URLs use the Site URL setting, else the address the request came in on (so the sitemap works with no configuration).
  const origin = (req, st) => (st.siteUrl || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
  app.get('/robots.txt', (req, res) => {
    const st = getSettings();
    res.type('text/plain').send(st.noindexSite ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${origin(req, st)}/sitemap.xml\n`);
  });
  app.get('/sitemap.xml', async (req, res) => {
    const st = getSettings(); if (st.noindexSite) return res.status(404).type('text/plain').send('Not available');
    const saved = savedPages(); const paths = REGISTRY.filter((p) => !saved[p.id]?.noindex).map((p) => p.path);
    const [people, practice, posts, custom] = await Promise.all([collection('people'), collection('practice'), collection('posts'), collection('custom')]);
    paths.push(...custom.filter((c) => c.published !== false && !c.noindex).map((c) => `/${c.slug}`), ...posts.filter((p) => p.published !== false).map((p) => `/knowledge/${p.slug}`), ...people.map((p) => `/people/${p.slug}`), ...practice.map((p) => `/practice/${p.slug}`));
    const esc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `  <url><loc>${esc(origin(req, st) + (p === '/' ? '/' : p))}</loc></url>`).join('\n')}\n</urlset>`);
  });

  if (fs.existsSync(dist)) {
    app.use(express.static(dist, { index: false }));
    const STATIC = new Set(['/', '/about', '/awards', '/people', '/practice', '/sectors', '/knowledge', '/careers', '/careers/internship', '/careers/apply', '/contact', '/admin']);
    /** Does this URL exist? Unknown ones still get the app shell (it draws the 404 page) but with a real 404 status. */
    const exists = async (p) => {
      p = p.replace(/\/+$/, '') || '/';
      p = p.replace(/^\/v[1-4](?=\/|$)/, '') || '/'; // old draft URLs redirect client-side
      if (STATIC.has(p)) return true;
      let m;
      if ((m = p.match(/^\/people\/([^/]+)$/))) return (await collection('people')).some((x) => x.slug === m[1]);
      if ((m = p.match(/^\/practice\/([^/]+)$/))) return (await collection('practice')).some((x) => x.slug === m[1]);
      if ((m = p.match(/^\/knowledge\/([^/]+)$/))) return (await collection('posts')).some((x) => x.slug === m[1] && x.published !== false);
      if ((m = p.match(/^\/([a-z0-9-]+)$/))) return (await collection('custom')).some((x) => x.slug === m[1] && x.published !== false);
      return false;
    };
    app.get('*', async (req, res) => {
      if (req.path.startsWith('/api/') || path.extname(req.path)) return res.status(404).json({ error: 'Not found' });
      const status = (await exists(req.path)) ? 200 : 404;
      try { res.status(status).type('html').send(await renderIndex(path.join(dist, 'index.html'), req.path)); } catch { res.status(status).sendFile(path.join(dist, 'index.html')); }
    });
  }
}
