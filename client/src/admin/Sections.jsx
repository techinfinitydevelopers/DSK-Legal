import { useEffect, useMemo, useState } from 'react';
import { api, Field, Input, Text, Lines, Select, MediaField, Icon, Modal, when, bytes, readFile } from './ui.jsx';
import { PageContent } from './PageContent.jsx';

const Counter = ({ v = '', max }) => <small className={(v.length > max ? 'ad-over' : '')}>{v.length}/{max} characters{v.length > max ? ' — search engines may cut this off' : ''}</small>;

/* ---------------- All pages ---------------- */
export function PagesList({ api, toast, nav }) {
  const [fixed, setFixed] = useState(null); const [custom, setCustom] = useState(null);
  const load = () => { api('GET', '/pages').then(setFixed).catch((e) => toast(e.message, 'err')); api('GET', '/c/custom').then(setCustom).catch((e) => toast(e.message, 'err')); };
  useEffect(() => { load(); }, []); // eslint-disable-line
  const del = async (p) => { if (!window.confirm(`Delete “${p.title}”? This cannot be undone.`)) return; await api('DELETE', `/c/custom/${p.slug}`).catch((e) => toast(e.message, 'err')); toast('Deleted'); load(); };
  return (
    <>
      <div className="ad-head"><h1>All Pages</h1><a className="ad-btn primary" href="#/pages/new"><Icon n="plus" /> Add page</a></div>
      <h2 className="ad-h2">Site pages</h2>
      <div className="ad-tablewrap"><table className="ad-table"><thead><tr><th>Page</th><th>Address</th><th>SEO</th><th /></tr></thead>
        <tbody>{(fixed || []).map((p) => (
          <tr key={p.id}><td><a className="ad-ttl" href={`#/pages/${p.id}`}>{p.name}</a></td><td className="nw">{p.path}</td>
            <td>{p.saved?.metaTitle || p.saved?.metaDescription ? <span className="ad-pill">Customised</span> : <span className="ad-pill draft">Default</span>}{p.saved?.noindex && <span className="ad-pill draft">noindex</span>}</td>
            <td className="ad-acts"><a href={`#/pages/${p.id}`}>Edit</a><a href={p.path} target="_blank" rel="noreferrer">View</a></td></tr>
        ))}</tbody></table></div>
      <h2 className="ad-h2">Pages you added</h2>
      <div className="ad-tablewrap">
        {!custom ? <p className="ad-muted pad">Loading…</p> : !custom.length ? <p className="ad-muted pad">None yet. <a href="#/pages/new">Add your first page</a> — for example a privacy policy or disclaimer.</p> : (
          <table className="ad-table"><thead><tr><th>Title</th><th>Address</th><th>Status</th><th /></tr></thead>
            <tbody>{custom.map((p) => (
              <tr key={p.slug}><td><a className="ad-ttl" href={`#/pages/custom/${p.slug}`}>{p.title}</a></td><td className="nw">/{p.slug}</td>
                <td>{p.published === false ? <span className="ad-pill draft">Draft</span> : <span className="ad-pill">Published</span>}</td>
                <td className="ad-acts"><a href={`#/pages/custom/${p.slug}`}>Edit</a><a href={`/${p.slug}`} target="_blank" rel="noreferrer">View</a><button onClick={() => del(p)}>Delete</button></td></tr>
            ))}</tbody></table>)}
      </div>
    </>
  );
}

/* ---------------- Page SEO editor (dropdown) ---------------- */
export function PagesAdmin({ id, api, toast, nav, has }) {
  const [pages, setPages] = useState(null); const [texts, setTexts] = useState(null);
  useEffect(() => { api('GET', '/pages').then(setPages).catch((e) => toast(e.message, 'err')); if (has('pages')) api('GET', '/texts').then(setTexts).catch(() => setTexts([])); else setTexts([]); }, []); // eslint-disable-line
  if (!pages || !texts) return <p>Loading…</p>;
  const cur = pages.find((p) => p.id === id) || pages[0];
  return (
    <>
      <div className="ad-head"><h1>Edit page</h1><a className="ad-btn ghost" href="#/pages">← All Pages</a>
        <select className="ad-pagepick" value={cur.id} onChange={(e) => nav(`#/pages/${e.target.value}`)} aria-label="Choose a page">
          {pages.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.path}</option>)}
        </select>
        <a className="ad-btn ghost" href={cur.path} target="_blank" rel="noreferrer">View page <Icon n="ext" /></a>
      </div>
      <PageForm key={cur.id} page={cur} texts={texts.filter((t) => (t.page || t.id) === cur.id)} api={api} toast={toast} canText={has('pages')} onSaved={(p) => setPages((x) => x.map((y) => (y.id === p.id ? p : y)))} />
      <p className="ad-muted">Knowledge posts, team profiles and practice areas have their own pages under <a href="#/posts">Knowledge</a>, <a href="#/people">Team</a> and <a href="#/practice">Practice Areas</a>; their title and description are created from their content automatically.</p>
    </>
  );
}
function PageForm({ page, texts, api, toast, onSaved, canText }) {
  const [f, setF] = useState({ metaTitle: '', metaDescription: '', ogImage: '', noindex: false, heading: '', lede: '', ...page.saved });
  const fields = texts.flatMap((t) => t.fields);
  const [vals, setVals] = useState(() => Object.fromEntries(fields.map((x) => [x.key, x.value || x.def])));
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const setVal = (k, v) => setVals((s) => ({ ...s, [k]: v }));
  const save = async (e, body = f, textVals = vals) => {
    e?.preventDefault(); setBusy(true);
    try {
      const p = await api('PUT', `/pages/${page.id}`, body); onSaved(p);
      if (canText && fields.length) await api('PUT', '/texts', { values: Object.fromEntries(fields.map((x) => [x.key, textVals[x.key]])) });
      toast('Page saved — live on the site');
    } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); }
  };
  const reset = () => {
    if (!window.confirm('Reset this page’s content, heading and SEO to the built-in defaults?')) return;
    const b = { metaTitle: '', metaDescription: '', ogImage: '', noindex: false, heading: '', lede: '' };
    const d = Object.fromEntries(fields.map((x) => [x.key, x.def]));
    setF(b); setVals(d); save(null, b, d);
  };
  const title = f.metaTitle || page.metaTitle, desc = f.metaDescription || page.metaDescription;
  return (
    <form onSubmit={save} className="ad-cols">
      <div className="ad-main">
        {canText && fields.length > 0 && <PageContent pages={texts} vals={vals} setVal={setVal} />}
        {page.heading !== undefined && canText && (
          <section className="ad-box"><h2>Page heading and intro</h2>
            <Field label="Heading" hint="Wrap the highlighted (italic red) words in *asterisks*, e.g. Get in *touch*. Without asterisks the last word is highlighted."><Input v={f.heading} set={set('heading')} placeholder={page.heading} /></Field>
            <Field label="Intro line" hint="Shown under the heading."><Text v={f.lede} set={set('lede')} rows={3} placeholder={page.lede} /></Field>
            <p className="ad-muted">Leave a field empty to use the built-in text (shown greyed out).</p>
          </section>
        )}
        <section className="ad-box"><h2>Search engine optimisation</h2>
          <Field label="Meta title" hint={<Counter v={f.metaTitle} max={60} />}><Input v={f.metaTitle} set={set('metaTitle')} placeholder={page.metaTitle} /></Field>
          <Field label="Meta description" hint={<Counter v={f.metaDescription} max={160} />}><Text v={f.metaDescription} set={set('metaDescription')} rows={3} placeholder={page.metaDescription} /></Field>
          <Field label="Social share image" hint="Shown when the page is shared on LinkedIn, WhatsApp, etc. Recommended 1200 × 630."><MediaField v={f.ogImage} set={set('ogImage')} toast={toast} /></Field>
          <label className="ad-pub"><input type="checkbox" checked={!!f.noindex} onChange={(e) => set('noindex')(e.target.checked)} /> Hide this page from search engines (noindex)</label>
        </section>
      </div>
      <aside className="ad-side">
        <section className="ad-box"><h2>Search preview</h2>
          <div className="ad-serp"><small>{window.location.host}{page.path}</small><b>{title}</b><p>{desc}</p></div></section>
        <div className="ad-row"><button className="ad-btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save page'}</button><button type="button" className="ad-btn ghost" onClick={reset}>Reset to defaults</button></div>
      </aside>
    </form>
  );
}

