import { useCallback, useEffect, useMemo, useState } from 'react';
import './admin.css';
import { api, Icon, Field, Input, Select, Toasts, when } from './ui.jsx';
import { PersonEditor, PostEditor, PracticeEditor, CustomEditor, JobEditor } from './Editors.jsx';
import { FormsList, FormEditor } from './FormsAdmin.jsx';
import { FaqAdmin } from './FaqAdmin.jsx';
import { ChatbotAdmin } from './ChatbotAdmin.jsx';
import { PagesList, PagesAdmin, SettingsAdmin, AuditLog, BackupAdmin, MediaAdmin, MenuAdmin, MenusList, MenuForm, FooterAdmin } from './Sections.jsx';

// Sidebar, grouped by purpose. `g` = group heading (none = top item). Items hide per role (`cap`), empty groups hide with them.
const NAV = [
  { k: 'dashboard', l: 'Dashboard', ic: 'dash', href: '#/dashboard' },
  { g: 'Content Management', k: 'pages', l: 'Pages', ic: 'page', cap: 'seo', sub: [['All Pages', '#/pages'], ['Add Page', '#/pages/new', 'content']] },
  { g: 'Content Management', k: 'faqs', l: 'FAQs', ic: 'page', cap: 'content', href: '#/faqs' },
  { g: 'Content Management', k: 'posts', l: 'Knowledge', ic: 'post', cap: 'content', href: '#/posts' },
  { g: 'Content Management', k: 'media', l: 'Media Library', ic: 'media', cap: 'media', sub: [['All Media', '#/media'], ['Upload Media Files', '#/media/upload']] },
  { g: 'People & Recruitment', k: 'jobs', l: 'Careers', ic: 'team', cap: 'jobs', sub: [['All Jobs', '#/jobs'], ['Add Job', '#/jobs/new'], ['Applications', '#/jobs/applications', 'inbox']] },
  { g: 'People & Recruitment', k: 'people', l: 'Team', ic: 'team', cap: 'content', href: '#/people' },
  { g: 'Firm Information', k: 'practice', l: 'Practice Areas', ic: 'scale', cap: 'content', href: '#/practice' },
  { g: 'Website Configuration', k: 'menu', l: 'Navigation', ic: 'page', cap: 'menu', sub: [['All Menus', '#/menu'], ['Add New Menu', '#/menu/new']] },
  { g: 'Website Configuration', k: 'footer', l: 'Footer Settings', ic: 'page', cap: 'menu', href: '#/footer' },
  { g: 'Website Configuration', k: 'forms', l: 'Forms', ic: 'page', cap: 'content', href: '#/forms' },
  { g: 'Communication', k: 'chatbot', l: 'Chatbot', ic: 'mail', cap: 'content', href: '#/chatbot' },
  { g: 'Communication', k: 'inbox', l: 'Inbox', ic: 'mail', cap: 'inbox', href: '#/inbox' },
  { g: 'System Settings', k: 'settings', l: 'Site Settings', ic: 'gear', cap: 'seo', sub: [['General', '#/settings/general'], ['Email (Microsoft 365)', '#/settings/email', 'admin']] },
  { g: 'System Settings', k: 'audit', l: 'Audit Log', ic: 'log', cap: 'admin', href: '#/audit' },
  { g: 'System Settings', k: 'backup', l: 'Backup', ic: 'box', cap: 'admin', href: '#/backup' },
  { g: 'System Settings', k: 'users', l: 'Users & Permissions', ic: 'users', cap: 'admin', sub: [['All Users', '#/users'], ['Add User', '#/users/new']] },
  { g: 'My Account', k: 'profile', l: 'My Profile', ic: 'user', sub: [['Your Profile', '#/profile'], ['Change Password', '#/profile/password']] },
  { g: 'My Account', k: 'view', l: 'View Website', ic: 'ext', href: '/', ext: true },
];
/** Which submenu entry is current: exact hash, else a deeper path under it, else the first (list) entry. */
const activeSub = (sub, hash) => sub.find(([, h]) => hash === h) || sub.slice(1).find(([, h]) => hash.startsWith(h + '/')) || sub[0];
/** Inbox entries are keyed by field id (contact) or label (applications): find the person's name and email whatever the key. */
const nameKey = (d) => d.name || d['Full name'] || Object.entries(d).find(([k, v]) => /name/i.test(k) && v)?.[1] || emailKey(d);
const emailKey = (d) => Object.entries(d).map(([k, v]) => (/e-?mail/i.test(k) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()) ? String(v).trim() : '')).find(Boolean) || '';
const go = (h) => { window.location.hash = h; };

