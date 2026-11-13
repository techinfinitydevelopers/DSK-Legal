import { useEffect, useMemo, useState } from 'react';
import { api, Field, Input, Text, Lines, Select, MediaField, Icon } from './ui.jsx';
import { LEVELS, OFFICES, PRACTICES } from '../v2/peopleData.js';

const TYPES = ['Articles', 'Monthly Newsletters', 'Practice Area Newsletters'];
const move = (arr, i, d) => { const a = [...arr]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; };

/** Shared shell for the three editors: load item (or blank), save, delete, view-on-site. */
function useItem(coll, slug, blank) {
  const isNew = slug === 'new';
  const [item, setItem] = useState(isNew ? blank : null);
  const [err, setErr] = useState('');
  useEffect(() => { if (!isNew) api('GET', `/c/${coll}/${slug}`).then(setItem).catch((e) => setErr(e.message)); }, [coll, slug, isNew]);
  return { item, setItem, isNew, err };
}
function EditorFrame({ title, back, view, isNew, saving, onSave, onDelete, children, status }) {
  return (
    <form className="ad-editor" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
      <div className="ad-head">
        <h1>{isNew ? `Add ${title}` : `Edit ${title}`}</h1>
        <a className="ad-btn ghost" href={back}>← Back to list</a>
        {view && !isNew && <a className="ad-btn ghost" href={view} target="_blank" rel="noreferrer">View on site <Icon n="ext" /></a>}
      </div>
      {children}
      <div className="ad-savebar">
        <button className="ad-btn primary" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Publish' : 'Save changes'}</button>
        {status}
        {!isNew && <button type="button" className="ad-btn danger" onClick={onDelete}>Delete</button>}
      </div>
    </form>
  );
}
const useSave = ({ coll, item, isNew, slug, toast, nav, base = `#/${coll}` }) => {
  const [saving, setSaving] = useState(false);
  return {
    saving,
    save: async (extra = {}) => {
      setSaving(true);
      try { const r = await api(isNew ? 'POST' : 'PUT', isNew ? `/c/${coll}` : `/c/${coll}/${slug}`, { ...item, ...extra }); toast(isNew ? 'Created' : 'Saved'); if (isNew) nav(`${base}/${r.slug}`); } catch (e) { toast(e.message, 'err'); } finally { setSaving(false); }
    },
    del: async () => {
      if (!window.confirm('Delete this permanently? This cannot be undone.')) return;
      try { await api('DELETE', `/c/${coll}/${slug}`); toast('Deleted'); nav(base === `#/${coll}` ? base : '#/pages'); } catch (e) { toast(e.message, 'err'); }
    },
  };
};

