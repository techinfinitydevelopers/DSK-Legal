// Per-page SEO + site-wide values from the admin dashboard (window.__SEO / window.__SITE are filled in main.jsx before a page renders).
// The server also writes these tags into the HTML it serves; this keeps client-side navigation and static hosting consistent.
export const seoTitle = (fallback) => (typeof window !== 'undefined' && window.__SEO?.title) || fallback;
export const siteEmail = () => (typeof window !== 'undefined' && window.__SITE?.contactEmail) || 'Contactus@dsklegal.com';

const setMeta = (attr, key, content) => {
  let m = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!content) { m?.remove(); return; }
  if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); document.head.appendChild(m); }
  m.setAttribute('content', content);
};
export function applyMeta(seo) {
  if (!seo) return;
  if (seo.title) document.title = seo.title;
  setMeta('name', 'description', seo.description);
  setMeta('property', 'og:title', seo.title);
  setMeta('property', 'og:description', seo.description);
  setMeta('property', 'og:image', seo.ogImage);
  setMeta('name', 'robots', seo.noindex ? 'noindex,nofollow' : '');
}

/** "Get in *touch*" → parts for the animated heading; without asterisks the last word is emphasised. */
export function headingParts(h) {
  const bits = String(h).split(/\*([^*]+)\*/);
  if (bits.length > 1) return bits.map((t, i) => (i % 2 ? { text: t, as: 'em' } : t.trim() ? { text: t.trim() } : null)).filter(Boolean);
  const w = String(h).trim().split(/\s+/);
  return w.length > 1 ? [{ text: w.slice(0, -1).join(' ') }, { text: w[w.length - 1], as: 'em' }] : [{ text: w[0] }];
}

/** Editable page text: a value saved in the admin (Page Text) wins, otherwise the built-in copy. */
/** Alt text saved for an uploaded file in the admin Media Library; `fallback` when there is none. */
export const mediaAlt = (src, fallback = '') => (typeof window !== 'undefined' && src && window.__MEDIA_ALT?.[src]) || fallback;
export const tx = (key, fallback) => (typeof window !== 'undefined' && window.__TEXT?.[key]) || fallback;