/* ---------------- Site settings (+ Microsoft 365 email) ---------------- */
export function SettingsAdmin({ api, toast, has, tab = 'general' }) {
  const admin = has('admin'); if (!admin) tab = 'general';
  return (
    <>
      <div className="ad-head"><h1>Site Settings</h1></div>
      <div className="ad-tabs">{[['general', 'General'], ...(admin ? [['email', 'Email (Microsoft 365)']] : [])].map(([k, l]) => <a key={k} href={`#/settings/${k}`} className={tab === k ? 'on' : ''}>{l}</a>)}</div>
      {tab !== 'email' ? <General api={api} toast={toast} admin={admin} /> : <EmailSettings api={api} toast={toast} />}
    </>
  );
}
function General({ api, toast, admin }) {
  const [f, setF] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { api('GET', '/settings').then(setF).catch((e) => toast(e.message, 'err')); }, []); // eslint-disable-line
  if (!f) return <p>Loading…</p>;
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = async (e) => { e.preventDefault(); setBusy(true); try { setF(await api('PUT', '/settings', f)); toast('Settings saved'); } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); } };
  return (
    <form className="ad-cols" onSubmit={save}>
      <div className="ad-main">
        <section className="ad-box"><h2>Website</h2><div className="ad-fgrid">
          <Field label="Site name"><Input v={f.siteName} set={set('siteName')} /></Field>
          <Field label="Website address" hint="Full address, e.g. https://dsklegal.com. Needed for canonical links, sitemap.xml and share previews."><Input v={f.siteUrl} set={set('siteUrl')} placeholder="https://dsklegal.com" /></Field>
          <Field label="Default meta description" hint="Used on pages that have no description of their own." wide><Text v={f.defaultDescription} set={set('defaultDescription')} rows={3} /></Field>
          <Field label="Default social share image" wide><MediaField v={f.defaultOgImage} set={set('defaultOgImage')} toast={toast} /></Field>
        </div></section>
        {admin && <section className="ad-box"><h2>Contact details</h2><div className="ad-fgrid">
          <Field label="Public contact email" hint="Shown in the header, contact page and “Contact us” buttons, and used as the fallback mail address."><Input v={f.contactEmail} set={set('contactEmail')} type="email" /></Field>
          <Field label="Phone"><Input v={f.phone} set={set('phone')} /></Field>
        </div></section>}
        <section className="ad-box"><h2>Search engines</h2>
          <label className="ad-pub"><input type="checkbox" checked={f.noindexSite} onChange={(e) => set('noindexSite')(e.target.checked)} /> Discourage search engines from indexing the whole site</label>
          <p className="ad-muted">Tick this while the site is a draft or test copy. It adds noindex to every page and blocks crawling in robots.txt. Untick it when the site goes live.</p></section>
      </div>
      <aside className="ad-side"><button className="ad-btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
        <p className="ad-muted">robots.txt and sitemap.xml are generated automatically from these settings and your pages.</p></aside>
    </form>
  );
}
function EmailSettings({ api, toast }) {
  const [f, setF] = useState(null); const [pw, setPw] = useState(''); const [to, setTo] = useState(''); const [busy, setBusy] = useState(''); const [res, setRes] = useState(null);
  useEffect(() => { api('GET', '/mail').then(setF).catch((e) => toast(e.message, 'err')); }, []); // eslint-disable-line
  if (!f) return <p>Loading…</p>;
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const body = () => ({ ...f, password: pw, notifyTo: f.notifyTo });
  const save = async (e) => { e?.preventDefault(); setBusy('save'); try { setF(await api('PUT', '/mail', body())); setPw(''); toast('Email settings saved'); return true; } catch (x) { toast(x.message, 'err'); return false; } finally { setBusy(''); } };
  const test = async () => {
    setRes(null); if (!(await save())) return; setBusy('test');
    try { await api('POST', '/mail/test', { to }); setRes({ ok: true, text: `Test email sent to ${to}. Check that inbox (and spam).` }); } catch (x) { setRes({ ok: false, text: x.message }); } finally { setBusy(''); }
  };
  return (
    <form className="ad-cols" onSubmit={save}>
      <div className="ad-main">
        <section className="ad-box"><h2>Outgoing mail account</h2>
          <label className="ad-pub"><input type="checkbox" checked={f.enabled} onChange={(e) => set('enabled')(e.target.checked)} /> Send email notifications for new enquiries and applications</label>
          <div className="ad-fgrid" style={{ marginTop: 14 }}>
            <Field label="Mailbox (username)" hint="A Microsoft 365 mailbox that sends the emails, e.g. noreply@dsklegal.com."><Input v={f.user} set={set('user')} type="email" autoComplete="off" placeholder="noreply@dsklegal.com" /></Field>
            <Field label="Password" hint={f.hasPassword ? 'A password is saved. Leave blank to keep it.' : 'Mailbox password, or an app password if MFA is on.'}><Input v={pw} set={setPw} type="password" autoComplete="new-password" placeholder={f.hasPassword ? '•••••••• (saved)' : ''} /></Field>
            <Field label="Sender name"><Input v={f.fromName} set={set('fromName')} /></Field>
            <Field label="From address" hint="Leave empty to use the mailbox. Must be the mailbox or an address it may “send as”."><Input v={f.from} set={set('from')} type="email" /></Field>
            <Field label="SMTP server"><Input v={f.host} set={set('host')} /></Field>
            <Field label="Port" hint="587 (STARTTLS) for Microsoft 365."><Input v={f.port} set={set('port')} type="number" /></Field>
          </div>
          {f.hasPassword && <button type="button" className="ad-btn ghost" onClick={async () => { if (window.confirm('Remove the saved password?')) { setF(await api('PUT', '/mail', { ...f, clearPassword: true })); toast('Password removed'); } }}>Remove saved password</button>}
        </section>
        <section className="ad-box"><h2>Who gets notified</h2>
          <Field label="Notification recipients" hint="One address per line. These inboxes receive every contact enquiry and application (the CV is attached)."><textarea rows={3} value={(f.notifyTo || []).join('\n')} onChange={(e) => set('notifyTo')(e.target.value.split(/[\s,;]+/).filter(Boolean))} placeholder="hr@dsklegal.com" /></Field>
          <label className="ad-pub"><input type="checkbox" checked={f.autoReply} onChange={(e) => set('autoReply')(e.target.checked)} /> Send an automatic confirmation to the person who wrote in</label>
          {f.autoReply && <div style={{ marginTop: 12 }}><Field label="Confirmation subject"><Input v={f.autoReplySubject} set={set('autoReplySubject')} /></Field>
            <Field label="Confirmation message" hint="{name} is replaced with the sender’s name."><Text v={f.autoReplyBody} set={set('autoReplyBody')} rows={6} /></Field></div>}
        </section>
        <section className="ad-box"><h2>Send a test email</h2>
          <div className="ad-row"><input style={{ maxWidth: 320 }} type="email" placeholder="you@example.com" value={to} onChange={(e) => setTo(e.target.value)} />
            <button type="button" className="ad-btn" disabled={!to || busy} onClick={test}>{busy === 'test' ? 'Sending…' : 'Save and send test'}</button></div>
          {res && <p className={res.ok ? 'ad-ok' : 'ad-err'} role="status">{res.text}</p>}
        </section>
      </div>
      <aside className="ad-side"><button className="ad-btn primary" disabled={!!busy}>{busy === 'save' ? 'Saving…' : 'Save email settings'}</button>
        <section className="ad-box ad-help"><h2>Microsoft 365 checklist</h2>
          <ol><li>Use a dedicated mailbox (or shared mailbox with a licence), not a person’s.</li>
            <li>In the Microsoft 365 admin centre: <i>Users → the mailbox → Mail → Manage email apps</i> → tick <b>Authenticated SMTP</b>.</li>
            <li>If the tenant enforces MFA / security defaults, create an <b>app password</b> for that mailbox, or ask IT to allow SMTP AUTH.</li>
            <li>Keep the From address the same as the mailbox, otherwise Microsoft rejects the message.</li>
            <li>For best deliverability, make sure SPF for dsklegal.com includes <code>spf.protection.outlook.com</code>.</li></ol>
          <p className="ad-muted">The password is stored encrypted on the server and is never shown again. If Microsoft later disables basic SMTP login for the tenant, this will need OAuth (ask your developer).</p></section></aside>
    </form>
  );
}

