import { useState } from 'react';

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
          {data.social ? (
            (data.social.linkedin || data.social.instagram) && (
              <p className="follow">FOLLOW US
                {data.social.linkedin && <a href={data.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><span>in</span></a>}
                {data.social.instagram && <a href={data.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><span>◎</span></a>}
              </p>
            )
          ) : <p className="follow">FOLLOW US <span>in</span> <span>◎</span></p>}
        </div>
        <div>
          <h4>{data.linksTitle || 'The Firm'}</h4>
          <ul className="plain">
            {data.links
              ? data.links.map((l) => <li key={l.label + l.href}><a href={l.href}>{l.label}</a></li>)
              : (aboutHref ? data.firm.flatMap((f) => (f === 'Home' ? [f, 'About Us'] : [f])) : data.firm).map((f) => (
                <li key={f}><a href={f === 'Awards & Recognition' ? awardsHref : f === 'Our Team' ? teamHref : f === 'About Us' ? aboutHref : f === 'Home' ? '/' : f === 'Careers' ? '/careers' : /^Contact/.test(f) ? '/contact' : '#'}>{f}</a></li>
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
        <div className="person">
          <div className="avatar" aria-hidden="true" style={data.person.photo ? { backgroundImage: `url(${data.person.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} />
          <b>{data.person.name}</b>
          <span>{data.person.role}</span>
        </div>
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
      </div>
    </footer>
  );
}
