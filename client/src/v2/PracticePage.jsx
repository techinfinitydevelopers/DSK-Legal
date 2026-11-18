import { useEffect, useMemo } from 'react';
import PageShell, { PageHero } from './PageShell.jsx';
import { CtaBand } from './Sections2.jsx';
import { Reveal } from '../hooks.jsx';
import { Spotlight, Magnetic } from './fx.jsx';
import { Typewriter } from './Typewriter.jsx';
import { PRACTICE_PAGES } from './practiceData.js';
import { svcId } from './practiceLinks.js';

/**
 * /practice → all 14 practice areas; /practice/:slug → one area: overview, services (accordion, deep-linkable by #anchor),
 * key contacts (linked to /people/:slug). Copy from dsklegal.com (see practiceData.js).
 */
const slug = window.location.pathname.replace(/\/$/, '').split('/')[2];

const firstSentence = (t, max = 190) => {
  const m = t.match(/^.*?[.!?](?=\s|$)/);
  const s = m ? m[0] : t;
  return s.length > max ? s.slice(0, max).replace(/\s+\S*$/, '') + '…' : s;
};

export default function PracticePage() {
  const idx = slug ? PRACTICE_PAGES.findIndex((p) => p.slug === slug) : -1;
  const page = PRACTICE_PAGES[idx];
  return (
    <PageShell title={page ? page.name : 'Practice Areas'}>
      {() => (slug ? (page ? <Detail p={page} i={idx} /> : <NotFound />) : <Index />)}
    </PageShell>
  );
}

function NotFound() {
  return (
    <>
      <PageHero crumbs={[['Practice areas', '/practice'], ['Not found']]} parts={[{ text: 'Practice area' }, { text: 'not found', as: 'em' }]} lede="We couldn’t find that practice area." />
      <section className="x-sec"><div className="container"><a className="x-link" href="/practice">All practice areas <b>→</b></a></div></section>
    </>
  );
}