/* ---------------- Audit log ---------------- */
export function AuditLog({ api, toast }) {
  const [q, setQ] = useState(''); const [data, setData] = useState({ total: 0, rows: [] }); const [n, setN] = useState(100);
  useEffect(() => { const t = setTimeout(() => api('GET', `/audit?limit=${n}&q=${encodeURIComponent(q)}`).then(setData).catch((e) => toast(e.message, 'err')), 200); return () => clearTimeout(t); }, [q, n]); // eslint-disable-line
  return (
    <>
      <div className="ad-head"><h1>Audit Log</h1><a className="ad-btn" href="/api/admin/audit.csv"><Icon n="dl" /> Export CSV</a>
        <input className="ad-search" type="search" placeholder="Search user, action, detail, IP…" value={q} onChange={(e) => { setQ(e.target.value); setN(100); }} /></div>
      <p className="ad-muted">Every sign-in (including failed attempts), content edit, upload, settings change, backup and restore is recorded with the user and IP address. Entries cannot be edited from here.</p>
      <div className="ad-tablewrap"><table className="ad-table"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Detail</th><th>IP</th></tr></thead>
        <tbody>{data.rows.map((r, i) => (
          <tr key={i} className={/failed|blocked/.test(r.action) ? 'warn' : ''}><td className="nw">{when(r.at)}</td><td>{r.user}</td><td>{r.action}</td><td className="wrap">{r.what}</td><td className="nw">{r.ip}</td></tr>
        ))}</tbody></table>
        {!data.rows.length && <p className="ad-muted pad">No entries.</p>}</div>
      <p className="ad-muted">Showing {data.rows.length} of {data.total}. {data.rows.length < data.total && <button className="ad-link" onClick={() => setN(n + 200)}>Show more</button>}</p>
    </>
  );
}

/* ---------------- Backup & restore ---------------- */
export function BackupAdmin({ api, toast }) {
  const [inc, setInc] = useState({ submissions: false, cvs: false, users: false });
  const [list, setList] = useState(null); const [busy, setBusy] = useState(''); const [file, setFile] = useState(null); const [confirm, setConfirm] = useState('');
  const load = () => api('GET', '/backup').then(setList).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []); // eslint-disable-line
  const q = Object.entries(inc).map(([k, v]) => `${k}=${v ? 1 : 0}`).join('&');
  const make = async () => { setBusy('make'); try { await api('POST', '/backup', inc); toast('Backup saved on the server'); load(); } catch (e) { toast(e.message, 'err'); } finally { setBusy(''); } };
  const restore = async () => {
    setBusy('restore');
    try {
      const r = await fetch('/api/admin/backup/restore', { method: 'POST', credentials: 'same-origin', headers: { 'X-Requested-With': 'dsk-admin', 'X-Confirm': 'RESTORE', 'Content-Type': 'application/zip' }, body: file });
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
      toast(`Restored: ${d.restored.join(', ')}. Undo point saved as ${d.undo}.`); setFile(null); setConfirm(''); load();
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(''); }
  };
  const del = async (b) => { if (!window.confirm(`Delete ${b.name}?`)) return; await api('DELETE', `/backup/files/${b.name}`).catch((e) => toast(e.message, 'err')); load(); };
  const chk = (k, label, hint) => <label className="ad-chk"><input type="checkbox" checked={inc[k]} onChange={(e) => setInc({ ...inc, [k]: e.target.checked })} /><span><b>{label}</b><small>{hint}</small></span></label>;
  return (
    <>
      <div className="ad-head"><h1>Backup</h1></div>
      <div className="ad-cols">
        <div className="ad-main">
          <section className="ad-box"><h2>Export a backup</h2>
            <p className="ad-muted">Always included: pages and SEO, knowledge posts, team, practice areas, site settings and all uploaded media.</p>
            <div className="ad-chks">
              {chk('submissions', 'Enquiries, applications and subscribers', 'Personal data — store the file securely.')}
              {chk('cvs', 'Uploaded CVs', 'Applicants’ documents (personal data).')}
              {chk('users', 'User accounts', 'Includes password hashes. Needed only to rebuild the dashboard on a new server.')}
            </div>
            <div className="ad-row"><a className="ad-btn primary" href={`/api/admin/backup/download?${q}`}><Icon n="dl" /> Download backup (.zip)</a>
              <button className="ad-btn" onClick={make} disabled={!!busy}>{busy === 'make' ? 'Saving…' : 'Save a copy on the server'}</button></div>
            <p className="ad-muted">The email password and server secrets are never part of a backup. Re-enter the email password after restoring on a new server.</p></section>
          <section className="ad-box"><h2>Backups saved on the server</h2>
            {!list ? <p>Loading…</p> : !list.length ? <p className="ad-muted">None yet. The newest 20 are kept.</p> : (
              <div className="ad-tablewrap"><table className="ad-table"><tbody>{list.map((b) => <tr key={b.name}><td>{b.name}</td><td className="nw">{when(b.at)}</td><td className="nw">{bytes(b.size)}</td>
                <td className="ad-acts"><a href={`/api/admin/backup/files/${b.name}`}>Download</a><button onClick={() => del(b)}>Delete</button></td></tr>)}</tbody></table></div>)}
            <p className="ad-muted">Copies on the server protect against mistakes, not against losing the server. Download one regularly and keep it elsewhere.</p></section>
        </div>
        <aside className="ad-side">
          <section className="ad-box ad-danger"><h2>Restore from a backup</h2>
            <p className="ad-muted">This <b>replaces</b> the current pages, posts, team, practice areas, settings and media with the backup’s. A full copy of the current state is saved first so you can undo it.</p>
            <input type="file" accept=".zip,application/zip" onChange={(e) => setFile(e.target.files[0] || null)} />
            {file && <><Field label="Type RESTORE to confirm"><Input v={confirm} set={setConfirm} /></Field>
              <button className="ad-btn danger solid" disabled={confirm !== 'RESTORE' || !!busy} onClick={restore}>{busy === 'restore' ? 'Restoring…' : 'Restore now'}</button></>}
          </section>
        </aside>
      </div>
    </>
  );
}

