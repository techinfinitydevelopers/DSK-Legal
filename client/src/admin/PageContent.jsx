import { useRef } from 'react';
import { Field, Input, Text } from './ui.jsx';

/* Page content: the wording of a fixed page, shown inside Pages → Edit page.
   Each field starts with the page's built-in (live-site) text; a changed value is saved over it, and "Reset" brings the built-in text back. */

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** "Profile — paragraph 1" → group "Profile", label "Paragraph 1"; "Hero — intro line ({total} = rankings)" → label + hint */
function split(f, flat) {
  if (flat) return { group: '', label: f.label, hint: '' };
  const [g, ...rest] = f.label.split(' — ');
  const r = rest.join(' — ') || f.label;
  const m = r.match(/^(.*?)\s*\((.*)\)$/);
  return { group: rest.length ? g : '', label: cap(m ? m[1] : r), hint: m ? m[2] : '' };
}

function RichText({ v, set, rows }) {
  const ref = useRef(null);
  const bold = () => {
    const el = ref.current; if (!el) return;
    const a = el.selectionStart; const b = el.selectionEnd; const t = v || '';
    const sel = t.slice(a, b);
    const next = sel ? `${t.slice(0, a)}**${sel}**${t.slice(b)}` : `${t.slice(0, a)}****${t.slice(b)}`;
    set(next);
    requestAnimationFrame(() => { el.focus(); const p = sel ? b + 4 : a + 2; el.setSelectionRange(sel ? a + 2 : p, sel ? b + 2 : p); });
  };
  return (
    <div className="cm-rich">
      <div className="cm-rich-bar"><button type="button" onClick={bold} title="Make the selected words bold" aria-label="Bold"><b>B</b></button><small>Select words, then press B to make them bold.</small></div>
      <textarea ref={ref} rows={rows} value={v ?? ''} onChange={(e) => set(e.target.value)} />
    </div>
  );
}

function FieldInput({ f, v, set }) {
  const rows = (f.def || '').length > 260 ? 7 : (f.def || '').length > 110 ? 4 : 3;
  if (f.rich) return <RichText v={v} set={set} rows={rows} />;
  return f.multi ? <Text v={v} set={set} rows={rows} /> : <Input v={v} set={set} />;
}

function Group({ title, fields, vals, setVal, flat }) {
  return (
    <section className="cm-box cm-pc">
      {title && <h2>{title}</h2>}
      {fields.map((f) => {
        const { label, hint } = split(f, flat);
        const changed = (vals[f.key] ?? '') !== (f.def ?? '');
        return (
          <Field key={f.key} label={<>{label}{changed && <em className="cm-pc-edit">Edited <button type="button" onClick={() => setVal(f.key, f.def)}>Reset</button></em>}</>} hint={hint || undefined}>
            <FieldInput f={f} v={vals[f.key]} set={(x) => setVal(f.key, x)} />
          </Field>
        );
      })}
    </section>
  );
}

/** pages: the text definitions belonging to the page being edited (from GET /texts). */
export function PageContent({ pages, vals, setVal }) {
  if (!pages.length) return null;
  return (
    <>
      {pages.map((p) => {
        const flat = p.id === 'sector-pages';
        if (flat) {
          return (
            <details className="cm-box cm-pc-more" key={p.id}>
              <summary>{p.name} (optional — {p.fields.length} sector descriptions)</summary>
              <p className="cm-muted">An introduction for each sector’s own page. Leave empty to show the standard introduction.</p>
              <Group fields={p.fields} vals={vals} setVal={setVal} flat />
            </details>
          );
        }
        const groups = []; const idx = {};
        for (const f of p.fields) {
          const g = split(f, false).group; if (!(g in idx)) { idx[g] = groups.length; groups.push({ g, fields: [] }); }
          groups[idx[g]].fields.push(f);
        }
        return groups.map((x) => <Group key={p.id + x.g} title={x.g} fields={x.fields} vals={vals} setVal={setVal} />);
      })}
    </>
  );
}
