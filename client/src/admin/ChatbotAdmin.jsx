import { useEffect, useState } from 'react';
import { Icon, Field, Input, Text, Lines, when } from './ui.jsx';

/* Chatbot tab. The bot runs on this server and answers only from the site's own content plus the entries written here.
   Tabs: Settings · Knowledge base (hand-written answers) · Test the bot · Unanswered questions. */

const key = () => Math.random().toString(36).slice(2, 9);
const tag = (items) => items.map((x) => ({ ...x, _k: key() }));
const strip = (items) => items.map(({ _k, ...x }) => x);
const KIND = { practice: 'Practice areas', service: 'Practice services', person: 'Team profiles', page: 'Page wording (About, Careers…)', faq: 'FAQs', kb: 'Knowledge-base entries', post: 'Knowledge posts', job: 'Open jobs', sectors: 'Sectors list', 'practice-list': 'Practice list', contact: 'Offices and contact', 'careers-nav': 'Careers links', 'awards-nav': 'Awards' };

export function ChatbotAdmin({ api, toast, has }) {
  const [tab, setTab] = useState('settings');
  const [d, setD] = useState(null); const [cfg, setCfg] = useState(null); const [kb, setKb] = useState(null);
  const [dirty, setDirty] = useState({ cfg: false, kb: false }); const [busy, setBusy] = useState(false);
  const ro = !has('content');
  const load = () => api('GET', '/chatbot').then((r) => { setD(r); setCfg(r.config); }).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); api('GET', '/chatbot/kb').then((r) => setKb(tag(r.items))).catch((e) => toast(e.message, 'err')); }, []); // eslint-disable-line
  useEffect(() => {
    if (!dirty.cfg && !dirty.kb) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
  if (!d || !cfg || !kb) return <p>Loading…</p>;

  const setC = (k) => (v) => { setCfg((c) => ({ ...c, [k]: v })); setDirty((x) => ({ ...x, cfg: true })); };
  const saveCfg = async (e) => { e?.preventDefault(); setBusy(true); try { setCfg(await api('PUT', '/chatbot', cfg)); setDirty((x) => ({ ...x, cfg: false })); toast('Chatbot settings saved — live on the site'); } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); } };
  const saveKb = async (e) => { e?.preventDefault(); setBusy(true); try { const r = await api('PUT', '/chatbot/kb', { items: strip(kb) }); setKb(tag(r.items)); setDirty((x) => ({ ...x, kb: false })); toast('Knowledge base saved — the bot uses it straight away'); load(); } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); } };
  const addEntry = (title = '') => { setKb((a) => [...a, { _k: key(), id: '', title, text: '', link: '', published: true }]); setDirty((x) => ({ ...x, kb: true })); setTab('kb'); };
  const upd = (k, p) => { setKb((a) => a.map((y) => (y._k === k ? { ...y, ...p } : y))); setDirty((x) => ({ ...x, kb: true })); };
  const sm = d.summary;

  return (
    <>
      <div className="cm-head"><h1>Chatbot</h1><a className="cm-btn ghost" href="/" target="_blank" rel="noreferrer">View site <Icon n="ext" /></a></div>
      <p className="cm-muted">A site assistant that answers visitors’ questions from your own content: practice areas, services, team profiles, offices, careers, FAQs and the entries you add here. It runs on this server, uses no outside AI service and never gives legal advice.</p>
      <div className="cm-tabs">{[['settings', 'Settings'], ['kb', `Knowledge base${dirty.kb ? ' •' : ''}`], ['test', 'Test the bot'], ['unanswered', 'Unanswered questions']].map(([k, l]) => <button type="button" key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>

      {tab === 'settings' && (
        <form onSubmit={saveCfg} className="cm-cols">
          <div className="cm-main">
            <section className="cm-box"><h2>Chat window</h2>
              <label className="cm-pub"><input type="checkbox" checked={!!cfg.enabled} onChange={(e) => setC('enabled')(e.target.checked)} disabled={ro} /> Show the chat button on the website</label>
              <Field label="Title"><Input v={cfg.title} set={setC('title')} disabled={ro} /></Field>
              <Field label="Welcome message"><Text v={cfg.welcome} set={setC('welcome')} rows={3} disabled={ro} /></Field>
              <Field label="Suggested questions" hint="One per line, up to 6. Shown as buttons under the welcome message."><Lines v={cfg.suggestions} set={setC('suggestions')} rows={5} /></Field>
              <Field label="Notice at the bottom of the chat" hint="Keep it clear that the assistant does not give legal advice."><Text v={cfg.disclaimer} set={setC('disclaimer')} rows={3} disabled={ro} /></Field>
            </section>
            <section className="cm-box"><h2>Privacy</h2>
              <label className="cm-pub"><input type="checkbox" checked={!!cfg.logging} onChange={(e) => setC('logging')(e.target.checked)} disabled={ro} /> Remember the questions visitors ask (text only, no names or IP addresses)</label>
              <p className="cm-muted">This is what fills “Unanswered questions”, so you can see what the bot could not answer and add it to the knowledge base. Answers are not stored.</p>
            </section>
          </div>
          <aside className="cm-side">
            {!ro && <section className="cm-box"><button className="cm-btn primary" disabled={busy || !dirty.cfg}>{busy ? 'Saving…' : dirty.cfg ? 'Save settings' : 'Saved'}</button></section>}
            <section className="cm-box"><h2>This week</h2>
              <p className="cm-muted">{sm.week} questions asked{sm.week ? ` · ${Math.round((sm.answeredWeek / sm.week) * 100)}% answered` : ''}</p>
              <h2>What the bot knows</h2>
              <ul className="cm-feed">{Object.entries(d.stats.by).sort((a, b) => b[1] - a[1]).map(([k, n]) => <li key={k}><span>{KIND[k] || k}</span><small>{n}</small></li>)}</ul>
              <p className="cm-muted">{d.stats.total} passages in total. Edits to pages, practice areas, team, FAQs and Page content are picked up automatically within a minute.</p>
            </section>
          </aside>
        </form>
      )}

      {tab === 'kb' && (
        <form onSubmit={saveKb} className="cm-cols">
          <div className="cm-main"><section className="cm-box">
            <p className="cm-muted">Write answers for things the website does not say, for example the firm’s founder, working hours or how to book a meeting. Each entry has a title (what visitors might ask), the answer, and an optional page to link to. These answers are preferred over the automatic content.</p>
            {!kb.length && <p className="cm-muted">No entries yet.</p>}
            <div className="cm-faq-list">
              {kb.map((x, i) => (
                <div className="cm-faq open" key={x._k}>
                  <div className="cm-faq-top"><span className="cm-ff-n">{i + 1}</span><span className="cm-faq-q">{x.title || <i>New entry</i>}</span>{x.published === false && <span className="cm-pill off">Hidden</span>}
                    {!ro && <div className="cm-mi-acts"><button type="button" className="cm-ico" aria-label="Delete entry" title="Delete" onClick={() => { if (window.confirm(`Delete “${x.title || 'this entry'}”?`)) { setKb((a) => a.filter((y) => y._k !== x._k)); setDirty((z) => ({ ...z, kb: true })); } }}><Icon n="x" /></button></div>}</div>
                  <fieldset className="cm-faq-body" disabled={ro}>
                    <Field label="Question or topic"><Input v={x.title} set={(v) => upd(x._k, { title: v })} placeholder="e.g. Who founded DSK Legal?" /></Field>
                    <Field label="Answer"><Text v={x.text} set={(v) => upd(x._k, { text: v })} rows={4} /></Field>
                    <div className="cm-ff-two">
                      <Field label="Link (optional)" hint="A page on the site, like /about, or a full address."><Input v={x.link} set={(v) => upd(x._k, { link: v })} placeholder="/about" /></Field>
                      <label className="cm-pub cm-faq-pub"><input type="checkbox" checked={x.published !== false} onChange={(e) => upd(x._k, { published: e.target.checked })} /> Use this answer</label>
                    </div>
                  </fieldset>
                </div>
              ))}
            </div>
            {!ro && <button type="button" className="cm-btn" onClick={() => addEntry()}><Icon n="plus" /> Add entry</button>}
          </section></div>
          <aside className="cm-side">{!ro && <section className="cm-box"><button className="cm-btn primary" disabled={busy || !dirty.kb}>{busy ? 'Saving…' : dirty.kb ? 'Save knowledge base' : 'Saved'}</button><p className="cm-muted">{kb.length} entries.</p></section>}</aside>
        </form>
      )}

      {tab === 'test' && <Tester api={api} toast={toast} onAdd={(q) => addEntry(q)} />}
      {tab === 'unanswered' && <Unanswered api={api} toast={toast} ro={ro} onAdd={(q) => addEntry(q)} />}
    </>
  );
}

function Tester({ api, toast, onAdd }) {
  const [q, setQ] = useState(''); const [r, setR] = useState(null); const [busy, setBusy] = useState(false);
  const go = async (e) => { e.preventDefault(); if (!q.trim()) return; setBusy(true); try { setR(await api('POST', '/chatbot/test', { q })); } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); } };
  return (
    <section className="cm-box">
      <form onSubmit={go} className="cm-faq-tools"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask the bot a question, as a visitor would" aria-label="Question" maxLength={300} /><button className="cm-btn primary" disabled={busy || !q.trim()}>{busy ? 'Asking…' : 'Ask'}</button></form>
      {r && (
        <>
          <h2>Answer {r.answer.found ? '' : <span className="cm-pill draft">Not answered</span>}</h2>
          <p style={{ whiteSpace: 'pre-line' }}>{r.answer.reply}</p>
          {r.answer.links?.length > 0 && <p className="cm-muted">Links: {r.answer.links.map((l) => `${l.title} (${l.url})`).join(' · ')}</p>}
          {!r.answer.found && <button type="button" className="cm-btn" onClick={() => onAdd(q)}><Icon n="plus" /> Write an answer for this</button>}
          <h2 style={{ marginTop: 18 }}>Best matches</h2>
          <div className="cm-tablewrap"><table className="cm-table"><thead><tr><th>Source</th><th>Passage</th><th>Score</th></tr></thead>
            <tbody>{r.hits.map((h, i) => <tr key={i}><td className="nw">{KIND[h.kind] || h.kind}<br /><small className="cm-muted">{h.title}</small></td><td className="wrap">{h.text}{h.text.length >= 220 ? '…' : ''}</td><td className="nw">{h.score}<br /><small className="cm-muted">cover {Math.round(h.coverage * 100)}%</small></td></tr>)}</tbody></table></div>
        </>
      )}
    </section>
  );
}

