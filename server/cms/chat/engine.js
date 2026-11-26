// Local retrieval engine for the chatbot. No external service: BM25 ranking over the knowledge-base chunks, a small synonym list,
// typo tolerance, and answers built from the best-matching sentences of the best passages ("extractive" answers), always with links to the source pages.
import { getChunks } from './kb.js';
import { menu } from '../../data/menu.js';
import { getSettings } from '../settings.js';

const STOP = new Set('a an the and or of to in on for with at by from is are was were be been am do does did can could would should will shall may might i you he she it we they me my our your their this that these those what which who whom whose how when where why please tell about give show need want know like find any some there here as if so than then also just not no yes into over under between more most very much many own get got have has had having let us today now currently current presence number information info details regarding available offer offers offering provide provides handle handles'.split(' '));
const SYN = {
  lawyer: ['attorney', 'partner', 'counsel', 'advocate'], lawyers: ['attorney', 'partner', 'counsel'], attorney: ['lawyer', 'partner'],
  ma: ['merger', 'acquisition'], merger: ['acquisition', 'corporate'], acquisition: ['merger', 'corporate'],
  ip: ['intellectual', 'property', 'trademark', 'patent', 'copyright'], trademark: ['intellectual', 'property'], patent: ['intellectual', 'property'], copyright: ['intellectual', 'property'],
  hr: ['labour', 'employment'], employment: ['labour'], labor: ['labour'], employee: ['labour', 'employment'],
  tax: ['customs', 'dispute'], litigation: ['dispute', 'resolution', 'arbitration'], court: ['dispute', 'litigation'], arbitration: ['dispute', 'resolution'], disputes: ['dispute'],
  bank: ['banking', 'finance'], loan: ['banking', 'finance', 'lending'], funding: ['finance', 'capital'], ipo: ['securities', 'capital', 'markets'],
  property: ['real', 'estate'], land: ['real', 'estate'], realty: ['real', 'estate'], 'white-collar': ['white', 'collar', 'crime'], fraud: ['white', 'collar', 'crime'],
  job: ['career', 'position', 'vacancy'], jobs: ['career', 'position', 'vacancy'], vacancy: ['career', 'job', 'position'], internship: ['intern', 'career'], intern: ['internship', 'career'], hiring: ['career', 'job'], recruit: ['career', 'job'],
  location: ['office', 'address'], address: ['office', 'location'], city: ['office'], phone: ['contact', 'call', 'office'], call: ['contact', 'phone'], email: ['contact'], reach: ['contact'],
  founder: ['found', 'founded', 'founding'], founders: ['found', 'founded'], founded: ['founder'], owner: ['found', 'founder', 'managing'], ceo: ['managing', 'partner'], head: ['managing', 'partner'], boss: ['managing', 'partner'], award: ['ranking', 'recognition'], awards: ['ranking', 'recognition'], ranking: ['award', 'recognition'], rankings: ['award', 'recognition'],
  data: ['technology', 'privacy'], privacy: ['technology', 'data'], tech: ['technology'], startup: ['corporate', 'technology'], aviation: ['airports'], pharma: ['healthcare', 'pharmaceuticals'], energy: ['power', 'projects', 'infrastructure'], infrastructure: ['projects'],
};

const stem = (w) => w.replace(/(ations?|ization|ising|izing)$/, 'at').replace(/ies$/, 'y').replace(/(ing|ed|es|s)$/, (m, _x, i) => (w.length - m.length >= 3 ? '' : m)).replace(/(ment|ness)$/, (m) => (w.length - m.length >= 4 ? '' : m));
const words = (t) => String(t).toLowerCase().replace(/&/g, ' and ').replace(/m\s*&\s*a|m and a/g, ' ma ').replace(/[^a-z0-9 -]/g, ' ').split(/\s+/).filter(Boolean);
const tokens = (t) => words(t).filter((w) => !STOP.has(w) && w.length > 1).map(stem);

