import { PRACTICE_PAGES } from './practiceData.js';

const norm = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
/** Anchor id of a service block on a practice page. */
export const svcId = (title) => norm(title).replace(/ /g, '-');

const findPage = (title) => PRACTICE_PAGES.find((p) => norm(p.name) === norm(title) || norm(p.filter) === norm(title));

/** /practice/:slug for a practice-area title from the menu data (falls back to the index). */
export const practiceHref = (title) => {
  const p = findPage(title);
  return p ? `/practice/${p.slug}` : '/practice';
};

/** Deep link to a service inside a practice page, when its title matches a service block. */
export const serviceHref = (groupTitle, item) => {
  const p = findPage(groupTitle);
  if (!p) return '/practice';
  const s = p.services.find((x) => norm(x.title) === norm(item));
  return `/practice/${p.slug}${s ? '#' + svcId(s.title) : ''}`;
};
