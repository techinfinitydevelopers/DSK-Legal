// Editable page text (Home, About, Awards, Legal). Built-in copy stays the default; a saved value overrides it, an empty one resets it.
// Home text lives in server/data/home.js, so it is patched into /api/home by path. About/Awards/Legal text is read by the client via window.__TEXT (tx(key, fallback)).
import { readJson, writeJson } from './store.js';
import { home } from '../data/home.js';
import { menu } from '../data/menu.js';

export const slugify = (t) => String(t).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const SECTOR_SLUGS = menu.sectors.map(slugify);

const F = (key, label, def, multi) => ({ key, label, def, multi: !!multi });
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);

/** Home: [path, label, multiline] */
const HOME = [
  ['ticker.label', 'Top ticker — label'], ['ticker.text', 'Top ticker — text'],
  ['hero.eyebrow', 'Hero — eyebrow'], ['hero.title', 'Hero — heading (start)'], ['hero.accent', 'Hero — heading (highlighted word)'], ['hero.titleTail', 'Hero — heading (end)'], ['hero.body', 'Hero — paragraph', 1],
  ['values.0.title', 'Value 1 — title'], ['values.0.text', 'Value 1 — text', 1], ['values.1.title', 'Value 2 — title'], ['values.1.text', 'Value 2 — text', 1], ['values.2.title', 'Value 3 — title'], ['values.2.text', 'Value 3 — text', 1],
  ['profile.eyebrow', 'Profile — eyebrow'], ['profile.title', 'Profile — heading (start)'], ['profile.accent', 'Profile — heading (highlighted)'], ['profile.titleTail', 'Profile — heading (end)'], ['profile.paras.0', 'Profile — paragraph 1', 1], ['profile.paras.1', 'Profile — paragraph 2', 1], ['profile.link', 'Profile — link label'],
  ['recognition.eyebrow', 'Recognition — eyebrow'], ['recognition.quote', 'Recognition — quote', 1], ['recognition.source', 'Recognition — source'], ['recognition.cta', 'Recognition — button'],
  ['strengths.eyebrow', 'Strengths — eyebrow'], ['strengths.paras.0', 'Strengths — paragraph 1', 1], ['strengths.paras.1', 'Strengths — paragraph 2', 1],
  ['practice.eyebrow', 'Practice areas — eyebrow'], ['practice.title', 'Practice areas — heading'], ['practice.sub', 'Practice areas — intro', 1],
  ['awards.eyebrow', 'Awards — eyebrow'], ['awards.title', 'Awards — heading'], ['awards.cta', 'Awards — button'],
  ['knowledge.eyebrow', 'Knowledge — eyebrow'], ['knowledge.title', 'Knowledge — heading'], ['knowledge.sub', 'Knowledge — intro', 1],
  ['offices.eyebrow', 'Offices — eyebrow'], ['offices.title', 'Offices — heading'], ['offices.sub', 'Offices — intro', 1],
];

const ABOUT = [
  F('about.profile.title', 'Profile — heading', 'Profile'),
  F('about.believe.title', 'We believe in — heading', 'We believe in'),
  F('about.p.1', 'Profile — paragraph 1 (wrap text in ** ** for bold)', "DSK Legal was set up in 2001 in India and in 2025 in the UAE, and has since established an excellent reputation for its integrity and value-based proactive, pragmatic and innovative legal advice and its ability to help clients effectively traverse the complex legal and regulatory regime in India. With offices in Mumbai, Delhi, Bengaluru, Chennai and Pune, DSK Legal has grown rapidly on the strength of its expertise to a multi-disciplinary team with **over 300 fee-earners, including 74 partners and associate partners**, as also experienced consultants. We are modern and inclusive in our outlook, and have a solution oriented approach. We strongly promote diversity of thought because we believe it helps us build strong teams with varied approaches and ideas to offer solutions that clients find value in.", true),
  F('about.p.2', 'Profile — paragraph 2 (wrap text in ** ** for bold)', "At DSK Legal, we believe in establishing strong and enduring relationships with our clients by ensuring that we are always available to attend to our clients’ needs. It is always our endeavour to understand our clients’ commercial goals. We are transparent in our working and commit ourselves to time-bound and cost-effective advice that protects our clients’ interests.", true),
  F('about.p.3', 'Profile — paragraph 3 (wrap text in ** ** for bold)', "The reputation that we have so strenuously built for ourselves has led us to be appointed by market leading international and domestic businesses on several path-breaking deals. Our advice is also sought by Governments, and this valuable interaction has in turn helped us establish a significant knowledge base within our firm – a base that we tap into for the benefit of our clients.", true),
  F('about.p.4', 'Profile — paragraph 4 (wrap text in ** ** for bold)', "Our commitment to our clients and work, attention to detail, transparent approach and formidable expertise in various areas of corporate and commercial law have not only won us recognition and awards from our peers and professional bodies, but has also attracted some of the best talent from leading law schools in India and abroad to work with us. We have strong relations with several international and domestic law firms in jurisdictions across the world, which help us provide clients with assistance on cross-border matters, or sometimes just introductions that our clients value.", true),
  F('about.p.5', 'Profile — paragraph 5 (wrap text in ** ** for bold)', "DSK Legal is widely recognized for its integrity, innovative solutions, and pragmatic legal advice. Known for navigating India’s complex legal and regulatory landscape, the firm has earned the trust of leading businesses and government entities. With a client-centric approach, we focus on understanding commercial goals and delivering transparent, time-bound, and cost-effective solutions, building strong and enduring relationships.", true),
  F('about.p.6', 'Profile — paragraph 6 (wrap text in ** ** for bold)', "Our culture of diversity and inclusivity fosters innovative thinking and practical problem-solving, enabling us to deliver exceptional legal strategies. Recognized for excellence by peers and professional bodies, we continue to attract top talent and maintain strong networks with experts around the world, providing seamless support for cross-border matters and reinforcing our position as a trusted legal partner.", true),
];