export default function Admin() {
  const [user, setUser] = useState(undefined);
  const [toasts, setToasts] = useState([]);
  const [hash, setHash] = useState(window.location.hash || '#/dashboard');
  const [unread, setUnread] = useState({ inbox: 0, apps: 0 });
  const [openGrp, setOpenGrp] = useState({});
  const [navOff, setNavOff] = useState(() => { try { return localStorage.getItem('cm_nav_off') === '1'; } catch { return false; } });
  const [full, setFull] = useState(() => !!document.fullscreenElement);
  const toggleNav = () => setNavOff((v) => { const n = !v; try { localStorage.setItem('cm_nav_off', n ? '1' : '0'); } catch { /* private mode */ } return n; });
  const toggleFull = () => { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); } catch { /* not allowed here */ } };
  useEffect(() => { const h = () => setFull(!!document.fullscreenElement); document.addEventListener('fullscreenchange', h); return () => document.removeEventListener('fullscreenchange', h); }, []);
  const toast = useCallback((text, kind = 'ok') => { const id = Math.random(); setToasts((t) => [...t, { id, text, kind }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500); }, []);
  const lost = useCallback(() => setUser(null), []);

  useEffect(() => {
    document.title = 'Dashboard — DSK Legal';
    let m = document.querySelector('meta[name=robots]'); if (!m) { m = document.createElement('meta'); m.name = 'robots'; document.head.appendChild(m); } m.content = 'noindex,nofollow';
    api('GET', '/me').then((r) => setUser(r.user)).catch(() => setUser(null));
    const h = () => { setHash(window.location.hash || '#/dashboard'); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h);
  }, []);
  useEffect(() => { if (user) api('GET', '/stats', null, lost).then((s) => setUnread({ inbox: s.unread, apps: s.unreadApps })).catch(() => {}); }, [user, hash, lost]);

  if (user === undefined) return <div className="cm-boot">Loading…</div>;
  if (!user) return <Login onDone={setUser} />;

  const [, section = 'dashboard', slug, slug2] = hash.split('/');
  const A = (m, u, b) => api(m, u, b, lost);
  const has = (c) => !!user.caps?.includes(c);
  const ctx = { toast, nav: go, user, api: A, has };
  const NEED = { posts: 'content', people: 'content', practice: 'content', jobs: 'jobs', menu: 'menu', footer: 'menu', forms: 'content', faqs: 'content', chatbot: 'content', texts: 'pages', media: 'media', inbox: 'inbox', pages: 'seo', settings: 'seo', audit: 'admin', backup: 'admin', users: 'admin' };
  const logout = async () => { await api('POST', '/logout').catch(() => {}); setUser(null); };
  const body = (() => {
    if (NEED[section] && !has(NEED[section])) return <p className="cm-err">Your role ({user.role}) cannot open this section.</p>;
    switch (section) {
      case 'dashboard': return <Dashboard {...ctx} />;
      case 'posts': return slug ? <PostEditor key={slug} slug={slug} {...ctx} /> : <Listing key="posts" coll="posts" title="Knowledge" noun="post" cols={[['title', 'Title'], ['type', 'Category'], ['date', 'Date'], ['published', 'Status']]} view={(x) => `/knowledge/${x.slug}`} {...ctx} />;
      case 'jobs': return slug === 'applications' ? (has('inbox') ? <Inbox key="apps" mode="apps" {...ctx} /> : <p className="cm-err">Your role ({user.role}) cannot open this section.</p>) : slug ? <JobEditor key={slug} slug={slug} {...ctx} /> : <Listing key="jobs" coll="jobs" title="Careers" noun="job" cols={[['title', 'Job title'], ['department', 'Department'], ['office', 'Office'], ['type', 'Type'], ['published', 'Status']]} view={() => '/careers'} {...ctx} />;
      case 'people': return slug ? <PersonEditor key={slug} slug={slug} {...ctx} /> : <Listing key="people" coll="people" title="Team" noun="team member" cols={[['name', 'Name'], ['level', 'Level'], ['office', 'Office'], ['email', 'Email']]} view={(x) => `/people/${x.slug}`} {...ctx} />;
      case 'practice': return slug ? <PracticeEditor key={slug} slug={slug} {...ctx} /> : <Listing key="practice" coll="practice" title="Practice Areas" noun="practice area" cols={[['name', 'Name'], ['services', 'Services'], ['contacts', 'Contacts']]} view={(x) => `/practice/${x.slug}`} {...ctx} />;
      case 'pages': return !slug ? <PagesList {...ctx} /> : slug === 'new' ? <CustomEditor key="new" slug="new" {...ctx} /> : slug === 'custom' ? <CustomEditor key={slug2} slug={slug2} {...ctx} /> : <PagesAdmin id={slug} {...ctx} />;
      case 'menu': return !slug ? <MenusList {...ctx} /> : slug === 'header' ? <MenuAdmin {...ctx} /> : <MenuForm key={slug} id={slug} {...ctx} />;
      case 'footer': return <FooterAdmin {...ctx} />;
      case 'chatbot': return <ChatbotAdmin {...ctx} />;
      case 'faqs': return <FaqAdmin {...ctx} />;
      case 'forms': return slug ? <FormEditor key={slug} id={slug} {...ctx} /> : <FormsList {...ctx} />;
      case 'texts': return <PagesAdmin id="home" {...ctx} />;
      case 'media': return <MediaAdmin mode={slug === 'upload' ? 'upload' : 'library'} {...ctx} />;
      case 'settings': return user.role === 'admin' ? <SettingsAdmin tab={slug} {...ctx} /> : <p className="cm-err">Admins only.</p>;
      case 'audit': return user.role === 'admin' ? <AuditLog {...ctx} /> : <p className="cm-err">Admins only.</p>;
      case 'backup': return user.role === 'admin' ? <BackupAdmin {...ctx} /> : <p className="cm-err">Admins only.</p>;
      case 'inbox': return <Inbox key="inbox" mode="inbox" {...ctx} />;
      case 'users': return user.role === 'admin' ? <Users mode={slug === 'new' ? 'new' : 'list'} {...ctx} /> : <p className="cm-err">Admins only.</p>;
      case 'profile': return <Profile mode={slug === 'password' ? 'password' : 'details'} {...ctx} onRelogin={() => setUser(null)} />;
      default: return <p>Page not found.</p>;
    }
  })();

  return (
    <div className={`cm${navOff ? ' cm-nav-off' : ''}`}>
      <aside className="cm-nav">
        <a className="cm-brand" href="#/dashboard"><img src="/logo.png" alt="" /><span>DSK Legal<small>Site manager</small></span></a>
        <nav>{NAV.filter((n) => !n.cap || has(n.cap)).map((x) => ({ ...x, sub: x.sub && x.sub.filter((c) => !c[2] || has(c[2])) })).map((n, idx, all) => {
          const heading = n.g && n.g !== all[idx - 1]?.g ? <p className="cm-navh" key={`h-${n.g}`}>{n.g}</p> : null;
          const item = (() => {
            if (!n.sub) return <a key={n.k} href={n.href} className={section === n.k ? 'on' : ''} {...(n.ext ? { target: '_blank', rel: 'noreferrer' } : {})}><Icon n={n.ic} />{n.l}{n.k === 'inbox' && unread.inbox > 0 && <b className="cm-badge">{unread.inbox}</b>}</a>;
            const here = section === n.k; const open = here || !!openGrp[n.k]; const cur = here && activeSub(n.sub, hash);
            return (
              <div key={n.k} className={`cm-grp${open ? ' open' : ''}`}>
                <div className="cm-grp-head"><a href={n.sub[0][1]} className={here ? 'on' : ''}><Icon n={n.ic} />{n.l}{n.k === 'jobs' && unread.apps > 0 && <b className="cm-badge">{unread.apps}</b>}</a>
                  <button type="button" className="cm-chev" aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} ${n.l}`} onClick={() => !here && setOpenGrp((o) => ({ ...o, [n.k]: !o[n.k] }))} disabled={here}><Icon n={open ? 'up' : 'down'} /></button></div>
                {open && <div className="cm-sub">{n.sub.map((c) => <a key={c[1]} href={c[1]} className={cur === c ? 'on' : ''}>{c[0]}</a>)}</div>}
              </div>
            );
          })();
          return [heading, item];
        })}</nav>
      </aside>
      <div className="cm-wrap">
        <header className="cm-top"><div className="cm-top-l"><button type="button" className="cm-iconbtn" onClick={toggleNav} aria-label={navOff ? 'Show the sidebar' : 'Hide the sidebar'} aria-expanded={!navOff} title={navOff ? 'Show the sidebar' : 'Hide the sidebar'}><Icon n="menu" /></button><button type="button" className="cm-iconbtn" onClick={toggleFull} aria-label={full ? 'Exit full screen' : 'Full screen'} aria-pressed={full} title={full ? 'Exit full screen' : 'Full screen'}><Icon n={full ? 'compress' : 'expand'} /></button></div><span>Signed in as <b>{user.name || user.username}</b> <em>{user.role}</em></span><button className="cm-btn ghost" onClick={logout}><Icon n="out" /> Log out</button></header>
        <main className="cm-content">{body}</main>
      </div>
      <Toasts items={toasts} />
    </div>
  );
}

function Login({ onDone }) {
  const [f, setF] = useState({ username: '', password: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { onDone((await api('POST', '/login', f)).user); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="cm-login">
      <form onSubmit={submit}>
        <img src="/logo.png" alt="DSK Legal" />
        <h1>Sign in</h1>
        <Field label="Username"><Input v={f.username} set={(v) => setF({ ...f, username: v })} autoComplete="username" autoFocus required /></Field>
        <Field label="Password"><Input v={f.password} set={(v) => setF({ ...f, password: v })} type="password" autoComplete="current-password" required /></Field>
        {err && <p className="cm-err" role="alert">{err}</p>}
        <button className="cm-btn primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <a href="/" className="cm-back">← Back to site</a>
      </form>
    </div>
  );
}

function Dashboard({ has, api, toast, nav, user }) {
  const [s, setS] = useState(null); const [draft, setDraft] = useState({ title: '', summary: '' });
  useEffect(() => { api('GET', '/stats').then(setS).catch((e) => toast(e.message, 'err')); }, []); // eslint-disable-line
  if (!s) return <p>Loading…</p>;
  const c = s.counts;
  const glance = [['jobs', c.jobs, 'Open job positions', 'jobs'], ['posts', c.posts, 'Knowledge posts', 'content'], ['people', c.people, 'Team members', 'content'], ['practice', c.practice, 'Practice areas', 'content'], ['media', c.media, 'Media files', 'media'], ['inbox', c.enquiries, 'Enquiries', 'inbox'], ['jobs/applications', c.applications, 'Job & internship applications', 'inbox'], ['inbox', c.subscribers, 'Newsletter subscribers', 'inbox']].filter((g) => has(g[3]));
  const quick = async (e) => {
    e.preventDefault();
    try { const r = await api('POST', '/c/posts', { ...draft, type: 'Articles', published: false, blocks: [{ t: 'p', h: '' }] }); toast('Draft saved'); nav(`#/posts/${r.slug}`); } catch (x) { toast(x.message, 'err'); }
  };
  return (
    <>
      <div className="cm-head"><h1>Dashboard</h1></div>
      <section className="cm-welcome"><h2>Welcome, {user.name || user.username}</h2><p>Edit the site’s content here. Changes go live on the website as soon as you save.</p>
        <p className="cm-muted">Your role: <b>{user.role}</b></p>
        <div className="cm-row">{has('content') && <a className="cm-btn primary" href="#/posts/new">Write a knowledge post</a>}{has('content') && <a className="cm-btn" href="#/people/new">Add a team member</a>}{has('jobs') && <a className="cm-btn" href="#/jobs/new">Add a job</a>}{has('seo') && <a className="cm-btn" href="#/pages">Edit page SEO</a>}{has('inbox') && <a className="cm-btn" href="#/inbox">Open inbox</a>}{has('media') && <a className="cm-btn" href="#/media">Upload media</a>}</div></section>
      <div className="cm-dash">
        <section className="cm-box"><h2>At a glance</h2><ul className="cm-glance">{glance.map(([k, n, l], i) => <li key={i}><a href={`#/${k}`}><b>{n}</b>{l}</a></li>)}</ul></section>
        {has('content') && <section className="cm-box"><h2>Quick draft</h2><form onSubmit={quick}>
          <Field label="Title"><Input v={draft.title} set={(v) => setDraft({ ...draft, title: v })} required /></Field>
          <Field label="Summary"><textarea rows={3} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} /></Field>
          <button className="cm-btn primary">Save draft</button></form></section>}
        {has('inbox') && <section className="cm-box"><h2>Recent enquiries</h2>{!s.recentSubs.length && <p className="cm-muted">Nothing yet.</p>}
          <ul className="cm-feed">{s.recentSubs.map((x) => <li key={x.id}><a href="#/inbox"><b>{x.data.name || x.data.email || x.data['Full name'] || x.type}</b><small>{x.type} · {when(x.at)}</small></a></li>)}</ul></section>}
        <section className="cm-box"><h2>Activity</h2>{!s.activity.length && <p className="cm-muted">No edits yet.</p>}
          <ul className="cm-feed">{s.activity.map((a, i) => <li key={i}><span><b>{a.user}</b> {a.action} <em>{a.what}</em></span><small>{when(a.at)}</small></li>)}</ul></section>
      </div>
    </>
  );
}

function Listing({ coll, title, noun, cols, view, api, toast }) {
  const [rows, setRows] = useState(null); const [q, setQ] = useState('');
  const load = () => api('GET', `/c/${coll}`).then(setRows).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, [coll]); // eslint-disable-line
  const shown = useMemo(() => (rows || []).filter((r) => !q || JSON.stringify([r.name, r.title, r.level, r.office, r.type, r.email]).toLowerCase().includes(q.toLowerCase())), [rows, q]);
  const del = async (r) => {
    if (!window.confirm(`Delete “${r.name || r.title}”? This cannot be undone.`)) return;
    try { await api('DELETE', `/c/${coll}/${r.slug}`); toast('Deleted'); load(); } catch (e) { toast(e.message, 'err'); }
  };
  const cell = (r, k) => (k === 'published' ? (r.published === false ? <span className="cm-pill draft">Draft</span> : <span className="cm-pill">Published</span>) : Array.isArray(r[k]) ? r[k].length : r[k]);
  return (
    <>
      <div className="cm-head"><h1>{title}</h1><a className="cm-btn primary" href={`#/${coll}/new`}><Icon n="plus" /> Add {noun}</a>
        <input className="cm-search" type="search" placeholder={`Search ${title.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {!rows ? <p>Loading…</p> : (
        <div className="cm-tablewrap"><table className="cm-table">
          <thead><tr>{cols.map(([k, l]) => <th key={k}>{l}</th>)}<th /></tr></thead>
          <tbody>{shown.map((r) => (
            <tr key={r.slug}>{cols.map(([k], i) => <td key={k} data-l={cols[i][1]}>{i === 0 ? <a className="cm-ttl" href={`#/${coll}/${r.slug}`}>{cell(r, k)}</a> : cell(r, k)}</td>)}
              <td className="cm-acts"><a href={`#/${coll}/${r.slug}`}>Edit</a><a href={view(r)} target="_blank" rel="noreferrer">View</a><button onClick={() => del(r)}>Delete</button></td></tr>
          ))}</tbody></table>
          {!shown.length && <p className="cm-muted pad">No matches.</p>}
        </div>
      )}
      <p className="cm-muted">{shown.length} of {rows?.length ?? 0}</p>
    </>
  );
}

