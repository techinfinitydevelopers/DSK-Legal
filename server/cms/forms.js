// Public forms (Contact, Internship, Job) whose fields are editable in the dashboard (Forms tab).
// Built-in definitions are the defaults; a saved definition in content/forms.json overrides one form. Reset = delete the saved entry.
// The same definition drives the public page, the server-side validation, and how an entry is stored in the inbox.
import { readJson, writeJson } from './store.js';
import { INTERN_FORM, JOB_FORM } from '../../client/src/v2/applyData.js';

export const FIELD_TYPES = ['text', 'email', 'tel', 'number', 'date', 'textarea', 'select', 'file'];
export const TYPE_LABEL = { text: 'Short text', email: 'Email', tel: 'Phone', number: 'Number', date: 'Date', textarea: 'Long text', select: 'Dropdown', file: 'File upload (CV)' };

const CONTACT = {
  sections: [{
    title: 'Get in touch',
    fields: [
      { id: 'name', label: 'Name', type: 'text', required: true },
      { id: 'phone', label: 'Phone number', type: 'tel', required: false, format: 'any' },
      { id: 'email', label: 'Email', type: 'email', required: true },
      { id: 'message', label: 'Message', type: 'textarea', required: true },
    ],
  }],
  confirm: null,
  submitLabel: 'Send',
  success: 'Thank you — your message has been received. We will get back to you shortly.',
};

const withDefaults = (form, success) => ({
  submitLabel: 'Send application',
  success,
  ...form,
  sections: form.sections.map((s) => ({
    ...s,
    fields: s.fields.map((f) => ({
      ...f,
      ...(f.type === 'tel' ? { format: '10' } : {}),
      ...(f.label === 'Job ID' ? { source: 'jobs' } : {}), // becomes a dropdown of the open positions published under Careers
    })),
  })),
});

export const FORMS = {
  contact: { title: 'Contact form', page: '/contact', about: 'The “Get in touch” form on the Contact page.', def: CONTACT, multiSection: false },
  internship: { title: 'Internship application', page: '/careers/internship', about: 'One-month internship application, with CV upload.', def: withDefaults(INTERN_FORM, 'Thank you — your application has been received. We will be in touch if your profile is shortlisted.'), multiSection: true },
  job: { title: 'Job application', page: '/careers/apply', about: 'Application for an open position, with CV upload.', def: withDefaults(JOB_FORM, 'Thank you — your application has been received. We will be in touch if your profile is shortlisted.'), multiSection: true },
};
export const FORM_IDS = Object.keys(FORMS);

const str = (v, n) => String(v ?? '').slice(0, n).trim();
const saved = () => readJson('forms', {});
export const getForm = (id) => (saved()[id] ? saved()[id] : FORMS[id]?.def);
export const isCustom = (id) => !!saved()[id];
export const defaultForm = (id) => FORMS[id]?.def;
/** Only the edited forms are sent to the public site; the rest use the built-in copy there. */
export const savedForms = () => saved();

const slug = (s) => str(s, 40).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

