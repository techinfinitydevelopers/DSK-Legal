import { useEffect, useMemo, useRef, useState } from 'react';
import { Flag } from '../v2/Flags.jsx';

/*
 * v4 header modelled on deloitte.com (in DSK brand colours): a fixed 48px bar (logo, four top-level items with chevrons,
 * Search / locale / contact icons on the right). Clicking an item drops a full-width panel:
 * a tab column on the left, link columns in the middle and a featured card on the right.
 * Below 1024px: logo + search + contact + burger, with a full-screen drill-down menu.
 */

const Chev = () => <i className="dl-chev" aria-hidden="true" />;
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>
);
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6" /></svg>
);

export default function Header4({ data }) {
  const { menu } = data;
  // On sub-pages (e.g. /v4/awards) section anchors must point back to the /v4 home page.
  const base = window.location.pathname.replace(/\/$/, '') === '/v4' ? '' : '/v4';
  const awards = '/v4/awards';

  // Top-level items → tabs → links. Every link points at a real section or page.
  const NAV = useMemo(() => [
    {
      id: 'who', label: 'Who we are',
      tabs: [
        { label: 'About DSK Legal', cols: [[
          ['Our Values', base + '#about'], ['Firm Profile', base + '#about'], ['Our Team', base + '#about'], ['Awards & Recognition', awards],
        ]] },
        { label: 'Our Offices', cols: [data.offices.cities.map((c) => [c.city, base + '#offices'])] },
      ],
      feature: { img: '/img/mumbai.png', kicker: 'Strategic locations', title: 'Offices across India and the UAE', href: base + '#offices' },
    },
    {
      id: 'what', label: 'What we do',
      tabs: [
        { label: 'Practice Areas', cols: split(menu.practice.map((g) => [g.title, base + '#practice']), 3) },
        { label: 'Sectors & Industries', cols: split(menu.sectors.map((s) => [s, base + '#practice']), 3) },
        { label: 'Awards & Rankings', cols: [[['All awards & rankings', awards], ['Client testimonials', base + '#testimonials']]] },
      ],
      feature: { img: '/img/banner1.jpg', kicker: 'Recognition', title: 'Awards and rankings from the leading legal guides', href: awards },
    },
    {
      id: 'thinking', label: 'Our Thinking',
      tabs: [
        { label: 'Knowledge Centre', cols: [data.knowledge.cards.map((c) => [c.title, base + '#knowledge']).concat([[data.ticker.text, base + '#knowledge']])] },
      ],
      feature: { img: '/img/banner2.jpg', kicker: data.ticker.label.replace(':', ''), title: data.ticker.text, href: base + '#knowledge' },
    },
    { id: 'careers', label: 'Careers', href: '#footer' },
  ], [base, data, menu]); // eslint-disable-line react-hooks/exhaustive-deps

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
      ...menu.practice.flatMap((g) => [[g.title, 'Practice area'], ...g.items.map((i) => [i, g.title])]),
      ...menu.sectors.map((s) => [s, 'Sector']),
    ];
    return pool.filter(([n]) => n.toLowerCase().includes(t)).slice(0, 8);
  }, [q, menu]);

  const cur = NAV.find((n) => n.id === drop && n.tabs);

  return (
    <header className={`dl${drop || mobile ? ' is-open' : ''}`} ref={ref}>
      <div className="dl-bar">
        <a href="/v4" className="dl-brand" aria-label="DSK Legal home">
          <img src="/logo.png" alt="DSK Legal — True Value, True Values" />
        </a>

        <nav className="dl-nav" aria-label="Primary">
          {NAV.map((n) => n.tabs ? (
            <button key={n.id} className={drop === n.id ? 'on' : ''} aria-expanded={drop === n.id} onClick={() => toggle(n.id)}>
              {n.label} <Chev />
            </button>
          ) : (
            <a key={n.id} href={base + n.href} onClick={closeAll}>{n.label}</a>
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
              {menu.countries.map((c) => (
                <li key={c.label}><a href={c.href} className={c.label === country ? 'sel' : ''} onClick={() => setCountry(c.label)}><Flag country={c.label} size={22} />{c.label}</a></li>
              ))}
            </ul>
          </div>
          <a className="dl-icon" href={base + '#footer'} aria-label="Contact us" onClick={closeAll}><IconUser /></a>
          <button className={`dl-burger${mobile ? ' on' : ''}`} aria-label={mobile ? 'Close menu' : 'Open menu'} aria-expanded={mobile} onClick={() => (mobile ? closeAll() : (setDrop(null), setMobile(true)))}>
            <i /><i /><i />
          </button>
        </div>
      </div>

      {/* desktop slide-down */}
      <div className={`dl-panel${cur ? ' open' : ''}`} aria-hidden={!cur}>
        {cur && (
          <div className="dl-panel-in">
            <ul className="dl-tabs" role="tablist">
              {cur.tabs.map((t, i) => (
                <li key={t.label}>
                  <button role="tab" aria-selected={tab === i} className={tab === i ? 'on' : ''} onMouseEnter={() => setTab(i)} onClick={() => setTab(i)}>{t.label}</button>
                </li>
              ))}
            </ul>
            <div className="dl-links" key={cur.id + tab}>
              {cur.tabs[tab].cols.map((col, ci) => (
                <ul key={ci}>
                  {col.map(([label, href]) => <li key={label}><a href={href} onClick={closeAll}>{label}</a></li>)}
                </ul>
              ))}
            </div>
            <a className="dl-feature" href={cur.feature.href} onClick={closeAll}>
              <img src={cur.feature.img} alt="" loading="lazy" />
              <p>{cur.feature.kicker}</p>
              <span>{cur.feature.title}</span>
            </a>
          </div>
        )}
      </div>

      {/* search slide-down */}
      <div className={`dl-panel dl-search${drop === 'search' ? ' open' : ''}`} aria-hidden={drop !== 'search'}>
        <form className="dl-search-in" role="search" onSubmit={(e) => { e.preventDefault(); window.location.href = base + '#practice'; closeAll(); }}>
          <IconSearch />
          <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search practice areas and sectors" aria-label="Search" />
          {q && <button type="button" className="dl-clear" onClick={() => setQ('')}>Clear</button>}
        </form>
        {hits.length > 0 && (
          <ul className="dl-hits">
            {hits.map(([n, where]) => <li key={n + where}><a href={base + '#practice'} onClick={closeAll}>{n}<small>{where}</small></a></li>)}
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
                  : <a href={base + n.href} onClick={closeAll}>{n.label}</a>}
              </li>
            ))}
            <li><a href={base + '#footer'} onClick={closeAll}>Contact us</a></li>
          </ul>
        ) : (() => {
          const n = NAV.find((x) => x.id === mStack[0]);
          const t = mStack.length > 1 ? n.tabs[mStack[1]] : null;
          return (
            <>
              <button className="dl-m-back" onClick={() => setMStack(mStack.slice(0, -1))}><Chev />{t ? n.label : 'Main menu'}</button>
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
          {menu.countries.map((c) => <a key={c.label} href={c.href}><Flag country={c.label} size={18} />{c.label}</a>)}
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