export function PersonEditor({ slug, toast, nav }) {
  const { item, setItem, isNew, err } = useItem('people', slug, { name: '', level: LEVELS[2], office: OFFICES[0], practices: [], sectors: [], bio: [], education: [], memberships: [], languages: [], matters: [], awards: [], activities: [] });
  const { saving, save, del } = useSave({ coll: 'people', item, isNew, slug, toast, nav });
  if (err) return <p className="ad-err">{err}</p>;
  if (!item) return <p>Loading…</p>;
  const set = (k) => (v) => setItem((s) => ({ ...s, [k]: v }));
  const toggle = (p) => set('practices')(item.practices.includes(p) ? item.practices.filter((x) => x !== p) : [...item.practices, p]);
  return (
    <EditorFrame title="team member" back="#/people" view={`/people/${slug}`} isNew={isNew} saving={saving} onSave={() => save()} onDelete={del}>
      <div className="ad-cols">
        <div className="ad-main">
          <section className="ad-box"><h2>Profile</h2><div className="ad-fgrid">
            <Field label="Full name" wide><Input v={item.name} set={set('name')} required /></Field>
            <Field label="Level"><Select v={item.level} set={set('level')} options={LEVELS} /></Field>
            <Field label="Office"><Select v={item.office} set={set('office')} options={OFFICES} /></Field>
            <Field label="Phone"><Input v={item.phone} set={set('phone')} /></Field>
            <Field label="Email"><Input v={item.email} set={set('email')} type="email" /></Field>
            <Field label="LinkedIn URL" wide><Input v={item.linkedin} set={set('linkedin')} placeholder="https://" /></Field>
          </div></section>
          <section className="ad-box"><h2>Biography</h2>
            <Field label="Biography paragraphs" hint="One paragraph per line."><Lines v={item.bio} set={set('bio')} rows={8} /></Field>
            <div className="ad-fgrid">
              <Field label="Education" hint="One per line."><Lines v={item.education} set={set('education')} rows={4} /></Field>
              <Field label="Memberships" hint="One per line."><Lines v={item.memberships} set={set('memberships')} rows={4} /></Field>
              <Field label="Languages" hint="One per line."><Lines v={item.languages} set={set('languages')} rows={3} /></Field>
              <Field label="Sectors" hint="One per line."><Lines v={item.sectors} set={set('sectors')} rows={3} /></Field>
              <Field label="Representative matters" hint="One per line." wide><Lines v={item.matters} set={set('matters')} rows={6} /></Field>
              <Field label="Awards and recognition" hint="One per line." wide><Lines v={item.awards} set={set('awards')} rows={3} /></Field>
              <Field label="Activities and publications" hint="One per line." wide><Lines v={item.activities} set={set('activities')} rows={3} /></Field>
            </div>
          </section>
        </div>
        <aside className="ad-side">
          <section className="ad-box"><h2>Photo</h2><MediaField v={item.photo} set={set('photo')} toast={toast} /></section>
          <section className="ad-box"><h2>Practice areas</h2><div className="ad-checks">
            {PRACTICES.map((p) => <label key={p}><input type="checkbox" checked={item.practices.includes(p)} onChange={() => toggle(p)} />{p}</label>)}
          </div></section>
        </aside>
      </div>
    </EditorFrame>
  );
}

const BLOCK_TYPES = [['p', 'Paragraph'], ['h3', 'Heading'], ['ul', 'Bulleted list'], ['ol', 'Numbered list'], ['byline', 'Byline'], ['hr', 'Divider']];
function BlockEditor({ blocks, set, types = BLOCK_TYPES }) {
  const upd = (i, patch) => set(blocks.map((b, k) => (k === i ? { ...b, ...patch } : b)));
  const retype = (i, t) => { const b = blocks[i]; const text = b.items ? b.items.join('\n') : b.h || ''; upd(i, t === 'ul' || t === 'ol' ? { t, items: text.split('\n').filter(Boolean), h: undefined } : { t, h: text, items: undefined }); };
  const add = (t) => set([...blocks, t === 'ul' || t === 'ol' ? { t, items: [] } : t === 'hr' ? { t } : { t, h: '' }]);
  return (
    <div className="ad-blocks">
      {blocks.map((b, i) => (
        <div className="ad-block" key={i}>
          <div className="ad-block-bar">
            <select value={b.t} onChange={(e) => retype(i, e.target.value)}>{types.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <span className="ad-spacer" />
            <button type="button" className="ad-ico" onClick={() => set(move(blocks, i, -1))} aria-label="Move up"><Icon n="up" /></button>
            <button type="button" className="ad-ico" onClick={() => set(move(blocks, i, 1))} aria-label="Move down"><Icon n="down" /></button>
            <button type="button" className="ad-ico" onClick={() => set(blocks.filter((_, k) => k !== i))} aria-label="Remove block"><Icon n="x" /></button>
          </div>
          {b.t === 'hr' ? <hr /> : b.items ? <ListArea items={b.items} set={(items) => upd(i, { items })} /> : <textarea rows={b.t === 'h3' || b.t === 'byline' ? 2 : 5} value={b.h || ''} onChange={(e) => upd(i, { h: e.target.value })} />}
        </div>
      ))}
      <div className="ad-addrow">{types.map(([v, l]) => <button key={v} type="button" className="ad-btn" onClick={() => add(v)}><Icon n="plus" /> {l}</button>)}</div>
    </div>
  );
}
function ListArea({ items, set }) {
  const [txt, setTxt] = useState(items.join('\n'));
  return <textarea rows={Math.min(12, Math.max(4, items.length + 1))} placeholder="One item per line" value={txt} onChange={(e) => { setTxt(e.target.value); set(e.target.value.split('\n').map((x) => x.trim()).filter(Boolean)); }} />;
}

export function PostEditor({ slug, toast, nav }) {
  const { item, setItem, isNew, err } = useItem('posts', slug, { title: '', type: 'Articles', date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), authors: '', summary: '', pdf: '', blocks: [{ t: 'p', h: '' }], published: true });
  const { saving, save, del } = useSave({ coll: 'posts', item, isNew, slug, toast, nav });
  if (err) return <p className="ad-err">{err}</p>;
  if (!item) return <p>Loading…</p>;
  const set = (k) => (v) => setItem((s) => ({ ...s, [k]: v }));
  return (
    <EditorFrame title="knowledge post" back="#/posts" view={`/knowledge/${slug}`} isNew={isNew} saving={saving} onSave={() => save()} onDelete={del}
      status={<label className="ad-pub"><input type="checkbox" checked={item.published !== false} onChange={(e) => set('published')(e.target.checked)} /> Published</label>}>
      <div className="ad-cols">
        <div className="ad-main">
          <section className="ad-box"><Field label="Title"><Input v={item.title} set={set('title')} required className="ad-title" /></Field>
            <Field label="Summary" hint="Shown on the Knowledge Centre cards."><Text v={item.summary} set={set('summary')} rows={3} /></Field></section>
          <section className="ad-box"><h2>Content</h2>
            <p className="ad-muted">Inline formatting allowed: &lt;b&gt;, &lt;i&gt;, &lt;sup&gt;, &lt;a href="https://…"&gt;. Anything else is stripped on save.</p>
            <BlockEditor blocks={item.blocks} set={set('blocks')} /></section>
        </div>
        <aside className="ad-side">
          <section className="ad-box"><h2>Details</h2>
            <Field label="Category"><Select v={item.type} set={set('type')} options={TYPES} /></Field>
            <Field label="Date"><Input v={item.date} set={set('date')} placeholder="October 28, 2026" /></Field>
            <Field label="Authors"><Text v={item.authors} set={set('authors')} rows={2} /></Field></section>
          <section className="ad-box"><h2>PDF download</h2><MediaField kind="pdf" v={item.pdf} set={set('pdf')} toast={toast} /></section>
        </aside>
      </div>
    </EditorFrame>
  );
}

