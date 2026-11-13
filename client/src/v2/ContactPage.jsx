import { useState } from 'react';
import { siteEmail } from '../seo.js';
import PageShell, { PageHero } from './PageShell.jsx';
import { Reveal } from '../hooks.jsx';
import { Magnetic } from './fx.jsx';

/**
 * /contact — "Get in touch" form (name, phone, email, message) from dsklegal.com/contact, plus office numbers.
 * There is no mail backend, so submitting opens the visitor's email client with the message prefilled to the firm's address.
 */


export default function ContactPage() {
  return (
    <PageShell title="Contact Us">
      {(data) => <Contact cities={data.offices.cities} />}
    </PageShell>
  );
}

function Contact({ cities }) {
  const topic = new URLSearchParams(window.location.search).get('topic') || '';
  const [f, setF] = useState({ name: '', phone: '', email: '', message: topic ? `I’d like to discuss: ${topic}\n\n` : '' });
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    // Preferred: deliver to the site's inbox (admin dashboard). If there is no backend, fall back to the visitor's mail app.
    try {
      const r = await fetch('/api/forms/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { ...f, topic }, website: '' }) });
      if (r.ok) { setSent('stored'); setF({ ...f, message: '' }); return; }
    } catch { /* fall through to mailto */ }
    const body = `${f.message}\n\n— ${f.name}\nPhone: ${f.phone}\nEmail: ${f.email}`;
    window.location.href = `mailto:${siteEmail()}?subject=${encodeURIComponent('Enquiry from dsklegal website' + (topic ? ` — ${topic}` : ''))}&body=${encodeURIComponent(body)}`;
    setSent('mail');
  };
  return (
    <>
      <PageHero
        crumbs={[['Contact us']]}
        parts={[{ text: 'Contact' }, { text: 'Us', as: 'em' }]}
        lede="Send us your question, and we will get back to you as soon as possible."
      />
      <section className="x-sec">
        <div className="container x-ct-in">
          <Reveal>
            <p className="x-kicker">Get in touch</p>
            <form className="x-ct-form" onSubmit={submit}>
              <label>Name<input required value={f.name} onChange={set('name')} autoComplete="name" /></label>
              <label>Phone number<input type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" /></label>
              <label>Email<input required type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
              <label>Message<textarea required rows={6} value={f.message} onChange={set('message')} /></label>
              <Magnetic><button className="x-btn x-btn-red" type="submit">Send <b>→</b></button></Magnetic>
              {sent === 'stored' && <p className="x-ct-note" role="status">Thank you — your message has been received. We will get back to you shortly.</p>}
              {sent === 'mail' && <p className="x-ct-note" role="status">Your email app should have opened with this message. If it didn’t, write to <a href={`mailto:${siteEmail()}`}>{siteEmail()}</a>.</p>}
            </form>
          </Reveal>
          <Reveal delay={150}>
            <p className="x-kicker">Our offices</p>
            <ul className="x-ct-offices">
              {cities.map((c) => (
                <li key={c.city}><b>{c.city}</b>{/\d/.test(c.note) ? <a href={`tel:${c.note.replace(/[^\d+]/g, '')}`}>{c.note}</a> : <span>{c.note}</span>}</li>
              ))}
            </ul>
            <p className="x-ct-mail"><small>Email</small><a href={`mailto:${siteEmail()}`}>{siteEmail()}</a></p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
