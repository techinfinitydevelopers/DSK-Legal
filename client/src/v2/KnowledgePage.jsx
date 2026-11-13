import { useMemo, useState } from 'react';
import PageShell, { PageHero } from './PageShell.jsx';
import { CtaBand } from './Sections2.jsx';
import { Reveal } from '../hooks.jsx';
import { KNOWLEDGE, KNOWLEDGE_TABS } from './knowledgeData.js';

/** /knowledge — latest posts per category from dsklegal.com/knowledge-centre; each card opens /knowledge/:slug (full text in articleData.js). */
const ARCHIVE = 'https://dsklegal.com/knowledge-centre/';
const slugOf = (k) => k.href.replace(/\/$/, '').split('/').pop();
const COUNTS = Object.fromEntries(KNOWLEDGE_TABS.map((t) => [t, KNOWLEDGE.filter((k) => k.type === t).length]));
const Arrow = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

function Card({ k, feature }) {
  return (
    <a className={`x-kc-card${feature ? ' feat' : ''}`} href={`/knowledge/${slugOf(k)}`}>
      <span className="x-kc-meta"><b>{k.type}</b><time>{k.date}</time></span>
      <h3>{k.title}</h3>
      {k.authors && <p className="x-kc-by"><span>By</span> {k.authors}</p>}
      <p className="x-kc-ex">{k.summary || k.excerpt}</p>
      <span className="x-kc-foot">
        <span className="x-link">Read article <Arrow /></span>
        {k.pdf && <span className="x-kc-pdf">PDF</span>}
      </span>
    </a>
  );
}

export default function KnowledgePage() {
  const [tab, setTab] = useState(KNOWLEDGE_TABS[0]);
  const [q, setQ] = useState('');
  const posts = useMemo(() => {
    const t = q.trim().toLowerCase();
    return KNOWLEDGE.filter((k) => k.type === tab && (!t || (k.title + ' ' + (k.authors || '') + ' ' + (k.summary || k.excerpt)).toLowerCase().includes(t)));
  }, [tab, q]);
  return (
    <PageShell title="Knowledge Centre">
      {() => (
        <>
          <PageHero
            crumbs={[['Knowledge centre']]}
            parts={[{ text: 'Knowledge' }, { text: 'Centre', as: 'em' }]}
            lede="Timely regulatory analyses, case studies, updates, and knowledge briefings authored by DSK Legal practitioners."
          />
          <section className="x-sec x-kc">
            <div className="container">
              <div className="x-kc-bar">
                <div className="x-kc-tabs" role="tablist" aria-label="Categories">
                  {KNOWLEDGE_TABS.map((t) => (
                    <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}<i>{COUNTS[t]}</i></button>
                  ))}
                </div>
                <label className="x-kc-search">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>
                  <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${tab.toLowerCase()}`} aria-label="Search knowledge centre" />
                </label>
              </div>
              {q && <p className="x-kc-count">{posts.length} result{posts.length === 1 ? '' : 's'} in {tab}</p>}
              {posts.length ? (
                <ul className="x-kc-grid" key={tab}>
                  {posts.map((k, i) => (
                    <Reveal as="li" key={k.href} delay={(i % 2) * 90} className={i === 0 && !q ? 'feat' : ''}>
                      <Card k={k} feature={i === 0 && !q} />
                    </Reveal>
                  ))}
                </ul>
              ) : <p className="x-kc-empty">Nothing in {tab} matches “{q}”. <button type="button" onClick={() => setQ('')}>Clear search</button></p>}
              <p className="x-kc-more">Showing the latest {COUNTS[tab]} in this category. <a className="x-link" href={ARCHIVE} target="_blank" rel="noopener noreferrer">Browse the full archive <Arrow /></a></p>
            </div>
          </section>
          <CtaBand />
        </>
      )}
    </PageShell>
  );
}
