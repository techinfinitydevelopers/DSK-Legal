import { useEffect, useState } from 'react';
import { Icon, Field, Input, Text } from './ui.jsx';

/* FAQs tab: add, edit, reorder, hide or delete questions. Order here is the order on /faq; questions with the same category are grouped there. */

const key = () => Math.random().toString(36).slice(2, 9);
const tag = (items) => items.map((x) => ({ ...x, _k: key() }));
const strip = (items) => items.map(({ _k, ...x }) => x);
const swap = (a, i, d) => { const j = i + d; if (j < 0 || j >= a.length) return a; const b = [...a]; [b[i], b[j]] = [b[j], b[i]]; return b; };

function Row({ x, n, count, cats, addCat, delCat, open, toggle, upd, move, del, ro }) {
  const typed = (x.category || '').trim();
  const canAdd = !!typed && !cats.some((c) => c.toLowerCase() === typed.toLowerCase());
  return (
    <div className={`cm-faq${open ? ' open' : ''}${x.published === false ? ' off' : ''}`}>
      <div className="cm-faq-top">
        <span className="cm-ff-n">{n + 1}</span>
        <button type="button" className="cm-faq-q" onClick={toggle} aria-expanded={open}>{x.question || <i>New question</i>}</button>
        {x.category && <span className="cm-pill off">{x.category}</span>}
        {x.published === false && <span className="cm-pill off">Hidden</span>}
        {!ro && <div className="cm-mi-acts">
          <button type="button" className="cm-ico" onClick={() => move(-1)} disabled={n === 0} aria-label="Move up" title="Move up"><Icon n="up" /></button>
          <button type="button" className="cm-ico" onClick={() => move(1)} disabled={n === count - 1} aria-label="Move down" title="Move down"><Icon n="down" /></button>
          <button type="button" className="cm-ico" onClick={del} aria-label="Delete question" title="Delete"><Icon n="x" /></button>
        </div>}
      </div>
      {open && (
        <fieldset className="cm-faq-body" disabled={ro}>
          <Field label="Question"><Input v={x.question} set={(v) => upd({ question: v })} placeholder="e.g. Which areas of law does DSK Legal cover?" /></Field>
          <Field label="Answer" hint="Leave a blank line between paragraphs."><Text v={x.answer} set={(v) => upd({ answer: v })} rows={6} /></Field>
          <div className="cm-ff-two">
            <div className="cm-catbox">
              <Field label="Category (optional)" hint="Type a new category or pick an existing one. Questions with the same category are grouped under a heading.">
                <span className="cm-catin">
                  <input value={x.category || ''} onChange={(e) => upd({ category: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (canAdd) addCat(typed); } }} placeholder="e.g. Careers" />
                  {canAdd && <button type="button" className="cm-catin-ok" onClick={() => addCat(typed)} aria-label={`Add the category ${typed}`} title="Add as a new category"><Icon n="check" /></button>}
                </span>
              </Field>
              {cats.length > 0 && <div className="cm-cats" role="group" aria-label="Existing categories">{cats.map((c) => (
                <span className="cm-catwrap" key={c}>
                  <button type="button" className={`cm-cat${x.category === c ? ' on' : ''}`} onClick={() => upd({ category: x.category === c ? '' : c })} aria-pressed={x.category === c}>{c}</button>
                  <button type="button" className="cm-cat-x" onClick={() => delCat(c)} aria-label={`Remove the category ${c}`} title={`Remove “${c}”`}>×</button>
                </span>))}</div>}
            </div>
            <label className="cm-pub cm-faq-pub"><input type="checkbox" checked={x.published !== false} onChange={(e) => upd({ published: e.target.checked })} /> Show on the site</label>
          </div>
        </fieldset>
      )}
    </div>
  );
}

