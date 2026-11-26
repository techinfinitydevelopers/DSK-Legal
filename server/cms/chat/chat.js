// Chatbot settings, question log and the public/admin helpers around the local engine (engine.js).
import { readJson, writeJson } from '../store.js';
import { answer, debug } from './engine.js';
import { getChunks, kbStats, getEntries, saveEntries, invalidate } from './kb.js';

const DEFAULTS = {
  enabled: true,
  title: 'DSK Legal Assistant',
  welcome: 'Hello! I’m the DSK Legal virtual assistant. I can help you find information about our practice areas, sectors, people, offices and careers.',
  suggestions: ['Our practice areas', 'Sectors we serve', 'Contact details', 'Careers and internships'],
  disclaimer: 'This assistant shares information from our website. It does not give legal advice and does not create a lawyer-client relationship.',
  logging: true,
};
const str = (v, n) => String(v ?? '').replace(/\r/g, '').trim().slice(0, n);

export const getConfig = () => ({ ...DEFAULTS, ...readJson('chatbot', {}) });
export const defaultConfig = () => ({ ...DEFAULTS });
export function saveConfig(b = {}) {
  const sug = (Array.isArray(b.suggestions) ? b.suggestions : []).map((x) => str(x, 60)).filter(Boolean).slice(0, 6);
  const c = {
    enabled: b.enabled !== false, title: str(b.title, 60) || DEFAULTS.title, welcome: str(b.welcome, 500) || DEFAULTS.welcome,
    suggestions: sug, disclaimer: str(b.disclaimer, 400), logging: b.logging !== false,
  };
  writeJson('chatbot', c);
  return c;
}
/** What the public widget needs. */
export const publicConfig = () => { const c = getConfig(); return { enabled: c.enabled, title: c.title, welcome: c.welcome, suggestions: c.suggestions, disclaimer: c.disclaimer }; };

// --- question log: only the question text and whether it was answered (no IP, no replies) ---
const LOG = 'chatlog';
const log = () => { const d = readJson(LOG, null); return Array.isArray(d?.items) ? d.items : []; };
function record(q, r) {
  if (!getConfig().logging || !q) return;
  const items = log(); items.push({ at: new Date().toISOString(), q: q.slice(0, 200), found: !!r.found, kind: r.kind, matched: r.matched || '' });
  writeJson(LOG, { items: items.slice(-2000) });
}
export async function reply(message) {
  const c = getConfig(); const r = await answer(message, c);
  if (!['welcome', 'greet', 'thanks', 'bye'].includes(r.kind)) record(String(message).trim(), r);
  return { reply: r.reply, links: r.links, suggestions: r.suggestions, found: r.found };
}
/** Questions the bot could not answer, grouped, most asked first. */
export function unanswered() {
  const m = new Map();
  for (const x of log()) { if (x.found) continue; const k = x.q.toLowerCase().replace(/[?!.\s]+$/g, ''); const e = m.get(k) || { q: x.q, count: 0, last: x.at }; e.count += 1; e.last = x.at; m.set(k, e); }
  return [...m.values()].sort((a, b) => b.count - a.count || b.last.localeCompare(a.last)).slice(0, 100);
}
export function clearUnanswered() { writeJson(LOG, { items: log().filter((x) => x.found) }); }
export function summary() {
  const items = log(); const week = Date.now() - 7 * 864e5; const recent = items.filter((x) => Date.parse(x.at) > week);
  return { total: items.length, week: recent.length, answeredWeek: recent.filter((x) => x.found).length };
}
export { debug, kbStats, getEntries, saveEntries, invalidate, getChunks };
