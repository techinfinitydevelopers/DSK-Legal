import { useEffect, useRef, useState } from 'react';
import { Flag } from './Flags.jsx';

const NAV = [
  { label: 'About Us', href: '#about', spy: true },
  { label: 'Practice Areas', href: '#practice', spy: true, menu: 'practice' },
  { label: 'Sectors & Industries', href: '#practice', menu: 'sectors' },
  { label: 'Our Team', href: '#about' },
  { label: 'Knowledge Centre', href: '#knowledge', spy: true },
  { label: 'Careers', href: '#footer' },
];

const Chev = () => <i className="xh-chev" aria-hidden="true" />;

export default function Header2({ data }) {
  const { menu } = data;
  // On sub-pages (e.g. /v2/awards) section anchors must point back to the /v2 home page.
  const base = window.location.pathname.replace(/\/$/, '') === '/v2' ? '' : '/v2';
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false); // mobile overlay
  const [drop, setDrop] = useState(null); // 'practice' | 'sectors' | 'country' | null
  const [country, setCountry] = useState('India');
  const [active, setActive] = useState('');
  const [ind, setInd] = useState(null);
  const navRef = useRef(null);
  const lastY = useRef(0);

  useEffect(() => {
    const on = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      if (y > lastY.current + 4 && y > 500) setHidden(true);
      else if (y < lastY.current - 4) setHidden(false);
      if (y > 40) setDrop((d) => (d === 'country' ? null : d));
      lastY.current = y;
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    const els = NAV.filter((n) => n.spy).map((n) => document.querySelector(n.href)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive('#' + e.target.id)),
      { rootMargin: '-35% 0px -55% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => (document.body.style.overflow = '');
  }, [open]);

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && (setDrop(null), setOpen(false));
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  const place = (el) => {
    const nav = navRef.current;
    if (!el || !nav) return;
    const a = el.getBoundingClientRect();
    const b = nav.getBoundingClientRect();
    setInd({ left: a.left - b.left, width: a.width });
  };
  const rest = () => {
    const el = navRef.current?.querySelector(`a[data-spy="${active}"]`);
    el ? place(el) : setInd(null);
  };
  const activeRef = useRef('');
  activeRef.current = active;
  // re-measure whenever the nav resizes (pill morph, window resize, fonts) so the highlight never drifts
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const sync = () => {
      const el = nav.querySelector(`a[data-spy="${activeRef.current}"]`);
      el ? place(el) : setInd(null);
    };
    const ro = new ResizeObserver(sync);
    ro.observe(nav);
    sync();
    const t = setTimeout(sync, 600);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, [active, scrolled]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => setDrop(null);

  return (
    <>
      {/* v2 keeps the full-width bar on scroll (no ' sc' pill morph, v3 still has it); only the red strip folds away ('nostrip') */}
      <header className={`xh${scrolled ? ' nostrip' : ''}${hidden && !drop ? ' hide' : ''}`} onMouseLeave={close}>
        <div className="xh-top">
          <a className="xh-mail" href={`mailto:${data.email}`}>
            <svg width="14" height="11" viewBox="0 0 14 11" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x=".6" y=".6" width="12.8" height="9.8" rx="1" /><path d="M1 1.5 7 6l6-4.5" /></svg>
            {data.email}
          </a>
          <div className="xh-top-r">
            <a className="xh-read" href={base + "#knowledge"}><b>{data.ticker.label}</b> {data.ticker.text}</a>
            <div className="xh-country">
              <button aria-haspopup="listbox" aria-expanded={drop === 'country'} onClick={() => setDrop(drop === 'country' ? null : 'country')} onMouseEnter={() => setDrop('country')}>
                {country === 'India' ? 'Country Selector' : country} <Chev />
              </button>
              <ul className={drop === 'country' ? 'open' : ''} role="listbox">
                {menu.countries.map((c) => (
                  <li key={c.label}>
                    <a href={c.href} className={c.label === country ? 'sel' : ''} onClick={() => setCountry(c.label)}><Flag country={c.label} size={22} />{c.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="xh-pill">
          <a href="/v2" className="xh-brand" aria-label="DSK Legal home">
            <img src="/logo.png" alt="DSK Legal — True Value, True Values" />
          </a>

          <nav ref={navRef} className="xh-nav" onMouseLeave={rest} aria-label="Primary">
            <span className="xh-ind" style={ind ? { transform: `translateX(${ind.left}px)`, width: ind.width, opacity: 1 } : { opacity: 0 }} />
            {NAV.map((n) => (
              <a
                key={n.label}
                href={base + n.href}
                data-spy={n.spy ? n.href : undefined}
                className={`${active === n.href && n.spy ? 'on' : ''}${n.menu && drop === n.menu ? ' dd' : ''}`}
                aria-haspopup={n.menu ? 'true' : undefined}
                aria-expanded={n.menu ? drop === n.menu : undefined}
                onMouseEnter={(e) => { place(e.currentTarget); setDrop(n.menu || null); }}
                onFocus={(e) => { place(e.currentTarget); setDrop(n.menu || null); }}
                onClick={close}
              >
                {n.label}
                {n.menu && <Chev />}
              </a>
            ))}
          </nav>

          <a className="xh-cta" href="#footer"><span>Contact Us</span><i>↗</i></a>
          <button className="xh-burger" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}><i /><i /></button>

          <div className={`xh-mega${drop === 'practice' ? ' open' : ''}`}>
            <div className="xh-mega-in">
              <div className="xh-cols">
                {menu.practice.map((g) => (
                  <div key={g.title} className="xh-grp">
                    <a className="xh-gt" href={base + "#practice"} onClick={close}>{g.title}</a>
                    <ul>
                      {g.items.slice(0, 4).map((i) => <li key={i}><a href={base + "#practice"} onClick={close}>{i}</a></li>)}
                    </ul>
                    {g.items.length > 4 && <a className="xh-more" href={base + "#practice"} onClick={close}>+{g.items.length - 4} more</a>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`xh-mega${drop === 'sectors' ? ' open' : ''}`}>
            <div className="xh-mega-in">
              <ul className="xh-sectors">
                {menu.sectors.map((s) => <li key={s}><a href={base + "#practice"} onClick={close}>{s}</a></li>)}
              </ul>
            </div>
          </div>
        </div>
      </header>

      <div className={`xh-menu${open ? ' open' : ''}`} aria-hidden={!open}>
        <button className="xh-close" aria-label="Close menu" onClick={() => setOpen(false)}>✕</button>
        <ul>
          {[...NAV, { label: 'Contact Us', href: '#footer' }].map((n, i) => (
            <li key={n.label} style={{ '--i': i }}>
              <a href={base + n.href} onClick={() => setOpen(false)}><em>{String(i + 1).padStart(2, '0')}</em>{n.label}</a>
            </li>
          ))}
        </ul>
        <div className="xh-menu-foot">
          <a href={`mailto:${data.email}`}>{data.email}</a>
          <span>{menu.countries.map((c) => c.label).join(' · ')} · Mumbai · New Delhi · Bengaluru · Pune · Chennai · Dubai</span>
        </div>
      </div>
    </>
  );
}