/* ---------------- Media library ---------------- */
export function MediaAdmin({ api, toast, mode = 'library' }) {
  const upMode = mode === 'upload'; const [recent, setRecent] = useState([]);
  const [files, setFiles] = useState(null); const [busy, setBusy] = useState(false); const [kind, setKind] = useState('all'); const [q, setQ] = useState('');
  const [sel, setSel] = useState(new Set()); const [drag, setDrag] = useState(false); const [detail, setDetail] = useState(null);
  const load = () => api('GET', '/media').then(setFiles).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []); // eslint-disable-line
  const up = async (list) => {
    list = [...list]; if (!list.length) return; setBusy(true); let ok = 0;
    for (const f of list) { try { const r = await api('POST', '/media', { name: f.name, data: await readFile(f) }); ok++; setRecent((x) => [r, ...x]); } catch (e) { toast(`${f.name}: ${e.message}`, 'err'); } }
    setBusy(false); if (ok) toast(`${ok} file${ok > 1 ? 's' : ''} uploaded`); load();
  };
  const isPdf = (f) => f.name.endsWith('.pdf');
  const shown = useMemo(() => (files || []).filter((f) => (kind === 'all' || (kind === 'pdf') === isPdf(f)) && (!q || f.name.toLowerCase().includes(q.toLowerCase()))), [files, kind, q]);
  const tog = (n) => setSel((s) => { const x = new Set(s); x.has(n) ? x.delete(n) : x.add(n); return x; });
  const del = async (list) => {
    const used = list.filter((f) => f.used);
    if (!window.confirm(`Delete ${list.length} file${list.length > 1 ? 's' : ''}?${used.length ? `\n\n${used.length} of them ${used.length > 1 ? 'are' : 'is'} still used on the site (${used.map((f) => `${f.name} ×${f.used}`).join(', ')}). Those places will show a broken file.` : ''}`)) return;
    for (const f of list) await api('DELETE', `/media/${f.name}`).catch((e) => toast(e.message, 'err'));
    setSel(new Set()); toast('Deleted'); load();
  };
  const chosen = (files || []).filter((f) => sel.has(f.name));
  if (upMode) return (
    <>
      <div className="ad-head"><h1>Upload Media Files</h1><a className="ad-btn ghost" href="#/media">All Media →</a></div>
      <label className={`ad-drop big${drag ? ' on' : ''}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); up(e.dataTransfer.files); }}>
        <Icon n="dl" /><b>{busy ? 'Uploading…' : 'Drop files here'}</b><span>or <u>choose files</u> from your computer</span>
        <small className="ad-muted">JPG, PNG, WebP, GIF or PDF · up to 6 MB each</small>
        <input type="file" hidden multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={(e) => { up(e.target.files); e.target.value = ''; }} /></label>
      {recent.length > 0 && <><h2 className="ad-h2">Uploaded just now</h2>
        <ul className="ad-recent">{recent.map((r) => <li key={r.url}>{r.name.endsWith('.pdf') ? <span className="ad-pdf sm">PDF</span> : <img src={r.url} alt="" />}<span>{r.name}<small>{bytes(r.size)}</small></span>
          <button className="ad-btn" onClick={() => navigator.clipboard?.writeText(location.origin + r.url).then(() => toast('URL copied'))}>Copy URL</button></li>)}</ul>
        <a className="ad-btn primary" href="#/media">View in library</a></>}
    </>
  );
  return (
    <>
      <div className="ad-head"><h1>All Media</h1>
        <label className="ad-btn primary">{busy ? 'Uploading…' : <><Icon n="plus" /> Upload files</>}<input type="file" hidden multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={(e) => { up(e.target.files); e.target.value = ''; }} /></label>
        {chosen.length > 0 && <button className="ad-btn danger solid" onClick={() => del(chosen)}>Delete {chosen.length} selected</button>}
        <input className="ad-search" type="search" placeholder="Search files…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="ad-tabs">{[['all', 'All'], ['img', 'Images'], ['pdf', 'PDFs']].map(([k, l]) => <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{l}{files ? ` (${files.filter((f) => k === 'all' || (k === 'pdf') === isPdf(f)).length})` : ''}</button>)}</div>
      <div className={`ad-drop${drag ? ' on' : ''}`} hidden={false} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); up(e.dataTransfer.files); }}>
        Drag files here to upload <span className="ad-muted">· JPG, PNG, WebP, GIF or PDF, up to 6 MB each</span></div>
      <div className="ad-grid-media big">{!files && <p>Loading…</p>}{files && !shown.length && <p className="ad-muted">No files.</p>}
        {shown.map((f) => (
          <div key={f.name} className={`ad-tile${sel.has(f.name) ? ' sel' : ''}`}>
            <label className="ad-tick"><input type="checkbox" checked={sel.has(f.name)} onChange={() => tog(f.name)} aria-label={`Select ${f.name}`} /></label>
            <button type="button" className="ad-thumb" onClick={() => setDetail(f.name)} aria-label={`Details for ${f.name}`}>{isPdf(f) ? <span className="ad-pdf">PDF</span> : <img src={f.url} alt="" loading="lazy" />}</button>
            <small title={f.name}>{f.name}</small><small>{bytes(f.size)} · {f.used ? <b className="ad-used">used ×{f.used}</b> : 'unused'}</small>
            <div className="ad-acts"><button className="blue" onClick={() => setDetail(f.name)}>Details</button><button className="blue" onClick={() => navigator.clipboard?.writeText(location.origin + f.url).then(() => toast('URL copied'))}>Copy URL</button><button onClick={() => del([f])}>Delete</button></div>
          </div>
        ))}</div>
      {detail && <MediaDetails name={detail} api={api} toast={toast} onClose={() => setDetail(null)} onChanged={load} />}
    </>
  );
}

/* ---------------- Media details (WordPress-style attachment panel) ---------------- */
function MediaDetails({ name, api, toast, onClose, onChanged }) {
  const [d, setD] = useState(null); const [f, setF] = useState({ alt: '', title: '', caption: '', description: '' }); const [busy, setBusy] = useState(false);
  useEffect(() => { api('GET', `/media/${name}`).then((x) => { setD(x); setF({ alt: x.alt, title: x.title, caption: x.caption, description: x.description }); }).catch((e) => { toast(e.message, 'err'); onClose(); }); }, [name]); // eslint-disable-line
  if (!d) return <Modal title="Attachment details" onClose={onClose} wide><div className="ad-modal-body">Loading…</div></Modal>;
  const isPdf = d.type === 'application/pdf'; const full = location.origin + d.url;
  const dirty = ['alt', 'title', 'caption', 'description'].some((k) => f[k] !== d[k]);
  const save = async () => { setBusy(true); try { const x = await api('PUT', `/media/${name}`, f); setD(x); toast('Details saved'); onChanged(); } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); } };
  const del = async () => {
    if (!window.confirm(`Delete permanently?${d.usedIn.length ? `\n\nThis file is used in ${d.usedIn.length} place${d.usedIn.length > 1 ? 's' : ''}; they will show a broken file.` : ''}`)) return;
    try { await api('DELETE', `/media/${name}`); toast('Deleted'); onChanged(); onClose(); } catch (e) { toast(e.message, 'err'); }
  };
  const kv = [['Uploaded on', new Date(d.uploadedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })], ['Uploaded by', d.uploadedBy], ['File name', d.name], ['File type', d.type], ['File size', bytes(d.size)], d.dim && ['Dimensions', `${d.dim.w} × ${d.dim.h} px`]].filter(Boolean);
  return (
    <Modal title="Attachment details" onClose={onClose} wide>
      <div className="ad-modal-body ad-mdet">
        <aside className="ad-mleft">
          <div className="ad-mprev">{isPdf ? <span className="ad-pdf">PDF</span> : <img src={d.url} alt={d.alt} />}</div>
          <dl className="ad-kv">{kv.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        </aside>
        <div className="ad-mright">
          <section className="ad-msec"><h4>Used in</h4>
            {d.usedIn.length ? <ul className="ad-uses">{d.usedIn.map((u, i) => <li key={i}><a href={u.href} onClick={onClose}>{u.label}</a><small>{u.kind}</small></li>)}</ul> : <p className="ad-muted">Not used anywhere yet.</p>}
          </section>
          <section className="ad-msec"><h4>Details</h4>
            <Field label="Alternative text" hint={isPdf ? 'Not used for PDFs.' : 'Describe the image for screen readers. Leave empty if it is purely decorative.'}><textarea rows={2} value={f.alt} onChange={(e) => setF({ ...f, alt: e.target.value })} disabled={isPdf} /></Field>
            <Field label="Title"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
            <Field label="Caption"><textarea rows={2} value={f.caption} onChange={(e) => setF({ ...f, caption: e.target.value })} /></Field>
            <Field label="Description"><textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          </section>
          <section className="ad-msec"><h4>File URL</h4>
            <div className="ad-urlrow"><input readOnly value={full} onFocus={(e) => e.target.select()} /><button type="button" className="ad-btn" onClick={() => navigator.clipboard?.writeText(full).then(() => toast('URL copied'))}>Copy URL</button></div>
          </section>
        </div>
      </div>
      <div className="ad-modal-foot">
        <button className="ad-btn primary" onClick={save} disabled={busy || !dirty}>{busy ? 'Saving…' : dirty ? 'Save details' : 'Saved'}</button>
        <a className="ad-btn" href={d.url} target="_blank" rel="noreferrer">Open file <Icon n="ext" /></a>
        <span className="ad-spacer" />
        <button className="ad-btn danger" onClick={del}>Delete permanently</button>
      </div>
    </Modal>
  );
}

/* ---------- Menu (header navigation) ---------- */
const BUILTIN_NOTE = { about: 'Link', practice: 'Dropdown', sectors: 'Dropdown', team: 'Link', knowledge: 'Dropdown', careers: 'Link', contact: 'Link' };
const LINK_BUILTIN = new Set(['about', 'team', 'careers', 'contact']);
const swap = (a, i, d) => { const b = [...a]; const j = i + d; if (j < 0 || j >= b.length) return b; [b[i], b[j]] = [b[j], b[i]]; return b; };
export function MenuAdmin({ api, toast, has }) {
  const [m, setM] = useState(null); const [busy, setBusy] = useState(false); const [dirty, setDirty] = useState(false);
  const can = has('menu');
  useEffect(() => { api('GET', '/menu').then(setM).catch((e) => toast(e.message, 'err')); }, []); // eslint-disable-line
  if (!m) return <p>Loading…</p>;
  const upd = (next) => { setM(next); setDirty(true); };
  const item = (i, patch) => upd({ ...m, items: m.items.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
  const feat = (i, patch) => item(i, { feature: { ...m.items[i].feature, ...patch } });
  const tab = (i, k, patch) => item(i, { tabs: m.items[i].tabs.map((t, n) => (n === k ? { ...t, ...patch } : t)) });
  const link = (i, k, j, patch) => tab(i, k, { links: m.items[i].tabs[k].links.map((l, n) => (n === j ? { ...l, ...patch } : l)) });
  const child = (i, j, patch) => item(i, { children: m.items[i].children.map((c, k) => (k === j ? { ...c, ...patch } : c)) });
  const save = async (e) => { e.preventDefault(); setBusy(true); try { setM(await api('PUT', '/menu', m)); setDirty(false); toast('Menu saved — live on the site'); } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); } };
  const reset = async () => { if (!window.confirm('Reset the menu to the built-in default? Your custom links and edits are removed (save to apply).')) return; try { upd(await api('GET', '/menu/default')); } catch (x) { toast(x.message, 'err'); } };
  return (
    <form onSubmit={save}>
      <div className="ad-head"><h1>Header menu</h1><a className="ad-btn ghost" href="#/menu">← All Menus</a><a className="ad-btn ghost" href="/" target="_blank" rel="noreferrer">View site <Icon n="ext" /></a></div>
      {!can && <p className="ad-muted">Your role can view the menu but not change it.</p>}
      <div className="ad-cols">
        <div className="ad-main">
          <section className="ad-box"><h2>Header menu</h2>
            <p className="ad-muted">Rename, reorder or hide items. Open “Dropdown content” on a dropdown to edit its title and links. The practice-area and sector lists are automatic. Add your own links or dropdowns at the bottom.</p>
            <ol className="ad-menu">
              {m.items.map((x, i) => (
                <li key={x.id || i} className={`ad-mi${x.hidden ? ' off' : ''}`}>
                  <div className="ad-mi-row">
                    <div className="ad-mi-fields">
                      <Input v={x.label} set={(v) => item(i, { label: v })} placeholder="Label" disabled={!can} aria-label="Menu label" />
                      {(!x.builtin || LINK_BUILTIN.has(x.id)) && !x.children && <Input v={x.href || ''} set={(v) => item(i, { href: v })} placeholder="/page or https://…" disabled={!can} aria-label="Link" />}
                    </div>
                    <span className="ad-pill">{x.builtin ? BUILTIN_NOTE[x.id] : x.children ? 'Dropdown' : 'Link'}</span>
                    {can && <div className="ad-mi-acts">
                      <button type="button" className="ad-ico" onClick={() => upd({ ...m, items: swap(m.items, i, -1) })} aria-label="Move up"><Icon n="up" /></button>
                      <button type="button" className="ad-ico" onClick={() => upd({ ...m, items: swap(m.items, i, 1) })} aria-label="Move down"><Icon n="down" /></button>
                      <label className="ad-pub"><input type="checkbox" checked={!x.hidden} onChange={(e) => item(i, { hidden: !e.target.checked })} /> Show</label>
                      {!x.builtin && <button type="button" className="ad-ico" onClick={() => upd({ ...m, items: m.items.filter((_, k) => k !== i) })} aria-label="Remove item"><Icon n="x" /></button>}
                    </div>}
                  </div>
                  {x.tabs && (
                    <details className="ad-mi-drop">
                      <summary>Dropdown content ({x.tabs.length} {x.tabs.length === 1 ? 'tab' : 'tabs'}, {x.tabs.reduce((n, t) => n + (t.links?.length || 0), 0)} links{x.tabs.some((t) => t.auto) ? ' + automatic lists' : ''})</summary>
                      {x.tabs.map((t, k) => (
                        <div className="ad-tab" key={k}>
                          <div className="ad-mi-row">
                            <div className="ad-mi-fields"><Input v={t.label} set={(v) => tab(i, k, { label: v })} placeholder="Tab title" disabled={!can} aria-label="Tab title" /></div>
                            {t.auto && <span className="ad-pill">Automatic</span>}
                            {can && <div className="ad-mi-acts">
                              <button type="button" className="ad-ico" onClick={() => item(i, { tabs: swap(x.tabs, k, -1) })} aria-label="Move tab up"><Icon n="up" /></button>
                              <button type="button" className="ad-ico" onClick={() => item(i, { tabs: swap(x.tabs, k, 1) })} aria-label="Move tab down"><Icon n="down" /></button>
                              {x.tabs.length > 1 && <button type="button" className="ad-ico" onClick={() => item(i, { tabs: x.tabs.filter((_, n) => n !== k) })} aria-label="Remove tab"><Icon n="x" /></button>}
                            </div>}
                          </div>
                          {t.auto ? (
                            <p className="ad-muted">{{ practice: 'The list of practice areas is generated automatically from Practice Areas.', sectors: 'The list of sectors is generated automatically.', knowledge: 'The latest knowledge pieces are listed automatically.' }[t.auto]}</p>
                          ) : (
                            <div className="ad-mi-kids">
                              {t.links.map((l, j) => (
                                <div className="ad-mi-row kid" key={j}>
                                  <div className="ad-mi-fields"><Input v={l.label} set={(v) => link(i, k, j, { label: v })} placeholder="Link label" disabled={!can} /><Input v={l.href} set={(v) => link(i, k, j, { href: v })} placeholder="/page or https://…" disabled={!can} /></div>
                                  {can && <div className="ad-mi-acts">
                                    <button type="button" className="ad-ico" onClick={() => tab(i, k, { links: swap(t.links, j, -1) })} aria-label="Move up"><Icon n="up" /></button>
                                    <button type="button" className="ad-ico" onClick={() => tab(i, k, { links: swap(t.links, j, 1) })} aria-label="Move down"><Icon n="down" /></button>
                                    <button type="button" className="ad-ico" onClick={() => tab(i, k, { links: t.links.filter((_, n) => n !== j) })} aria-label="Remove link"><Icon n="x" /></button>
                                  </div>}
                                </div>
                              ))}
                              {can && <button type="button" className="ad-btn" onClick={() => tab(i, k, { links: [...t.links, { label: '', href: '' }] })}><Icon n="plus" /> Add link</button>}
                            </div>
                          )}
                        </div>
                      ))}
                      {can && x.tabs.length < 8 && <button type="button" className="ad-btn" onClick={() => item(i, { tabs: [...x.tabs, { label: 'New tab', links: [{ label: '', href: '' }] }] })}><Icon n="plus" /> Add tab</button>}
                      {x.feature && (
                        <div className="ad-tab ad-feat">
                          <div className="ad-mi-row"><b>Featured card (right side of the dropdown)</b>
                            <label className="ad-pub"><input type="checkbox" checked={!x.feature.hidden} disabled={!can} onChange={(e) => feat(i, { hidden: !e.target.checked })} /> Show card</label></div>
                          {!x.feature.hidden && (
                            <div className="ad-fgrid">
                              <Field label="Small heading"><Input v={x.feature.kicker} set={(v) => feat(i, { kicker: v })} disabled={!can} placeholder="Recognition" /></Field>
                              <Field label="Title"><Input v={x.feature.title} set={(v) => feat(i, { title: v })} disabled={!can} /></Field>
                              <Field label="Link"><Input v={x.feature.href} set={(v) => feat(i, { href: v })} disabled={!can} placeholder="/awards" /></Field>
                              <Field label="Image" wide><MediaField v={x.feature.img} set={(v) => feat(i, { img: v })} toast={toast} /></Field>
                            </div>
                          )}
                        </div>
                      )}
                    </details>
                  )}
                  {x.children && (
                    <div className="ad-mi-kids">
                      {x.children.map((c, j) => (
                        <div className="ad-mi-row kid" key={j}>
                          <div className="ad-mi-fields"><Input v={c.label} set={(v) => child(i, j, { label: v })} placeholder="Link label" disabled={!can} /><Input v={c.href} set={(v) => child(i, j, { href: v })} placeholder="/page or https://…" disabled={!can} /></div>
                          {can && <div className="ad-mi-acts">
                            <button type="button" className="ad-ico" onClick={() => item(i, { children: swap(x.children, j, -1) })} aria-label="Move up"><Icon n="up" /></button>
                            <button type="button" className="ad-ico" onClick={() => item(i, { children: swap(x.children, j, 1) })} aria-label="Move down"><Icon n="down" /></button>
                            <button type="button" className="ad-ico" onClick={() => item(i, { children: x.children.filter((_, k) => k !== j) })} aria-label="Remove link"><Icon n="x" /></button>
                          </div>}
                        </div>
                      ))}
                      {can && <button type="button" className="ad-btn" onClick={() => item(i, { children: [...x.children, { label: '', href: '' }] })}><Icon n="plus" /> Add dropdown link</button>}
                    </div>
                  )}
                </li>
              ))}
            </ol>
            {can && <div className="ad-addrow">
              <button type="button" className="ad-btn" onClick={() => upd({ ...m, items: [...m.items, { id: '', label: '', href: '' }] })}><Icon n="plus" /> Add link</button>
              <button type="button" className="ad-btn" onClick={() => upd({ ...m, items: [...m.items, { id: '', label: '', children: [{ label: '', href: '' }] }] })}><Icon n="plus" /> Add dropdown</button>
            </div>}
          </section>
        </div>
        <aside className="ad-side">
          <section className="ad-box"><h2>Country selector</h2>
            {m.countries.map((c, i) => (
              <div className="ad-mi-row kid" key={i}>
                <div className="ad-mi-fields"><Input v={c.label} set={(v) => upd({ ...m, countries: m.countries.map((x, k) => (k === i ? { ...x, label: v } : x)) })} placeholder="Country" disabled={!can} /><Input v={c.href} set={(v) => upd({ ...m, countries: m.countries.map((x, k) => (k === i ? { ...x, href: v } : x)) })} placeholder="https://…" disabled={!can} /></div>
                {can && m.countries.length > 1 && <button type="button" className="ad-ico" onClick={() => upd({ ...m, countries: m.countries.filter((_, k) => k !== i) })} aria-label="Remove country"><Icon n="x" /></button>}
              </div>
            ))}
            {can && <button type="button" className="ad-btn" onClick={() => upd({ ...m, countries: [...m.countries, { label: '', href: '' }] })}><Icon n="plus" /> Add country</button>}
          </section>
          {can && <section className="ad-box"><button className="ad-btn primary" disabled={busy || !dirty}>{busy ? 'Saving…' : dirty ? 'Save menu' : 'Saved'}</button>
            <button type="button" className="ad-btn ghost" onClick={reset}>Reset to default</button></section>}
        </aside>
      </div>
    </form>
  );
}

/* ---------- All Menus / Add New Menu ---------- */
export function MenusList({ api, toast, has }) {
  const [d, setD] = useState(null);
  const load = () => api('GET', '/menus').then(setD).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []); // eslint-disable-line
  const del = async (m) => { if (!window.confirm(`Delete the menu “${m.name}”? This cannot be undone.`)) return; try { await api('DELETE', `/menus/${m.id}`); toast('Menu deleted'); load(); } catch (e) { toast(e.message, 'err'); } };
  if (!d) return <p>Loading…</p>;
  const can = has('menu');
  return (
    <>
      <div className="ad-head"><h1>All Menus</h1>{can && <a className="ad-btn primary" href="#/menu/new"><Icon n="plus" /> Add New Menu</a>}</div>
      <div className="ad-tablewrap"><table className="ad-table">
        <thead><tr><th>Menu name</th><th>Location</th><th>Items</th><th /></tr></thead>
        <tbody>
          <tr><td data-l="Menu name"><a className="ad-ttl" href="#/menu/header">{d.header.name}</a></td><td data-l="Location">{d.header.location}</td><td data-l="Items">{d.header.items} (mega-menus, links, dropdowns)</td><td className="ad-acts"><a href="#/menu/header">Edit</a><a href="/" target="_blank" rel="noreferrer">View</a></td></tr>
          {d.menus.map((m) => (
            <tr key={m.id}><td data-l="Menu name"><a className="ad-ttl" href={`#/menu/${m.id}`}>{m.name}</a></td><td data-l="Location">{d.locations[m.location]}</td><td data-l="Items">{m.links.length}</td>
              <td className="ad-acts"><a href={`#/menu/${m.id}`}>Edit</a>{can && <button onClick={() => del(m)}>Delete</button>}</td></tr>
          ))}
        </tbody></table></div>
      {!d.menus.length && <p className="ad-muted">No extra menus yet. Use <a href="#/menu/new">Add New Menu</a> to create one, for example a footer “Quick links” column.</p>}
    </>
  );
}