const AWARDS = [
  F('awards.hero.lede', 'Hero — intro line ({total} = rankings, {groups} = practice areas)', '{total} rankings and awards across {groups} practice areas, from the leading independent legal guides.', 1),
  F('awards.logos.kicker', 'Logos — eyebrow', 'Independent industry endorsement'),
  F('awards.logos.title', 'Logos — heading', 'Recognised by'),
  F('awards.timeline.kicker', 'Timeline — eyebrow', 'Recognition by year'),
];

const PAGES = [
  { id: 'home', name: 'Home', fields: HOME.map(([p, l, m]) => F(`home.${p}`, l, get(home, p), m)) },
  { id: 'about', name: 'About us', fields: ABOUT },
  { id: 'awards', name: 'Awards & Recognition', fields: AWARDS },
  { id: 'sectors', name: 'Sector pages', fields: menu.sectors.map((n) => F(`sectors.${slugify(n)}.intro`, `${n} — description (shown on /sectors/${slugify(n)})`, '', 1)) },
];
const ALL = PAGES.flatMap((p) => p.fields);
const KNOWN = new Map(ALL.map((f) => [f.key, f]));

export const savedTexts = () => readJson('texts', {});
export const listTexts = () => { const s = savedTexts(); return PAGES.map((p) => ({ ...p, fields: p.fields.map((f) => ({ ...f, value: s[f.key] ?? '' })) })); };
export function saveTexts(values = {}) {
  const next = { ...savedTexts() };
  for (const [k, v] of Object.entries(values)) {
    const f = KNOWN.get(k); if (!f) continue;
    const s = String(v ?? '').replace(/\r/g, '').trim().slice(0, f.multi ? 3000 : 300);
    if (!s || s === f.def) delete next[k]; else next[k] = s;
  }
  writeJson('texts', next);
  return next;
}

/** Saved text for About/Awards (the client falls back to its built-in copy for anything not here). */
export const clientTexts = () => { const s = savedTexts(); return Object.fromEntries(Object.entries(s).filter(([k]) => !k.startsWith('home.'))); };

/** Home page data with saved text applied. Only the touched branches are cloned. */
export function applyHomeTexts(h) {
  const s = savedTexts(); const keys = Object.keys(s).filter((k) => k.startsWith('home.'));
  if (!keys.length) return h;
  const out = { ...h };
  for (const k of keys) {
    const p = k.slice(5); const ks = p.split('.');
    // clone the path down to the leaf
    let src = h; let dst = out;
    for (let i = 0; i < ks.length - 1; i++) {
      const key = ks[i]; const cur = src[key];
      dst[key] = dst[key] !== cur ? dst[key] : (Array.isArray(cur) ? [...cur] : { ...cur });
      src = cur; dst = dst[key];
    }
    const leaf = ks[ks.length - 1];
    if (typeof dst[leaf] === 'object' && dst[leaf] !== null) continue;
    dst[leaf] = s[k];
  }
  return out;
}
