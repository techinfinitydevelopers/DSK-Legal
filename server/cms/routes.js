import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { auditFacets, collection, saveCollection, restoreCollection, COLLECTIONS, KEYS, UPLOAD_DIR, PRIVATE_DIR, logActivity, readAudit, submissions, saveSubmissions, readJson, uid } from './store.js';
import { getSettings, saveSettings } from './settings.js';
import { listPages, savePage, savedPages } from './pages.js';
import { listTexts, saveTexts } from './texts.js';
import { getFooter, saveFooter, DEFAULT_FOOTER } from './footer.js';
import { getMenu, saveMenu, DEFAULT_MENU, listMenus, createMenu, updateMenu, deleteMenu, LOCATIONS } from './menu.js';
import { publicMail, saveMail, sendTest } from './mail.js';
import { recordUpload, dropMeta, details as mediaDetails, saveMeta } from './media.js';
import { buildZip, createBackup, listBackups, backupPath, restoreZip } from './backup.js';
import { requireAuth, capsOf, ROLES, login, logout, listUsers, addUser, removeUser, setPassword, updateUser, verifyPassword, users } from './auth.js';
import { FORMS, FORM_IDS, TYPE_LABEL, getForm, isCustom, defaultForm, saveForm, resetForm } from './forms.js';
import { getFaqs, saveFaqs } from './faqs.js';
import { getConfig as chatGet, saveConfig as chatSave, defaultConfig as chatDefault, getEntries as kbGet, saveEntries as kbSave, kbStats, debug as chatDebug, unanswered as chatUnanswered, clearUnanswered, summary as chatSummary, invalidate as kbInvalidate } from './chat/chat.js';

// ---- sanitising: article HTML is rendered with dangerouslySetInnerHTML, so only a small tag whitelist survives ----
const ALLOWED = new Set(['a', 'b', 'strong', 'i', 'em', 'u', 'sup', 'sub', 'br']);
export function cleanHtml(s) {
  return String(s ?? '').replace(/<!--[\s\S]*?-->/g, '').replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (m, tag, attrs) => {
    tag = tag.toLowerCase();
    if (!ALLOWED.has(tag)) return '';
    if (m.startsWith('</')) return `</${tag}>`;
    if (tag === 'a') {
      const href = (attrs.match(/href\s*=\s*"([^"]*)"/i) || attrs.match(/href\s*=\s*'([^']*)'/i) || [])[1] || '';
      return /^(https?:\/\/|mailto:|\/|#)/i.test(href.trim()) ? `<a href="${href.trim().replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">` : '<a>';
    }
    return `<${tag}>`;
  }).replace(/<(?![/a-zA-Z])/g, '&lt;');
}
const str = (v, max = 5000) => String(v ?? '').slice(0, max).trim();
const list = (v, max = 400) => (Array.isArray(v) ? v : []).map((x) => str(x, 4000)).filter(Boolean).slice(0, max);
const safeUrl = (v) => { v = str(v, 500); return !v || /^(https?:\/\/|\/)/i.test(v) ? v : ''; };
const slugify = (s) => str(s, 200).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);

const cleanBlocks = (arr, byline) => (Array.isArray(arr) ? arr : []).slice(0, 500).map((x) => {
  if (x?.t === 'hr') return { t: 'hr' };
  if (x?.t === 'ul' || x?.t === 'ol') return { t: x.t, items: (Array.isArray(x.items) ? x.items : []).map((i) => cleanHtml(str(i, 4000))).filter(Boolean) };
  const t = x?.t === 'h3' || (byline && x?.t === 'byline') ? x.t : 'p';
  return { t, h: cleanHtml(str(x?.h, 8000)) };
}).filter((x) => x.t === 'hr' || x.h || x.items?.length);
const RESERVED = new Set(['admin', 'api', 'uploads', 'p', 'about', 'awards', 'people', 'practice', 'sectors', 'knowledge', 'careers', 'contact', 'faq', 'assets', 'img', 'fonts', 'robots', 'sitemap', 'index', 'logo', 'favicon', 'v1', 'v2', 'v3', 'v4']);
const imgUrl = (v) => { v = str(v, 400); return !v || /^(https?:\/\/|\/)/i.test(v) ? v : ''; };

