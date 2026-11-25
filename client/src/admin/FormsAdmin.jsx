import { useEffect, useState } from 'react';
import { Icon, Field, Input, Text, Select, Lines } from './ui.jsx';

/* Forms tab: choose a form, then edit its sections and fields (label, type, required, options, show-when rules).
   The public page, the server-side checks and the inbox all read the saved definition (server/cms/forms.js). */

const TYPES = [['text', 'Short text'], ['email', 'Email'], ['tel', 'Phone'], ['number', 'Number'], ['date', 'Date'], ['textarea', 'Long text'], ['select', 'Dropdown'], ['file', 'File upload (CV)']];
const key = () => Math.random().toString(36).slice(2, 9);
/** stable React keys while editing (stripped before saving), so reordering never mixes up the option boxes */
const tag = (form) => ({ ...form, confirm: form.confirm || null, sections: form.sections.map((s) => ({ ...s, _k: key(), fields: s.fields.map((f) => ({ ...f, _k: key() })) })) });
const strip = (form) => ({ ...form, sections: form.sections.map(({ _k, ...s }) => ({ ...s, fields: s.fields.map(({ _k: _x, ...f }) => f) })) });
const swap = (a, i, d) => { const j = i + d; if (j < 0 || j >= a.length) return a; const b = [...a]; [b[i], b[j]] = [b[j], b[i]]; return b; };
const newField = () => ({ _k: key(), id: `f_${key()}`, label: '', type: 'text', required: false });

export function FormsList({ api, toast }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { api('GET', '/forms').then(setRows).catch((e) => toast(e.message, 'err')); }, []); // eslint-disable-line
  return (
    <>
      <div className="cm-head"><h1>Forms</h1></div>
      <p className="cm-muted">Change what each public form asks for: add, remove, reorder or rename fields, make them required, edit dropdown options and show a field only when another answer matches. Entries still arrive in the Inbox.</p>
      {!rows ? <p>Loading…</p> : (
        <div className="cm-tablewrap"><table className="cm-table"><thead><tr><th>Form</th><th>Public page</th><th>Fields</th><th>Status</th><th /></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}>
              <td><a href={`#/forms/${r.id}`}><b>{r.title}</b></a><br /><small className="cm-muted">{r.about}</small></td>
              <td><a href={r.page} target="_blank" rel="noreferrer">{r.page} <Icon n="ext" /></a></td>
              <td>{r.fields} in {r.sections} section{r.sections === 1 ? '' : 's'}</td>
              <td><span className={`cm-pill${r.custom ? '' : ' off'}`}>{r.custom ? 'Customised' : 'Built-in'}</span></td>
              <td><a className="cm-btn" href={`#/forms/${r.id}`}>Edit fields</a></td>
            </tr>))}</tbody></table></div>
      )}
      <p className="cm-muted">The credentials form on the Sectors &amp; Industries page is a Microsoft Form and is edited in Microsoft Forms, not here.</p>
    </>
  );
}