export function PracticeEditor({ slug, toast, nav }) {
  const { item, setItem, isNew, err } = useItem('practice', slug, { name: '', intro: [], services: [], contacts: [] });
  const { saving, save, del } = useSave({ coll: 'practice', item, isNew, slug, toast, nav });
  const [people, setPeople] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => { api('GET', '/c/people').then(setPeople).catch(() => {}); }, []);
  const hits = useMemo(() => people.filter((p) => q && p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6), [people, q]);
  if (err) return <p className="ad-err">{err}</p>;
  if (!item) return <p>Loading…</p>;
  const set = (k) => (v) => setItem((s) => ({ ...s, [k]: v }));
  const svc = (i, patch) => set('services')(item.services.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const contactSlugs = item.contacts.map((c) => c.slug);
  return (
    <EditorFrame title="practice area" back="#/practice" view={`/practice/${slug}`} isNew={isNew} saving={saving} onSave={() => save({ contactSlugs })} onDelete={del}>
      <div className="ad-cols">
        <div className="ad-main">
          <section className="ad-box"><Field label="Practice name"><Input v={item.name} set={set('name')} required className="ad-title" /></Field>
            <Field label="Introduction" hint="One paragraph per line."><Lines v={item.intro} set={set('intro')} rows={5} /></Field></section>
          <section className="ad-box"><h2>Services</h2>
            {item.services.map((s, i) => (
              <details className="ad-svc" key={i} open={!s.title}>
                <summary><b>{s.title || 'New service'}</b><span className="ad-spacer" />
                  <button type="button" className="ad-ico" onClick={(e) => { e.preventDefault(); set('services')(move(item.services, i, -1)); }}><Icon n="up" /></button>
                  <button type="button" className="ad-ico" onClick={(e) => { e.preventDefault(); set('services')(move(item.services, i, 1)); }}><Icon n="down" /></button>
                  <button type="button" className="ad-ico" onClick={(e) => { e.preventDefault(); set('services')(item.services.filter((_, k) => k !== i)); }}><Icon n="x" /></button></summary>
                <Field label="Service title"><Input v={s.title} set={(v) => svc(i, { title: v })} /></Field>
                {s.items.map((it, j) => (
                  <div className="ad-item" key={j}>
                    <select value={it.t} onChange={(e) => svc(i, { items: s.items.map((x, k) => (k === j ? { ...x, t: e.target.value } : x)) })}><option value="p">Paragraph</option><option value="li">Bullet</option></select>
                    <textarea rows={it.x.length > 160 ? 4 : 2} value={it.x} onChange={(e) => svc(i, { items: s.items.map((x, k) => (k === j ? { ...x, x: e.target.value } : x)) })} />
                    <button type="button" className="ad-ico" onClick={() => svc(i, { items: s.items.filter((_, k) => k !== j) })}><Icon n="x" /></button>
                  </div>
                ))}
                <button type="button" className="ad-btn" onClick={() => svc(i, { items: [...s.items, { t: 'p', x: '' }] })}><Icon n="plus" /> Add text</button>
              </details>
            ))}
            <button type="button" className="ad-btn" onClick={() => set('services')([...item.services, { title: '', items: [{ t: 'p', x: '' }] }])}><Icon n="plus" /> Add service</button>
          </section>
        </div>
        <aside className="ad-side">
          <section className="ad-box"><h2>Key contacts</h2>
            <ul className="ad-chips">{item.contacts.map((c) => <li key={c.slug}>{c.name}<button type="button" onClick={() => set('contacts')(item.contacts.filter((x) => x.slug !== c.slug))} aria-label={`Remove ${c.name}`}>×</button></li>)}</ul>
            <Input v={q} set={setQ} placeholder="Search team to add…" />
            {hits.map((p) => <button type="button" className="ad-hit" key={p.slug} disabled={contactSlugs.includes(p.slug)} onClick={() => { set('contacts')([...item.contacts, { name: p.name, level: p.level, office: p.office, slug: p.slug }]); setQ(''); }}>{p.name} <small>{p.level}</small></button>)}
          </section>
        </aside>
      </div>
    </EditorFrame>
  );
}