// ---- per-collection validators: whatever the browser sends is rebuilt field by field ----
const clean = {
  people(b, old = {}) {
    const name = str(b.name, 120); if (!name) throw new Error('Name is required');
    const parts = name.split(/\s+/);
    const practices = list(b.practices, 30);
    return {
      ...old, slug: old.slug || slugify(name), name, first: str(b.first, 80) || parts[0], last: str(b.last, 80) || parts.slice(1).join(' ') || parts[0],
      level: str(b.level, 80), office: str(b.office, 60), phone: str(b.phone, 60), email: str(b.email, 120), linkedin: safeUrl(b.linkedin), photo: safeUrl(b.photo),
      practices, tags: practices, sectors: list(b.sectors, 40), education: list(b.education), memberships: list(b.memberships), languages: list(b.languages, 20),
      bio: list(b.bio, 30), activities: list(b.activities), matters: list(b.matters), awards: list(b.awards),
    };
  },
  posts(b, old = {}) {
    const title = str(b.title, 300); if (!title) throw new Error('Title is required');
    const blocks = cleanBlocks(b.blocks, true);
    return {
      ...old, slug: old.slug || slugify(title), title, date: str(b.date, 40), type: ['Articles', 'Monthly Newsletters', 'Practice Area Newsletters'].includes(b.type) ? b.type : 'Articles',
      authors: str(b.authors, 400), summary: str(b.summary, 1200), excerpt: str(b.summary, 300), pdf: safeUrl(b.pdf), blocks, published: b.published !== false,
    };
  },
  jobs(b, old = {}) {
    const title = str(b.title, 200); if (!title) throw new Error('Job title is required');
    return {
      ...old, slug: old.slug || (['new', 'applications'].includes(slugify(title)) ? `${slugify(title)}-job` : slugify(title)), title, jobId: str(b.jobId, 40), department: ['Legal', 'Support Function'].includes(b.department) ? b.department : 'Legal',
      office: str(b.office, 60), type: ['Full-time', 'Part-time', 'Contract', 'Internship'].includes(b.type) ? b.type : 'Full-time', experience: str(b.experience, 80),
      summary: str(b.summary, 1200), responsibilities: list(b.responsibilities, 40), requirements: list(b.requirements, 40),
      postedOn: str(b.postedOn, 40) || old.postedOn || new Date().toISOString().slice(0, 10), closingDate: str(b.closingDate, 40), published: b.published !== false,
    };
  },
  custom(b, old = {}) {
    const title = str(b.title, 200); if (!title) throw new Error('Title is required');
    const slug = old.slug || slugify(b.slug || title);
    if (!slug) throw new Error('Web address is required');
    if (!old.slug && RESERVED.has(slug)) throw new Error(`“${slug}” is reserved by the site. Choose another web address.`);
    return { ...old, slug, title, lede: str(b.lede, 600), blocks: cleanBlocks(b.blocks, false), metaTitle: str(b.metaTitle, 120), metaDescription: str(b.metaDescription, 320), ogImage: imgUrl(b.ogImage), noindex: b.noindex === true, published: b.published !== false };
  },
  practice(b, old = {}) {
    const name = str(b.name, 120); if (!name) throw new Error('Name is required');
    return {
      ...old, slug: old.slug || slugify(name), name, filter: old.filter || name, src: old.src || '', intro: list(b.intro, 20),
      services: (Array.isArray(b.services) ? b.services : []).slice(0, 60).map((s) => ({
        title: str(s?.title, 200),
        items: (Array.isArray(s?.items) ? s.items : []).slice(0, 100).map((i) => ({ t: i?.t === 'li' ? 'li' : 'p', x: str(i?.x, 4000) })).filter((i) => i.x),
      })).filter((s) => s.title),
      contacts: list(b.contactSlugs, 20),
    };
  },
};

