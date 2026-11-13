import { useEffect, useMemo, useState } from 'react';
import { seoTitle } from '../seo.js';
import Header4 from '../v4/Header4.jsx';
import Footer from '../components/Footer.jsx';
import { Loader } from './Mark.jsx';
import { CtaBand } from './Sections2.jsx';
import { Typewriter } from './Typewriter.jsx';
import { PEOPLE, LEVELS, OFFICES, PRACTICES } from './peopleData.js';

/**
 * /people — team directory modelled on bakermckenzie.com/en/people: keyword search, A–Z surname filter,
 * practice / office / level filters, sort, grid ↔ list, "Showing x of y" + Load more. Filters live in the URL.
 * /people/:slug — profile page. Data: v2/peopleData.js (from dsklegal.com/team-member).
 */
const PAGE = 12;
const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const SORTS = { level: 'Level', office: 'Office', surname: 'Surname' };
const KEYS = ['q', 'letter', 'practice', 'office', 'level', 'sort', 'view'];

const readParams = () => {
  const p = new URLSearchParams(window.location.search);
  return Object.fromEntries(KEYS.map((k) => [k, p.get(k) || '']));
};
const initials = (p) => p.first[0] + p.last[0];
const tel = (n) => `tel:${n.replace(/[^+\d]/g, '')}`;

// photo with an initials fallback if the image is missing
function Avatar({ p, className = '' }) {
  const [ok, setOk] = useState(true);
  return (
    <span className={`x-pp-av ${className}`} aria-hidden="true">
      {ok ? <img src={p.photo} alt="" loading="lazy" onError={() => setOk(false)} /> : initials(p)}
    </span>
  );
}

export default function PeoplePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const slug = window.location.pathname.replace(/\/$/, '').split('/')[2];
  const person = slug && PEOPLE.find((p) => p.slug === slug);

  useEffect(() => {
    document.title = seoTitle(`${person ? person.name + ' — ' : ''}Our People — DSK Legal`);
    window.scrollTo(0, 0);
    fetch('/api/home').then((r) => (r.ok ? r.json() : Promise.reject())).then(setData).catch(() => setError(true));
  }, [person]);
  if (error) return <p className="state">Unable to load content. Please try again later.</p>;
  if (!data) return <Loader />;

  return (
    <div className="v2 v4">
      <Header4 data={data} />
      <main>{slug ? <Profile p={person} /> : <Directory />}</main>
      <CtaBand />
      <Footer data={data.footer} awardsHref="/awards" teamHref="/people" aboutHref="/about" />
    </div>
  );
}