/** Validates and normalises an edited form; throws a readable message for the editor. */
export function cleanForm(id, raw) {
  const meta = FORMS[id];
  if (!meta) throw new Error('Unknown form');
  if (!raw || !Array.isArray(raw.sections) || !raw.sections.length) throw new Error('The form needs at least one section.');
  if (!meta.multiSection && raw.sections.length > 1) throw new Error('This form has a single section.');
  if (raw.sections.length > 12) throw new Error('At most 12 sections.');
  const seen = new Set(); const idMap = {}; let files = 0; let total = 0;
  const sections = raw.sections.map((s, si) => {
    const title = str(s?.title, 80);
    if (!title) throw new Error(`Section ${si + 1} needs a title.`);
    const fields = (Array.isArray(s.fields) ? s.fields : []).map((f) => {
      const label = str(f?.label, 200);
      if (!label) throw new Error(`A field in “${title}” has no label.`);
      const type = FIELD_TYPES.includes(f.type) ? f.type : 'text';
      const rawId = slug(f.id);
      // fields added in the editor get a temporary id (f_xxxxxx); the saved id is derived from the label so inbox entries read well
      let fid = (/^f_[a-z0-9]{5,}$/.test(rawId) ? slug(label) : rawId) || slug(label) || `field_${Math.random().toString(36).slice(2, 8)}`;
      while (seen.has(fid)) fid = `${fid}_${Math.random().toString(36).slice(2, 5)}`;
      seen.add(fid); total += 1; if (rawId) idMap[rawId] = fid;
      const out = { id: fid, label, type, required: !!f.required };
      const ph = str(f.placeholder, 200); if (ph && type !== 'select' && type !== 'file') out.placeholder = ph;
      if (type === 'select') {
        const opts = [...new Set((Array.isArray(f.options) ? f.options : []).map((o) => str(o, 120)).filter(Boolean))].slice(0, 200);
        if (!opts.length && f.source !== 'jobs') throw new Error(`The dropdown “${label}” needs at least one option.`);
        out.options = opts;
      }
      if (type === 'number') {
        if (f.min !== '' && f.min != null && Number.isFinite(Number(f.min))) out.min = Number(f.min);
        if (f.max !== '' && f.max != null && Number.isFinite(Number(f.max))) out.max = Number(f.max);
        if (out.min != null && out.max != null && out.min > out.max) throw new Error(`“${label}”: minimum is above the maximum.`);
      }
      if (type === 'tel') out.format = f.format === '10' ? '10' : 'any';
      if (type === 'file') { files += 1; out.required = !!f.required; }
      if (f.source === 'jobs' && (type === 'text' || type === 'select')) out.source = 'jobs';
      if (f.showIf && typeof f.showIf === 'object' && f.showIf.id) {
        const cond = { id: slug(f.showIf.id) };
        if (f.showIf.any) cond.any = true; else cond.eq = str(f.showIf.eq, 200);
        out.showIf = cond;
      }
      return out;
    });
    if (!fields.length) throw new Error(`The section “${title}” has no fields.`);
    if (fields.length > 60) throw new Error(`Too many fields in “${title}” (max 60).`);
    return { title, fields };
  });
  if (total > 150) throw new Error('Too many fields (max 150).');
  if (files > 1) throw new Error('Only one file upload field is supported per form.');
  if (id === 'contact' && !sections[0].fields.some((f) => f.type === 'email')) throw new Error('The contact form needs an email field so you can reply to enquiries.');
  const ids = new Set(sections.flatMap((s) => s.fields.map((f) => f.id)));
  for (const s of sections) for (const f of s.fields) {
    if (f.showIf) f.showIf.id = idMap[f.showIf.id] || f.showIf.id;
    if (f.showIf && (!ids.has(f.showIf.id) || f.showIf.id === f.id)) delete f.showIf; // dangling condition → always show
  }
  let confirm = null;
  if (raw.confirm && str(raw.confirm.label, 600)) confirm = { id: 'confirm', label: str(raw.confirm.label, 600), required: true };
  return {
    sections, confirm,
    submitLabel: str(raw.submitLabel, 40) || meta.def.submitLabel,
    success: str(raw.success, 400) || meta.def.success,
  };
}

export function saveForm(id, raw) { const f = cleanForm(id, raw); const all = saved(); all[id] = f; writeJson('forms', all); return f; }
export function resetForm(id) { const all = saved(); delete all[id]; writeJson('forms', all); return FORMS[id].def; }

const visible = (f, v) => !f.showIf || (f.showIf.any ? !!str(v[f.showIf.id], 4000) : str(v[f.showIf.id], 4000) === f.showIf.eq);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks submitted values (by field id) against the form definition.
 * Returns { error } or { data }: the entry as stored in the inbox — keyed by field id for the contact form, by label for applications.
 */
export function readSubmission(type, values, hasFile) {
  const form = getForm(type);
  if (!form) return { error: 'Unknown form' };
  const v = values && typeof values === 'object' ? values : {};
  const data = {}; const cvField = { f: null };
  for (const s of form.sections) for (const f of s.fields) {
    if (!visible(f, v)) continue;
    const label = f.label;
    if (f.type === 'file') { cvField.f = f; if (f.required && !hasFile) return { error: `Please attach: ${label}` }; continue; }
    const val = str(Array.isArray(v[f.id]) ? v[f.id].join(', ') : v[f.id], f.type === 'textarea' ? 4000 : 400);
    if (!val) { if (f.required) return { error: `Please fill in: ${label}` }; continue; }
    if (f.type === 'email' && !EMAIL.test(val)) return { error: `Enter a valid email address for: ${label}` };
    if (f.type === 'tel') {
      if (f.format === '10' ? !/^\d{10}$/.test(val) : !/^[+\d][\d\s()-]{4,24}$/.test(val)) return { error: `Enter a valid phone number for: ${label}` };
    }
    if (f.type === 'number') {
      const n = Number(val);
      if (Number.isNaN(n) || (f.min != null && n < f.min) || (f.max != null && n > f.max)) return { error: `“${label}” must be a valid number${f.min != null || f.max != null ? ` between ${f.min ?? '…'} and ${f.max ?? '…'}` : ''}.` };
    }
    if (f.type === 'select' && f.source !== 'jobs' && !(f.options || []).includes(val)) return { error: `Choose one of the listed options for: ${label}` };
    data[type === 'contact' ? f.id : label] = val;
  }
  if (type !== 'contact') { // applications: the first answer is the applicant's name
    const first = form.sections[0].fields[0];
    const nm = first && data[first.label];
    if (nm && !('name' in data)) data.name = nm;
  }
  if (form.confirm && !v._confirm) return { error: 'Please confirm the declaration.' };
  return { data };
}
