import { useEffect, useRef, useState } from 'react';

/** Bar Council of India disclaimer shown on the home page until the visitor accepts (same text as /disclaimer and as the pop-up on dsklegal.com).
 *  Acceptance is remembered in localStorage for 30 days; Decline keeps the page blocked. The cookie banner stays hidden while this is open. */
const KEY = 'dsk_disclaimer';
const DAYS = 30;
const accepted = () => { try { const v = Number(localStorage.getItem(KEY)); return v > 0 && Date.now() - v < DAYS * 864e5; } catch { return false; } };

export default function DisclaimerGate() {
  const [open, setOpen] = useState(() => !accepted());
  const [blocks, setBlocks] = useState(null);
  const [declined, setDeclined] = useState(false);
  const [more, setMore] = useState(true); // more text below the fold
  const ok = useRef(null);
  const body = useRef(null);
  const check = () => { const el = body.current; if (el) setMore(el.scrollTop + el.clientHeight < el.scrollHeight - 8); };

  useEffect(() => { if (open) import('../v2/legalData.js').then((m) => setBlocks(m.LEGAL['/disclaimer'].blocks)); }, [open]);
  useEffect(() => { check(); }, [blocks]);
  useEffect(() => {
    if (!open) return undefined;
    const root = document.documentElement;
    root.dataset.disclaimer = 'open';
    ok.current?.focus();
    return () => { delete root.dataset.disclaimer; };
  }, [open]);

  if (!open) return null;
  const accept = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch { /* private mode: asked again next visit */ } setOpen(false); };
  // keep Tab inside the dialog
  const trap = (e) => {
    if (e.key !== 'Tab') return;
    const f = [...e.currentTarget.querySelectorAll('button, a[href], [tabindex="0"]')];
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  };

  const lead = blocks?.[0]; const list = blocks?.find((b) => b.t === 'ol'); const close = blocks?.[blocks.length - 1];
  return (
    <div className="dg" role="dialog" aria-modal="true" aria-labelledby="dg-title" onKeyDown={trap}>
      <div className="dg-card">
        <header className="dg-head">
          <img src="/logo.png" alt="DSK Legal" />
          <p className="dg-kick">Bar Council of India</p>
          <h2 id="dg-title">Disclaimer</h2>
        </header>
        <div className="dg-scroll">
          <div className="dg-body" tabIndex={0} ref={body} onScroll={check}>
            {lead && <p className="dg-lead" dangerouslySetInnerHTML={{ __html: lead.h }} />}
            {list && <ol>{list.items.map((x, j) => <li key={j} dangerouslySetInnerHTML={{ __html: x }} />)}</ol>}
            {close && close !== lead && <p className="dg-close" dangerouslySetInnerHTML={{ __html: close.h }} />}
          </div>
          {more && <span className="dg-hint" aria-hidden="true">Scroll to read all <i /></span>}
        </div>
        <footer className="dg-foot">
          {declined && <p role="alert">You need to accept the disclaimer to enter the website.</p>}
          <div className="dg-btns">
            <button type="button" className="dg-no" onClick={() => setDeclined(true)}>Decline</button>
            <button type="button" className="dg-yes" ref={ok} onClick={accept}>I accept <b aria-hidden="true">→</b></button>
          </div>
        </footer>
      </div>
    </div>
  );
}
