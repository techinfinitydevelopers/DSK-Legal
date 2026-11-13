import { useEffect, useState } from 'react';

export default function Header({ data }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [prog, setProg] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      setScrolled(window.scrollY > 40);
      setProg(h.scrollTop / (h.scrollHeight - h.clientHeight || 1));
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={`header${scrolled ? ' scrolled' : ''}`}>
      <div className="topbar">
        <div className="container topbar-in">
          <a href={`mailto:${data.email}`}>✉ {data.email}</a>
          <span className="ticker">
            <b>{data.ticker.label}</b> <a href="#knowledge">{data.ticker.text}</a>
          </span>
          <a className="btn btn-red btn-xs" href="#footer">Subscribe Now</a>
        </div>
      </div>
      <div className="container nav">
        <a href="/" className="brand" aria-label="DSK Legal home">
          <img src="/logo.jpg" alt="DSK Legal — True Value, True Values" />
        </a>
        <button className="burger" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
        <nav className={open ? 'open' : ''}>
          {data.nav.map(([n, h]) => (
            <a key={n} href={h} onClick={() => setOpen(false)}>{n}</a>
          ))}
          <a className="btn btn-red btn-xs" href="#footer">Contact Us</a>
        </nav>
      </div>
      <div className="progress" style={{ transform: `scaleX(${prog})` }} />
    </header>
  );
}
