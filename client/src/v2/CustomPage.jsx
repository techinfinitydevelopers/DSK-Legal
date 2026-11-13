import PageShell, { PageHero } from './PageShell.jsx';
import { CtaBand } from './Sections2.jsx';
import { headingParts } from '../seo.js';
import NotFoundPage from './NotFoundPage.jsx';

/** Pages created in the admin dashboard (Pages → Add Page), served at /<slug>. Content arrives via /api/content (window.__CUSTOM). */
const slug = window.location.pathname.replace(/\/$/, '').slice(1);

const Html = ({ as: Tag = 'p', h }) => <Tag dangerouslySetInnerHTML={{ __html: h }} />;

export default function CustomPage() {
  const page = (window.__CUSTOM || []).find((p) => p.slug === slug);
  if (!page) return <NotFoundPage />;
  return (
    <PageShell title={page ? page.title : 'Page not found'}>
      {() => (page ? (
        <>
          <PageHero crumbs={[[page.title]]} parts={headingParts(page.title)} lede={page.lede} />
          <section className="x-sec">
            <div className="container x-cu">
              {page.blocks.map((b, i) => {
                if (b.t === 'hr') return <hr key={i} />;
                if (b.t === 'h3') return <Html key={i} as="h3" h={b.h} />;
                if (b.t === 'ul' || b.t === 'ol') { const L = b.t; return <L key={i}>{b.items.map((x, k) => <li key={k} dangerouslySetInnerHTML={{ __html: x }} />)}</L>; }
                return <Html key={i} h={b.h} />;
              })}
            </div>
          </section>
          <CtaBand />
        </>
      ) : (
        <PageHero crumbs={[['Not found']]} parts={[{ text: 'Page' }, { text: 'not found', as: 'em' }]} lede="We couldn’t find that page.">
          <p><a className="x-link" href="/">Back to home</a></p>
        </PageHero>
      ))}
    </PageShell>
  );
}