// --- index (rebuilt when the knowledge base is rebuilt) ---
let idx = null;
async function index() {
  const chunks = await getChunks();
  if (idx && idx.chunks === chunks) return idx;
  const docs = chunks.map((c) => { const t = tokens(c.title); return [...t, ...t, ...tokens(c.text)]; }); // title words count double
  const df = new Map(); const tf = docs.map((d) => { const m = new Map(); for (const w of d) m.set(w, (m.get(w) || 0) + 1); for (const w of m.keys()) df.set(w, (df.get(w) || 0) + 1); return m; });
  const avg = docs.reduce((n, d) => n + d.length, 0) / (docs.length || 1);
  idx = { chunks, docs, tf, df, avg, N: docs.length, vocab: [...df.keys()] };
  return idx;
}

const lev = (a, b) => { if (Math.abs(a.length - b.length) > 2) return 9; const d = Array.from({ length: b.length + 1 }, (_, j) => j); for (let i = 1; i <= a.length; i++) { let p = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return d[b.length]; };

/** Query terms: stemmed words, typos snapped to a known word, synonyms added with a lower weight. */
function queryTerms(q, ix) {
  const base = words(q).filter((w) => !STOP.has(w) && w.length > 1);
  const terms = new Map(); const groups = [];
  const GENERIC = new Set(['firm', 'dsk', 'legal', 'compani', 'organis', 'organiz']); // in nearly every passage: they do not count towards "does the passage cover the question"
  for (const w of base) {
    let s = stem(w);
    if (!ix.df.has(s) && s.length >= 5) { const best = ix.vocab.filter((v) => Math.abs(v.length - s.length) <= 1).map((v) => [v, lev(s, v)]).filter(([, d]) => d <= (s.length >= 8 ? 2 : 1)).sort((a, b) => a[1] - b[1])[0]; if (best) s = best[0]; }
    terms.set(s, 1);
    if (!GENERIC.has(s)) groups.push([s, ...(SYN[w] || []).map(stem)]);
  }
  for (const w of base) for (const x of SYN[w] || []) { const s = stem(x); if (!terms.has(s)) terms.set(s, 0.45); }
  return { terms, groups, core: groups.map((g) => g[0]) };
}

/** Ranked passages for a question: [{ chunk, score, coverage }] */
export async function search(q, limit = 6) {
  const ix = await index(); const { terms, groups } = queryTerms(q, ix);
  if (!terms.size) return [];
  const k1 = 1.4; const b = 0.75;
  const scored = [];
  for (let i = 0; i < ix.N; i++) {
    const tf = ix.tf[i]; let score = 0;
    for (const [t, wt] of terms) {
      const f = tf.get(t); if (!f) continue;
      const idf = Math.log(1 + (ix.N - ix.df.get(t) + 0.5) / (ix.df.get(t) + 0.5));
      score += wt * idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * ix.docs[i].length) / ix.avg)));
    }
    if (score > 0) { const c = ix.chunks[i]; /* the word itself counts fully, a synonym 60% */ const cov = groups.length ? groups.reduce((n, g) => n + (tf.has(g[0]) ? 1 : g.some((t) => tf.has(t)) ? 0.6 : 0), 0) / groups.length : 0; scored.push({ chunk: c, score: score * (c.boost || 1) * (0.6 + 0.4 * cov), coverage: cov }); }
  }
  scored.sort((a, b) => b.score - a.score);
  // exact phrase bonus: the longest run of the question's own words that also appears in a passage
  const rw = words(q); const grams = [];
  for (let n = Math.min(4, rw.length); n >= 2; n--) for (let i = 0; i + n <= rw.length; i++) { const g = rw.slice(i, i + n); if (g.some((w) => !STOP.has(w) && w.length > 1)) grams.push(g.join(' ')); }
  for (const h of scored.slice(0, 30)) { const t = ` ${words(h.chunk.title + ' ' + h.chunk.text).join(' ')} `; const g = grams.find((x) => t.includes(` ${x} `)); if (g) h.score *= 1 + 0.35 * g.split(' ').length; }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

