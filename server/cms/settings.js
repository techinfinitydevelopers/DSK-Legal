import { readJson, writeJson } from './store.js';

export const DEFAULTS = {
  siteName: 'DSK Legal',
  siteUrl: '', // e.g. https://dsklegal.com — used for canonical links, sitemap and social-share URLs
  defaultDescription: 'DSK Legal is a full-service, solution-oriented law firm across India and the UAE.',
  defaultOgImage: '',
  contactEmail: 'Contactus@dsklegal.com',
  phone: '',
  noindexSite: false, // tick while the site is a draft / staging copy
};
const str = (v, n) => String(v ?? '').trim().slice(0, n);
const url = (v) => { v = str(v, 300).replace(/\/+$/, ''); return /^https?:\/\/[^\s]+$/i.test(v) ? v : ''; };
const img = (v) => { v = str(v, 400); return !v || /^(https?:\/\/|\/)/i.test(v) ? v : ''; };

export const getSettings = () => ({ ...DEFAULTS, ...readJson('settings', {}) });
export function saveSettings(b = {}) {
  const email = str(b.contactEmail, 160);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Contact email is not valid.');
  const s = {
    siteName: str(b.siteName, 80) || DEFAULTS.siteName, siteUrl: url(b.siteUrl), defaultDescription: str(b.defaultDescription, 320),
    defaultOgImage: img(b.defaultOgImage), contactEmail: email || DEFAULTS.contactEmail, phone: str(b.phone, 60), noindexSite: b.noindexSite === true,
  };
  writeJson('settings', s);
  return s;
}