export function MenuForm({ id, api, toast, nav, has }) {
  const isNew = id === 'new'; const can = has('menu');
  const [m, setM] = useState(isNew ? { name: '', location: 'footer', links: [{ label: '', href: '' }] } : null);
  const [locs, setLocs] = useState({ footer: 'Footer', none: 'Not shown (draft)' }); const [busy, setBusy] = useState(false);
  useEffect(() => { api('GET', '/menus').then((d) => setLocs(d.locations)).catch(() => {}); if (!isNew) api('GET', `/menus/${id}`).then(setM).catch((e) => toast(e.message, 'err')); }, [id]); // eslint-disable-line
  if (!m) return <p>Loading…</p>;
  const link = (i, patch) => setM((s) => ({ ...s, links: s.links.map((l, k) => (k === i ? { ...l, ...patch } : l)) }));
  const save = async (e) => { e.preventDefault(); setBusy(true); try { const r = await api(isNew ? 'POST' : 'PUT', isNew ? '/menus' : `/menus/${id}`, m); toast(isNew ? 'Menu created' : 'Menu saved'); if (isNew) nav(`#/menu/${r.id}`); else setM(r); } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); } };
  const del = async () => { if (!window.confirm(`Delete the menu “${m.name}”?`)) return; try { await api('DELETE', `/menus/${id}`); toast('Menu deleted'); nav('#/menu'); } catch (x) { toast(x.message, 'err'); } };
  return (
    <form onSubmit={save}>
      <div className="ad-head"><h1>{isNew ? 'Add New Menu' : 'Edit Menu'}</h1><a className="ad-btn ghost" href="#/menu">← All Menus</a></div>
      {!can && <p className="ad-muted">Your role can view menus but not change them.</p>}
      <div className="ad-cols">
        <div className="ad-main">
          <section className="ad-box"><Field label="Menu name"><Input v={m.name} set={(v) => setM({ ...m, name: v })} required className="ad-title" placeholder="Quick links" disabled={!can} /></Field></section>
          <section className="ad-box"><h2>Menu items</h2>
            <p className="ad-muted">Links are shown in the order below. Use a site path (/careers) or a full address (https://…).</p>
            <div className="ad-mi-kids nobar">
              {m.links.map((l, i) => (
                <div className="ad-mi-row kid" key={i}>
                  <div className="ad-mi-fields"><Input v={l.label} set={(v) => link(i, { label: v })} placeholder="Link label" disabled={!can} /><Input v={l.href} set={(v) => link(i, { href: v })} placeholder="/page or https://…" disabled={!can} /></div>
                  {can && <div className="ad-mi-acts">
                    <button type="button" className="ad-ico" onClick={() => setM({ ...m, links: swap(m.links, i, -1) })} aria-label="Move up"><Icon n="up" /></button>
                    <button type="button" className="ad-ico" onClick={() => setM({ ...m, links: swap(m.links, i, 1) })} aria-label="Move down"><Icon n="down" /></button>
                    <button type="button" className="ad-ico" onClick={() => setM({ ...m, links: m.links.filter((_, k) => k !== i) })} aria-label="Remove link"><Icon n="x" /></button>
                  </div>}
                </div>
              ))}
              {can && <button type="button" className="ad-btn" onClick={() => setM({ ...m, links: [...m.links, { label: '', href: '' }] })}><Icon n="plus" /> Add link</button>}
            </div>
          </section>
        </div>
        <aside className="ad-side">
          <section className="ad-box"><h2>Display location</h2>
            <Field label="Show this menu in" hint="Footer: a link column above the footer’s legal line. Not shown: keep it as a draft."><Select v={m.location} set={(v) => setM({ ...m, location: v })} options={Object.entries(locs).map(([value, label]) => ({ value, label }))} /></Field></section>
          {can && <section className="ad-box"><button className="ad-btn primary" disabled={busy}>{busy ? 'Saving…' : isNew ? 'Create menu' : 'Save menu'}</button>
            {!isNew && <button type="button" className="ad-btn danger" onClick={del}>Delete menu</button>}</section>}
        </aside>
      </div>
    </form>
  );
}

