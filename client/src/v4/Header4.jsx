import { useEffect, useMemo, useRef, useState } from 'react';
import { Flag } from '../v2/Flags.jsx';
import { practiceHref, serviceHref } from '../v2/practiceLinks.js';

/*
 * v4 header modelled on deloitte.com (in DSK brand colours): a fixed 48px bar (logo, four top-level items with chevrons,
 * Search / locale / contact icons on the right). Clicking an item drops a full-width panel:
 * a tab column on the left, link columns in the middle and a featured card on the right.
 * Below 1200px: logo + search + contact + burger, with a full-screen drill-down menu.
 */

const Chev = () => <i className="dl-chev" aria-hidden="true" />;
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>
);

export default function Header4({ data }) {
  const { menu } = data;
  // On sub-pages (/awards, /people) section anchors must point back to the home page.
  const base = window.location.pathname.replace(/\/$/, '') === '' ? '' : '/';
  const awards = '/awards';
  const people = '/people';
  const about = '/about';

  // Top-level items, named as on dsklegal.com. Links go straight to a page; dropdowns hold one list of links (`single`).
  const BASE = useMemo(() => [
    { id: 'about', label: 'About Us', href: '/about' },
    { id: 'practice', label: 'Practice Areas', single: true, tabs: [{ label: 'Practice Areas', cols: split(menu.practice.map((g) => [g.title, practiceHref(g.title)]), 3) }] },
    { id: 'sectors', label: 'Sectors & Industries', single: true, tabs: [{ label: 'Sectors & Industries', cols: split(menu.sectors.map((s) => [s, '/sectors']), 3) }] },
    { id: 'team', label: 'Our Team', href: '/people' },
    { id: 'knowledge', label: 'Knowledge Centre', single: true, tabs: [{ label: 'Knowledge Centre', cols: [[['Monthly Newsletters', '/knowledge'], ['Practice Area Newsletters', '/knowledge'], ['Articles', '/knowledge']]] }] },
    { id: 'careers', label: 'Careers', href: '/careers' },
    { id: 'contact', label: 'Contact Us', href: '/contact' },
  ], [base, data, menu]); // eslint-disable-line react-hooks/exhaustive-deps

  // Order, labels, visibility and extra links set in the dashboard (Menu tab); without a saved menu the built-in one is used.
  const cfg = window.__MENU;
  const NAV = useMemo(() => {
    if (!cfg?.items) return BASE;
    return cfg.items.filter((i) => !i.hidden).map((i) => {
      const b = BASE.find((n) => n.id === i.id);
      if (b) {
        // saved dropdown tabs: manual tabs list their own links; auto tabs are generated from site data
        const AUTO = { practice: b.tabs?.[0]?.cols, sectors: b.tabs?.[0]?.cols, knowledge: b.tabs?.[0]?.cols };
        const tabs = b.tabs && i.tabs?.length ? i.tabs.map((t) => (t.auto ? { label: t.label, cols: AUTO[t.auto] || [[]] } : { label: t.label, cols: [t.links.map((l) => [l.label, l.href])] })) : b.tabs;
        const feature = i.feature ? (i.feature.hidden ? null : i.feature) : b.feature;
        return { ...b, label: i.label || b.label, ...(tabs ? { tabs } : {}), feature, ...(b.href !== undefined ? { href: i.href || b.href } : {}) };
      }
      return i.children?.length ? { id: i.id, label: i.label, single: true, tabs: [{ label: i.label, cols: [i.children.map((c) => [c.label, c.href])] }] } : { id: i.id, label: i.label, href: i.href };
    });
  }, [BASE, cfg]);
  const countries = cfg?.countries?.length ? cfg.countries : menu.countries;

  const [drop, setDrop] = useState(null); // top-level id | 'search' | 'locale' | null
  const [tab, setTab] = useState(0);
  const [country, setCountry] = useState('India');
  const [q, setQ] = useState('');
  const [mobile, setMobile] = useState(false);
  const [mStack, setMStack] = useState([]); // drill-down path in the mobile menu
  const ref = useRef(null);
  const searchRef = useRef(null);

  const toggle = (id) => { setTab(0); setDrop((d) => (d === id ? null : id)); };
  const closeAll = () => { setDrop(null); setMobile(false); setMStack([]); };

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && closeAll();
    const out = (e) => ref.current && !ref.current.contains(e.target) && setDrop(null);
    window.addEventListener('keydown', esc);
    document.addEventListener('mousedown', out);
    return () => { window.removeEventListener('keydown', esc); document.removeEventListener('mousedown', out); };
  }, []);
  useEffect(() => { if (drop === 'search') searchRef.current?.focus(); }, [drop]);
  useEffect(() => {
    document.body.style.overflow = mobile ? 'hidden' : '';
    return () => (document.body.style.overflow = '');
  }, [mobile]);

  // search across practice areas, sectors and site sections
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    const pool = [
      ...menu.practice.flatMap((g) => [[g.title, 'Practice area', practiceHref(g.title)], ...g.items.map((i) => [i, g.title, serviceHref(g.title, i)])]),
      ...menu.sectors.map((s) => [s, 'Sector', '/sectors']),
    ];
    return pool.filter(([n]) => n.toLowerCase().includes(t)).slice(0, 8);
  }, [q, menu]);

  const cur = NAV.find((n) => n.id === drop && n.tabs);

  return (
    <header className={`dl${drop || mobile ? ' is-open' : ''}`} ref={ref}>
      <div className="dl-bar">
        <a href="/" className="dl-brand" aria-label="DSK Legal home">
          <img src="/logo.png" alt="DSK Legal — True Value, True Values" />
        </a>

        <nav className="dl-nav" aria-label="Primary">
          {NAV.map((n) => n.tabs ? (
            <button key={n.id} className={drop === n.id ? 'on' : ''} aria-expanded={drop === n.id} onClick={() => toggle(n.id)}>
              {n.label} <Chev />
            </button>
          ) : (
            <a key={n.id} href={n.href.startsWith('/') ? n.href : base + n.href} onClick={closeAll}>{n.label}</a>
          ))}
        </nav>

        <div className="dl-tools">
          <button className={`dl-search-btn${drop === 'search' ? ' on' : ''}`} aria-expanded={drop === 'search'} onClick={() => toggle('search')}>
            <IconSearch /><span>Search</span>
          </button>
          <div className="dl-locale">
            <button className={drop === 'locale' ? 'on' : ''} aria-haspopup="listbox" aria-expanded={drop === 'locale'} onClick={() => toggle('locale')}>
              <Flag country={country} size={18} /><span>{country === 'India' ? 'IN' : 'AE'} - EN</span><Chev />
            </button>
            <ul className={drop === 'locale' ? 'open' : ''} role="listbox">
              {countries.map((c) => (
                <li key={c.label}><a href={c.href} className={c.label === country ? 'sel' : ''} onClick={() => setCountry(c.label)}><Flag country={c.label} size={22} />{c.label}</a></li>
              ))}
            </ul>
          </div>
          <button className={`dl-burger${mobile ? ' on' : ''}`} aria-label={mobile ? 'Close menu' : 'Open menu'} aria-expanded={mobile} onClick={() => (mobile ? closeAll() : (setDrop(null), setMobile(true)))}>
            <i /><i /><i />
          </button>
        </div>
      </div>

      {/* desktop slide-down */}
      <div className={`dl-panel${cur ? ' open' : ''}`} aria-hidden={!cur}>
        {cur && (
          <div className={`dl-panel-in${cur.single ? ' single' : ''}`}>
            {!cur.single && <ul className="dl-tabs" role="tablist">
              {cur.tabs.map((t, i) => (
                <li key={t.label}>
                  <button role="tab" aria-selected={tab === i} className={tab === i ? 'on' : ''} onMouseEnter={() => setTab(i)} onClick={() => setTab(i)}>{t.label}</button>
                </li>
              ))}
            </ul>}
            <div className="dl-links" key={cur.id + tab}>
              {cur.tabs[tab].cols.map((col, ci) => (
                <ul key={ci}>
                  {col.map(([label, href]) => <li key={label}><a href={href} onClick={closeAll}>{label}</a></li>)}
                </ul>
              ))}
            </div>
            {cur.feature && (
              <a className="dl-feature" href={cur.feature.href} onClick={closeAll}>
                <img src={cur.feature.img} alt="" loading="lazy" />
                <p>{cur.feature.kicker}</p>
                <span>{cur.feature.title}</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* search slide-down */}
      <div className={`dl-panel dl-search${drop === 'search' ? ' open' : ''}`} aria-hidden={drop !== 'search'}>
        <form className="dl-search-in" role="search" onSubmit={(e) => { e.preventDefault(); window.location.href = hits[0] ? hits[0][2] : '/practice'; closeAll(); }}>
          <IconSearch />
          <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search practice areas and sectors" aria-label="Search" />
          {q && <button type="button" className="dl-clear" onClick={() => setQ('')}>Clear</button>}
        </form>
        {hits.length > 0 && (
          <ul className="dl-hits">
            {hits.map(([n, where, href]) => <li key={n + where}><a href={href} onClick={closeAll}>{n}<small>{where}</small></a></li>)}
          </ul>
        )}
      </div>

      {/* mobile drill-down */}
      <div className={`dl-mobile${mobile ? ' open' : ''}`} aria-hidden={!mobile}>
        {mStack.length === 0 ? (
          <ul className="dl-m-list">
            {NAV.map((n) => (
              <li key={n.id}>
                {n.tabs
                  ? <button onClick={() => setMStack([n.id])}>{n.label}<Chev /></button>
                  : <a href={n.href.startsWith('/') ? n.href : base + n.href} onClick={closeAll}>{n.label}</a>}
              </li>
            ))}
          </ul>
        ) : (() => {
          const n = NAV.find((x) => x.id === mStack[0]);
          const t = mStack.length > 1 ? n.tabs[mStack[1]] : n.single ? n.tabs[0] : null; // dashboard-made dropdowns have one tab: show its links directly
          return (
            <>
              <button className="dl-m-back" onClick={() => setMStack(mStack.slice(0, -1))}><Chev />{mStack.length > 1 ? n.label : 'Main menu'}</button>
              <p className="dl-m-title">{t ? t.label : n.label}</p>
              <ul className="dl-m-list">
                {t
                  ? t.cols.flat().map(([label, href]) => <li key={label}><a href={href} onClick={closeAll}>{label}</a></li>)
                  : n.tabs.map((x, i) => <li key={x.label}><button onClick={() => setMStack([n.id, i])}>{x.label}<Chev /></button></li>)}
              </ul>
            </>
          );
        })()}
        <div className="dl-m-foot">
          {countries.map((c) => <a key={c.label} href={c.href}><Flag country={c.label} size={18} />{c.label}</a>)}
          <a href={`mailto:${data.email}`}>{data.email}</a>
        </div>
      </div>
    </header>
  );
}

function split(list, n) {
  const per = Math.ceil(list.length / n);
  return Array.from({ length: n }, (_, i) => list.slice(i * per, (i + 1) * per)).filter((c) => c.length);
}
