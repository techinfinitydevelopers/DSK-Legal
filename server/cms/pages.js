import { readJson, writeJson, collection } from './store.js';
import { getSettings } from './settings.js';
import { menu } from '../data/menu.js';
import { slugify } from './texts.js';

/** Every fixed page of the site. `heading`/`lede` exist only where the page's hero can be overridden. */
export const REGISTRY = [
  { id: 'home', path: '/', name: 'Home', metaTitle: 'DSK Legal — Clarity in Complexity', metaDescription: 'DSK Legal is a full-service, solution-oriented law firm across India and the UAE.' },
  { id: 'about', path: '/about', name: 'About us', metaTitle: 'About DSK Legal', metaDescription: 'Who we are, what we believe in and how DSK Legal serves clients across India and the UAE.' },
  { id: 'awards', path: '/awards', name: 'Awards & Recognition', metaTitle: 'Awards & Recognition — DSK Legal', metaDescription: 'Rankings and recognition earned by DSK Legal and its lawyers.' },
  { id: 'people', path: '/people', name: 'Our People', metaTitle: 'Our People — DSK Legal', metaDescription: 'Partners, counsel and firm leaders across our offices in India and the UAE.' },
  { id: 'practice', path: '/practice', name: 'Practice Areas (index)', metaTitle: 'Practice Areas — DSK Legal', metaDescription: 'Comprehensive legal expertise for multinational corporations, financial institutions, private funds and enterprises across India and the UAE.', heading: 'Practice *Areas*', lede: 'Comprehensive legal expertise designed to guide multinational corporations, financial institutions, private funds, and enterprises across India and the UAE.' },
  { id: 'sectors', path: '/sectors', name: 'Sectors & Industries', metaTitle: 'Sectors & Industries — DSK Legal', metaDescription: 'Tailored legal solutions across a diverse range of sectors and industries.', heading: 'Sectors & *Industries*', lede: 'Tailored legal solutions across a diverse range of sectors and industries.' },
  { id: 'knowledge', path: '/knowledge', name: 'Knowledge Centre (index)', metaTitle: 'Knowledge Centre — DSK Legal', metaDescription: 'Timely regulatory analyses, case studies, updates and knowledge briefings authored by DSK Legal practitioners.', heading: 'Knowledge *Centre*', lede: 'Timely regulatory analyses, case studies, updates, and knowledge briefings authored by DSK Legal practitioners.' },
  { id: 'careers', path: '/careers', name: 'Careers', metaTitle: 'Careers — DSK Legal', metaDescription: 'Build a long and fulfilling career at DSK Legal.', heading: 'Careers at *DSK Legal*', lede: 'We are committed to helping you build a long and fulfilling career at DSK Legal.' },
  { id: 'internship', path: '/careers/internship', name: 'Internship application', metaTitle: 'Internship application — DSK Legal', metaDescription: 'Apply for a one-month internship at DSK Legal.', heading: 'Internship *application*', lede: 'Apply for a one-month internship at DSK Legal. Fields marked * are required.' },
  { id: 'apply', path: '/careers/apply', name: 'Job application', metaTitle: 'Job application — DSK Legal', metaDescription: 'Apply for a position at DSK Legal.', heading: 'Apply for a *position*', lede: 'Tell us about your education and experience. Fields marked * are required.' },
  { id: 'contact', path: '/contact', name: 'Contact us', metaTitle: 'Contact Us — DSK Legal', metaDescription: 'Send us your question and we will get back to you as soon as possible.', heading: 'Contact *Us*', lede: 'Send us your question, and we will get back to you as soon as possible.' },
  { id: 'faq', path: '/faq', name: 'FAQs', metaTitle: 'FAQs — DSK Legal', metaDescription: 'Answers to frequently asked questions about DSK Legal.', heading: 'Frequently asked *questions*', lede: 'Answers to common questions about our firm and how we work.' },
  { id: 'privacy', path: '/privacy-policy', name: 'Privacy Policy', metaTitle: 'Privacy Policy — DSK Legal', metaDescription: 'How DSK Legal collects, uses and protects personal information shared through this website.' },
  { id: 'terms', path: '/terms-and-conditions', name: 'Terms & Conditions', metaTitle: 'Terms & Conditions — DSK Legal', metaDescription: 'Terms governing the use of the DSK Legal website.' },
  { id: 'disclaimer', path: '/disclaimer', name: 'Disclaimer', metaTitle: 'Disclaimer — DSK Legal', metaDescription: 'Bar Council of India disclaimer for users of the DSK Legal website.' },
  { id: 'emaildisclaimer', path: '/email-disclaimer', name: 'Email Disclaimer', metaTitle: 'Email Disclaimer — DSK Legal', metaDescription: 'Confidentiality notice for communications from DSK Legal.' },
];