/* ---------- Footer ---------- */
export function FooterAdmin({ api, toast, has }) {
  const [f, setF] = useState(null); const [busy, setBusy] = useState(false); const [dirty, setDirty] = useState(false); const [rk, setRk] = useState(0);
  const can = has('menu');
  useEffect(() => { api('GET', '/footer').then(setF).catch((e) => toast(e.message, 'err')); }, []); // eslint-disable-line
  if (!f) return <p>Loading…</p>;
  const set = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); setDirty(true); };
  const link = (i, patch) => set('links')(f.links.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const save = async (e) => { e.preventDefault(); setBusy(true); try { setF(await api('PUT', '/footer', f)); setDirty(false); toast('Footer saved — live on the site'); } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); } };
  const reset = async () => { if (!window.confirm('Reset the footer to the built-in default? Save afterwards to apply.')) return; try { setF(await api('GET', '/footer/default')); setRk((n) => n + 1); setDirty(true); } catch (x) { toast(x.message, 'err'); } };
  const ro = !can;
  return (
    <form onSubmit={save}>
      <div className="ad-head"><h1>Footer Settings</h1><a className="ad-btn ghost" href="/" target="_blank" rel="noreferrer">View site <Icon n="ext" /></a></div>
      {ro && <p className="ad-muted">Your role can view the footer but not change it.</p>}
      <div className="ad-cols">
        <div className="ad-main">
          <section className="ad-box"><h2>Office locations</h2>
            <Field label="Column title"><Input v={f.officesTitle} set={set('officesTitle')} disabled={ro} /></Field>
            <Field label="Offices" hint="One per line."><Lines key={rk} v={f.offices} set={set('offices')} rows={8} /></Field></section>
          <section className="ad-box"><h2>Link column</h2>
            <Field label="Column title"><Input v={f.linksTitle} set={set('linksTitle')} disabled={ro} /></Field>
            <div className="ad-mi-kids nobar">
              {f.links.map((l, i) => (
                <div className="ad-mi-row kid" key={i}>
                  <div className="ad-mi-fields"><Input v={l.label} set={(v) => link(i, { label: v })} placeholder="Link label" disabled={ro} /><Input v={l.href} set={(v) => link(i, { href: v })} placeholder="/page or https://…" disabled={ro} /></div>
                  {can && <div className="ad-mi-acts">
                    <button type="button" className="ad-ico" onClick={() => set('links')(swap(f.links, i, -1))} aria-label="Move up"><Icon n="up" /></button>
                    <button type="button" className="ad-ico" onClick={() => set('links')(swap(f.links, i, 1))} aria-label="Move down"><Icon n="down" /></button>
                    <button type="button" className="ad-ico" onClick={() => set('links')(f.links.filter((_, k) => k !== i))} aria-label="Remove link"><Icon n="x" /></button>
                  </div>}
                </div>
              ))}
              {can && <button type="button" className="ad-btn" onClick={() => set('links')([...f.links, { label: '', href: '' }])}><Icon n="plus" /> Add link</button>}
            </div>
            <p className="ad-muted">More link columns can be made under <a href="#/menu/new">Menu → Add New Menu</a> (location: Footer).</p></section>
          <section className="ad-box"><h2>Mailing list</h2>
            <Field label="Heading"><Input v={f.mailingTitle} set={set('mailingTitle')} disabled={ro} /></Field>
            <Field label="Text"><Text v={f.mailing} set={set('mailing')} rows={3} disabled={ro} /></Field></section>
          <section className="ad-box"><h2>Legal line</h2>
            <Field label="Copyright"><Input v={f.copyright} set={set('copyright')} disabled={ro} /></Field>
            <Field label="Disclaimer"><Text v={f.disclaimer} set={set('disclaimer')} rows={4} disabled={ro} /></Field></section>
        </div>
        <aside className="ad-side">
          {can && <section className="ad-box"><button className="ad-btn primary" disabled={busy || !dirty}>{busy ? 'Saving…' : dirty ? 'Save footer' : 'Saved'}</button>
            <button type="button" className="ad-btn ghost" onClick={reset}>Reset to default</button></section>}
          <section className="ad-box"><h2>Featured image</h2>
            <p className="ad-muted">Shown in the last footer column (for example a news or announcement graphic). When empty, the contact person card below is shown instead.</p>
            <Field label="Image"><MediaField v={f.promoImage} set={set('promoImage')} toast={toast} /></Field>
            <Field label="Link" hint="Opens in a new tab when the image is clicked."><Input v={f.promoLink} set={set('promoLink')} placeholder="https://…" disabled={ro} /></Field>
            <Field label="Description (alt text)" hint="Read out by screen readers; say what the image shows."><Input v={f.promoAlt} set={set('promoAlt')} disabled={ro} /></Field></section>
          <section className="ad-box"><h2>Contact person card</h2>
            <Field label="Name"><Input v={f.personName} set={set('personName')} disabled={ro} /></Field>
            <Field label="Role"><Input v={f.personRole} set={set('personRole')} disabled={ro} /></Field>
            <Field label="Photo"><MediaField v={f.personPhoto} set={set('personPhoto')} toast={toast} /></Field></section>
          <section className="ad-box"><h2>Social links</h2>
            <Field label="LinkedIn" hint="Full address. Leave both empty to hide “Follow us”."><Input v={f.linkedin} set={set('linkedin')} placeholder="https://www.linkedin.com/company/…" disabled={ro} /></Field>
            <Field label="Instagram"><Input v={f.instagram} set={set('instagram')} placeholder="https://www.instagram.com/…" disabled={ro} /></Field></section>
        </aside>
      </div>
    </form>
  );
}

/** Page Text: edit the built-in copy of Home, About, Awards and each sector page. Empty / unchanged = built-in text. */
