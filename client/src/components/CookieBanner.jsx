import { useEffect, useState } from 'react';

/** Cookie notice. The site sets no analytics or advertising cookies today; the choice is stored in localStorage (`dsk_cookie` = all | essential)
 *  so that any analytics added later can check window.__COOKIE === 'all'. The footer's "Cookie settings" button reopens it. */
const KEY = 'dsk_cookie';
const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };

export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    window.__COOKIE = read() || undefined;
    if (!read()) setOpen(true);
    const again = () => setOpen(true);
    window.addEventListener('dsk-cookie-settings', again);
    return () => window.removeEventListener('dsk-cookie-settings', again);
  }, []);
  if (!open) return null;
  const choose = (v) => { try { localStorage.setItem(KEY, v); } catch { /* private mode: choice lasts for this visit */ } window.__COOKIE = v; setOpen(false); };
  return (
    <div className="ck" role="dialog" aria-label="Cookie notice" aria-live="polite">
      <p><b>Cookies.</b> This website uses only the cookies it needs to work. It does not use advertising or tracking cookies. See our <a href="/privacy-policy">Privacy Policy</a>.</p>
      <div className="ck-btns">
        <button type="button" className="ck-ghost" onClick={() => choose('essential')}>Essential only</button>
        <button type="button" className="ck-main" onClick={() => choose('all')}>Accept all</button>
      </div>
    </div>
  );
}
