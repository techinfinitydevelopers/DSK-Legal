// Header navigation set in the dashboard (Menu tab). The three mega-menus keep their built-in content; their label, order and visibility are editable.
// Extra items are plain links or simple dropdowns. Stored in content/menu.json; absent file = the site's built-in menu.
import { readJson, writeJson, uid } from './store.js';
import { home } from '../data/home.js';

const BUILTIN = { who: 'Who we are', what: 'What we do', thinking: 'Our Thinking', careers: 'Careers' };
/** Dropdown contents of the built-in mega-menus. `auto` tabs are generated from site data (practice areas, sectors, knowledge) and only their title is editable. */
const L = (label, href) => ({ label, href });
export const DEFAULT_TABS = {
  who: [
    { label: 'About DSK Legal', links: [L('About DSK Legal', '/about'), L('Our Values', '/#about'), L('Firm Profile', '/about'), L('Our Team', '/people'), L('Awards & Recognition', '/awards')] },
    { label: 'Our People', links: [L('Meet our team', '/people'), L('Partners & leadership', '/people?level=Partner')] },
    { label: 'Our Offices', links: home.offices.cities.map((c) => L(c.city, '/#offices')) },
  ],
  what: [
    { label: 'Practice Areas', auto: 'practice' },
    { label: 'Sectors & Industries', auto: 'sectors' },
    { label: 'Awards & Rankings', links: [L('All awards & rankings', '/awards'), L('Client testimonials', '/#testimonials')] },
  ],
  thinking: [{ label: 'Knowledge Centre', auto: 'knowledge' }],
};
/** The card shown at the right of each mega-menu. */
export const DEFAULT_FEATURES = {
  who: { img: '/img/mumbai.png', kicker: 'Strategic locations', title: 'Offices across India and the UAE', href: '/#offices' },
  what: { img: '/img/banner1.jpg', kicker: 'Recognition', title: 'Awards and rankings from the leading legal guides', href: '/awards' },
  thinking: { img: '/img/banner2.jpg', kicker: String(home.ticker?.label || 'Latest').replace(':', ''), title: String(home.ticker?.text || 'Knowledge Centre'), href: '/knowledge' },
};
const withTabs = (items) => items.map((i) => (DEFAULT_TABS[i.id] ? { ...i, tabs: i.tabs || DEFAULT_TABS[i.id], feature: i.feature || DEFAULT_FEATURES[i.id] } : i));