const PAGE_TYPES = BLOCK_TYPES.filter(([v]) => v !== 'byline');
export function CustomEditor({ slug, toast, nav, has }) {
  const { item, setItem, isNew, err } = useItem('custom', slug, { title: '', slug: '', lede: '', blocks: [{ t: 'p', h: '' }], metaTitle: '', metaDescription: '', ogImage: '', noindex: false, published: true });
  const { saving, save, del } = useSave({ coll: 'custom', item, isNew, slug, toast, nav, base: '#/pages/custom' });
  const [slugTouched, setSlugTouched] = useState(false);
  if (err) return <p className="ad-err">{err}</p>;
  if (!item) return <p>Loading…</p>;
  const set = (k) => (v) => setItem((s) => ({ ...s, [k]: v }));
  const auto = (t) => t.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  const title = item.metaTitle || (item.title ? `${item.title} — DSK Legal` : '');
  return (
    <EditorFrame title="page" back="#/pages" view={`/${slug}`} isNew={isNew} saving={saving} onSave={() => save()} onDelete={del}
      status={<label className="ad-pub"><input type="checkbox" checked={item.published !== false} onChange={(e) => set('published')(e.target.checked)} /> Published</label>}>
      <div className="ad-cols">
        <div className="ad-main">
          {has && !has('content') && <p className="ad-note">Your role can change the SEO fields only. Edits to the title, address and content are not saved.</p>}
          <section className="ad-box">
            <Field label="Page title"><Input v={item.title} set={(v) => { set('title')(v); if (isNew && !slugTouched) set('slug')(auto(v)); }} required className="ad-title" /></Field>
            {isNew ? <Field label="Web address" hint={`This page will live at ${window.location.origin}/${item.slug || '…'}. It cannot be changed after you publish.`}><Input v={item.slug} set={(v) => { setSlugTouched(true); set('slug')(auto(v)); }} placeholder="privacy-policy" /></Field>
              : <p className="ad-muted">Web address: <b>/{item.slug}</b></p>}
            <Field label="Intro line" hint="Shown under the page heading."><Text v={item.lede} set={set('lede')} rows={2} /></Field>
          </section>
          <section className="ad-box"><h2>Content</h2>
            <p className="ad-muted">Inline formatting allowed: &lt;b&gt;, &lt;i&gt;, &lt;sup&gt;, &lt;a href="https://…"&gt;. Anything else is stripped on save.</p>
            <BlockEditor blocks={item.blocks} set={set('blocks')} types={PAGE_TYPES} /></section>
        </div>
        <aside className="ad-side">
          <section className="ad-box"><h2>Search engine optimisation</h2>
            <Field label="Meta title" hint={`${(item.metaTitle || '').length}/60 characters`}><Input v={item.metaTitle} set={set('metaTitle')} placeholder={title} /></Field>
            <Field label="Meta description" hint={`${(item.metaDescription || '').length}/160 characters`}><Text v={item.metaDescription} set={set('metaDescription')} rows={3} placeholder={item.lede} /></Field>
            <Field label="Social share image"><MediaField v={item.ogImage} set={set('ogImage')} toast={toast} /></Field>
            <label className="ad-pub"><input type="checkbox" checked={!!item.noindex} onChange={(e) => set('noindex')(e.target.checked)} /> Hide from search engines</label></section>
        </aside>
      </div>
    </EditorFrame>
  );
}

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
export function JobEditor({ slug, toast, nav }) {
  const { item, setItem, isNew, err } = useItem('jobs', slug, { title: '', jobId: '', department: 'Legal', office: OFFICES[0], type: 'Full-time', experience: '', summary: '', responsibilities: [], requirements: [], closingDate: '', published: true });
  const { saving, save, del } = useSave({ coll: 'jobs', item, isNew, slug, toast, nav });
  if (err) return <p className="ad-err">{err}</p>;
  if (!item) return <p>Loading…</p>;
  const set = (k) => (v) => setItem((s) => ({ ...s, [k]: v }));
  return (
    <EditorFrame title="job opening" back="#/jobs" view="/careers" isNew={isNew} saving={saving} onSave={() => save()} onDelete={del}
      status={<label className="ad-pub"><input type="checkbox" checked={item.published !== false} onChange={(e) => set('published')(e.target.checked)} /> Published</label>}>
      <div className="ad-cols">
        <div className="ad-main">
          <section className="ad-box"><Field label="Job title"><Input v={item.title} set={set('title')} required className="ad-title" placeholder="Senior Associate — Banking & Finance" /></Field>
            <Field label="Summary" hint="Shown on the Careers page card."><Text v={item.summary} set={set('summary')} rows={3} /></Field></section>
          <section className="ad-box"><h2>Role details</h2>
            <Field label="Responsibilities" hint="One per line."><Lines v={item.responsibilities} set={set('responsibilities')} rows={6} /></Field>
            <Field label="Requirements" hint="One per line."><Lines v={item.requirements} set={set('requirements')} rows={6} /></Field></section>
        </div>
        <aside className="ad-side">
          <section className="ad-box"><h2>Details</h2>
            <Field label="Department"><Select v={item.department} set={set('department')} options={['Legal', 'Support Function']} /></Field>
            <Field label="Office"><Select v={item.office} set={set('office')} options={OFFICES} /></Field>
            <Field label="Employment type"><Select v={item.type} set={set('type')} options={JOB_TYPES} /></Field>
            <Field label="Experience"><Input v={item.experience} set={set('experience')} placeholder="3–5 years" /></Field>
            <Field label="Job ID" hint="Prefilled on the application form. Optional."><Input v={item.jobId} set={set('jobId')} placeholder="DSK-2026-014" /></Field>
            <Field label="Closing date" hint="Opening is hidden from the site after this date (YYYY-MM-DD). Optional."><Input v={item.closingDate} set={set('closingDate')} type="date" /></Field></section>
        </aside>
      </div>
    </EditorFrame>
  );
}
