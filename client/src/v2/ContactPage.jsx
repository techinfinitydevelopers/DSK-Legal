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

/** Built-in form; the dashboard (Forms tab) can replace it, see server/cms/forms.js. */
const DEFAULT_FORM = {
  sections: [{ title: 'Get in touch', fields: [
    { id: 'name', label: 'Name', type: 'text', required: true },
    { id: 'phone', label: 'Phone number', type: 'tel', required: false, format: 'any' },
    { id: 'email', label: 'Email', type: 'email', required: true },
    { id: 'message', label: 'Message', type: 'textarea', required: true },
  ] }],
  submitLabel: 'Send',
  success: 'Thank you — your message has been received. We will get back to you shortly.',
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const visible = (f, v) => !f.showIf || (f.showIf.any ? !!v[f.showIf.id] : v[f.showIf.id] === f.showIf.eq);

function Contact({ cities }) {
  const topic = new URLSearchParams(window.location.search).get('topic') || '';
  const form = window.__FORMS?.contact || DEFAULT_FORM;
  const fields = form.sections.flatMap((s) => s.fields).filter((f) => f.type !== 'file');
  const [f, setF] = useState(() => Object.fromEntries(fields.map((x) => [x.id, x.id === 'message' && topic ? `I’d like to discuss: ${topic}\n\n` : ''])));
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState({});
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const check = () => {
    const e = {};
    for (const x of fields) {
      if (!visible(x, f)) continue;
      const val = String(f[x.id] ?? '').trim();
      if (!val) { if (x.required) e[x.id] = 'Required'; continue; }
      if (x.type === 'email' && !EMAIL_RE.test(val)) e[x.id] = 'Enter a valid email address';
      if (x.type === 'tel' && (x.format === '10' ? !/^\d{10}$/.test(val) : !/^[+\d][\d\s()-]{4,24}$/.test(val))) e[x.id] = 'Enter a valid phone number';
      if (x.type === 'number' && (Number.isNaN(Number(val)) || (x.min != null && Number(val) < x.min) || (x.max != null && Number(val) > x.max))) e[x.id] = 'Enter a valid number';
    }
    return e;
  };
  const submit = async (e) => {
    e.preventDefault();
    const errors = check(); setErr(errors);
    if (Object.keys(errors).length) { document.getElementById(`ct-${Object.keys(errors)[0]}`)?.focus(); return; }
    // Preferred: deliver to the site's inbox (admin dashboard). If there is no backend, fall back to the visitor's mail app.
    try {
      const r = await fetch('/api/forms/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ values: f, topic, fields: { ...f, topic }, website: '' }) });
      if (r.ok) { setSent('stored'); setF(Object.fromEntries(fields.map((x) => [x.id, '']))); return; }
      const j = await r.json().catch(() => ({}));
      if (r.status === 400 && j.error) { setSent('error:' + j.error); return; }
    } catch { /* fall through to mailto */ }
    const body = fields.filter((x) => visible(x, f) && String(f[x.id] || '').trim()).map((x) => `${x.label}: ${f[x.id]}`).join('\n');
    window.location.href = `mailto:${siteEmail()}?subject=${encodeURIComponent('Enquiry from dsklegal website' + (topic ? ` — ${topic}` : ''))}&body=${encodeURIComponent(body)}`;
    setSent('mail');
  };
  const control = (x) => {
    const c = { id: `ct-${x.id}`, value: f[x.id] ?? '', onChange: set(x.id), 'aria-invalid': !!err[x.id], placeholder: x.placeholder };
    if (x.type === 'textarea') return <textarea {...c} rows={6} />;
    if (x.type === 'select') return <select {...c}><option value="">Select…</option>{(x.options || []).map((o) => <option key={o} value={o}>{o}</option>)}</select>;
    return <input {...c} type={x.type} min={x.min} max={x.max} autoComplete={x.type === 'email' ? 'email' : x.type === 'tel' ? 'tel' : x.id === 'name' ? 'name' : undefined} />;
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
            <form className="x-ct-form" onSubmit={submit} noValidate>
              {fields.filter((x) => visible(x, f)).map((x) => (
                <label key={x.id} htmlFor={`ct-${x.id}`}>{x.label}{x.required && ' *'}{control(x)}{err[x.id] && <small className="x-ct-err" role="alert">{err[x.id]}</small>}</label>
              ))}
              <Magnetic><button className="x-btn x-btn-red" type="submit">{form.submitLabel || 'Send'} <b>→</b></button></Magnetic>
              {sent === 'stored' && <p className="x-ct-note" role="status">{form.success || DEFAULT_FORM.success}</p>}
              {String(sent).startsWith('error:') && <p className="x-ct-note" role="alert">{String(sent).slice(6)}</p>}
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
