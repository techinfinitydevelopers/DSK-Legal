// Outgoing email via SMTP (built for Microsoft 365 / Exchange Online: smtp.office365.com, port 587, STARTTLS).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { readJson, writeJson, PRIVATE_DIR, submissions, saveSubmissions } from './store.js';

const DEFAULT = { enabled: false, host: 'smtp.office365.com', port: 587, user: '', pass: '', from: '', fromName: 'DSK Legal Website', notifyTo: [], autoReply: false, autoReplySubject: 'We have received your message', autoReplyBody: 'Dear {name},\n\nThank you for contacting DSK Legal. We have received your message and will get back to you shortly.\n\nRegards,\nDSK Legal' };
const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
const key = () => crypto.createHash('sha256').update(String(readJson('_secret', {}).key || '')).digest();
const enc = (t) => { const iv = crypto.randomBytes(12); const c = crypto.createCipheriv('aes-256-gcm', key(), iv); const d = Buffer.concat([c.update(t, 'utf8'), c.final()]); return [iv, c.getAuthTag(), d].map((b) => b.toString('base64')).join('.'); };
const dec = (t) => { try { const [iv, tag, d] = t.split('.').map((x) => Buffer.from(x, 'base64')); const c = crypto.createDecipheriv('aes-256-gcm', key(), iv); c.setAuthTag(tag); return Buffer.concat([c.update(d), c.final()]).toString('utf8'); } catch { return ''; } };

const load = () => ({ ...DEFAULT, ...readJson('mail', {}) });
export function publicMail() { const { pass, ...c } = load(); return { ...c, hasPassword: !!pass }; }
export function saveMail(b = {}) {
  const cur = load();
  const user = String(b.user ?? '').trim().slice(0, 160);
  const from = String(b.from ?? '').trim().slice(0, 160) || user;
  if (user && !EMAIL.test(user)) throw new Error('Mailbox (username) must be an email address.');
  if (from && !EMAIL.test(from)) throw new Error('From address is not valid.');
  const notifyTo = (Array.isArray(b.notifyTo) ? b.notifyTo : String(b.notifyTo || '').split(/[\s,;]+/)).map((x) => String(x).trim()).filter(Boolean);
  if (notifyTo.some((x) => !EMAIL.test(x))) throw new Error('One of the notification addresses is not valid.');
  const port = Number(b.port) || 587;
  const next = {
    enabled: b.enabled === true, host: String(b.host || DEFAULT.host).trim().slice(0, 120), port: port > 0 && port < 65536 ? port : 587, user, from,
    fromName: String(b.fromName ?? '').replace(/[\r\n"<>]/g, '').slice(0, 80) || DEFAULT.fromName, notifyTo: notifyTo.slice(0, 10),
    autoReply: b.autoReply === true, autoReplySubject: String(b.autoReplySubject || DEFAULT.autoReplySubject).replace(/[\r\n]/g, ' ').slice(0, 150), autoReplyBody: String(b.autoReplyBody || DEFAULT.autoReplyBody).slice(0, 3000),
    pass: b.clearPassword ? '' : b.password ? enc(String(b.password)) : cur.pass,
  };
  writeJson('mail', next);
  return publicMail();
}

function transport(c) {
  return nodemailer.createTransport({ host: c.host, port: c.port, secure: c.port === 465, requireTLS: c.port !== 465, auth: { user: c.user, pass: dec(c.pass) }, connectionTimeout: 12000, greetingTimeout: 12000, socketTimeout: 20000 });
}
const ready = (c) => c.enabled && c.host && c.user && c.pass;
const fromOf = (c) => ({ name: c.fromName, address: c.from || c.user });

export async function sendTest(to) {
  const c = load();
  if (!c.host || !c.user || !c.pass) throw new Error('Save the mailbox and password first.');
  if (!EMAIL.test(to)) throw new Error('Enter a valid recipient address.');
  await transport(c).sendMail({ from: fromOf(c), to, subject: 'DSK Legal website — test email', text: 'This is a test message from the DSK Legal admin dashboard. If you can read it, outgoing email is configured correctly.' });
}

const emailOf = (fields) => Object.entries(fields).map(([k, v]) => (/e-?mail/i.test(k) && EMAIL.test(String(v).trim()) ? String(v).trim() : '')).find(Boolean) || '';
const nameOf = (f) => f.name || f['Full name'] || f['Name'] || Object.entries(f).find(([k]) => /name/i.test(k))?.[1] || '';
const TITLES = { contact: 'contact enquiry', internship: 'internship application', job: 'job application' };

/** Fire-and-forget after a form is stored; records the outcome on the submission so the inbox can show it. */
export async function notifySubmission(sub) {
  const c = load();
  if (!ready(c)) return;
  let status = '';
  try {
    const t = transport(c); const who = String(nameOf(sub.data)).slice(0, 80) || 'unknown';
    const attachments = sub.cv ? [{ filename: sub.cvName || sub.cv, path: path.join(PRIVATE_DIR, path.basename(sub.cv)) }].filter((a) => fs.existsSync(a.path)) : [];
    if (c.notifyTo.length) {
      const text = Object.entries(sub.data).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
      const reply = emailOf(sub.data);
      await t.sendMail({ from: fromOf(c), to: c.notifyTo, replyTo: reply || undefined, subject: `[Website] New ${TITLES[sub.type] || sub.type} — ${who}`.replace(/[\r\n]/g, ' '), text: `${text}\n\n— Received ${sub.at}${sub.cv ? '\n(CV attached)' : ''}`, attachments });
      status = 'notified';
    }
    const to = emailOf(sub.data);
    if (c.autoReply && to) {
      await t.sendMail({ from: fromOf(c), to, subject: c.autoReplySubject, text: c.autoReplyBody.replace(/\{name\}/g, who) });
      status += (status ? ' + ' : '') + 'auto-reply sent';
    }
  } catch (e) { status = `failed: ${String(e.message || e).slice(0, 160)}`; console.warn('[cms] mail failed:', status); }
  if (status) saveSubmissions(submissions().map((s) => (s.id === sub.id ? { ...s, mail: status } : s)));
}
