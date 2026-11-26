// File-based content store for the admin dashboard. One JSON file per collection in server/content/.
// Collections are seeded from the site's hardcoded data modules on first run, so the site looks identical until someone edits.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const CONTENT_DIR = process.env.CMS_DIR || path.resolve(here, '../content');
export const UPLOAD_DIR = path.join(CONTENT_DIR, 'uploads');
export const PRIVATE_DIR = path.join(CONTENT_DIR, 'private'); // CVs etc. — never served statically
const SRC = path.resolve(here, '../../client/src/v2');

for (const d of [UPLOAD_DIR, PRIVATE_DIR]) { try { fs.mkdirSync(d, { recursive: true }); } catch { /* read-only FS (serverless): CMS is not mounted there */ } }

const file = (n) => path.join(CONTENT_DIR, `${n}.json`);
export const readJson = (n, fallback) => {
  try { return JSON.parse(fs.readFileSync(file(n), 'utf8')); } catch { return fallback; }
};
export const writeJson = (n, v) => {
  const tmp = file(n) + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(v, null, 1));
  fs.renameSync(tmp, file(n));
};
export const uid = () => crypto.randomBytes(8).toString('hex');

const slugOf = (k) => k.href.replace(/\/$/, '').split('/').pop();

/** Default content from the hardcoded data files (null if the client sources are not present, e.g. serverless). */
async function defaults(name) {
  const load = (f) => import(pathToFileURL(path.join(SRC, f)).href);
  try {
    if (name === 'people') return (await load('peopleData.js')).PEOPLE;
    if (name === 'practice') return (await load('practiceData.js')).PRACTICE_PAGES;
    if (name === 'posts') {
      const [{ KNOWLEDGE }, { ARTICLES }] = await Promise.all([load('knowledgeData.js'), load('articleData.js')]);
      return KNOWLEDGE.map((k) => {
        const a = ARTICLES.find((x) => x.slug === slugOf(k)) || { blocks: [], pdf: '' };
        return { slug: slugOf(k), title: k.title, date: k.date, type: k.type, authors: k.authors || '', summary: k.summary || '', excerpt: k.excerpt || '', pdf: a.pdf || '', blocks: a.blocks, published: true };
      });
    }
  } catch (e) { console.warn('[cms] no defaults for', name, e.message); }
  return null;
}

const cache = {};
export async function collection(name) {
  if (cache[name]) return cache[name];
  let data = readJson(name, null);
  if (!data) {
    data = (await defaults(name)) || [];
    if (data.length) writeJson(name, data);
  }
  return (cache[name] = data);
}
export const saveCollection = (name, data) => { cache[name] = data; writeJson(name, data); };
export const restoreCollection = async (name) => { delete cache[name]; try { fs.unlinkSync(file(name)); } catch {} return collection(name); };
export const resetCache = () => { for (const k of Object.keys(cache)) delete cache[k]; };
export const peekCollection = (name) => cache[name] || [];

export const KEYS = { people: 'slug', practice: 'slug', posts: 'slug', custom: 'slug', jobs: 'slug' };
export const COLLECTIONS = Object.keys(KEYS);

// ---- audit log: append-only JSON lines (who did what, from where) ----
const AUDIT = path.join(CONTENT_DIR, 'audit.jsonl');
/** `who` is an Express request that passed requireAuth, or a plain username string. */
export function logActivity(who, action, what = '') {
  const user = typeof who === 'string' ? who : who?.user?.username || '—';
  const ip = typeof who === 'string' ? '' : who?.ip || '';
  try {
    if (fs.existsSync(AUDIT) && fs.statSync(AUDIT).size > 8 * 1024 * 1024) fs.renameSync(AUDIT, AUDIT + '.1');
    fs.appendFileSync(AUDIT, JSON.stringify({ at: new Date().toISOString(), user, action, what: String(what).slice(0, 300), ip }) + '\n');
  } catch (e) { console.warn('[cms] audit write failed', e.message); }
}
function allAudit() {
  let lines = [];
  for (const f of [AUDIT, AUDIT + '.1']) { try { lines = lines.concat(fs.readFileSync(f, 'utf8').split('\n').filter(Boolean)); } catch { /* none yet */ } }
  return lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).reverse(); // newest first
}
const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** Filters: user and action match exactly; from/to are YYYY-MM-DD (inclusive, server time zone offset ignored — compared on the stored UTC date); q searches everything. */
export function readAudit({ limit = 100, offset = 0, q = '', user = '', action = '', from = '', to = '' } = {}) {
  let rows = allAudit();
  if (user) rows = rows.filter((r) => r.user === user);
  if (action) rows = rows.filter((r) => r.action === action);
  if (DAY.test(from)) rows = rows.filter((r) => String(r.at).slice(0, 10) >= from);
  if (DAY.test(to)) rows = rows.filter((r) => String(r.at).slice(0, 10) <= to);
  if (q) { const n = q.toLowerCase(); rows = rows.filter((r) => `${r.user} ${r.action} ${r.what} ${r.ip}`.toLowerCase().includes(n)); }
  return { total: rows.length, rows: rows.slice(offset, offset + limit) };
}
/** Values for the filter drop-downs. */
export function auditFacets() {
  const rows = allAudit();
  const uniq = (k) => [...new Set(rows.map((r) => r[k]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
  return { users: uniq('user'), actions: uniq('action') };
}
export const submissions = () => readJson('submissions', []);
export const saveSubmissions = (s) => writeJson('submissions', s);