export default function cmsRouter(peopleLookup) {
  const r = express.Router();
  r.use(express.json({ limit: '9mb' }));
  const auth = requireAuth();
  const can = (req, cap) => capsOf(req.userFull?.role).includes(cap);

  r.post('/login', login);
  r.post('/logout', logout);
  r.get('/me', auth, (req, res) => res.json({ user: req.user }));

  // ---- dashboard ----
  r.get('/stats', auth, async (req, res) => {
    const [people, posts, practice, jobs] = await Promise.all(['people', 'posts', 'practice', 'jobs'].map(collection));
    const subs = submissions();
    res.json({
      counts: { jobs: jobs.filter((j) => j.published !== false).length, people: people.length, posts: posts.length, practice: practice.length, media: fs.readdirSync(UPLOAD_DIR).length, submissions: can(req, 'inbox') ? subs.filter((s) => s.type !== 'subscribe').length : null, enquiries: can(req, 'inbox') ? subs.filter((s) => s.type === 'contact').length : null, applications: can(req, 'inbox') ? subs.filter((s) => s.type === 'job' || s.type === 'internship').length : null, subscribers: can(req, 'inbox') ? subs.filter((s) => s.type === 'subscribe').length : null },
      unread: can(req, 'inbox') ? subs.filter((s) => !s.read && s.type === 'contact').length : 0,
      unreadApps: can(req, 'inbox') ? subs.filter((s) => !s.read && (s.type === 'job' || s.type === 'internship')).length : 0,
      recentSubs: can(req, 'inbox') ? subs.slice(0, 6) : [],
      recentPosts: posts.slice(0, 5).map((p) => ({ slug: p.slug, title: p.title, date: p.date, type: p.type })),
      activity: readAudit({ limit: 12 }).rows,
    });
  });

  // ---- content collections ----
  const known = (req, res, next) => (COLLECTIONS.includes(req.params.name) ? next() : res.status(404).json({ error: 'Unknown collection' }));
  r.get('/c/:name', auth, known, async (req, res) => res.json(await collection(req.params.name)));
  r.get('/c/:name/:slug', auth, known, async (req, res) => {
    const it = (await collection(req.params.name)).find((x) => x.slug === req.params.slug);
    it ? res.json(it) : res.status(404).json({ error: 'Not found' });
  });
  const upsert = async (req, res, creating) => {
    const { name } = req.params; const key = KEYS[name];
    const cap = name === 'jobs' ? 'jobs' : 'content';
    let seoOnly = false; // SEO role may only touch the meta fields of an existing custom page
    if (!can(req, cap)) { if (name === 'custom' && !creating && can(req, 'seo')) seoOnly = true; else return res.status(403).json({ error: 'Your role is not allowed to edit this.' }); }
    try {
      const all = await collection(name);
      const idx = creating ? -1 : all.findIndex((x) => x[key] === req.params.slug);
      if (!creating && idx < 0) return res.status(404).json({ error: 'Not found' });
      let item = clean[name](req.body || {}, creating ? {} : all[idx]);
      if (seoOnly) item = { ...all[idx], metaTitle: item.metaTitle, metaDescription: item.metaDescription, ogImage: item.ogImage, noindex: item.noindex };
      if (creating) {
        let base = item.slug || uid(); let s = base, n = 2;
        while (all.some((x) => x[key] === s)) s = `${base}-${n++}`;
        item.slug = s;
      }
      if (name === 'practice') item.contacts = item.contacts.map((s) => peopleLookup(s)).filter(Boolean);
      const next = creating ? [item, ...all] : all.map((x, i) => (i === idx ? item : x));
      saveCollection(name, next);
      logActivity(req, creating ? 'created' : 'updated', `${name}: ${item.name || item.title}`);
      res.json(item);
    } catch (e) { res.status(400).json({ error: e.message }); }
  };
  r.post('/c/:name', auth, known, (req, res) => upsert(req, res, true));
  r.put('/c/:name/:slug', auth, known, (req, res) => upsert(req, res, false));
  r.delete('/c/:name/:slug', auth, known, async (req, res) => {
    const { name } = req.params;
    if (!can(req, name === 'jobs' ? 'jobs' : 'content')) return res.status(403).json({ error: 'Your role is not allowed to delete this.' });
    const all = await collection(name);
    const it = all.find((x) => x.slug === req.params.slug);
    if (!it) return res.status(404).json({ error: 'Not found' });
    saveCollection(name, all.filter((x) => x !== it));
    logActivity(req, 'deleted', `${name}: ${it.name || it.title}`);
    res.json({ ok: true });
  });
  r.post('/c/:name/restore-defaults', requireAuth('admin'), known, async (req, res) => {
    const d = await restoreCollection(req.params.name);
    logActivity(req, 'restored defaults', req.params.name);
    res.json({ count: d.length });
  });

  // ---- media library (images + PDF; SVG refused: it can carry script) ----
  const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'application/pdf': 'pdf' };
  r.get('/media', auth, async (_req, res) => {
    const hay = JSON.stringify([await collection('people'), await collection('posts'), await collection('practice'), readJson('pages', {}), readJson('settings', {})]);
    const files = fs.readdirSync(UPLOAD_DIR).map((f) => { const st = fs.statSync(path.join(UPLOAD_DIR, f)); const url = `/uploads/${f}`; return { name: f, url, size: st.size, at: st.mtime.toISOString(), used: hay.split(url).length - 1 }; });
    res.json(files.sort((a, b) => b.at.localeCompare(a.at)));
  });
  r.get('/media/:file', auth, async (req, res) => { try { res.json(await mediaDetails(req.params.file)); } catch { res.status(404).json({ error: 'Not found' }); } });
  r.put('/media/:file', requireAuth('media'), async (req, res) => {
    try { saveMeta(req.params.file, req.body); logActivity(req, 'edited media details', path.basename(req.params.file)); res.json(await mediaDetails(req.params.file)); } catch (e) { res.status(400).json({ error: e.message }); }
  });
  r.post('/media', requireAuth('media'), (req, res) => {
    const m = /^data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body?.data || ''));
    const ext = m && TYPES[m[1]];
    if (!ext) return res.status(400).json({ error: 'Only JPG, PNG, WebP, GIF or PDF files are allowed.' });
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 6 * 1024 * 1024) return res.status(400).json({ error: 'File is larger than 6 MB.' });
    const base = slugify(String(req.body.name || 'file').replace(/\.[^.]+$/, '')) || 'file';
    const name = `${base}-${uid().slice(0, 6)}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
    recordUpload(name, buf, req.user.username, req.body.name);
    logActivity(req, 'uploaded', name);
    res.json({ name, url: `/uploads/${name}`, size: buf.length });
  });
  r.delete('/media/:file', requireAuth('media'), (req, res) => {
    const f = path.basename(req.params.file);
    try { fs.unlinkSync(path.join(UPLOAD_DIR, f)); dropMeta(f); logActivity(req, 'deleted', f); res.json({ ok: true }); } catch { res.status(404).json({ error: 'Not found' }); }
  });

  // ---- submissions (contact, applications, subscribers) ----
  r.get('/submissions', requireAuth('inbox'), (_req, res) => res.json(submissions()));
  r.patch('/submissions/:id', requireAuth('inbox'), (req, res) => {
    saveSubmissions(submissions().map((s) => (s.id === req.params.id ? { ...s, read: req.body?.read !== false } : s)));
    res.json({ ok: true });
  });
  r.delete('/submissions/:id', requireAuth('inbox'), (req, res) => {
    const s = submissions().find((x) => x.id === req.params.id);
    if (s?.cv) fs.rm(path.join(PRIVATE_DIR, path.basename(s.cv)), { force: true }, () => {});
    saveSubmissions(submissions().filter((x) => x.id !== req.params.id));
    res.json({ ok: true });
  });
  r.get('/submissions/:id/cv', requireAuth('inbox'), (req, res) => {
    const s = submissions().find((x) => x.id === req.params.id);
    const f = s?.cv && path.join(PRIVATE_DIR, path.basename(s.cv));
    if (!f || !fs.existsSync(f)) return res.status(404).json({ error: 'No CV' });
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.download(f, s.cvName || path.basename(f));
  });
  r.get('/export/subscribers.csv', requireAuth('inbox'), (_req, res) => {
    const rows = submissions().filter((s) => s.type === 'subscribe');
    res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
    res.send('email,subscribed_at\n' + rows.map((s) => `${String(s.data.email).replace(/^[=+\-@]/, "'$&")},${s.at}`).join('\n'));
  });

  // ---- users + own password ----
  r.get('/users', requireAuth('admin'), (_req, res) => res.json(listUsers()));
  r.post('/users', requireAuth('admin'), (req, res) => {
    const { username = '', name, email, role, password = '' } = req.body || {};
    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) return res.status(400).json({ error: 'Username: 3–32 letters, numbers, . _ -' });
    if (String(password).length < 10) return res.status(400).json({ error: 'Password must be at least 10 characters.' });
    try { const u = addUser({ username, name: str(name, 80), email: str(email, 120), role, password }); logActivity(req, 'added user', username); res.json(u); } catch (e) { res.status(400).json({ error: e.message }); }
  });
  r.put('/users/:id/role', requireAuth('admin'), (req, res) => {
    const role = String(req.body?.role || '');
    if (!ROLES[role]) return res.status(400).json({ error: 'Unknown role.' });
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot change your own role.' });
    if (!users().some((u) => u.id === req.params.id)) return res.status(404).json({ error: 'Not found' });
    updateUser(req.params.id, { role, sv: Date.now() }); logActivity(req, 'changed role', `${req.params.id} → ${role}`); res.json({ ok: true });
  });
  r.delete('/users/:id', requireAuth('admin'), (req, res) => {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account.' });
    removeUser(req.params.id); logActivity(req, 'removed user', req.params.id); res.json({ ok: true });
  });
  r.put('/profile', auth, (req, res) => {
    const { name, email, current, password } = req.body || {};
    updateUser(req.user.id, { name: str(name, 80) || req.user.username, email: str(email, 120) });
    if (password) {
      if (String(password).length < 10) return res.status(400).json({ error: 'New password must be at least 10 characters.' });
      if (!verifyPassword(users().find((u) => u.id === req.user.id), current || '')) return res.status(400).json({ error: 'Current password is incorrect.' });
      setPassword(req.user.id, password);
      res.setHeader('Set-Cookie', 'dsk_admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'); // old sessions are invalid now; sign in again
      return res.json({ ok: true, relogin: true });
    }
    res.json({ ok: true });
  });


  // ---- pages + SEO ----
  r.get('/pages', auth, (_req, res) => res.json(listPages()));
  r.put('/pages/:id', requireAuth('seo'), (req, res) => {
    try {
      const old = savedPages()[req.params.id] || {}; // roles without 'pages' (SEO) may change meta fields only; heading and intro stay as saved
      const p = savePage(req.params.id, can(req, 'pages') ? req.body : { ...req.body, heading: old.heading, lede: old.lede }); logActivity(req, 'updated page', p.name); res.json(p); } catch (e) { res.status(400).json({ error: e.message }); }
  });

  // ---- header menu ----
  r.get('/menu', auth, (_req, res) => res.json(getMenu()));
  r.get('/menu/default', auth, (_req, res) => res.json(DEFAULT_MENU));
  r.put('/menu', requireAuth('menu'), (req, res) => {
    try { const m = saveMenu(req.body); logActivity(req, 'updated menu', `${m.items.filter((i) => !i.hidden).length} items`); res.json(m); } catch (e) { res.status(400).json({ error: e.message }); }
  });
  r.get('/texts', requireAuth('pages'), (_req, res) => res.json(listTexts()));
  r.put('/texts', requireAuth('pages'), (req, res) => { const n = saveTexts(req.body?.values || {}); logActivity(req, 'updated page text', `${Object.keys(req.body?.values || {}).length} fields`); res.json(listTexts()); });
  // Chatbot: settings, hand-written knowledge entries, tester, unanswered questions
  r.get('/chatbot', auth, async (_req, res) => res.json({ config: chatGet(), defaults: chatDefault(), stats: await kbStats(), summary: chatSummary() }));
  r.put('/chatbot', requireAuth('content'), (req, res) => { try { const c = chatSave(req.body); logActivity(req, 'updated chatbot settings', c.enabled ? 'on' : 'off'); res.json(c); } catch (e) { res.status(400).json({ error: e.message }); } });
  r.get('/chatbot/kb', auth, (_req, res) => res.json({ items: kbGet() }));
  r.put('/chatbot/kb', requireAuth('content'), (req, res) => { try { const k = kbSave(req.body); logActivity(req, 'updated chatbot knowledge', `${k.items.length} entries`); res.json(k); } catch (e) { res.status(400).json({ error: e.message }); } });
  r.post('/chatbot/test', requireAuth('content'), async (req, res) => { kbInvalidate(); const { answer: a } = await import('./chat/engine.js'); const m = String(req.body?.q || '').slice(0, 300); res.json({ answer: await a(m, chatGet()), hits: await chatDebug(m) }); });
  r.get('/chatbot/unanswered', auth, (_req, res) => res.json({ items: chatUnanswered() }));
  r.delete('/chatbot/unanswered', requireAuth('content'), (req, res) => { clearUnanswered(); logActivity(req, 'cleared chatbot unanswered questions'); res.json({ ok: true }); });
  // FAQs shown on /faq
  r.get('/faqs', auth, (_req, res) => res.json(getFaqs()));
  r.put('/faqs', requireAuth('content'), (req, res) => {
    try { const f = saveFaqs(req.body); logActivity(req, 'updated FAQs', `${f.items.length} questions`); res.json(f); } catch (e) { res.status(400).json({ error: e.message }); }
  });
  // Forms: editable fields for the Contact, Internship and Job forms
  r.get('/forms', auth, (_req, res) => res.json(FORM_IDS.map((id) => { const f = getForm(id); return { id, title: FORMS[id].title, about: FORMS[id].about, page: FORMS[id].page, custom: isCustom(id), fields: f.sections.reduce((n, s) => n + s.fields.length, 0), sections: f.sections.length }; })));
  r.get('/forms/:id', auth, (req, res) => (FORMS[req.params.id] ? res.json({ id: req.params.id, title: FORMS[req.params.id].title, page: FORMS[req.params.id].page, multiSection: FORMS[req.params.id].multiSection, custom: isCustom(req.params.id), form: getForm(req.params.id), typeLabels: TYPE_LABEL }) : res.status(404).json({ error: 'Unknown form' })));
  r.get('/forms/:id/default', auth, (req, res) => (FORMS[req.params.id] ? res.json(defaultForm(req.params.id)) : res.status(404).json({ error: 'Unknown form' })));
  r.put('/forms/:id', requireAuth('content'), (req, res) => {
    if (!FORMS[req.params.id]) return res.status(404).json({ error: 'Unknown form' });
    try { const f = saveForm(req.params.id, req.body); logActivity(req, 'updated form', `${FORMS[req.params.id].title}: ${f.sections.reduce((n, s) => n + s.fields.length, 0)} fields`); res.json(f); } catch (e) { res.status(400).json({ error: e.message }); }
  });
  r.delete('/forms/:id', requireAuth('content'), (req, res) => {
    if (!FORMS[req.params.id]) return res.status(404).json({ error: 'Unknown form' });
    const f = resetForm(req.params.id); logActivity(req, 'reset form', FORMS[req.params.id].title); res.json(f);
  });
  r.get('/footer', auth, (_req, res) => res.json(getFooter()));
  r.get('/footer/default', auth, (_req, res) => res.json(DEFAULT_FOOTER));
  r.put('/footer', requireAuth('menu'), (req, res) => {
    try { const f = saveFooter(req.body); logActivity(req, 'updated footer', `${f.links.length} links, ${f.offices.length} offices`); res.json(f); } catch (e) { res.status(400).json({ error: e.message }); }
  });
  r.get('/menus', auth, (_req, res) => res.json({ header: { name: 'Header menu', location: 'Header (top of every page)', items: getMenu().items.filter((i) => !i.hidden).length }, locations: LOCATIONS, menus: listMenus() }));
  r.get('/menus/:id', auth, (req, res) => { const m = listMenus().find((x) => x.id === req.params.id); m ? res.json(m) : res.status(404).json({ error: 'Not found' }); });
  r.post('/menus', requireAuth('menu'), (req, res) => {
    try { const m = createMenu(req.body); logActivity(req, 'created menu', m.name); res.json(m); } catch (e) { res.status(400).json({ error: e.message }); }
  });
  r.put('/menus/:id', requireAuth('menu'), (req, res) => {
    try { const m = updateMenu(req.params.id, req.body); if (!m) return res.status(404).json({ error: 'Not found' }); logActivity(req, 'updated menu', m.name); res.json(m); } catch (e) { res.status(400).json({ error: e.message }); }
  });
  r.delete('/menus/:id', requireAuth('menu'), (req, res) => {
    const m = deleteMenu(req.params.id); if (!m) return res.status(404).json({ error: 'Not found' }); logActivity(req, 'deleted menu', m.name); res.json({ ok: true });
  });
  r.get('/roles', auth, (_req, res) => res.json(Object.entries(ROLES).map(([id, v]) => ({ id, label: v.label, about: v.about }))));

  // ---- site settings + outgoing email (admins) ----
  r.get('/settings', requireAuth('seo'), (_req, res) => res.json(getSettings()));
  r.put('/settings', requireAuth('seo'), (req, res) => {
    try {
      const SEO_FIELDS = ['siteName', 'siteUrl', 'defaultDescription', 'defaultOgImage', 'noindexSite']; // non-admins: SEO fields only
      const body = can(req, 'admin') ? req.body : { ...getSettings(), ...Object.fromEntries(SEO_FIELDS.filter((k) => k in (req.body || {})).map((k) => [k, req.body[k]])) };
      const s = saveSettings(body); logActivity(req, 'updated settings', 'general'); res.json(s); } catch (e) { res.status(400).json({ error: e.message }); }
  });
  r.get('/mail', requireAuth('admin'), (_req, res) => res.json(publicMail()));
  r.put('/mail', requireAuth('admin'), (req, res) => {
    try { const m = saveMail(req.body); logActivity(req, 'updated settings', `email (${m.enabled ? 'on' : 'off'}${req.body?.password ? ', password changed' : ''})`); res.json(m); } catch (e) { res.status(400).json({ error: e.message }); }
  });
  r.post('/mail/test', requireAuth('admin'), async (req, res) => {
    try { await sendTest(String(req.body?.to || '').trim()); logActivity(req, 'sent test email', String(req.body.to).slice(0, 80)); res.json({ ok: true }); } catch (e) { logActivity(req, 'test email failed', String(e.message).slice(0, 120)); res.status(400).json({ error: String(e.message || e).slice(0, 300) }); }
  });

  // ---- audit log (admins) ----
  const auditQuery = (req) => ({ q: String(req.query.q || '').slice(0, 80), user: String(req.query.user || '').slice(0, 40), action: String(req.query.action || '').slice(0, 80), from: String(req.query.from || '').slice(0, 10), to: String(req.query.to || '').slice(0, 10) });
  r.get('/audit', requireAuth('admin'), (req, res) => res.json(readAudit({ limit: Math.min(Number(req.query.limit) || 100, 500), offset: Number(req.query.offset) || 0, ...auditQuery(req) })));
  r.get('/audit/filters', requireAuth('admin'), (_req, res) => res.json(auditFacets()));
  r.get('/audit.csv', requireAuth('admin'), (req, res) => {
    const cell = (v) => `"${String(v ?? '').replace(/^[=+\-@]/, "'$&").replace(/"/g, '""')}"`;
    res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
    res.send('time,user,action,detail,ip\n' + readAudit({ limit: 100000, ...auditQuery(req) }).rows.map((x) => [x.at, x.user, x.action, x.what, x.ip].map(cell).join(',')).join('\n'));
  });

  // ---- backup / restore (admins) ----
  const opts = (q) => ({ submissions: q.submissions === '1', cvs: q.cvs === '1', users: q.users === '1' });
  r.get('/backup', requireAuth('admin'), (_req, res) => res.json(listBackups()));
  r.post('/backup', requireAuth('admin'), (req, res) => { const b = createBackup({ submissions: !!req.body?.submissions, cvs: !!req.body?.cvs, users: !!req.body?.users }); logActivity(req, 'created backup', b.name); res.json(b); });
  r.get('/backup/download', requireAuth('admin'), (req, res) => {
    const o = opts(req.query); logActivity(req, 'downloaded backup', Object.entries(o).filter(([, v]) => v).map(([k]) => k).join('+') || 'content only');
    res.setHeader('Content-Type', 'application/zip'); res.setHeader('Content-Disposition', `attachment; filename="dsk-backup-${new Date().toISOString().slice(0, 10)}.zip"`);
    res.send(buildZip(o));
  });
  r.get('/backup/files/:name', requireAuth('admin'), (req, res) => {
    const p = backupPath(req.params.name); if (!p || !fs.existsSync(p)) return res.status(404).json({ error: 'Not found' });
    logActivity(req, 'downloaded backup', req.params.name); res.download(p);
  });
  r.delete('/backup/files/:name', requireAuth('admin'), (req, res) => {
    const p = backupPath(req.params.name); if (!p) return res.status(404).json({ error: 'Not found' });
    fs.rmSync(p, { force: true }); logActivity(req, 'deleted backup', req.params.name); res.json({ ok: true });
  });
  r.post('/backup/restore', requireAuth('admin'), express.raw({ type: () => true, limit: '400mb' }), (req, res) => {
    if (req.headers['x-confirm'] !== 'RESTORE') return res.status(400).json({ error: 'Confirmation missing.' });
    try { const out = restoreZip(req.body); logActivity(req, 'restored backup', `${out.restored.join(', ')} (undo point ${out.undo})`); res.json(out); } catch (e) { res.status(400).json({ error: e.message }); }
  });

  r.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  return r;
}