export const DEFAULT_MENU_BASE = {
  items: [
    { id: 'who', label: BUILTIN.who, builtin: true }, { id: 'what', label: BUILTIN.what, builtin: true },
    { id: 'thinking', label: BUILTIN.thinking, builtin: true }, { id: 'careers', label: BUILTIN.careers, href: '/careers', builtin: true },
  ],
  countries: [{ label: 'India', href: 'https://dsklegal.com/' }, { label: 'UAE', href: 'https://dsklegal.ae/' }],
};
const str = (v, n) => String(v ?? '').slice(0, n).trim();
const href = (v) => { v = str(v, 500); return /^(https?:\/\/|mailto:|\/|#)/i.test(v) ? v : ''; };

export const DEFAULT_MENU = { ...DEFAULT_MENU_BASE, items: withTabs(DEFAULT_MENU_BASE.items) };
export const savedMenu = () => { const m = readJson('menu', null); return m && { ...m, items: withTabs(m.items) }; };
export const getMenu = () => savedMenu() || DEFAULT_MENU;

const AUTO = new Set(['practice', 'sectors', 'knowledge']);
const imgUrl = (v) => { v = str(v, 400); return !v || /^(https?:\/\/|\/)/i.test(v) ? v : ''; };
function cleanFeature(f, id) {
  const d = DEFAULT_FEATURES[id];
  if (!f || typeof f !== 'object') return d;
  return { img: imgUrl(f.img) || d.img, kicker: str(f.kicker, 60), title: str(f.title, 140) || d.title, href: href(f.href) || d.href, ...(f.hidden ? { hidden: true } : {}) };
}
function cleanTabs(raw, id) {
  if (!Array.isArray(raw)) return DEFAULT_TABS[id];
  const tabs = raw.slice(0, 8).map((t) => {
    const label = str(t?.label, 40); if (!label) return null;
    if (AUTO.has(t.auto)) return { label, auto: t.auto };
    const links = (Array.isArray(t.links) ? t.links : []).slice(0, 30).map((l) => ({ label: str(l?.label, 80), href: href(l?.href) })).filter((l) => l.label && l.href);
    return links.length ? { label, links } : null;
  }).filter(Boolean);
  return tabs.length ? tabs : DEFAULT_TABS[id];
}

export function saveMenu(b = {}) {
  const seen = new Set(); const items = [];
  for (const x of (Array.isArray(b.items) ? b.items : []).slice(0, 14)) {
    const id = BUILTIN[x?.id] ? x.id : null;
    if (id) {
      if (seen.has(id)) continue; seen.add(id);
      items.push({ id, builtin: true, label: str(x.label, 40) || BUILTIN[id], ...(DEFAULT_TABS[id] ? { tabs: cleanTabs(x.tabs, id), feature: cleanFeature(x.feature, id) } : {}), ...(id === 'careers' ? { href: href(x.href) || '/careers' } : {}), ...(x.hidden ? { hidden: true } : {}) });
    } else {
      const label = str(x?.label, 40); if (!label) continue;
      const children = (Array.isArray(x.children) ? x.children : []).slice(0, 14).map((c) => ({ label: str(c?.label, 60), href: href(c?.href) })).filter((c) => c.label && c.href);
      const link = href(x.href);
      if (!children.length && !link) throw new Error(`“${label}” needs a link or at least one dropdown link.`);
      items.push({ id: /^c-[a-z0-9]{4,16}$/.test(x.id || '') ? x.id : `c-${uid().slice(0, 8)}`, label, ...(children.length ? { children } : { href: link }), ...(x.hidden ? { hidden: true } : {}) });
    }
  }
  for (const id of Object.keys(BUILTIN)) if (!seen.has(id)) items.push({ id, builtin: true, label: BUILTIN[id], ...(DEFAULT_TABS[id] ? { tabs: DEFAULT_TABS[id], feature: DEFAULT_FEATURES[id] } : {}), ...(id === 'careers' ? { href: '/careers' } : {}) });
  const countries = (Array.isArray(b.countries) ? b.countries : []).slice(0, 6).map((c) => ({ label: str(c?.label, 30), href: href(c?.href) })).filter((c) => c.label && c.href);
  const out = { items, countries: countries.length ? countries : DEFAULT_MENU.countries };
  writeJson('menu', out);
  return out;
}

// ---- additional menus (Menu → Add New Menu). Flat link lists; a menu with location "footer" is shown as a link column in the site footer. ----
export const LOCATIONS = { footer: 'Footer', none: 'Not shown (draft)' };
const menusFile = () => readJson('menus', []);
export const listMenus = () => menusFile();
export const footerMenus = () => menusFile().filter((m) => m.location === 'footer' && m.links.length).map(({ id, name, links }) => ({ id, name, links }));

function cleanMenu(b = {}, old = {}) {
  const name = str(b.name, 60); if (!name) throw new Error('Menu name is required.');
  const links = (Array.isArray(b.links) ? b.links : []).slice(0, 30).map((l) => ({ label: str(l?.label, 60), href: href(l?.href) })).filter((l) => l.label && l.href);
  const all = menusFile();
  if (all.some((m) => m.id !== old.id && m.name.toLowerCase() === name.toLowerCase())) throw new Error('A menu with this name already exists.');
  return { id: old.id || `m-${uid().slice(0, 8)}`, name, location: LOCATIONS[b.location] ? b.location : 'footer', links };
}
export function createMenu(b) { const m = cleanMenu(b); writeJson('menus', [...menusFile(), m]); return m; }
export function updateMenu(id, b) {
  const all = menusFile(); const old = all.find((m) => m.id === id); if (!old) return null;
  const m = cleanMenu(b, old); writeJson('menus', all.map((x) => (x.id === id ? m : x))); return m;
}
export function deleteMenu(id) { const all = menusFile(); const old = all.find((m) => m.id === id); if (!old) return null; writeJson('menus', all.filter((m) => m.id !== id)); return old; }