function Directory() {
  const [f, setF] = useState(readParams);
  const [shown, setShown] = useState(PAGE);
  const set = (k, v) => { setF((o) => ({ ...o, [k]: v })); setShown(PAGE); };
  const clear = () => { setF(Object.fromEntries(KEYS.map((k) => [k, k === 'view' ? f.view : '']))); setShown(PAGE); };

  // keep filters shareable: mirror them into the query string
  useEffect(() => {
    const p = new URLSearchParams();
    KEYS.forEach((k) => f[k] && p.set(k, f[k]));
    const qs = p.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }, [f]);

  const list = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const hit = PEOPLE.filter((p) =>
      (!q || [p.name, p.level, p.office, ...p.practices, ...p.sectors].some((s) => s.toLowerCase().includes(q))) &&
      (!f.letter || p.last[0] === f.letter) &&
      (!f.practice || p.tags.includes(f.practice)) &&
      (!f.office || p.office === f.office) &&
      (!f.level || p.level === f.level));
    const by = f.sort || 'level';
    const cmp = {
      level: (a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.last.localeCompare(b.last),
      office: (a, b) => a.office.localeCompare(b.office) || a.last.localeCompare(b.last),
      surname: (a, b) => a.last.localeCompare(b.last) || a.first.localeCompare(b.first),
    }[by];
    return [...hit].sort(cmp);
  }, [f]);

  const letters = useMemo(() => new Set(PEOPLE.map((p) => p.last[0])), []);
  const active = KEYS.some((k) => k !== 'view' && k !== 'sort' && f[k]);
  const view = f.view === 'list' ? 'list' : 'grid';

  return (
    <>
      <section className="x-ap-hero x-pp-hero">
        <div className="container">
          <nav className="x-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><b>People</b></nav>
          <Typewriter as="h1" delay={0.3} threshold={0.2} parts={[{ text: 'Our' }, { text: 'People', as: 'em' }]} />
          <p>{PEOPLE.length} partners, counsel and firm leaders across our offices in India and the UAE. Search by name, practice, sector or office.</p>
          <form className="x-pp-search" role="search" onSubmit={(e) => e.preventDefault()}>
            <input value={f.q} onChange={(e) => set('q', e.target.value)} placeholder="Search by keyword" aria-label="Search people" />
            {f.q && <button type="button" className="x-pp-x" onClick={() => set('q', '')} aria-label="Clear search">×</button>}
            <span aria-hidden="true">⌕</span>
          </form>
          <div className="x-pp-az" role="group" aria-label="Filter by surname">
            {AZ.map((l) => (
              <button key={l} disabled={!letters.has(l)} className={f.letter === l ? 'on' : ''} aria-pressed={f.letter === l} onClick={() => set('letter', f.letter === l ? '' : l)}>{l}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="x-sec x-pp">
        <div className="container">
          <div className="x-pp-bar">
            <div className="x-pp-filters">
              <Select label="Practice area" value={f.practice} onChange={(v) => set('practice', v)} options={PRACTICES} />
              <Select label="Office" value={f.office} onChange={(v) => set('office', v)} options={OFFICES} />
              <Select label="Level" value={f.level} onChange={(v) => set('level', v)} options={LEVELS} />
              {active && <button className="x-pp-clear" onClick={clear}>Clear all</button>}
            </div>
            <div className="x-pp-tools">
              <label className="x-pp-sort">Sort by
                <select value={f.sort || 'level'} onChange={(e) => set('sort', e.target.value === 'level' ? '' : e.target.value)}>
                  {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <div className="x-pp-view" role="group" aria-label="Layout">
                <button className={view === 'grid' ? 'on' : ''} aria-pressed={view === 'grid'} onClick={() => setF((o) => ({ ...o, view: '' }))} aria-label="Grid view"><IconGrid /></button>
                <button className={view === 'list' ? 'on' : ''} aria-pressed={view === 'list'} onClick={() => setF((o) => ({ ...o, view: 'list' }))} aria-label="List view"><IconList /></button>
              </div>
            </div>
          </div>

          <p className="x-pp-count" aria-live="polite">Showing {Math.min(shown, list.length)} of {list.length} results</p>

          {list.length === 0 ? (
            <div className="x-pp-empty"><p>No one matches these filters.</p><button className="x-btn x-btn-red" onClick={clear}>Clear filters <b>→</b></button></div>
          ) : (
            <ul className={`x-pp-list ${view}`}>
              {list.slice(0, shown).map((p) => <Card key={p.slug} p={p} />)}
            </ul>
          )}

          {shown < list.length && (
            <div className="x-pp-more"><button className="x-btn x-btn-line-dark" onClick={() => setShown((n) => n + PAGE)}>Load more people</button></div>
          )}
        </div>
      </section>
    </>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className={`x-pp-sel${value ? ' on' : ''}`}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Card({ p }) {
  const href = `/people/${p.slug}`;
  return (
    <li className="x-pp-card">
      <a className="x-pp-main" href={href}>
        <Avatar p={p} />
        <span className="x-pp-txt">
          <b>{p.name}</b>
          <span>{p.level}</span>
          <small>{[p.office, p.practices[0]].filter(Boolean).join(' · ')}</small>
        </span>
      </a>
      <div className="x-pp-act">
        {p.phone && <a href={tel(p.phone)}><IconPhone /> {p.phone}</a>}
        {p.email && <a href={`mailto:${p.email}`}><IconMail /> Email</a>}
      </div>
    </li>
  );
}

function Profile({ p }) {
  if (!p) {
    return (
      <section className="x-ap-hero x-pp-hero">
        <div className="container">
          <nav className="x-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href={`/people`}>People</a></nav>
          <h1>Profile not <em>found</em></h1>
          <p><a className="x-link" href={`/people`}>Back to all people →</a></p>
        </div>
      </section>
    );
  }
  const related = PEOPLE.filter((x) => x.slug !== p.slug && p.tags[0] && x.tags.includes(p.tags[0])).slice(0, 3);
  const vcard = () => {
    const v = ['BEGIN:VCARD', 'VERSION:3.0', `N:${p.last};${p.first};;;`, `FN:${p.name}`, 'ORG:DSK Legal', `TITLE:${p.level}`, p.phone && `TEL;TYPE=WORK:${p.phone}`, p.email && `EMAIL:${p.email}`, `ADR;TYPE=WORK:;;;${p.office};;;`, 'END:VCARD'].filter(Boolean).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([v], { type: 'text/vcard' }));
    a.download = `${p.slug}.vcf`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const Block = ({ title, items, list }) => items.length > 0 && (
    <>
      <p className="x-kicker">{title}</p>
      {list ? <ul>{items.map((m) => <li key={m}>{m}</li>)}</ul> : items.map((t) => <p key={t}>{t}</p>)}
    </>
  );
  const Side = ({ title, items, tags, q, only }) => items.length > 0 && (
    <>
      <h4>{title}</h4>
      {tags
        ? <ul className="x-pf-tags">{items.map((x) => <li key={x}>{only.includes(x) ? <a href={`/people?${q}=${encodeURIComponent(x)}`}>{x}</a> : <span>{x}</span>}</li>)}</ul>
        : <ul className="x-pf-plain">{items.map((x) => <li key={x}>{x}</li>)}</ul>}
    </>
  );

  return (
    <>
      <section className="x-ap-hero x-pp-hero x-pf-hero">
        <div className="container x-pf-top">
          <Avatar p={p} className="x-pf-av" />
          <div>
            <nav className="x-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href={`/people`}>People</a><span>/</span><b>{p.name}</b></nav>
            <h1>{p.name}</h1>
            <p className="x-pf-role">{p.level} · DSK Legal, {p.office}</p>
            <div className="x-pf-act">
              {p.phone && <a href={tel(p.phone)}><IconPhone /> {p.phone}</a>}
              {p.email && <a href={`mailto:${p.email}`}><IconMail /> {p.email}</a>}
              {p.linkedin && <a href={p.linkedin} target="_blank" rel="noopener noreferrer"><IconIn /> LinkedIn</a>}
              <button onClick={vcard}><IconCard /> vCard</button>
            </div>
          </div>
        </div>
      </section>

      <section className="x-sec x-pf">
        <div className="container x-pf-grid">
          <div className="x-pf-body">
            <Block title="Experience" items={p.bio} />
            <Block title="Recent key assignments" items={p.matters} list />
            <Block title="Professional activities" items={p.activities} list />
            <Block title="Awards & recognition" items={p.awards} list />
          </div>
          <aside className="x-pf-side">
            <Side title="Key practice areas" items={p.practices} tags q="practice" only={PRACTICES} />
            <Side title="Sectors & industries" items={p.sectors} />
            <h4>Office</h4>
            <p><a href={`/people?office=${encodeURIComponent(p.office)}`}>{p.office}</a>{p.phone && <><br /><small>{p.phone}</small></>}</p>
            <Side title="Education" items={p.education} />
            <Side title="Professional memberships" items={p.memberships} />
            {p.languages.length > 0 && <><h4>Languages</h4><p>{p.languages.join(', ')}</p></>}
          </aside>
        </div>
        {related.length > 0 && (
          <div className="container x-pf-rel">
            <p className="x-kicker">Also in {p.tags[0]}</p>
            <ul className="x-pp-list grid">{related.map((r) => <Card key={r.slug} p={r} />)}</ul>
          </div>
        )}
      </section>
    </>
  );
}

const IconGrid = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>;
const IconList = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="1" y="2" width="14" height="2.5" rx="1" /><rect x="1" y="6.75" width="14" height="2.5" rx="1" /><rect x="1" y="11.5" width="14" height="2.5" rx="1" /></svg>;
const IconPhone = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2" /></svg>;
const IconMail = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
const IconCard = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.6-1.5 1.7-2 3-2s2.4.5 3 2M15 10h3M15 13h3" /></svg>;
const IconIn = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5M3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4z" /></svg>;