function Index() {
  return (
    <>
      <PageHero
        crumbs={[['Practice areas']]}
        parts={[{ text: 'Practice' }, { text: 'Areas', as: 'em' }]}
        lede="Comprehensive legal expertise designed to guide multinational corporations, financial institutions, private funds, and enterprises across India and the UAE."
      />
      <section className="x-sec">
        <div className="container">
          <ul className="x-pg-grid">
            {PRACTICE_PAGES.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={(i % 3) * 100}>
                <Spotlight as="a" href={`/practice/${p.slug}`} className="x-card x-pg-card">
                  <span className="x-num">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{p.name}</h3>
                  <p>{firstSentence(p.intro[0])}</p>
                  <span className="x-pg-meta">{p.services.length} services · {p.contacts.length} key contacts <b>→</b></span>
                </Spotlight>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

/** "Label: text" bullets get the label in bold; `kids` are nested sub-bullets. */
function Item({ x, kids }) {
  const m = x.match(/^([^:]{3,70}):(?!\/)\s*(\S[\s\S]*)$/); // the space after the colon is optional: some imported bullets read "Label:Text"
  return (
    <li>
      {m ? <><b>{m[1]}:</b> {m[2]}</> : x}
      {kids.length > 0 && <ul className="x-pg-sublist">{kids.map((k) => <li key={k}>{k}</li>)}</ul>}
    </li>
  );
}

/** Bullets that start in lower case continue the bullet above them ("…include investments:" → "in the real estate sector…"), so they are nested under it.
 *  Imported text sometimes also repeats those sub-points inside the parent bullet; that repeated tail is cut. */
function nest(list) {
  const out = [];
  for (const it of list) {
    const last = out[out.length - 1];
    if (last && /^[a-z]/.test(it.x)) last.kids.push(it.x);
    else out.push({ x: it.x, kids: [] });
  }
  return out.map((o) => {
    const at = o.kids.length ? o.x.indexOf(o.kids[0].slice(0, 30)) : -1;
    return at > 0 ? { ...o, x: o.x.slice(0, at).trim() } : o;
  });
}

/** A short paragraph with no sentence punctuation that is followed by more text is a sub-heading inside a service (e.g. "Cartels", "Other Agreements"). */
const isSub = (items, i) => {
  const it = items[i]; const x = it.x.trim();
  return it.t === 'p' && i < items.length - 1 && x.length <= 70 && x.split(/\s+/).length <= 8 && !/[.:;!?,]$/.test(x);
};

function Body({ items }) {
  const out = [];
  for (let i = 0; i < items.length; ) {
    if (items[i].t === 'li') {
      const j = items.findIndex((it, k) => k > i && it.t !== 'li');
      const end = j === -1 ? items.length : j;
      out.push(<ul key={i} className="x-pg-list">{nest(items.slice(i, end)).map((it, k) => <Item key={k} x={it.x} kids={it.kids} />)}</ul>);
      i = end;
    } else if (isSub(items, i)) { out.push(<h4 key={i} className="x-pg-sub">{items[i].x}</h4>); i += 1; }
    else { out.push(<p key={i} className="x-p">{items[i].x}</p>); i += 1; }
  }
  return out;
}

function Detail({ p, i }) {
  const prev = PRACTICE_PAGES[(i + PRACTICE_PAGES.length - 1) % PRACTICE_PAGES.length];
  const next = PRACTICE_PAGES[(i + 1) % PRACTICE_PAGES.length];
  const ids = useMemo(() => p.services.map((s) => svcId(s.title)), [p]);

  // open + scroll to the service named in the #hash (nav menu / search deep links)
  useEffect(() => {
    const go = () => {
      const el = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (!el) return;
      if (el.tagName === 'DETAILS') el.open = true;
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, [p]);

  const openAll = (open) => document.querySelectorAll('.x-pg-svc').forEach((d) => { d.open = open; });

  return (
    <>
      <PageHero
        crumbs={[['Practice areas', '/practice'], [p.name]]}
        parts={[{ text: p.name }]}
      >
        <p className="x-pg-facts"><b>{p.services.length}</b> services <i /> <b>{p.contacts.length}</b> key contacts</p>
      </PageHero>

      <section className="x-sec x-pg">
        <div className="container x-pg-in">
          <div className="x-pg-main">
            <Reveal>
              <p className="x-kicker">Overview</p>
              {p.intro.map((t) => <p key={t.slice(0, 24)} className="x-pg-lead">{t}</p>)}
              <h2 className="x-pg-h2">How we can assist you</h2>
            </Reveal>
            <div className="x-pg-tools">
              <button type="button" onClick={() => openAll(true)}>Expand all</button>
              <button type="button" onClick={() => openAll(false)}>Collapse all</button>
            </div>
            {p.services.map((s, k) => (
              <details key={s.title} id={ids[k]} className="x-pg-svc" open={k === 0}>
                <summary><span className="x-pg-n">{String(k + 1).padStart(2, '0')}</span><h3>{s.title}</h3><i aria-hidden="true" /></summary>
                <div className="x-pg-svc-body"><Body items={s.items} /></div>
              </details>
            ))}
          </div>

          <aside className="x-pg-side">
            <div className="x-pg-toc">
              <p className="x-kicker">On this page</p>
              <ul>
                {p.services.map((s, k) => <li key={s.title}><a href={`#${ids[k]}`}>{s.title}</a></li>)}
                <li><a href="#contacts">Key contacts</a></li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="x-sec x-pg-contacts" id="contacts">
        <div className="container">
          <Reveal className="x-head">
            <p className="x-kicker">Meet the team</p>
            <Typewriter text="Key contacts" />
          </Reveal>
          <ul className="x-pg-ct">
            {p.contacts.map((c) => (
              <li key={c.name}>
                <a href={c.slug ? `/people/${c.slug}` : '/people'}>
                  <span className="x-pp-av"><img src={`/img/team/${c.slug}.jpg`} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} /></span>
                  <span><b>{c.name}</b><small>{c.level} · {c.office}</small></span>
                </a>
              </li>
            ))}
          </ul>
          <Magnetic><a className="x-btn x-btn-dark" href={`/people?practice=${encodeURIComponent(p.filter)}`}>See everyone in {p.name} <b>→</b></a></Magnetic>
        </div>
      </section>

      <nav className="x-pg-pn" aria-label="Other practice areas">
        <a href={`/practice/${prev.slug}`}><small>Previous</small><span>← {prev.name}</span></a>
        <a href="/practice"><small>All</small><span>Practice areas</span></a>
        <a href={`/practice/${next.slug}`}><small>Next</small><span>{next.name} →</span></a>
      </nav>
      <CtaBand />
    </>
  );
}
