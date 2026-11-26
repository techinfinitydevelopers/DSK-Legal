import { useEffect, useRef, useState } from 'react';

/** Floating assistant on the public site. It talks to /api/chat, which answers from the site's own content (see server/cms/chat). */
const KEY = 'dsk_chat_v1';
const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || null; } catch { return null; } };
const save = (v) => { try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode */ } };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Icon = ({ n }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {n === 'chat' && <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 21 12z" />}
    {n === 'x' && <path d="M6 6l12 12M18 6L6 18" />}
    {n === 'send' && <path d="M4 12l16-8-6 16-3-7-7-1z" />}
  </svg>
);

export default function ChatWidget() {
  const [cfg, setCfg] = useState(null);
  const [open, setOpen] = useState(false);
  const saved = useRef(load());
  const [msgs, setMsgs] = useState(saved.current?.msgs || []);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [lead, setLead] = useState(null); // { name, email, message, state }
  const end = useRef(null); const input = useRef(null);

  useEffect(() => {
    fetch('/api/chat/config').then((r) => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null)).then((c) => { if (c?.enabled) { setCfg(c); document.documentElement.setAttribute('data-chat', 'on'); } }).catch(() => {});
    return () => document.documentElement.removeAttribute('data-chat');
  }, []);
  useEffect(() => { if (cfg && !msgs.length) setMsgs([{ role: 'bot', text: cfg.welcome, chips: cfg.suggestions }]); }, [cfg]); // eslint-disable-line
  useEffect(() => { save({ msgs: msgs.slice(-30) }); end.current?.scrollIntoView({ block: 'end' }); }, [msgs, busy, lead]);
  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 80); }, [open]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') setOpen(false); }; if (open) { window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); } return undefined; }, [open]);
  if (!cfg) return null;

  const ask = async (q) => {
    q = (q || '').trim(); if (!q || busy) return;
    setText(''); setLead(null);
    setMsgs((m) => [...m.map((x) => ({ ...x, chips: undefined })), { role: 'user', text: q }]); setBusy(true);
    const t0 = Date.now();
    let r;
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q }) });
      const j = await res.json().catch(() => ({}));
      r = res.ok ? j : { reply: j.error || 'Sorry, something went wrong. Please try again.', links: [], found: true };
    } catch { r = { reply: 'I can’t reach the assistant right now. Please try again, or use the Contact page.', links: [{ title: 'Contact us', url: '/contact' }], found: true }; }
    await new Promise((ok) => setTimeout(ok, Math.max(0, 500 - (Date.now() - t0)))); // a short beat so the reply does not flash in
    setBusy(false);
    setMsgs((m) => [...m, { role: 'bot', text: r.reply, links: r.links, chips: r.found === false ? ['Our practice areas', 'Contact details'] : undefined, ask: r.found === false ? q : undefined }]);
  };

  const sendLead = async (e) => {
    e.preventDefault();
    if (!lead.name.trim() || !EMAIL.test(lead.email) || !lead.message.trim()) { setLead({ ...lead, state: 'bad' }); return; }
    setLead({ ...lead, state: 'sending' });
    try {
      const r = await fetch('/api/forms/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { name: lead.name.trim(), email: lead.email.trim(), message: lead.message.trim(), topic: 'Chat assistant' }, website: '' }) });
      if (!r.ok) throw new Error();
      setLead(null); setMsgs((m) => [...m.map((x) => ({ ...x, ask: undefined })), { role: 'bot', text: 'Thank you. Your message has been sent to our team, and someone will get back to you by email.' }]);
    } catch { setLead({ ...lead, state: 'err' }); }
  };

  return (
    <div className="cbw">
      {!open && <button type="button" className="cbw-launch" onClick={() => setOpen(true)} aria-label={`Open ${cfg.title}`}><Icon n="chat" /><span>Ask us</span></button>}
      {open && (
        <section className="cbw-panel" role="dialog" aria-label={cfg.title} aria-modal="false">
          <header className="cbw-head">
            <span className="cbw-av" aria-hidden="true">D</span>
            <span className="cbw-ttl"><b>{cfg.title}</b><small>Answers from our website</small></span>
            <button type="button" className="cbw-x" onClick={() => setOpen(false)} aria-label="Close chat"><Icon n="x" /></button>
          </header>
          <div className="cbw-log" role="log" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`cbw-row ${m.role}`}>
                <div className="cbw-msg">
                  {String(m.text).split('\n').map((l, j) => <p key={j}>{l}</p>)}
                  {m.links?.length > 0 && <div className="cbw-links">{m.links.map((l) => <a key={l.url} href={l.url}>{l.title} <span aria-hidden="true">→</span></a>)}</div>}
                  {m.ask && !lead && <button type="button" className="cbw-cta" onClick={() => setLead({ name: '', email: '', message: m.ask, state: '' })}>Leave a message for our team</button>}
                </div>
                {m.chips?.length > 0 && <div className="cbw-chips">{m.chips.map((c) => <button type="button" key={c} onClick={() => ask(c)}>{c}</button>)}</div>}
              </div>
            ))}
            {busy && <div className="cbw-row bot"><div className="cbw-msg cbw-typing" aria-label="Typing"><i /><i /><i /></div></div>}
            {lead && (
              <form className="cbw-lead" onSubmit={sendLead} noValidate>
                <label>Your name<input value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value, state: '' })} autoComplete="name" /></label>
                <label>Email<input type="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value, state: '' })} autoComplete="email" /></label>
                <label>Message<textarea rows={3} value={lead.message} onChange={(e) => setLead({ ...lead, message: e.target.value, state: '' })} /></label>
                {lead.state === 'bad' && <small className="cbw-err" role="alert">Please enter your name, a valid email and a message.</small>}
                {lead.state === 'err' && <small className="cbw-err" role="alert">Could not send. Please try again or use the Contact page.</small>}
                <div><button type="submit" disabled={lead.state === 'sending'}>{lead.state === 'sending' ? 'Sending…' : 'Send to our team'}</button><button type="button" className="ghost" onClick={() => setLead(null)}>Cancel</button></div>
              </form>
            )}
            <div ref={end} />
          </div>
          <form className="cbw-in" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
            <input ref={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your question…" maxLength={300} aria-label="Your question" autoComplete="off" />
            <button type="submit" disabled={!text.trim() || busy} aria-label="Send"><Icon n="send" /></button>
          </form>
          {cfg.disclaimer && <p className="cbw-note">{cfg.disclaimer}</p>}
        </section>
      )}
    </div>
  );
}
