import PageShell, { PageHero } from './PageShell.jsx';
import { CtaBand } from './Sections2.jsx';
import { headingParts } from '../seo.js';
import { LEGAL } from './legalData.js';

/** /privacy-policy, /terms-and-conditions, /disclaimer, /email-disclaimer. A page created in the admin with the same slug takes over. */
const path = window.location.pathname.replace(/\/$/, '');
const Html = ({ as: Tag = 'p', h }) => <Tag dangerouslySetInnerHTML={{ __html: h }} />;

export default function LegalPage() {
  const custom = (window.__CUSTOM || []).find((p) => `/${p.slug}` === path);
  const base = LEGAL[path] || { title: 'Legal', blocks: [] };
  const page = custom ? { ...base, title: custom.title, lede: custom.lede, blocks: custom.blocks, updated: '' } : base;
  return (
    <PageShell title={page.title}>
      {() => (
        <>
          <PageHero crumbs={[[page.title]]} parts={headingParts(page.title)} lede={page.lede} />
          <section className="x-sec">
            <div className="container x-cu x-legal">
              {page.updated && <p className="x-legal-date">Last updated: {page.updated}</p>}
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
      )}
    </PageShell>
  );
}