export function FaqAdmin({ api, toast, has }) {
  const [items, setItems] = useState(null); const [dirty, setDirty] = useState(false); const [busy, setBusy] = useState(false);
  const [openK, setOpenK] = useState(null); const [q, setQ] = useState('');
  const ro = !has('content');
  useEffect(() => { api('GET', '/faqs').then((r) => { setItems(tag(r.items)); setCats(catsOf(r.items)); }).catch((e) => toast(e.message, 'err')); }, []); // eslint-disable-line
  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
  // Pickable categories = those already saved (taken when the list loads and after each save), never what is being typed right now
  const [cats, setCats] = useState([]);
  const catsOf = (list) => [...new Set(list.map((x) => x.category).filter(Boolean))];
  if (!items) return <p>Loading…</p>;
  const edit = (fn) => { setItems(fn); setDirty(true); };
  const delCat = (c) => {
    const n = items.filter((x) => x.category === c).length;
    if (n && !window.confirm(`Remove the category “${c}”?\n\n${n} question${n === 1 ? '' : 's'} using it will have no category. Press “Save FAQs” to apply.`)) return;
    if (n) edit((a) => a.map((x) => (x.category === c ? { ...x, category: '' } : x)));
    setCats((p) => p.filter((y) => y !== c));
  };
  const add = () => { const n = { _k: key(), id: '', question: '', answer: '', category: '', published: true }; edit((a) => [...a, n]); setOpenK(n._k); setQ(''); };
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const r = await api('PUT', '/faqs', { items: strip(items) }); setItems(tag(r.items)); setCats(catsOf(r.items)); setDirty(false); setOpenK(null); toast('FAQs saved — live on the site'); } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); }
  };
  const shown = items.map((x, i) => ({ x, i })).filter(({ x }) => !q.trim() || `${x.question} ${x.answer} ${x.category}`.toLowerCase().includes(q.trim().toLowerCase()));
  const live = items.filter((x) => x.published !== false).length;
  return (
    <form onSubmit={save}>
      <div className="cm-head"><h1>FAQs</h1><a className="cm-btn ghost" href="/faq" target="_blank" rel="noreferrer">View page <Icon n="ext" /></a><a className="cm-btn ghost" href="#/pages/faq">Page heading &amp; SEO</a></div>
      {ro && <p className="cm-muted">Your role can view the FAQs but not change them.</p>}
      <div className="cm-cols">
        <div className="cm-main">
          <section className="cm-box">
            <div className="cm-faq-tools"><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions" aria-label="Search questions" />{!ro && <button type="button" className="cm-btn" onClick={add}><Icon n="plus" /> Add question</button>}</div>
            {!items.length && <p className="cm-muted">No questions yet. Press “Add question” to write the first one.</p>}
            <div className="cm-faq-list">
              {shown.map(({ x, i }) => (
                <Row key={x._k} x={x} n={i} count={items.length} cats={cats} delCat={delCat} addCat={(c) => { setCats((p) => (p.some((y) => y.toLowerCase() === c.toLowerCase()) ? p : [...p, c])); }} ro={ro} open={openK === x._k} toggle={() => setOpenK(openK === x._k ? null : x._k)}
                  upd={(p) => edit((a) => a.map((y) => (y._k === x._k ? { ...y, ...p } : y)))}
                  move={(d) => edit((a) => swap(a, i, d))}
                  del={() => { if (window.confirm(`Delete this question?\n\n${x.question || 'Untitled'}`)) edit((a) => a.filter((y) => y._k !== x._k)); }} />
              ))}
              {items.length > 0 && !shown.length && <p className="cm-muted">No question matches “{q}”.</p>}
            </div>
            {q.trim() && <p className="cm-muted">Reordering works on the full list; clear the search to see every position.</p>}
          </section>
        </div>
        <aside className="cm-side">
          {!ro && <section className="cm-box"><button className="cm-btn primary" disabled={busy || !dirty}>{busy ? 'Saving…' : dirty ? 'Save FAQs' : 'Saved'}</button>
            <p className="cm-muted">{items.length} questions · {live} shown on the site. Saved changes go live straight away.</p></section>}
          <section className="cm-box"><h2>How it works</h2>
            <p className="cm-muted">The order here is the order on the /faq page. A category groups questions under a heading. Hidden questions stay saved but do not appear on the site. The page title and search description are under <a href="#/pages/faq">Pages → FAQs</a>.</p></section>
        </aside>
      </div>
    </form>
  );
}
