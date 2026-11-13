import PageShell, { PageHero } from './PageShell.jsx';
import { CtaBand } from './Sections2.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import { Reveal } from '../hooks.jsx';
import { tx } from '../seo.js';
import { slugify } from './sectorSlug.js';
import { PRACTICE_PAGES } from './practiceData.js';

/** /sectors/:slug. dsklegal.com has no per-sector content (only the shared intro below), so the description is editable in the admin (Page Text → Sector pages). */
const slug = window.location.pathname.replace(/\/$/, '').split('/').pop();
const INTRO = 'At DSK Legal, we leverage our extensive expertise across a diverse range of sectors and industries to provide tailored legal solutions. Our dedicated team of legal professionals understands the unique challenges faced by businesses in these fields and is committed to delivering comprehensive support to help our clients achieve their objectives while mitigating risks.';

export default function SectorPage() {
  return (
    <PageShell title="Sectors & Industries">
      {(data) => <Sector list={data.menu.sectors} />}
    </PageShell>
  );
}

function Sector({ list }) {
  const name = list.find((s) => slugify(s) === slug);
  if (!name) return <NotFoundPage />;
  const i = list.indexOf(name);
  const desc = tx(`sectors.${slug}.intro`, '');
  const others = [list[(i + 1) % list.length], list[(i + 2) % list.length], list[(i + 3) % list.length]].filter((s) => s !== name);
  const practices = PRACTICE_PAGES;
  document.title = `${name} — Sectors & Industries — DSK Legal`;
  return (
    <>
      <PageHero crumbs={[['Sectors & industries', '/sectors'], [name]]} parts={[{ text: name }]} lede={`Legal advice for the ${name} sector.`} />
      <section className="x-sec">
        <div className="container x-sr">
          <Reveal className="x-head x-sc-intro">
            <p className="x-kicker">Sector</p>
            {(desc || INTRO).split('\n').filter(Boolean).map((t) => <p key={t.slice(0, 20)} className="x-pg-lead">{t}</p>)}
            <p><a className="x-btn x-btn-red" href={`/contact?topic=${encodeURIComponent(name)}`}>Talk to us about {name} <b>→</b></a></p>
          </Reveal>
          <Reveal className="x-head"><p className="x-kicker">Our practice areas</p></Reveal>
          <ul className="x-sc-grid">
            {practices.map((p, k) => <li key={p.slug}><a href={`/practice/${p.slug}`}><span>{String(k + 1).padStart(2, '0')}</span>{p.name}<b>→</b></a></li>)}
          </ul>
          <Reveal className="x-head x-sr-more"><p className="x-kicker">Other sectors</p></Reveal>
          <ul className="x-sc-grid">
            {others.map((s) => <li key={s}><a href={`/sectors/${slugify(s)}`}><span>→</span>{s}<b>→</b></a></li>)}
            <li><a href="/sectors"><span>→</span>All sectors &amp; industries<b>→</b></a></li>
          </ul>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
