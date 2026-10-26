import { useState } from 'react';

export default function Footer({ data, awardsHref = '#awards' }) {
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
          <h4>Office Locations</h4>
          <ul>
            {data.offices.map((o) => (
              <li key={o}><i className="dot" />{o}</li>
            ))}
          </ul>
          <p className="follow">FOLLOW US <span>in</span> <span>◎</span></p>
        </div>
        <div>
          <h4>The Firm</h4>
          <ul className="plain">
            {data.firm.map((f) => (
              <li key={f}><a href={f === 'Awards & Recognition' ? awardsHref : '#'}>{f}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Join Our Mailing List</h4>
          <p className="small">{data.mailing}</p>
          <form onSubmit={submit}>
            <input type="email" required placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn btn-red btn-sm" type="submit">SEND</button>
          </form>
          {msg && <p className="small" role="status">{msg}</p>}
        </div>
        <div className="person">
          <div className="avatar" aria-hidden="true" />
          <b>{data.person.name}</b>
          <span>{data.person.role}</span>
        </div>
      </div>
      <div className="container legal">
        <span>{data.copyright}</span>
        <span>{data.disclaimer}</span>
      </div>
    </footer>
  );
}