// --- answers ---
const sentences = (t) => (String(t).match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [t]).map((s) => s.trim()).filter(Boolean);
function best(text, core, n = 2, cap = 420) {
  const ss = sentences(text); if (ss.length <= n) return text.slice(0, cap + 80);
  const scored = ss.map((s, i) => ({ s, i, sc: core.filter((t) => tokens(s).includes(t)).length + (i === 0 ? 0.6 : 0) }));
  const pick = scored.sort((a, b) => b.sc - a.sc).slice(0, n).sort((a, b) => a.i - b.i).map((x) => x.s).join(' ');
  return pick.length > cap + 80 ? `${pick.slice(0, cap)}…` : pick;
}
const link = (c) => (c.url ? { title: c.title.replace(/^.*?: /, '').slice(0, 70), url: c.url } : null);

const INTENT = {
  greet: /^(hi|hii|hello|hey|namaste|hola|good (morning|afternoon|evening))\b/i,
  thanks: /^(thanks|thank you|thx|ok thanks|great|perfect|awesome|got it)\b/i,
  bye: /^(bye|goodbye|see you|that'?s all)\b/i,
  advice: /\b(should i|can i sue|am i liable|is it legal|legal advice|my case|my dispute|i was (arrested|fired|cheated)|file a (case|complaint)|how much (will|does) it cost|your fees?|legal fees?)\b/i,
};

const menuSectors = () => menu.sectors;
export async function answer(message, cfg = {}) {
  const q = String(message || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  const st = getSettings();
  const contactLink = { title: 'Contact us', url: '/contact' };
  const suggestions = cfg.suggestions || [];
  if (!q) return { reply: cfg.welcome || 'Hello! How can I help you?', links: [], suggestions, found: true, kind: 'welcome' };
  if (INTENT.greet.test(q) && q.length < 40) return { reply: cfg.welcome || 'Hello! How can I help you?', links: [], suggestions, found: true, kind: 'greet' };
  if (INTENT.thanks.test(q) && q.length < 40) return { reply: 'You’re welcome! Is there anything else I can help you with?', links: [], suggestions, found: true, kind: 'thanks' };
  if (INTENT.bye.test(q) && q.length < 40) return { reply: 'Thank you for visiting DSK Legal. Have a good day!', links: [], suggestions: [], found: true, kind: 'bye' };
  if (INTENT.advice.test(q)) {
    return { reply: `I can’t give legal advice or discuss the details of a specific matter in this chat. Our team will be glad to help: write to ${st.contactEmail} or use the Contact page, and a lawyer will get back to you.`, links: [contactLink], suggestions: ['Our practice areas', 'Contact details'], found: true, kind: 'advice' };
  }

  const chunks = await getChunks(); const qw = words(q);
  // 1) a team member asked for by name
  const named = chunks.find((c) => c.kind === 'person' && words(c.person.name).filter((w) => w.length > 1).every((w) => qw.includes(w)) && words(c.person.name).length >= 2);
  if (named && !/\b(contact|phone|email|call|reach)\b/i.test(q)) {
    return { reply: best(named.text, [], 3, 520), links: [{ title: named.title, url: named.url }], suggestions: [], found: true, kind: 'person', matched: named.title };
  }
  // 2) offices, phone numbers, e-mail
  const cc = chunks.find((c) => c.kind === 'contact');
  if (cc && /\b(phone|telephone|call|e-?mail|address|office|offices|location|located|reach|contact|dubai|abu dhabi|mumbai|delhi|bengaluru|bangalore|pune|chennai|uae|india)\b/i.test(q) && !/\b(lawyer|partner|team member|practice|sector|career|job|intern)/i.test(q)) {
    const city = cc.cities.find((c) => qw.includes(c.city.toLowerCase().split(' ').pop()) || q.toLowerCase().includes(c.city.toLowerCase()) || (/bangalore/.test(q.toLowerCase()) && c.city === 'Bengaluru') || (/delhi/.test(q.toLowerCase()) && c.city === 'New Delhi') || (/uae/.test(q.toLowerCase()) && /dubai|abu/i.test(c.city)));
    const reply = city ? `Our ${city.city} office${/\d/.test(city.note) ? `: ${city.note}` : ' — please use the Contact page for details'}. You can also email ${cc.email}.` : cc.text;
    return { reply, links: [{ title: 'Contact us', url: '/contact' }], suggestions: [], found: true, kind: 'contact', matched: cc.title };
  }
  // 3) which sectors / industries
  const sc = chunks.find((c) => c.kind === 'sectors');
  if (sc && /\b(sectors?|industr(y|ies))\b/i.test(q) && !/\b(lawyer|partner|team|practice|career)\b/i.test(q)) {
    const qt = tokens(q); const names = menuSectors().filter((n) => tokens(n).some((x) => x.length >= 5 && qt.includes(x)));
    const reply = names.length ? `Yes, DSK Legal works with the ${names.slice(0, 4).join(', ')} sector${names.length > 1 ? 's' : ''}. See the Sectors page for the full list.` : sc.text;
    return { reply, links: [{ title: 'Sectors & industries', url: '/sectors' }], suggestions: [], found: true, kind: 'sectors', matched: sc.title };
  }
  // 4) general retrieval
  const hits = await search(q);
  const ix = await index(); const { core } = queryTerms(q, ix);
  const need = core.length >= 3 ? 0.55 : core.length === 2 ? 0.6 : 0.5;
  // the best passage that also covers enough of the question's own words (a near-tie with a better-covering passage wins)
  const lead = hits.slice(0, 5).filter((h) => h.score >= hits[0].score * 0.7 && h.coverage >= need).sort((a, b) => b.coverage - a.coverage || b.score - a.score)[0] || hits[0];
  const ok = lead && lead.score >= 2.2 && lead.coverage >= need;
  if (!ok) {
    return { reply: `I couldn’t find that on our website. You can reach the team at ${st.contactEmail}, or browse our practice areas and sectors below.`, links: [contactLink, { title: 'Practice areas', url: '/practice' }], suggestions, found: false, kind: 'fallback' };
  }
  const c = lead.chunk;
  const strip = (t) => t.replace(new RegExp(`^${c.title.split(' — ').pop().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.\\s*`, 'i'), '');
  let reply;
  if (c.kind === 'faq' || c.kind === 'kb') reply = best(c.answer, core, 3, 600);
  else if (c.full || c.text.length < 330) reply = c.text;
  else reply = best(strip(c.text), core, 2);
  if (c.kind === 'service') reply = `${c.title.split(' — ')[1] || c.title}: ${reply}`;
  else if (c.kind === 'practice') reply = `${c.title}: ${reply}`;

  const links = [...(c.extraLinks || [])]; const seen = new Set(links.map((l) => l.url));
  for (const h of [lead, ...hits]) { const l = link(h.chunk); if (l && l.url !== '/' && !seen.has(l.url) && h.score >= lead.score * 0.45) { seen.add(l.url); links.push(l); } if (links.length >= 3) break; }
  return { reply, links, suggestions: [], found: true, kind: c.kind, matched: c.title };
}

/** For the dashboard "Test the bot" panel. */
export async function debug(message) {
  const hits = await search(String(message || '').slice(0, 300), 6);
  return hits.map((h) => ({ kind: h.chunk.kind, title: h.chunk.title, url: h.chunk.url, score: Math.round(h.score * 100) / 100, coverage: Math.round(h.coverage * 100) / 100, text: h.chunk.text.slice(0, 220) }));
}
