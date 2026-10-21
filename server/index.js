import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { home } from './data/home.js';
import { menu } from './data/menu.js';
import { testimonialsAll } from './data/testimonials.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/home', (_req, res) => res.json({ ...home, menu, testimonialsAll }));

const subscribers = [];
app.post('/api/subscribe', (req, res) => {
  const email = String(req.body?.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  if (!subscribers.includes(email)) subscribers.push(email);
  res.json({ ok: true });
});

const dist = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => console.log(`DSK Legal server on http://localhost:${PORT}`));
