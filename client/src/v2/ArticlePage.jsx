import { useEffect, useMemo, useState } from 'react';
import PageShell, { PageHero } from './PageShell.jsx';
import { CtaBand } from './Sections2.jsx';
import { Reveal } from '../hooks.jsx';
import { ARTICLES } from './articleData.js';
import { KNOWLEDGE } from './knowledgeData.js';

/** /knowledge/:slug — one article or newsletter. Text from dsklegal.com (articleData.js, html whitelisted at scrape time); listing metadata from knowledgeData.js. */
const slug = window.location.pathname.replace(/\/$/, '').split('/')[2];
const slugOf = (k) => k.href.replace(/\/$/, '').split('/').pop();
const plain = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
const idOf = (h, i) => `s-${i}-${plain(h).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}`;
const Arrow = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

export default function ArticlePage() {
  const art = ARTICLES.find((a) => a.slug === slug);
  const meta = KNOWLEDGE.find((k) => slugOf(k) === slug);
  return (
    <PageShell title={art ? art.title : 'Knowledge Centre'}>
      {() => (art ? <Article art={art} meta={meta} /> : <NotFound />)}
    </PageShell>
  );
}

function NotFound() {
  return (
    <>
      <PageHero crumbs={[['Knowledge centre', '/knowledge'], ['Not found']]} parts={[{ text: 'Article' }, { text: 'not found', as: 'em' }]} lede="We couldn’t find that article." />
      <section className="x-sec"><div className="container"><a className="x-link" href="/knowledge">All knowledge <b>→</b></a></div></section>
    </>
  );
}

const Html = ({ as: Tag = 'p', h, ...rest }) => <Tag dangerouslySetInnerHTML={{ __html: h }} {...rest} />;

function ReadProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const el = document.querySelector('.x-ar-body');
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.5;
      setP(Math.max(0, Math.min(1, (window.innerHeight * 0.25 - r.top) / total)));
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, []);
  return <div className="x-ar-prog" aria-hidden="true"><span style={{ transform: `scaleX(${p})` }} /></div>;
}

function Share({ title }) {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { window.prompt('Copy this link', url); }
  };
  return (
    <div className="x-ar-card x-ar-share">
      <p className="x-kicker">Share</p>
      <div>
        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}>Email</a>
        <button type="button" onClick={copy}>{copied ? 'Copied ✓' : 'Copy link'}</button>
      </div>
    </div>
  );
}