function Condition({ f, prior, set }) {
  const on = !!f.showIf;
  const src = prior.find((p) => p.id && p.id === f.showIf?.id) || null;
  const choose = (id) => { const p = prior.find((x) => x.id === id); set({ showIf: id ? { id, ...(p?.type === 'select' && p.options?.length ? { eq: p.options[0] } : { eq: '' }) } : undefined }); };
  return (
    <div className="cm-ff-cond">
      <label className="cm-ff-inline"><span>Show this field</span>
        <select value={on ? 'when' : 'always'} onChange={(e) => (e.target.value === 'always' ? set({ showIf: undefined }) : choose(prior[0]?.id || ''))} disabled={!prior.length}>
          <option value="always">Always</option><option value="when">Only when another answer matches…</option>
        </select></label>
      {on && (
        <div className="cm-ff-cond-row">
          <select value={f.showIf.id} onChange={(e) => choose(e.target.value)}>{prior.map((p) => <option key={p._k} value={p.id}>{p.label || p.id}</option>)}</select>
          <select value={f.showIf.any ? 'any' : 'eq'} onChange={(e) => set({ showIf: e.target.value === 'any' ? { id: f.showIf.id, any: true } : { id: f.showIf.id, eq: src?.options?.[0] || '' } })}>
            <option value="eq">is exactly</option><option value="any">is filled in</option>
          </select>
          {!f.showIf.any && (src?.type === 'select' && src.options?.length
            ? <select value={f.showIf.eq ?? ''} onChange={(e) => set({ showIf: { id: f.showIf.id, eq: e.target.value } })}>{src.options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
            : <input value={f.showIf.eq ?? ''} onChange={(e) => set({ showIf: { id: f.showIf.id, eq: e.target.value } })} placeholder="value" />)}
        </div>
      )}
      {!prior.length && <small className="cm-muted">Add a field above this one to use it as a condition.</small>}
    </div>
  );
}

function FieldRow({ f, n, count, prior, upd, move, dup, del }) {
  const [open, setOpen] = useState(!f.label);
  const jobs = f.source === 'jobs';
  return (
    <div className={`cm-ff${open ? ' open' : ''}`}>
      <div className="cm-ff-top">
        <span className="cm-ff-n">{n + 1}</span>
        <input className="cm-ff-label" value={f.label} onChange={(e) => upd({ label: e.target.value })} placeholder="Field label, e.g. Full name" aria-label="Field label" />
        <select value={f.type} onChange={(e) => upd({ type: e.target.value })} aria-label="Field type" disabled={jobs}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <label className="cm-ff-req"><input type="checkbox" checked={!!f.required} onChange={(e) => upd({ required: e.target.checked })} /> Required</label>
        <div className="cm-mi-acts">
          <button type="button" className="cm-ico" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="More options" title="More options"><Icon n={open ? 'up' : 'down'} /></button>
          <button type="button" className="cm-ico" onClick={() => move(-1)} disabled={n === 0} aria-label="Move up" title="Move up"><Icon n="up" /></button>
          <button type="button" className="cm-ico" onClick={() => move(1)} disabled={n === count - 1} aria-label="Move down" title="Move down"><Icon n="down" /></button>
          <button type="button" className="cm-ico" onClick={dup} aria-label="Duplicate field" title="Duplicate"><Icon n="plus" /></button>
          <button type="button" className="cm-ico" onClick={del} aria-label="Delete field" title="Delete"><Icon n="x" /></button>
        </div>
      </div>
      {open && (
        <div className="cm-ff-more">
          {jobs && <p className="cm-muted">This field turns into a dropdown of the open positions published under Careers, when there are any.</p>}
          {!['select', 'file', 'date'].includes(f.type) && <Field label="Placeholder" hint="Grey hint shown inside the empty field."><Input v={f.placeholder} set={(v) => upd({ placeholder: v })} /></Field>}
          {f.type === 'select' && !jobs && <Field label="Options" hint="One per line, in the order visitors see them."><Lines v={f.options || []} set={(v) => upd({ options: v })} rows={5} /></Field>}
          {f.type === 'number' && <div className="cm-ff-two"><Field label="Minimum"><Input type="number" v={f.min ?? ''} set={(v) => upd({ min: v === '' ? undefined : v })} /></Field><Field label="Maximum"><Input type="number" v={f.max ?? ''} set={(v) => upd({ max: v === '' ? undefined : v })} /></Field></div>}
          {f.type === 'tel' && <Field label="Phone format"><Select v={f.format || 'any'} set={(v) => upd({ format: v })} options={[{ value: '10', label: '10-digit Indian number, without +91' }, { value: 'any', label: 'Any phone number' }]} /></Field>}
          {f.type === 'file' && <p className="cm-muted">Visitors can attach a PDF, DOC, DOCX or RTF up to 5 MB. Only one upload field per form.</p>}
          <Condition f={f} prior={prior} set={upd} />
        </div>
      )}
    </div>
  );
}

export function FormEditor({ id, api, toast, has }) {
  const [d, setD] = useState(null); const [form, setForm] = useState(null); const [dirty, setDirty] = useState(false); const [busy, setBusy] = useState(false);
  const can = has('content');
  useEffect(() => { api('GET', `/forms/${id}`).then((r) => { setD(r); setForm(tag(r.form)); }).catch((e) => toast(e.message, 'err')); }, [id]); // eslint-disable-line
  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
  if (!form || !d) return <p>Loading…</p>;
  const edit = (fn) => { setForm((f) => fn(f)); setDirty(true); };
  const sec = (si, patch) => edit((f) => ({ ...f, sections: f.sections.map((s, i) => (i === si ? { ...s, ...patch } : s)) }));
  const fld = (si, fi, patch) => sec(si, { fields: form.sections[si].fields.map((x, i) => (i === fi ? { ...x, ...patch } : x)) });
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const r = await api('PUT', `/forms/${id}`, strip(form)); setForm(tag(r)); setD((x) => ({ ...x, custom: true })); setDirty(false); toast('Form saved — live on the site'); } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); }
  };
  const reset = async () => {
    if (!window.confirm(`Reset “${d.title}” to the built-in fields? Your changes to this form are lost.`)) return;
    try { const r = await api('DELETE', `/forms/${id}`); setForm(tag(r)); setD((x) => ({ ...x, custom: false })); setDirty(false); toast('Form reset to the built-in fields'); } catch (x) { toast(x.message, 'err'); }
  };
  const total = form.sections.reduce((n, s) => n + s.fields.length, 0);
  const priorOf = (si, fi) => form.sections.flatMap((s, i) => s.fields.map((x, j) => ({ x, i, j }))).filter(({ i, j }) => i < si || (i === si && j < fi)).map(({ x }) => x).filter((x) => x.type !== 'file' && x.id);
  return (
    <form onSubmit={save}>
      <div className="cm-head"><h1>{d.title}</h1><a className="cm-btn ghost" href="#/forms">← All forms</a><a className="cm-btn ghost" href={d.page} target="_blank" rel="noreferrer">View page <Icon n="ext" /></a></div>
      {!can && <p className="cm-muted">Your role can view this form but not change it.</p>}
      <div className="cm-cols">
        <div className="cm-main">
          {form.sections.map((s, si) => (
            <section className="cm-box cm-fsec" key={s._k}>
              <div className="cm-fsec-head">
                <Field label={d.multiSection ? `Section ${si + 1} title` : 'Form heading'}><Input v={s.title} set={(v) => sec(si, { title: v })} disabled={!can} /></Field>
                {d.multiSection && can && <div className="cm-mi-acts">
                  <button type="button" className="cm-ico" onClick={() => edit((f) => ({ ...f, sections: swap(f.sections, si, -1) }))} disabled={si === 0} aria-label="Move section up"><Icon n="up" /></button>
                  <button type="button" className="cm-ico" onClick={() => edit((f) => ({ ...f, sections: swap(f.sections, si, 1) }))} disabled={si === form.sections.length - 1} aria-label="Move section down"><Icon n="down" /></button>
                  <button type="button" className="cm-ico" onClick={() => { if (window.confirm(`Delete the section “${s.title || si + 1}” and its ${s.fields.length} fields?`)) edit((f) => ({ ...f, sections: f.sections.filter((_, i) => i !== si) })); }} disabled={form.sections.length < 2} aria-label="Delete section"><Icon n="x" /></button>
                </div>}
              </div>
              <fieldset disabled={!can} className="cm-ff-list">
                {s.fields.map((f, fi) => (
                  <FieldRow key={f._k} f={f} n={fi} count={s.fields.length} prior={priorOf(si, fi)}
                    upd={(p) => fld(si, fi, p)}
                    move={(dlt) => sec(si, { fields: swap(s.fields, fi, dlt) })}
                    dup={() => sec(si, { fields: [...s.fields.slice(0, fi + 1), { ...f, _k: key(), id: `f_${key()}`, label: `${f.label} (copy)` }, ...s.fields.slice(fi + 1)] })}
                    del={() => { if (window.confirm(`Delete the field “${f.label || 'untitled'}”?`)) sec(si, { fields: s.fields.filter((_, i) => i !== fi) }); }} />
                ))}
                {can && <button type="button" className="cm-btn" onClick={() => sec(si, { fields: [...s.fields, newField()] })}><Icon n="plus" /> Add field</button>}
              </fieldset>
            </section>
          ))}
          {d.multiSection && can && <button type="button" className="cm-btn" onClick={() => edit((f) => ({ ...f, sections: [...f.sections, { _k: key(), title: '', fields: [newField()] }] }))}><Icon n="plus" /> Add section</button>}
        </div>
        <aside className="cm-side">
          {can && <section className="cm-box"><button className="cm-btn primary" disabled={busy || !dirty}>{busy ? 'Saving…' : dirty ? 'Save form' : 'Saved'}</button>
            {d.custom && <button type="button" className="cm-btn ghost" onClick={reset}>Reset to built-in</button>}
            <p className="cm-muted">{total} fields · {d.custom ? 'customised' : 'built-in fields'}. Saved changes go live straight away.</p></section>}
          <section className="cm-box"><h2>Button and messages</h2>
            <Field label="Submit button text"><Input v={form.submitLabel} set={(v) => edit((f) => ({ ...f, submitLabel: v }))} disabled={!can} /></Field>
            <Field label="Message after sending"><Text v={form.success} set={(v) => edit((f) => ({ ...f, success: v }))} rows={3} disabled={!can} /></Field></section>
          {d.multiSection && <section className="cm-box"><h2>Declaration checkbox</h2>
            <Field label="Text" hint="Visitors must tick it before sending. Leave empty to remove the checkbox."><Text v={form.confirm?.label || ''} set={(v) => edit((f) => ({ ...f, confirm: v.trim() ? { id: 'confirm', label: v, required: true } : null }))} rows={4} disabled={!can} /></Field></section>}
          <section className="cm-box"><h2>How it works</h2>
            <p className="cm-muted">Answers are checked again on the server. Entries appear in the Inbox with each field’s label{id === 'contact' ? '' : ' as the heading'}. Renaming a field only affects new entries.</p></section>
        </aside>
      </div>
    </form>
  );
}