const LABEL = { contact: 'Contact', internship: 'Internship', job: 'Job application', subscribe: 'Subscriber' };
/** mode "inbox": Enquiries + Subscribers. mode "apps" (Careers → Applications): job and internship applications. */
function Inbox({ api, toast, mode = 'inbox' }) {
  const apps = mode === 'apps';
  const [rows, setRows] = useState(null); const [tab, setTab] = useState(apps ? 'apps' : 'all'); const [open, setOpen] = useState(null);
  const load = () => api('GET', '/submissions').then(setRows).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []); // eslint-disable-line
  const shown = (rows || []).filter((r) => (tab === 'all' ? r.type === 'contact' : tab === 'apps' ? r.type === 'job' || r.type === 'internship' : tab === 'job' || tab === 'internship' ? r.type === tab : r.type === tab));
  const toggle = async (r) => {
    setOpen(open === r.id ? null : r.id);
    if (!r.read) { await api('PATCH', `/submissions/${r.id}`, { read: true }).catch(() => {}); setRows((x) => x.map((y) => (y.id === r.id ? { ...y, read: true } : y))); }
  };
  const del = async (r) => { if (!window.confirm('Delete this entry' + (r.cv ? ' and its CV' : '') + '? This cannot be undone.')) return; await api('DELETE', `/submissions/${r.id}`).catch((e) => toast(e.message, 'err')); load(); };
  return (
    <>
      <div className="cm-head"><h1>{apps ? 'Applications' : 'Inbox'}</h1>{apps && <a className="cm-btn ghost" href="#/jobs">← All Jobs</a>}{tab === 'subscribe' && <a className="cm-btn" href="/api/admin/export/subscribers.csv"><Icon n="dl" /> Export CSV</a>}</div>
      <div className="cm-tabs">{(apps ? [['apps', 'All applications'], ['job', 'Job applications'], ['internship', 'Internship applications']] : [['all', 'Enquiries'], ['subscribe', 'Subscribers']]).map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {!rows ? <p>Loading…</p> : !shown.length ? <p className="cm-muted">Nothing here yet.</p> : (
        <ul className="cm-inbox">{shown.map((r) => (
          <li key={r.id} className={r.read ? '' : 'unread'}>
            <button className="cm-in-row" onClick={() => toggle(r)}><i />
              <b>{nameKey(r.data) || '—'}</b><span className="cm-pill">{LABEL[r.type]}</span><small>{when(r.at)}</small></button>
            {open === r.id && (
              <div className="cm-in-body">{r.mail && <p className={`cm-mailst${r.mail.startsWith('failed') ? ' bad' : ''}`}>Email: {r.mail}</p>}<dl>{Object.entries(r.data).map(([k, v]) => v && <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
                <div className="cm-row">{r.cv && <a className="cm-btn" href={`/api/admin/submissions/${r.id}/cv`}><Icon n="dl" /> Download CV{r.cvName ? ` (${r.cvName})` : ''}</a>}
                  {emailKey(r.data) && <a className="cm-btn" href={`mailto:${emailKey(r.data)}`}>Reply</a>}<button className="cm-btn danger" onClick={() => del(r)}>Delete</button></div></div>
            )}
          </li>))}</ul>
      )}
    </>
  );
}

function Users({ api, toast, user, mode, nav }) {
  const [rows, setRows] = useState([]); const [f, setF] = useState({ username: '', name: '', email: '', role: 'editor', password: '' });
  const [roles, setRoles] = useState([]);
  useEffect(() => { api('GET', '/roles').then(setRoles).catch(() => {}); }, []); // eslint-disable-line
  const roleOpts = roles.map((r) => ({ value: r.id, label: r.label }));
  const about = roles.find((r) => r.id === f.role)?.about;
  const setRole = async (u, role) => { try { await api('PUT', `/users/${u.id}/role`, { role }); toast(`${u.username} is now ${role}. They must sign in again.`); load(); } catch (x) { toast(x.message, 'err'); } };
  const load = () => api('GET', '/users').then(setRows).catch((e) => toast(e.message, 'err'));
  useEffect(() => { if (mode === 'list') load(); }, [mode]); // eslint-disable-line
  const add = async (e) => { e.preventDefault(); try { await api('POST', '/users', f); toast('User added'); nav('#/users'); } catch (x) { toast(x.message, 'err'); } };
  const del = async (u) => { if (!window.confirm(`Remove ${u.username}?`)) return; try { await api('DELETE', `/users/${u.id}`); load(); } catch (x) { toast(x.message, 'err'); } };
  if (mode === 'new') return (
    <>
      <div className="cm-head"><h1>Add User</h1><a className="cm-btn ghost" href="#/users">← All Users</a></div>
      <form className="cm-box cm-narrow" onSubmit={add}>
        <Field label="Username"><Input v={f.username} set={(v) => setF({ ...f, username: v })} required /></Field>
        <Field label="Name"><Input v={f.name} set={(v) => setF({ ...f, name: v })} /></Field>
        <Field label="Email"><Input v={f.email} set={(v) => setF({ ...f, email: v })} type="email" /></Field>
        <Field label="Role" hint={about}><Select v={f.role} set={(v) => setF({ ...f, role: v })} options={roleOpts.length ? roleOpts : ['editor']} /></Field>
        <Field label="Password" hint="At least 10 characters."><Input v={f.password} set={(v) => setF({ ...f, password: v })} type="password" autoComplete="new-password" required minLength={10} /></Field>
        <button className="cm-btn primary">Add user</button>
      </form>
    </>
  );
  return (
    <>
      <div className="cm-head"><h1>All Users</h1><a className="cm-btn primary" href="#/users/new"><Icon n="plus" /> Add user</a></div>
      {roles.length > 0 && <section className="cm-box cm-roles"><h2>Roles</h2><dl>{roles.map((r) => <div key={r.id}><dt>{r.label}</dt><dd>{r.about}</dd></div>)}</dl></section>}
      <div className="cm-tablewrap"><table className="cm-table"><thead><tr><th>Username</th><th>Name</th><th>Email</th><th>Role</th><th /></tr></thead>
        <tbody>{rows.map((u) => <tr key={u.id}><td>{u.username}</td><td>{u.name}</td><td>{u.email}</td><td>{u.id === user.id || !roleOpts.length ? <span className="cm-pill">{u.role}</span> : <select value={u.role} onChange={(e) => setRole(u, e.target.value)} aria-label={`Role of ${u.username}`}>{roleOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>}</td><td className="cm-acts">{u.id !== user.id && <button onClick={() => del(u)}>Remove</button>}</td></tr>)}</tbody></table></div>
    </>
  );
}

function Profile({ api, toast, user, onRelogin, mode }) {
  const [f, setF] = useState({ name: user.name || '', email: user.email || '', current: '', password: '', again: '' });
  const pw = mode === 'password';
  const save = async (e) => {
    e.preventDefault();
    if (pw && f.password !== f.again) return toast('The two new passwords do not match.', 'err');
    try {
      const r = await api('PUT', '/profile', pw ? { name: user.name, email: user.email, current: f.current, password: f.password } : { name: f.name, email: f.email });
      if (r.relogin) { toast('Password changed — please sign in again'); onRelogin(); } else toast('Profile saved');
    } catch (x) { toast(x.message, 'err'); }
  };
  return (
    <>
      <div className="cm-head"><h1>{pw ? 'Change Password' : 'Your Profile'}</h1></div>
      <form className="cm-box cm-narrow" onSubmit={save}>
        {pw ? (
          <>
            <Field label="Current password"><Input v={f.current} set={(v) => setF({ ...f, current: v })} type="password" autoComplete="current-password" required /></Field>
            <Field label="New password" hint="At least 10 characters. You will be signed out and must sign in again."><Input v={f.password} set={(v) => setF({ ...f, password: v })} type="password" autoComplete="new-password" required minLength={10} /></Field>
            <Field label="Repeat new password"><Input v={f.again} set={(v) => setF({ ...f, again: v })} type="password" autoComplete="new-password" required /></Field>
            <button className="cm-btn primary">Change password</button>
          </>
        ) : (
          <>
            <Field label="Username"><input value={user.username} disabled /></Field>
            <Field label="Role"><input value={user.role} disabled /></Field>
            <Field label="Display name"><Input v={f.name} set={(v) => setF({ ...f, name: v })} /></Field>
            <Field label="Email"><Input v={f.email} set={(v) => setF({ ...f, email: v })} type="email" /></Field>
            <button className="cm-btn primary">Save profile</button>
          </>
        )}
      </form>
    </>
  );
}
