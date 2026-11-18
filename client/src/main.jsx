import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { Loader } from './v2/Mark.jsx';
import { applyMeta } from './seo.js';
import CookieBanner from './components/CookieBanner.jsx';
import DisclaimerGate from './components/DisclaimerGate.jsx';
import BackToTop from './components/BackToTop.jsx';
import './v2/v2.css'; // scoped to .v2 / x- / xh- classes, so safe to ship with v1
import './v4/v4.css'; // Deloitte-style header (v4 only, scoped to .dl classes)

// v4 ("Deloitte nav design") is the site: / → home, /awards → awards page, /about, /practice(/:slug), /sectors, /knowledge, /careers, /contact → inner pages, /people(/:slug) → team directory.
// Earlier drafts (v1 classic, v2, v3 ribbon intro) live in src/draft and are deliberately not routed or bundled; their old URLs (/v2, /v3, /v4/…) redirect to the matching live page.
const clean = window.location.pathname.replace(/\/$/, '');
const stripped = clean.replace(/^\/v[1-4](?=\/|$)/, '');
const KNOWN = /^\/(awards|about|sectors(\/[^/]+)?|knowledge(\/[^/]+)?|careers(\/(internship|apply))?|contact|admin|privacy-policy|terms-and-conditions|disclaimer|email-disclaimer|people(\/[^/]+)?|practice(\/[^/]+)?)$/;
// anything else that looks like a single slug may be a page created in the admin dashboard (CustomPage shows a 404 view if it does not exist)
const isCustom = !KNOWN.test(stripped) && /^\/[a-z0-9][a-z0-9-]{0,80}$/.test(stripped);
const path = KNOWN.test(stripped) || isCustom ? stripped : '';
if (clean !== stripped) window.history.replaceState(null, '', (stripped || '/') + window.location.search + window.location.hash);
// Published CMS content (/api/content) is merged into the built-in data arrays in place before any page module loads;
// if the API is absent (static hosting) or slow, the hardcoded copy is used.
let cmsReady;
const applyCms = () => (cmsReady ||= (async () => {
  try {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 2500);
    const r = await fetch(`/api/content?path=${encodeURIComponent(path || '/')}`, { signal: ctl.signal }); clearTimeout(timer);
    if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return;
    const c = await r.json();
    const swap = (arr, next) => Array.isArray(next) && next.length && arr.splice(0, arr.length, ...next);
    const [pe, pr, kn, ar] = await Promise.all([import('./v2/peopleData.js'), import('./v2/practiceData.js'), import('./v2/knowledgeData.js'), import('./v2/articleData.js')]);
    window.__CUSTOM = c.custom || []; window.__JOBS = c.jobs || []; window.__MENU = c.menu || null; window.__FOOTER_MENUS = c.footerMenus || []; window.__SITE = c.site; window.__SEO = c.seo; window.__TEXT = c.texts || {}; applyMeta(c.seo);
    swap(pe.PEOPLE, c.people); swap(pr.PRACTICE_PAGES, c.practice); swap(kn.KNOWLEDGE, c.knowledge); swap(ar.ARTICLES, c.articles);
  } catch { /* keep built-in content */ }
})());
const lazy = (load) => React.lazy(async () => { await applyCms(); return load(); });
const AppHome = lazy(() => import('./v4/App4.jsx'));
const AppAwards = lazy(() => import('./v2/AwardsPage.jsx'));
const AppAbout = lazy(() => import('./v2/AboutPage.jsx'));
const AppPractice = lazy(() => import('./v2/PracticePage.jsx'));
const AppSectors = lazy(() => import('./v2/SectorsPage.jsx'));
const AppSector = lazy(() => import('./v2/SectorPage.jsx'));
const AppKnowledge = lazy(() => import('./v2/KnowledgePage.jsx'));
const AppCareers = lazy(() => import('./v2/CareersPage.jsx'));
const AppContact = lazy(() => import('./v2/ContactPage.jsx'));
const AppApply = lazy(() => import('./v2/ApplyPage.jsx'));
const AppArticle = lazy(() => import('./v2/ArticlePage.jsx'));
const AppLegal = lazy(() => import('./v2/LegalPage.jsx'));
const AppCustom = lazy(() => import('./v2/CustomPage.jsx'));
const AppNotFound = lazy(() => import('./v2/NotFoundPage.jsx'));
const AppAdmin = React.lazy(() => import('./admin/Admin.jsx'));
const AppPeople = lazy(() => import('./v2/PeoplePage.jsx'));
const PAGES = { '/awards': AppAwards, '/about': AppAbout, '/sectors': AppSectors, '/knowledge': AppKnowledge, '/careers': AppCareers, '/careers/internship': AppApply, '/careers/apply': AppApply, '/contact': AppContact, '/privacy-policy': AppLegal, '/terms-and-conditions': AppLegal, '/disclaimer': AppLegal, '/email-disclaimer': AppLegal };
const App = path === '/admin' ? AppAdmin : isCustom ? AppCustom : PAGES[path] || (path.startsWith('/people') ? AppPeople : path.startsWith('/knowledge/') ? AppArticle : path.startsWith('/practice') ? AppPractice : path.startsWith('/sectors/') ? AppSector : stripped === '' || stripped === '/' ? AppHome : AppNotFound);
if (!document.title) document.title = 'DSK Legal';

createRoot(document.getElementById('root')).render(
  <>
    <React.Suspense fallback={<Loader />}>
      <App />
    </React.Suspense>
    {path !== '/admin' && <BackToTop />}
    {path !== '/admin' && <CookieBanner />}
    {(stripped === '' || stripped === '/') && <DisclaimerGate />}
  </>
);
