import { useState } from 'react';

/** Social icon: a link when the address is set in the dashboard (Footer). With no footer settings saved yet both icons show as plain icons; once saved, only the ones with an address show. */
const Social = ({ label, href, configured, children }) => (configured && !href ? null : href
  ? <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>{children}</a>
  : <span className="soc-off" role="img" aria-label={label}>{children}</span>);

export default function Footer({ data, awardsHref = '/awards', teamHref = '/people', aboutHref = '/about' }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) throw new Error();
      setMsg('Thank you for subscribing.');
      setEmail('');
    } catch {
      setMsg('Please enter a valid email.');
    }
  };

  return (
    <footer id="footer" className="footer">
      <div className="container foot-grid">
        <div>
          <h4>{data.officesTitle || 'Office Locations'}</h4>
          <ul>
            {data.offices.map((o) => (
              <li key={o}><i className="dot" />{o}</li>
            ))}
          </ul>
          {!(data.social && !data.social.linkedin && !data.social.instagram) && <div className="follow">
            <span>FOLLOW US</span>
            <Social label="LinkedIn" href={data.social?.linkedin} configured={!!data.social}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg></Social>
            <Social label="Instagram" href={data.social?.instagram} configured={!!data.social}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.2" /><circle cx="12" cy="12" r="4.1" /><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" /></svg></Social>
          </div>}
        </div>
        <div>
          <h4>{data.linksTitle || 'The Firm'}</h4>
          <ul className="plain">
            {data.links
              ? data.links.map((l) => <li key={l.label + l.href}><a href={l.href}>{l.label}</a></li>)
              : (aboutHref ? data.firm.flatMap((f) => (f === 'Home' ? [f, 'About Us'] : [f])) : data.firm).map((f) => (
                <li key={f}><a href={f === 'Awards & Recognition' ? awardsHref : f === 'Our Team' ? teamHref : f === 'About Us' ? aboutHref : f === 'Home' ? '/' : f === 'Careers' ? '/careers' : f === 'FAQs' ? '/faq' : /^Contact/.test(f) ? '/contact' : '#'}>{f}</a></li>
              ))}
          </ul>
        </div>
        <div>
          <h4>{data.mailingTitle || 'Join Our Mailing List'}</h4>
          <p className="small">{data.mailing}</p>
          <form onSubmit={submit}>
            <input type="email" required placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn btn-red btn-sm" type="submit">SEND</button>
          </form>
          {msg && <p className="small" role="status">{msg}</p>}
        </div>
        {data.promo?.image ? (
          <div className="foot-promo">
            {data.promo.href
              ? <a href={data.promo.href} target="_blank" rel="noopener noreferrer"><img src={data.promo.image} alt={data.promo.alt || ''} loading="lazy" width="500" height="500" /></a>
              : <img src={data.promo.image} alt={data.promo.alt || ''} loading="lazy" width="500" height="500" />}
          </div>
        ) : (
        <div className="person">
          <div className="avatar" aria-hidden="true" style={data.person.photo ? { backgroundImage: `url(${data.person.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} />
          <b>{data.person.name}</b>
          <span>{data.person.role}</span>
        </div>
        )}
      </div>
      {(window.__FOOTER_MENUS || []).length > 0 && (
        <div className="container foot-menus">
          {window.__FOOTER_MENUS.map((m) => (
            <nav key={m.id} aria-label={m.name}>
              <h4>{m.name}</h4>
              <ul className="plain">{m.links.map((l) => <li key={l.label + l.href}><a href={l.href}>{l.label}</a></li>)}</ul>
            </nav>
          ))}
        </div>
      )}
      <div className="container legal">
        <span>{data.copyright}</span>
        <span>{data.disclaimer}</span>
        <nav className="legal-links" aria-label="Legal">
          <a href="/privacy-policy">Privacy Policy</a><a href="/terms-and-conditions">Terms &amp; Conditions</a><a href="/disclaimer">Disclaimer</a><button type="button" onClick={() => window.dispatchEvent(new Event('dsk-cookie-settings'))}>Cookie settings</button>
        </nav>
      </div>
    </footer>
  );
}
