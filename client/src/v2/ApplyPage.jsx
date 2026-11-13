import { useEffect, useMemo, useRef, useState } from 'react';
import { siteEmail } from '../seo.js';
import PageShell, { PageHero } from './PageShell.jsx';
import { Magnetic } from './fx.jsx';
import { INTERN_FORM, JOB_FORM } from './applyData.js';

/**
 * /careers/internship and /careers/apply — the firm's two application forms (fields from dsklegal.com/Internship and /job, see applyData.js).
 * There is no mail/storage backend, so a valid form opens the visitor's email client with every answer prefilled to the firm's address;
 * a CV can't travel that way, so the visitor is told to attach it before sending.
 */

const CV_TYPES = /\.(pdf|docx?|rtf)$/i;
const MAX_CV = 5 * 1024 * 1024;

const PAGES = {
  '/careers/internship': { form: INTERN_FORM, title: 'Internship application', crumb: 'Internship', parts: [{ text: 'Internship' }, { text: 'application', as: 'em' }], lede: 'Apply for a one-month internship at DSK Legal. Fields marked * are required.', subject: 'Internship application' },
  '/careers/apply': { form: JOB_FORM, title: 'Job application', crumb: 'Apply for a position', parts: [{ text: 'Apply for a' }, { text: 'position', as: 'em' }], lede: 'Tell us about your education and experience. Fields marked * are required.', subject: 'Job application' },
};
const path = window.location.pathname.replace(/\/$/, '');
const cfg = PAGES[path] || PAGES['/careers/apply'];

const visible = (f, v) => !f.showIf || (f.showIf.any ? !!v[f.showIf.id] : v[f.showIf.id] === f.showIf.eq);

function validate(form, v, cv, ok) {
  const e = {};
  for (const s of form.sections) for (const f of s.fields) {
    if (!visible(f, v)) continue;
    const val = (v[f.id] ?? '').toString().trim();
    if (f.type === 'file') {
      if (f.required && !cv) e[f.id] = 'Please attach your CV.';
      else if (cv && !CV_TYPES.test(cv.name)) e[f.id] = 'Use a PDF or Word file.';
      else if (cv && cv.size > MAX_CV) e[f.id] = 'File is larger than 5 MB.';
      continue;
    }
    if (!val) { if (f.required) e[f.id] = 'This field is required.'; continue; }
    if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) e[f.id] = 'Enter a valid email address.';
    if (f.type === 'tel' && !/^\d{10}$/.test(val)) e[f.id] = 'Enter the 10-digit number without +91.';
    if (f.type === 'number') {
      const n = Number(val);
      if (Number.isNaN(n) || n < (f.min ?? 0)) e[f.id] = f.min ? `Must be between ${f.min} and ${f.max}.` : 'Enter a valid number.';
      else if (f.max && n > f.max) e[f.id] = `Must be between ${f.min} and ${f.max}.`;
    }
  }
  if (!ok) e._confirm = 'Please confirm the declaration.';
  return e;
}