const str = (v, n) => String(v ?? '').trim().slice(0, n);
const img = (v) => { v = str(v, 400); return !v || /^(https?:\/\/|\/)/i.test(v) ? v : ''; };
export const savedPages = () => readJson('pages', {});

export const listPages = () => { const s = savedPages(); return REGISTRY.map((p) => ({ ...p, saved: s[p.id] || {} })); };
export function savePage(id, b = {}) {
  const reg = REGISTRY.find((p) => p.id === id);
  if (!reg) throw new Error('Unknown page');
  const next = { metaTitle: str(b.metaTitle, 120), metaDescription: str(b.metaDescription, 320), ogImage: img(b.ogImage), noindex: b.noindex === true };
  if (reg.heading !== undefined) { next.heading = str(b.heading, 140); next.lede = str(b.lede, 600); }
  const all = { ...savedPages(), [id]: next };
  writeJson('pages', all);
  return { ...reg, saved: next };
}

const plain = (t, n) => String(t ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, n);

/** SEO for any URL path: saved page override → built-in default → site default. Detail pages derive from their own content. */
export async function seoFor(pathname) {
  const st = getSettings();
  const p = pathname.replace(/\/$/, '') || '/';
  const base = { title: '', description: '', ogImage: st.defaultOgImage, noindex: st.noindexSite, intro: null };
  const reg = REGISTRY.find((r) => r.path === p);
  if (reg) {
    const s = savedPages()[reg.id] || {};
    return { ...base, title: s.metaTitle || reg.metaTitle, description: s.metaDescription || reg.metaDescription || st.defaultDescription, ogImage: s.ogImage || st.defaultOgImage, noindex: st.noindexSite || !!s.noindex,
      intro: reg.heading !== undefined && (s.heading || s.lede) ? { heading: s.heading || '', lede: s.lede || '' } : null };
  }
  let m;
  if ((m = p.match(/^\/([a-z0-9-]+)$/))) {
    const c = (await collection('custom')).find((x) => x.slug === m[1] && x.published !== false);
    if (c) return { ...base, title: c.metaTitle || `${c.title} — ${st.siteName}`, description: c.metaDescription || plain(c.lede, 200) || st.defaultDescription, ogImage: c.ogImage || base.ogImage, noindex: st.noindexSite || !!c.noindex };
  }
  if ((m = p.match(/^\/knowledge\/([^/]+)$/))) {
    const post = (await collection('posts')).find((x) => x.slug === m[1] && x.published !== false);
    if (post) return { ...base, title: `${post.title} — ${st.siteName}`, description: plain(post.summary || post.excerpt, 200) || st.defaultDescription };
  } else if ((m = p.match(/^\/people\/([^/]+)$/))) {
    const x = (await collection('people')).find((y) => y.slug === m[1]);
    if (x) return { ...base, title: `${x.name} — Our People — ${st.siteName}`, description: plain(x.bio?.[0], 200) || `${x.name}, ${x.level}, ${x.office}.`, ogImage: x.photo || base.ogImage };
  } else if ((m = p.match(/^\/sectors\/([^/]+)$/))) {
    const n = menu.sectors.find((x) => slugify(x) === m[1]);
    if (n) return { ...base, title: `${n} — Sectors & Industries — ${st.siteName}`, description: `Legal advice for the ${n} sector from DSK Legal.` };
  } else if ((m = p.match(/^\/practice\/([^/]+)$/))) {
    const x = (await collection('practice')).find((y) => y.slug === m[1]);
    if (x) return { ...base, title: `${x.name} — ${st.siteName}`, description: plain(x.intro?.[0], 200) || st.defaultDescription };
  }
  return { ...base, description: st.defaultDescription };
}
