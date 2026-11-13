import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { home } from './data/home.js';
import { menu } from './data/menu.js';
import { testimonialsAll } from './data/testimonials.js';
import { awardsByPractice } from './data/awards.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5001;
// The CMS needs a writable disk, so it is off on Vercel (read-only serverless); the site then serves its built-in content.
const CMS = !process.env.VERCEL;
const dist = path.resolve(__dirname, '../client/dist');

app.set('trust proxy', 1);
app.use(cors());
// admin + form routes carry their own (larger) body limits
const small = express.json({ limit: '100kb' });
app.use((req, res, next) => (/^\/api\/(admin|forms)\b/.test(req.path) ? next() : small(req, res, next)));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/home', async (_req, res) => {
  const out = { ...home, menu, testimonialsAll, awardsByPractice };
  if (CMS) { const { getSettings } = await import('./cms/settings.js'); const st = getSettings(); if (st.contactEmail) out.email = st.contactEmail; const { footerForSite } = await import('./cms/footer.js'); const ft = footerForSite(); if (ft) out.footer = { ...out.footer, ...ft }; }
  res.json(out);
});

if (CMS) {
  const { mountCms } = await import('./cms/mount.js');
  await mountCms(app, dist);
} else {
  app.post('/api/subscribe', (req, res) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(req.body?.email || '').trim()) ? res.json({ ok: true }) : res.status(400).json({ error: 'Valid email required' })));
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
}

// On Vercel the app is exported and run as a serverless function (see /api/index.js).
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`DSK Legal server on http://localhost:${PORT}`));
}

export default app;
