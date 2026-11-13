// Minimal auth: scrypt password hashes, HMAC-signed session cookie, login throttling. No external deps.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeJson, uid, CONTENT_DIR, logActivity } from './store.js';

const hash = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
const secret = (() => {
  let s = readJson('_secret', null);
  if (!s) { s = { key: crypto.randomBytes(32).toString('hex') }; writeJson('_secret', s); }
  return s.key;
})();

export const users = () => readJson('users', []);
const saveUsers = (u) => writeJson('users', u);
/** Role → what it may change. Everyone signed in can read the dashboard; writes are checked per capability. */
export const ROLES = {
  admin: { label: 'Admin', about: 'Everything: users, settings, email, audit log and backups.', caps: ['admin', 'content', 'pages', 'seo', 'jobs', 'media', 'menu', 'inbox'] },
  editor: { label: 'Editor', about: 'Content, pages, careers, media, menu and the inbox. No users, settings or backups.', caps: ['content', 'pages', 'seo', 'jobs', 'media', 'menu', 'inbox'] },
  seo: { label: 'SEO', about: 'Page titles, descriptions, social images, no-index and site-wide SEO fields. Can upload media.', caps: ['seo', 'media'] },
  hr: { label: 'HR / Recruiter', about: 'Job openings, applications in the inbox and CV downloads.', caps: ['jobs', 'inbox', 'media'] },
  support: { label: 'Support', about: 'Reads and handles enquiries and newsletter subscribers in the inbox.', caps: ['inbox'] },
};
export const capsOf = (role) => (ROLES[role] || ROLES.editor).caps;
const pub = (u) => ({ id: u.id, username: u.username, name: u.name, email: u.email, role: u.role, caps: capsOf(u.role) });

export function bootstrapAdmin() {
  if (users().length) return;
  const pw = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  addUser({ username: 'admin', name: 'Administrator', email: '', role: 'admin', password: pw });
  if (!process.env.ADMIN_PASSWORD) {
    const f = path.join(CONTENT_DIR, 'first-run-password.txt');
    fs.writeFileSync(f, `username: admin\npassword: ${pw}\n\nChange it under Profile, then delete this file.\n`, { mode: 0o600 });
    console.log(`\n[cms] First run — admin account created.\n[cms]   Username: admin\n[cms]   Password: ${pw}\n[cms]   Sign in at /admin and change it under Profile. (Also saved to ${f})\n`);
  }
}

export function addUser({ username, name, email, role, password }) {
  const all = users();
  if (all.some((u) => u.username.toLowerCase() === username.toLowerCase())) throw new Error('Username already exists');
  const salt = crypto.randomBytes(16).toString('hex');
  const u = { id: uid(), username, name: name || username, email: email || '', role: ROLES[role] ? role : 'editor', salt, hash: hash(password, salt) };
  saveUsers([...all, u]);
  return pub(u);
}
export const listUsers = () => users().map(pub);
export function removeUser(id) { saveUsers(users().filter((u) => u.id !== id)); }
export function setPassword(id, password) {
  saveUsers(users().map((u) => { if (u.id !== id) return u; const salt = crypto.randomBytes(16).toString('hex'); return { ...u, salt, hash: hash(password, salt), sv: (u.sv || 0) + 1 }; }));
}
export function updateUser(id, patch) {
  saveUsers(users().map((u) => (u.id === id ? { ...u, ...patch } : u)));
}

const sign = (p) => crypto.createHmac('sha256', secret).update(p).digest('base64url');
const TTL = 12 * 3600 * 1000;
const makeToken = (u) => { const p = Buffer.from(JSON.stringify({ id: u.id, sv: u.sv || 0, exp: Date.now() + TTL })).toString('base64url'); return `${p}.${sign(p)}`; };
function readToken(tok) {
  if (!tok) return null;
  const [p, s] = tok.split('.');
  if (!p || !s) return null;
  const good = Buffer.from(sign(p)); const got = Buffer.from(s);
  if (good.length !== got.length || !crypto.timingSafeEqual(good, got)) return null;
  try {
    const d = JSON.parse(Buffer.from(p, 'base64url').toString());
    if (d.exp < Date.now()) return null;
    const u = users().find((x) => x.id === d.id);
    return u && (u.sv || 0) === d.sv ? u : null;
  } catch { return null; }
}
const cookieOf = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split(/=(.*)/s).slice(0, 2)).filter((x) => x[0]));

const fails = new Map();
function throttled(ip) { const f = fails.get(ip); return f && f.n >= 6 && Date.now() - f.t < 15 * 60 * 1000; }

export function login(req, res) {
  const ip = req.ip;
  if (throttled(ip)) { logActivity({ user: { username: 'locked-out' }, ip }, 'login blocked', 'too many attempts'); return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' }); }
  const { username = '', password = '' } = req.body || {};
  const u = users().find((x) => x.username.toLowerCase() === String(username).toLowerCase());
  const ok = u && crypto.timingSafeEqual(Buffer.from(hash(String(password), u.salt)), Buffer.from(u.hash));
  if (!ok) {
    const f = fails.get(ip) || { n: 0, t: 0 }; fails.set(ip, { n: f.n + 1, t: Date.now() });
    logActivity({ user: { username: String(username).slice(0, 40) }, ip }, 'login failed', '');
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }
  fails.delete(ip);
  logActivity({ user: { username: u.username }, ip }, 'logged in', '');
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.setHeader('Set-Cookie', `dsk_admin=${makeToken(u)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${TTL / 1000}${secure ? '; Secure' : ''}`);
  res.json({ user: pub(u) });
}
export function logout(_req, res) { res.setHeader('Set-Cookie', 'dsk_admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'); res.json({ ok: true }); }

/** Middleware: requires a valid session; mutating requests must carry the custom header (CSRF guard). */
export function requireAuth(cap) {
  return (req, res, next) => {
    const u = readToken(cookieOf(req).dsk_admin);
    if (!u) return res.status(401).json({ error: 'Not signed in' });
    if (req.method !== 'GET' && req.headers['x-requested-with'] !== 'dsk-admin') return res.status(403).json({ error: 'Bad request' });
    if (cap && !capsOf(u.role).includes(cap)) return res.status(403).json({ error: cap === 'admin' ? 'Admins only' : 'Your role is not allowed to do this.' });
    req.user = pub(u); req.userFull = u;
    next();
  };
}
export const verifyPassword = (u, pw) => crypto.timingSafeEqual(Buffer.from(hash(String(pw), u.salt)), Buffer.from(u.hash));
