// Knowledge base for the chatbot: every piece of public site content cut into short, linkable passages ("chunks").
// Sources: practice areas and services, team profiles, offices and contact details, About/Careers/Sectors/Awards/Home wording,
// published FAQs, knowledge posts, open jobs, and entries written by hand in the dashboard (Chatbot -> Knowledge base).
import { readJson, writeJson, uid, collection } from '../store.js';
import { listTexts } from '../texts.js';
import { getFaqs } from '../faqs.js';
import { getSettings } from '../settings.js';
import { home } from '../../data/home.js';
import { menu } from '../../data/menu.js';

const clean = (t) => String(t ?? '').replace(/\s+/g, ' ').trim();
const norm = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const svcId = (title) => norm(title).replace(/ /g, '-'); // anchor of a service block on a practice page (same rule as the public site)

/** Hand-written entries (title, text, optional link). Stored in content/chatkb.json. */
export const getEntries = () => { const d = readJson('chatkb', null); return Array.isArray(d?.items) ? d.items : []; };
export function saveEntries(raw) {
  const list = Array.isArray(raw?.items) ? raw.items : null;
  if (!list) throw new Error('Nothing to save.');
  if (list.length > 300) throw new Error('At most 300 entries.');
  const seen = new Set();
  const items = list.map((x, i) => {
    const title = clean(x?.title).slice(0, 200); const text = String(x?.text ?? '').replace(/\r/g, '').trim().slice(0, 4000);
    if (!title) throw new Error(`Entry ${i + 1} has no title.`);
    if (!text) throw new Error(`“${title.slice(0, 50)}” has no answer text.`);
    let link = clean(x.link).slice(0, 400); if (link && !/^(https?:\/\/|\/)/i.test(link)) link = '';
    let id = /^[a-z0-9]{8,32}$/.test(String(x.id || '')) ? x.id : uid(); while (seen.has(id)) id = uid(); seen.add(id);
    return { id, title, text, link, published: x.published !== false };
  });
  writeJson('chatkb', { items });
  invalidate();
  return { items };
}

/** Cut long text into passages of about `max` characters on sentence boundaries. */
function pieces(text, max = 520) {
  const sentences = clean(text).match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [clean(text)];
  const out = []; let cur = '';
  for (const s of sentences) { if ((cur + s).length > max && cur) { out.push(cur.trim()); cur = ''; } cur += s; }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

let cache = { at: 0, chunks: null };
export const invalidate = () => { cache = { at: 0, chunks: null }; };

export async function getChunks() {
  if (cache.chunks && Date.now() - cache.at < 30_000) return cache.chunks;
  const chunks = [];
  const add = (kind, title, text, url, extra = {}) => { text = clean(text); if (text.length >= 20) chunks.push({ id: `${kind}:${chunks.length}`, kind, title: clean(title), text, url, ...extra }); };

  const [practice, people, posts, jobs] = await Promise.all(['practice', 'people', 'posts', 'jobs'].map(collection));

  for (const p of practice) {
    const url = `/practice/${p.slug}`;
    pieces((p.intro || []).join(' ')).forEach((t, i) => add('practice', p.name, t, url, { area: p.name, lead: i === 0 }));
    for (const s of p.services || []) {
      const body = (s.items || []).map((x) => (typeof x === 'string' ? x : x.x)).filter(Boolean).join(' ');
      pieces(`${s.title}. ${body}`).forEach((t) => add('service', `${p.name} — ${s.title}`, t, `${url}#${svcId(s.title)}`, { area: p.name }));
    }
  }
  add('sectors', 'Sectors and industries', `DSK Legal serves these sectors and industries: ${menu.sectors.join(', ')}.`, '/sectors', { full: true });
  add('practice-list', 'Practice areas', `DSK Legal's practice areas are: ${practice.map((p) => p.name).join(', ')}.`, '/practice', { full: true });

  for (const x of people) {
    const bio = (x.bio || []).slice(0, 2).join(' ').slice(0, 420);
    add('person', x.name, `${x.name} is ${x.level} at DSK Legal, based in ${x.office}. ${x.practices?.length ? `Practices: ${x.practices.join(', ')}. ` : ''}${x.sectors?.length ? `Sectors: ${x.sectors.slice(0, 6).join(', ')}. ` : ''}${bio}`, `/people/${x.slug}`, { person: x });
  }

  const st = getSettings();
  const cities = home.offices.cities.map((c) => `${c.city}${/\d/.test(c.note) ? ` (${c.note})` : ''}`);
  add('contact', 'Offices and contact', `DSK Legal has offices in ${cities.join(', ')}. Email: ${st.contactEmail}${st.phone ? `. Phone: ${st.phone}` : ''}. You can also send a message through the Contact page.`, '/contact', { full: true, cities: home.offices.cities, email: st.contactEmail, phone: st.phone });
  add('careers-nav', 'Careers, internships and jobs', 'You can apply for a one-month internship, or for an open position, through the application forms on our website. Both let you attach your CV. Open positions and what it is like to work here are on the Careers page.', '/careers', { full: true, extraLinks: [{ title: 'Apply for an internship', url: '/careers/internship' }, { title: 'Apply for a position', url: '/careers/apply' }] });
  add('awards-nav', 'Awards and rankings', 'DSK Legal and its lawyers are ranked and recognised by leading independent legal guides across many practice areas. The full list of rankings and awards, year by year, is on the Awards and Recognition page.', '/awards', { full: true });

  for (const pg of listTexts()) {
    if (pg.id === 'sector-pages') continue;
    for (const f of pg.fields) {
      const v = clean(f.value || f.def); if (v.length < 60 || /[{}]/.test(v)) continue;
      const url = { home: '/', about: '/about', awards: '/awards', careers: '/careers', sectors: '/sectors' }[pg.id] || '/';
      const group = f.label.split(' — ')[0];
      pieces(v).forEach((t) => add('page', `${pg.name}: ${group}`, t.replace(/\*\*/g, ''), url));
    }
  }

  for (const q of getFaqs().items) if (q.published !== false) add('faq', q.question, `${q.question} ${q.answer}`, '/faq', { boost: 1.6, answer: q.answer });
  for (const x of getEntries()) if (x.published !== false) add('kb', x.title, `${x.title}. ${x.text}`, x.link || '', { boost: 1.8, answer: x.text, link: x.link });
  for (const x of posts) if (x.published !== false) add('post', x.title, `${x.title}. ${x.excerpt || x.summary || ''}`, `/knowledge/${x.slug}`);
  for (const j of jobs) if (j.published !== false) add('job', j.title, `Open position: ${j.title}${j.department ? `, ${j.department}` : ''}${j.office ? `, ${j.office}` : ''}. ${j.summary || ''}`, '/careers/apply');

  cache = { at: Date.now(), chunks };
  return chunks;
}

export const kbStats = async () => {
  const by = {}; for (const c of await getChunks()) by[c.kind] = (by[c.kind] || 0) + 1;
  return { total: Object.values(by).reduce((a, b) => a + b, 0), by };
};