function Field({ f, value, error, onChange, onFile, fileName }) {
  const id = `f-${f.id}`;
  const common = { id, name: f.id, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-e` : undefined };
  let input;
  if (f.type === 'select') {
    input = (
      <select {...common} value={value || ''} onChange={(e) => onChange(f.id, e.target.value)}>
        <option value="">Select…</option>
        {[...new Set(f.options)].map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  } else if (f.type === 'textarea') {
    input = <textarea {...common} rows={4} value={value || ''} placeholder={f.placeholder} onChange={(e) => onChange(f.id, e.target.value)} />;
  } else if (f.type === 'file') {
    input = (
      <>
        <input {...common} type="file" accept=".pdf,.doc,.docx,.rtf" onChange={(e) => onFile(e.target.files[0] || null)} />
        {fileName && <small className="x-ap-file">Selected: {fileName}</small>}
      </>
    );
  } else {
    input = <input {...common} type={f.type} value={value || ''} placeholder={f.placeholder} min={f.min} max={f.max} inputMode={f.type === 'tel' ? 'numeric' : undefined} autoComplete={f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : undefined} onChange={(e) => onChange(f.id, e.target.value)} />;
  }
  return (
    <div className={`x-af-field${f.type === 'textarea' || f.type === 'file' || (f.label || '').length > 60 || (f.placeholder || '').length > 45 ? ' wide' : ''}${error ? ' bad' : ''}`}>
      <label htmlFor={id}>{f.label}{f.required && <b aria-hidden="true"> *</b>}</label>
      {input}
      {error && <p className="x-af-err" id={`${id}-e`} role="alert">{error}</p>}
    </div>
  );
}

export default function ApplyPage() {
  return (
    <PageShell title={cfg.title}>
      {() => <Form />}
    </PageShell>
  );
}

const isFilled = (f, v, cv) => (f.type === 'file' ? !!cv : !!(v[f.id] ?? '').toString().trim());
const splitTitle = (t) => { const m = t.match(/^(.*?)\s*\(optional\)$/i); return m ? [m[1], true] : [t, false]; };

/** With open positions published in the CMS, the free-text "Job ID" field becomes a dropdown of them. */
function withJobs(form) {
  const jobs = window.__JOBS || [];
  if (!jobs.length) return form;
  const opts = jobs.map((j) => ({ label: j.jobId ? `${j.title} (${j.jobId})` : j.title, j }));
  return { ...form, sections: form.sections.map((s) => ({ ...s, fields: s.fields.map((f) => (f.label === 'Job ID'
    ? { ...f, label: 'Open position', type: 'select', placeholder: undefined, options: ['N/A — general application', ...opts.map((o) => o.label)], _jobs: opts }
    : f)) })) };
}

function Form() {
  const form = useMemo(() => withJobs(cfg.form), []);
  const [v, setV] = useState(() => {
    const job = new URLSearchParams(window.location.search).get('job');
    const f = job && form.sections.flatMap((s) => s.fields).find((x) => x.label === 'Job ID' || x.label === 'Open position');
    if (!f) return {};
    const hit = f._jobs?.find((o) => o.j.jobId === job || o.j.title === job);
    return f._jobs ? (hit ? { [f.id]: hit.label } : {}) : { [f.id]: job.slice(0, 120) };
  });
  const [cv, setCv] = useState(null);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState({});
  const [sent, setSent] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const set = (id, val) => setV((s) => ({ ...s, [id]: val }));
  const fileField = useMemo(() => form.sections.flatMap((s) => s.fields).find((f) => f.type === 'file'), [form]);

  // per-section completion (required, visible fields) + overall progress
  const prog = form.sections.map((s) => {
    const req = s.fields.filter((f) => f.required && visible(f, v));
    const done = req.filter((f) => isFilled(f, v, cv)).length;
    return { total: req.length, done };
  });
  const total = prog.reduce((n, p) => n + p.total, 0) + 1;
  const done = prog.reduce((n, p) => n + p.done, 0) + (ok ? 1 : 0);

  // highlight the section being read in the left rail
  useEffect(() => {
    const els = [...ref.current.querySelectorAll('.x-af-sec')];
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(els.indexOf(e.target))), { rootMargin: '-25% 0px -65% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const errors = validate(form, v, cv, ok);
    setErr(errors);
    const first = Object.keys(errors)[0];
    if (first) {
      const el = first === '_confirm' ? ref.current.querySelector('.x-af-confirm input') : document.getElementById(`f-${first}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus({ preventScroll: true });
      return;
    }
    const lines = [];
    for (const s of form.sections) {
      const rows = s.fields.filter((f) => f.type !== 'file' && visible(f, v) && (v[f.id] ?? '').toString().trim()).map((f) => `${f.label}: ${v[f.id].toString().trim()}`);
      if (rows.length) lines.push(`== ${s.title} ==`, ...rows, '');
    }
    lines.push(`CV: ${cv?.name || '—'} (attach this file to the email)`, 'Declaration: confirmed');
    const name = v[form.sections[0].fields[0].id] || '';
    // Preferred: deliver to the site's inbox with the CV stored privately. If there is no backend, fall back to mailto.
    try {
      const fields = {};
      for (const s of form.sections) for (const f of s.fields) if (f.type !== 'file' && visible(f, v) && (v[f.id] ?? '').toString().trim()) fields[f.label] = v[f.id].toString().trim();
      fields.name = name;
      const cvData = cv ? await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(cv); }) : null;
      const r = await fetch(`/api/forms/${cfg === PAGES['/careers/internship'] ? 'internship' : 'job'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields, cv: cvData && { name: cv.name, data: cvData }, website: '' }) });
      if (r.ok) { setSent('stored'); return; }
    } catch { /* fall through to mailto */ }
    window.location.href = `mailto:${siteEmail()}?subject=${encodeURIComponent(`${cfg.subject} — ${name}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
    setSent('mail');
  };

  const errCount = Object.keys(err).length;

  return (
    <>
      <PageHero crumbs={[['Careers', '/careers'], [cfg.crumb]]} parts={cfg.parts} lede={cfg.lede} />
      <section className="x-sec x-af">
        <div className="container x-af-layout">
          <aside className="x-af-rail" aria-label="Form progress">
            <p className="x-kicker">Your application</p>
            <ol>
              {form.sections.map((s, i) => {
                const [name, optional] = splitTitle(s.title);
                const p = prog[i];
                const complete = p.total > 0 && p.done === p.total;
                return (
                  <li key={s.title} className={`${active === i ? 'on' : ''}${complete ? ' done' : ''}`}>
                    <a href={`#sec-${i}`} onClick={(e) => { e.preventDefault(); document.getElementById(`sec-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
                      <span className="n">{complete ? '✓' : String(i + 1).padStart(2, '0')}</span>
                      <span className="t">{name}{optional && <small>Optional</small>}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
            <div className="x-af-prog" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Required fields completed">
              <span style={{ width: `${Math.round((done / total) * 100)}%` }} />
            </div>
            <small>{done} of {total} required fields done</small>
          </aside>

          <form ref={ref} className="x-af-form" onSubmit={submit} noValidate>
            {form.sections.map((s, i) => {
              const fields = s.fields.filter((f) => visible(f, v));
              const [name, optional] = splitTitle(s.title);
              return (
                <section key={s.title} id={`sec-${i}`} className="x-af-sec">
                  <header>
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    <h2>{name}</h2>
                    {optional && <em>Optional</em>}
                  </header>
                  <div className="x-af-grid">
                    {fields.map((f) => (
                      <Field key={f.id} f={f} value={v[f.id]} error={err[f.id]} onChange={set} onFile={setCv} fileName={f.type === 'file' ? cv?.name : ''} />
                    ))}
                  </div>
                </section>
              );
            })}
            <label className={`x-af-confirm${err._confirm ? ' bad' : ''}`}>
              <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
              <span>{form.confirm.label} <b aria-hidden="true">*</b></span>
            </label>
            {err._confirm && <p className="x-af-err" role="alert">{err._confirm}</p>}
            {errCount > 0 && <p className="x-af-summary" role="alert">Please fix {errCount} field{errCount === 1 ? '' : 's'} highlighted above.</p>}
            <div className="x-af-actions">
              <Magnetic><button className="x-btn x-btn-red" type="submit">Send application <b>→</b></button></Magnetic>
              <a className="x-link" href="/careers">Back to careers</a>
            </div>
            {sent === 'stored' && <p className="x-ct-note" role="status">Thank you — your application has been received. We will be in touch if your profile is shortlisted.</p>}
            {sent === 'mail' && (
              <p className="x-ct-note" role="status">
                Your email app should have opened with your answers. <b>Attach {cv ? `“${cv.name}”` : fileField?.label}</b> before sending. If nothing opened, write to <a href={`mailto:${siteEmail()}`}>{siteEmail()}</a>.
              </p>
            )}
          </form>
        </div>
      </section>
    </>
  );
}
