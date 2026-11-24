import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { CONTENT_DIR, UPLOAD_DIR, PRIVATE_DIR, readJson, writeJson, resetCache, uid } from './store.js';

export const BACKUP_DIR = path.join(CONTENT_DIR, 'backups');
const DATA = ['people', 'posts', 'practice', 'custom', 'jobs', 'menu', 'menus', 'footer', 'pages', 'texts', 'forms', 'faqs', 'settings', 'media'];
const NAME = /^dsk-backup-[\d-]+(-pre-restore)?\.zip$/;
const SAFE_FILE = /^[\w][\w.-]{0,150}\.(jpg|png|webp|gif|pdf|doc|docx|rtf)$/i;
const stamp = () => new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);

/** opts: { submissions, cvs, users } — personal data is opt-in. Mail password and the signing secret are never included. */
export function buildZip(opts = {}) {
  const zip = new AdmZip(); const inc = ['content', 'media'];
  for (const n of DATA) { const v = readJson(n, null); if (v) zip.addFile(`data/${n}.json`, Buffer.from(JSON.stringify(v, null, 1))); }
  try { for (const f of fs.readdirSync(UPLOAD_DIR)) zip.addFile(`uploads/${f}`, fs.readFileSync(path.join(UPLOAD_DIR, f))); } catch { /* none */ }
  if (opts.submissions) { zip.addFile('submissions.json', Buffer.from(JSON.stringify(readJson('submissions', []), null, 1))); inc.push('submissions'); }
  if (opts.cvs) { try { for (const f of fs.readdirSync(PRIVATE_DIR)) zip.addFile(`private/${f}`, fs.readFileSync(path.join(PRIVATE_DIR, f))); inc.push('cvs'); } catch { /* none */ } }
  if (opts.users) { zip.addFile('users.json', Buffer.from(JSON.stringify(readJson('users', []), null, 1))); inc.push('users'); }
  zip.addFile('manifest.json', Buffer.from(JSON.stringify({ app: 'dsk-legal-cms', version: 1, createdAt: new Date().toISOString(), includes: inc })));
  return zip.toBuffer();
}

export function createBackup(opts, suffix = '') {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const name = `dsk-backup-${stamp()}${suffix}.zip`;
  fs.writeFileSync(path.join(BACKUP_DIR, name), buildZip(opts));
  const all = listBackups();
  for (const old of all.slice(20)) fs.rmSync(path.join(BACKUP_DIR, old.name), { force: true }); // keep the newest 20
  return listBackups().find((b) => b.name === name);
}
export function listBackups() {
  try { return fs.readdirSync(BACKUP_DIR).filter((f) => NAME.test(f)).map((f) => { const s = fs.statSync(path.join(BACKUP_DIR, f)); return { name: f, size: s.size, at: s.mtime.toISOString() }; }).sort((a, b) => b.at.localeCompare(a.at)); } catch { return []; }
}
export const backupPath = (n) => (NAME.test(n) ? path.join(BACKUP_DIR, n) : null);

/** Replace content from a backup ZIP. Only whitelisted names are read; nothing is extracted by path. */
export function restoreZip(buf) {
  let zip; try { zip = new AdmZip(buf); } catch { throw new Error('That file is not a valid ZIP.'); }
  const entries = zip.getEntries().filter((e) => !e.isDirectory);
  const man = entries.find((e) => e.entryName === 'manifest.json');
  let manifest; try { manifest = JSON.parse(man.getData().toString()); } catch { /* handled below */ }
  if (manifest?.app !== 'dsk-legal-cms') throw new Error('This is not a DSK Legal backup (manifest missing).');
  if (entries.reduce((n, e) => n + e.header.size, 0) > 400 * 1024 * 1024 || entries.some((e) => e.header.size > 25 * 1024 * 1024)) throw new Error('Backup is too large or looks unsafe.');

  const plan = { json: {}, uploads: [], priv: [] };
  for (const e of entries) {
    const n = e.entryName; let m;
    if ((m = n.match(/^data\/(\w+)\.json$/)) && DATA.includes(m[1])) { try { plan.json[m[1]] = JSON.parse(e.getData().toString()); } catch { throw new Error(`${n} is not valid JSON.`); } }
    else if (n === 'submissions.json') { try { plan.json.submissions = JSON.parse(e.getData().toString()); } catch { throw new Error('submissions.json is not valid JSON.'); } }
    else if (n === 'users.json') { try { plan.json.users = JSON.parse(e.getData().toString()); } catch { throw new Error('users.json is not valid JSON.'); } }
    else if ((m = n.match(/^uploads\/([^/]+)$/)) && SAFE_FILE.test(m[1])) plan.uploads.push([m[1], e]);
    else if ((m = n.match(/^private\/([^/]+)$/)) && SAFE_FILE.test(m[1])) plan.priv.push([m[1], e]);
  }
  for (const k of ['people', 'posts', 'practice', 'custom', 'jobs']) if (plan.json[k] && !Array.isArray(plan.json[k])) throw new Error(`${k}.json has the wrong shape.`);
  if (!plan.json.people && !plan.json.posts && !plan.json.practice) throw new Error('Backup contains no content.');
  if (plan.json.users && !(Array.isArray(plan.json.users) && plan.json.users.some((u) => u.role === 'admin' && u.hash))) throw new Error('users.json would leave no admin account.');

  const safety = createBackup({ submissions: true, cvs: true, users: true }, '-pre-restore'); // undo point
  for (const [k, v] of Object.entries(plan.json)) writeJson(k, v);
  if (plan.uploads.length) { for (const f of fs.readdirSync(UPLOAD_DIR)) fs.rmSync(path.join(UPLOAD_DIR, f), { force: true }); for (const [f, e] of plan.uploads) fs.writeFileSync(path.join(UPLOAD_DIR, f), e.getData()); }
  if (plan.priv.length) { for (const f of fs.readdirSync(PRIVATE_DIR)) fs.rmSync(path.join(PRIVATE_DIR, f), { force: true }); for (const [f, e] of plan.priv) fs.writeFileSync(path.join(PRIVATE_DIR, f), e.getData()); }
  resetCache();
  return { restored: Object.keys(plan.json), uploads: plan.uploads.length, cvs: plan.priv.length, undo: safety.name, from: manifest.createdAt };
}
export { uid };
