// Site footer content set in the dashboard (Footer tab). Stored in content/footer.json; absent file = the site's built-in footer.
import { readJson, writeJson } from './store.js';
import { home } from '../data/home.js';

const str = (v, n) => String(v ?? '').slice(0, n).trim();
const href = (v) => { v = str(v, 500); return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(v) ? v : ''; };
const img = (v) => { v = str(v, 400); return !v || /^(https?:\/\/|\/)/i.test(v) ? v : ''; };
const web = (v) => { v = str(v, 300); return /^https?:\/\//i.test(v) ? v : ''; };

const F = home.footer;
export const DEFAULT_FOOTER = {
  officesTitle: 'Office Locations',
  offices: F.offices,
  linksTitle: 'The Firm',
  links: [['Home', '/'], ['About Us', '/about'], ['Our Team', '/people'], ['Awards & Recognition', '/awards'], ['Careers', '/careers'], ['Contact Us', '/contact']].map(([label, h]) => ({ label, href: h })),
  mailingTitle: 'Join Our Mailing List',
  mailing: F.mailing,
  personName: F.person.name, personRole: F.person.role, personPhoto: '',
  promoImage: F.promo.image, promoLink: F.promo.href, promoAlt: F.promo.alt,
  linkedin: F.social.linkedin, instagram: F.social.instagram,
  copyright: F.copyright,
  disclaimer: F.disclaimer,
};

export const savedFooter = () => readJson('footer', null);
export const getFooter = () => ({ ...DEFAULT_FOOTER, ...(savedFooter() || {}) });

export function saveFooter(b = {}) {
  const lines = (a, max, n) => (Array.isArray(a) ? a : []).slice(0, max).map((x) => str(x, n)).filter(Boolean);
  const out = {
    officesTitle: str(b.officesTitle, 60) || DEFAULT_FOOTER.officesTitle,
    offices: lines(b.offices, 14, 80),
    linksTitle: str(b.linksTitle, 60) || DEFAULT_FOOTER.linksTitle,
    links: (Array.isArray(b.links) ? b.links : []).slice(0, 16).map((l) => ({ label: str(l?.label, 60), href: href(l?.href) })).filter((l) => l.label && l.href),
    mailingTitle: str(b.mailingTitle, 60) || DEFAULT_FOOTER.mailingTitle,
    mailing: str(b.mailing, 300),
    personName: str(b.personName, 80), personRole: str(b.personRole, 120), personPhoto: img(b.personPhoto),
    promoImage: img(b.promoImage), promoLink: href(b.promoLink), promoAlt: str(b.promoAlt, 200),
    linkedin: web(b.linkedin), instagram: web(b.instagram),
    copyright: str(b.copyright, 200),
    disclaimer: str(b.disclaimer, 600),
  };
  writeJson('footer', out);
  return out;
}

/** Footer block the public pages receive in /api/home (built-in values when nothing has been saved). */
export function footerForSite() {
  const s = savedFooter(); if (!s) return null;
  const f = { ...DEFAULT_FOOTER, ...s };
  return { offices: f.offices, officesTitle: f.officesTitle, links: f.links, linksTitle: f.linksTitle, mailingTitle: f.mailingTitle, mailing: f.mailing,
    person: { name: f.personName, role: f.personRole, photo: f.personPhoto }, promo: { image: f.promoImage, href: f.promoLink, alt: f.promoAlt }, social: { linkedin: f.linkedin, instagram: f.instagram }, copyright: f.copyright, disclaimer: f.disclaimer };
}