function Unanswered({ api, toast, ro, onAdd }) {
  const [rows, setRows] = useState(null);
  const load = () => api('GET', '/chatbot/unanswered').then((r) => setRows(r.items)).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []); // eslint-disable-line
  const clear = async () => { if (!window.confirm('Clear the list of unanswered questions?')) return; try { await api('DELETE', '/chatbot/unanswered'); load(); } catch (x) { toast(x.message, 'err'); } };
  return (
    <section className="cm-box">
      <p className="cm-muted">Questions visitors asked that the bot could not answer from the site, most asked first. Write an answer for the useful ones.</p>
      {!rows ? <p>Loading…</p> : !rows.length ? <p className="cm-muted">Nothing here. Either every question was answered, or no one has asked yet (or question history is turned off in Settings).</p> : (
        <div className="cm-tablewrap"><table className="cm-table"><thead><tr><th>Question</th><th>Asked</th><th>Last</th><th /></tr></thead>
          <tbody>{rows.map((x) => <tr key={x.q}><td className="wrap">{x.q}</td><td className="nw">{x.count}×</td><td className="nw">{when(x.last)}</td><td>{!ro && <button type="button" className="cm-btn" onClick={() => onAdd(x.q)}>Write answer</button>}</td></tr>)}</tbody></table></div>
      )}
      {!ro && rows?.length > 0 && <button type="button" className="cm-btn ghost" onClick={clear}>Clear list</button>}
    </section>
  );
}
