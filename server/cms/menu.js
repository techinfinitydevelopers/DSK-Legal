// Header navigation set in the dashboard (Menu tab). The built-in items use the live site's names; their label, order and visibility are editable.
// Extra items are plain links or simple dropdowns. Stored in content/menu.json; absent file = the site's built-in menu.
import { readJson, writeJson, uid } from './store.js';
import { home } from '../data/home.js';

const BUILTIN = { about: 'About Us', practice: 'Practice Areas', sectors: 'Sectors & Industries', team: 'Our Team', knowledge: 'Knowledge Centre', careers: 'Careers', contact: 'Contact Us' };
/** Built-in items that are plain links (their address is editable); the others are dropdowns. Names follow the live site, dsklegal.com. */
export const LINKS = { about: '/about', team: '/people', careers: '/careers', contact: '/contact' };
/** Dropdown contents of the built-in dropdowns. `auto` tabs are generated from site data (practice areas, sectors) and only their title is editable. */
const L = (label, href) => ({ label, href });
export const DEFAULT_TABS = {
  practice: [{ label: 'Practice Areas', auto: 'practice' }],
  sectors: [{ label: 'Sectors & Industries', auto: 'sectors' }],
  knowledge: [{ label: 'Knowledge Centre', links: [L('Monthly Newsletters', '/knowledge'), L('Practice Area Newsletters', '/knowledge'), L('Articles', '/knowledge')] }],
};
/** The simple dropdowns have no featured card. */
export const DEFAULT_FEATURES = {};
const withTabs = (items) => items.map((i) => (DEFAULT_TABS[i.id] ? { ...i, tabs: i.tabs || DEFAULT_TABS[i.id], feature: i.feature || DEFAULT_FEATURES[i.id] } : i));

export const DEFAULT_MENU_BASE = {
  items: Object.keys(BUILTIN).map((id) => ({ id, label: BUILTIN[id], builtin: true, ...(LINKS[id] ? { href: LINKS[id] } : {}) })),
  countries: [{ label: 'India', href: 'https://dsklegal.com/' }, { label: 'UAE', href: 'https://dsklegal.ae/' }],
};
const str = (v, n) => String(v ?? '').slice(0, n).trim();
const href = (v) => { v = str(v, 500); return /^(https?:\/\/|mailto:|\/|#)/i.test(v) ? v : ''; };

export const DEFAULT_MENU = { ...DEFAULT_MENU_BASE, items: withTabs(DEFAULT_MENU_BASE.items) };
// a menu saved before the header was renamed to the live-site names (Who we are / What we do / Our Thinking) is ignored, so the new default shows
export const savedMenu = () => { const m = readJson('menu', null); return m && !m.items?.some((i) => ['who', 'what', 'thinking'].includes(i.id)) ? { ...m, items: withTabs(m.items) } : null; };
export const getMenu = () => savedMenu() || DEFAULT_MENU;

const AUTO = new Set(['practice', 'sectors', 'knowledge']);
const imgUrl = (v) => { v = str(v, 400); return !v || /^(https?:\/\/|\/)/i.test(v) ? v : ''; };
function cleanFeature(f, id) {
  const d = DEFAULT_FEATURES[id];
  if (!d) return undefined;
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
      items.push({ id, builtin: true, label: str(x.label, 40) || BUILTIN[id], ...(DEFAULT_TABS[id] ? { tabs: cleanTabs(x.tabs, id), feature: cleanFeature(x.feature, id) } : {}), ...(LINKS[id] ? { href: href(x.href) || LINKS[id] } : {}), ...(x.hidden ? { hidden: true } : {}) });
    } else {
      const label = str(x?.label, 40); if (!label) continue;
      const children = (Array.isArray(x.children) ? x.children : []).slice(0, 14).map((c) => ({ label: str(c?.label, 60), href: href(c?.href) })).filter((c) => c.label && c.href);
      const link = href(x.href);
      if (!children.length && !link) throw new Error(`“${label}” needs a link or at least one dropdown link.`);
      items.push({ id: /^c-[a-z0-9]{4,16}$/.test(x.id || '') ? x.id : `c-${uid().slice(0, 8)}`, label, ...(children.length ? { children } : { href: link }), ...(x.hidden ? { hidden: true } : {}) });
    }
  }
  for (const id of Object.keys(BUILTIN)) if (!seen.has(id)) items.push({ id, builtin: true, label: BUILTIN[id], ...(DEFAULT_TABS[id] ? { tabs: DEFAULT_TABS[id], feature: DEFAULT_FEATURES[id] } : {}), ...(LINKS[id] ? { href: LINKS[id] } : {}) });
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