function Article({ art, meta }) {
  const related = meta ? KNOWLEDGE.filter((k) => k.type === meta.type && slugOf(k) !== art.slug).slice(0, 3) : [];
  const idx = meta ? KNOWLEDGE.filter((k) => k.type === meta.type) : [];
  const at = meta ? idx.findIndex((k) => slugOf(k) === art.slug) : -1;
  const newer = at > 0 ? idx[at - 1] : null;
  const older = at >= 0 && at < idx.length - 1 ? idx[at + 1] : null;

  const mins = useMemo(() => Math.max(1, Math.round(art.blocks.reduce((n, b) => n + plain((b.h || '') + ' ' + (b.items || []).join(' ')).split(/\s+/).length, 0) / 210)), [art]);
  const heads = useMemo(() => art.blocks.map((b, i) => (b.t === 'h2' || b.t === 'h3' ? { id: idOf(b.h, i), text: plain(b.h), i } : null)).filter(Boolean), [art]);
  const showToc = heads.length >= 3;
  const byline = art.blocks.find((b) => b.t === 'byline');
  const firstP = art.blocks.findIndex((b) => b.t === 'p');

  const [cur, setCur] = useState('');
  useEffect(() => {
    if (!showToc) return undefined;
    const els = heads.map((h) => document.getElementById(h.id)).filter(Boolean);
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setCur(e.target.id)), { rootMargin: '-20% 0px -70% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [heads, showToc]);

  return (
    <>
      <ReadProgress />
      <PageHero className="x-ar-hero" crumbs={[['Knowledge centre', '/knowledge'], [meta?.type || 'Article']]} parts={[{ text: art.title }]}>
        <p className="x-ar-meta">
          {meta && <b>{meta.type}</b>}
          {meta && <time>{meta.date}</time>}
          <span>{mins} min read</span>
        </p>
        {art.pdf && <a className="x-btn x-btn-red x-ar-dl" href={art.pdf} target="_blank" rel="noopener noreferrer">Download PDF <b>→</b></a>}
      </PageHero>

      <section className="x-sec x-ar">
        <div className="container x-ar-in">
          <article className="x-ar-body">
            {byline && (
              <div className="x-ar-by">
                <small>Authors</small>
                <Html as="p" h={byline.h.replace(/^\s*(Authored by|Authors?:?)\s*/i, '')} />
              </div>
            )}
            {art.blocks.map((b, i) => {
              if (b.t === 'byline') return null;
              if (b.t === 'h2') return <Html key={i} as="h2" id={idOf(b.h, i)} h={b.h} />;
              if (b.t === 'h3') return <Html key={i} as="h3" id={idOf(b.h, i)} h={b.h} />;
              if (b.t === 'quote') return <Html key={i} as="blockquote" h={b.h} />;
              if (b.t === 'hr') return <hr key={i} />;
              if (b.t === 'ul' || b.t === 'ol') {
                const L = b.t;
                return <L key={i}>{b.items.map((x, k) => <li key={k} dangerouslySetInnerHTML={{ __html: x }} />)}</L>;
              }
              const cls = i === firstP && !byline ? 'x-ar-lead' : /^\[\d+\]/.test(plain(b.h)) ? 'x-ar-fn' : i === firstP ? 'x-ar-lead' : undefined;
              return <Html key={i} h={b.h} className={cls} />;
            })}
          </article>

          <aside className="x-ar-side">
            {showToc && (
              <nav className="x-ar-card x-ar-toc" aria-label="In this article">
                <p className="x-kicker">In this article</p>
                <ul>
                  {heads.map((h) => (
                    <li key={h.id} className={cur === h.id ? 'on' : ''}>
                      <a href={`#${h.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{h.text}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {art.pdf && (
              <a className="x-ar-pdf" href={art.pdf} target="_blank" rel="noopener noreferrer">
                <span>PDF</span><b>Download the full newsletter</b><i>→</i>
              </a>
            )}
            <Share title={art.title} />
            <a className="x-link" href="/knowledge"><span aria-hidden="true">←</span> All knowledge</a>
          </aside>
        </div>
      </section>

      {(newer || older) && (
        <nav className="x-pg-pn x-ar-pn" aria-label="More in this category">
          {older ? <a href={`/knowledge/${slugOf(older)}`}><small>Older</small><span>← {older.title}</span></a> : <span />}
          <a href="/knowledge"><small>All</small><span>Knowledge centre</span></a>
          {newer ? <a href={`/knowledge/${slugOf(newer)}`}><small>Newer</small><span>{newer.title} →</span></a> : <span />}
        </nav>
      )}

      {related.length > 0 && (
        <section className="x-sec x-ar-rel">
          <div className="container">
            <Reveal className="x-head"><p className="x-kicker">More in {meta.type}</p></Reveal>
            <ul className="x-kc-grid x-ar-relgrid">
              {related.map((k) => (
                <li key={k.href}>
                  <a className="x-kc-card" href={`/knowledge/${slugOf(k)}`}>
                    <span className="x-kc-meta"><b>{k.type}</b><time>{k.date}</time></span>
                    <h3>{k.title}</h3>
                    {k.authors && <p className="x-kc-by"><span>By</span> {k.authors}</p>}
                    <span className="x-kc-foot"><span className="x-link">Read article <Arrow /></span>{k.pdf && <span className="x-kc-pdf">PDF</span>}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <CtaBand />
    </>
  );
}
