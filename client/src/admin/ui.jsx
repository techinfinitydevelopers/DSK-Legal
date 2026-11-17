import { useEffect, useState } from 'react';

/** fetch wrapper for the admin API; the custom header is the CSRF guard the server requires on writes. */
export async function api(method, url, body, onAuthLost) {
  const r = await fetch(`/api/admin${url}`, {
    method, credentials: 'same-origin',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), 'X-Requested-With': 'dsk-admin' },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null; try { data = await r.json(); } catch { /* empty */ }
  if (r.status === 401 && onAuthLost && !url.startsWith('/login')) onAuthLost();
  if (!r.ok) throw new Error(data?.error || `Request failed (${r.status})`);
  return data;
}

export const Icon = ({ n }) => {
  const P = {
    dash: 'M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z',
    team: 'M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21a8 8 0 0 1 16 0',
    post: 'M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h8',
    scale: 'M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zm14 0l-3 7a3 3 0 0 0 6 0zM8 21h8',
    media: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M9 9.5h.01',
    mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
    users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M17 4.5a3.5 3.5 0 0 1 0 7M18 14a7 7 0 0 1 4 6',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    out: 'M9 4H4v16h5M16 8l4 4-4 4M20 12H9',
    page: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5', gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    log: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', box: 'M21 8v13H3V8M1 3h22v5H1zM10 12h4',
    ext: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
    plus: 'M12 5v14M5 12h14', up: 'M6 15l6-6 6 6', down: 'M6 9l6 6 6-6', x: 'M6 6l12 12M18 6L6 18', dl: 'M12 4v11M7 11l5 5 5-5M4 20h16',
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n]} /></svg>;
};

export function Field({ label, hint, children, wide }) {
  return <label className={`ad-f${wide ? ' wide' : ''}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
export function Input({ v, set, type, ...p }) {
  const [show, setShow] = useState(false);
  if (type !== 'password') return <input value={v ?? ''} onChange={(e) => set(e.target.value)} type={type} {...p} />;
  return (
    <span className="ad-pw">
      <input value={v ?? ''} onChange={(e) => set(e.target.value)} type={show ? 'text' : 'password'} {...p} />
      <button type="button" className="ad-pw-t" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} title={show ? 'Hide password' : 'Show password'}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
          {show && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </span>
  );
}
export const Text = ({ v, set, rows = 4, ...p }) => <textarea rows={rows} value={v ?? ''} onChange={(e) => set(e.target.value)} {...p} />;
/** array ↔ one-item-per-line textarea */
export const Lines = ({ v, set, rows = 4, sep = '\n' }) => {
  const [txt, setTxt] = useState((v || []).join(sep));
  return <textarea rows={rows} value={txt} onChange={(e) => { setTxt(e.target.value); set(e.target.value.split(sep).map((x) => x.trim()).filter(Boolean)); }} />;
};
export const Select = ({ v, set, options }) => <select value={v ?? ''} onChange={(e) => set(e.target.value)}>{options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select>;

export function Toasts({ items }) { return <div className="ad-toasts" aria-live="polite">{items.map((t) => <div key={t.id} className={`ad-toast ${t.kind}`}>{t.text}</div>)}</div>; }

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className="ad-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`ad-modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header><h3>{title}</h3><button className="ad-x" onClick={onClose} aria-label="Close"><Icon n="x" /></button></header>
        {children}
      </div>
    </div>
  );
}

export const readFile = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });

/** Choose from the media library or upload a new file; value is a URL string. */
export function MediaField({ v, set, kind = 'image', toast }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ad-media-field">
      {v && kind === 'image' && <img src={v} alt="" />}
      {v && kind !== 'image' && <a href={v} target="_blank" rel="noreferrer">{v.split('/').pop()}</a>}
      <div className="ad-row">
        <input value={v ?? ''} onChange={(e) => set(e.target.value)} placeholder={kind === 'image' ? '/img/… or choose a file' : 'PDF URL or choose a file'} />
        <button type="button" className="ad-btn" onClick={() => setOpen(true)}>Choose / Upload</button>
        {v && <button type="button" className="ad-btn ghost" onClick={() => set('')}>Remove</button>}
      </div>
      {open && <MediaPicker kind={kind} toast={toast} onClose={() => setOpen(false)} onPick={(u) => { set(u); setOpen(false); }} />}
    </div>
  );
}

export function MediaPicker({ kind, onPick, onClose, toast }) {
  const [files, setFiles] = useState(null);
  const load = () => api('GET', '/media').then(setFiles).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []); // eslint-disable-line
  const upload = async (f) => {
    if (!f) return;
    try { const r = await api('POST', '/media', { name: f.name, data: await readFile(f) }); toast('Uploaded'); onPick(r.url); } catch (e) { toast(e.message, 'err'); }
  };
  const shown = (files || []).filter((f) => (kind === 'image' ? !f.name.endsWith('.pdf') : f.name.endsWith('.pdf')));
  return (
    <Modal title="Media library" onClose={onClose} wide>
      <div className="ad-modal-body">
        <label className="ad-btn primary ad-upload">Upload {kind === 'image' ? 'image' : 'PDF'}<input type="file" hidden accept={kind === 'image' ? 'image/jpeg,image/png,image/webp,image/gif' : 'application/pdf'} onChange={(e) => upload(e.target.files[0])} /></label>
        <div className="ad-grid-media">
          {files === null && <p>Loading…</p>}
          {files && !shown.length && <p className="ad-muted">Nothing uploaded yet.</p>}
          {shown.map((f) => (
            <button key={f.name} type="button" className="ad-tile" onClick={() => onPick(f.url)}>
              {kind === 'image' ? <img src={f.url} alt="" /> : <span className="ad-pdf">PDF</span>}
              <small>{f.name}</small>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export const when = (iso) => { try { return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return iso; } };
export const bytes = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
