import { useEffect, useState } from 'react';
import { Reveal } from '../hooks.jsx';

export function Values({ items }) {
  return (
    <section className="values" id="about">
      <div className="container">
        <div className="row-head">
          <div>
            <p className="eyebrow">Foundational Tenets</p>
            <h2>Our Values</h2>
          </div>
          <span className="muted-caps">Guiding every engagement</span>
        </div>
        <div className="grid-3">
          {items.map((v, i) => (
            <Reveal as="article" delay={i * 120} className="card value" key={v.n}>
              <span className="num">{v.n}</span>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Profile({ data }) {
  return (
    <section className="profile">
      <div className="container profile-in">
        <figure className="profile-img">
          <div className="zoom"><img src="/img/about.png" alt="Scales of justice" loading="lazy" /></div>
          <figcaption>
            <span>{data.imgCaption}</span>
            <span>{data.imgNote}</span>
          </figcaption>
        </figure>
        <div>
          <p className="eyebrow">{data.eyebrow}</p>
          <h2 className="h2-lg">
            {data.title} <em>{data.accent}</em> {data.titleTail}
          </h2>
          {data.paras.map((p) => (
            <p key={p.slice(0, 20)} className="body">{p}</p>
          ))}
          <a className="link-red" href="#offices">{data.link.toUpperCase()} →</a>
        </div>
      </div>
    </section>
  );
}

export function Recognition({ recognition: r, strengths: s, renderCta }) {
  return (
    <section className="recog">
      <div className="container grid-2">
        <article className="card">
          <p className="eyebrow">▣ {r.eyebrow}</p>
          <blockquote>
            “Ranked as an <u>Outstanding Firm</u> by Asialaw Profiles rankings.”
          </blockquote>
          <cite>{r.source}</cite>
          {renderCta ? renderCta(r.cta) : <a className="btn btn-red btn-sm" href="#awards">{r.cta}</a>}
        </article>
        <article className="card">
          <p className="eyebrow">▣ {s.eyebrow}</p>
          {s.paras.map((p) => (
            <p key={p.slice(0, 20)} className="body">{p}</p>
          ))}
          <a className="link-red" href="#practice">{s.link.toUpperCase()} →</a>
        </article>
      </div>
    </section>
  );
}

export function Testimonials({ items }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [items.length]);
  const t = items[i];
  return (
    <section className="testi">
      <div className="container">
        <p className="eyebrow light">Client Testimonials</p>
        <div className="mark">“</div>
        <blockquote key={i}>“{t.quote}”</blockquote>
        <p className="who">
          <b>{t.who}</b>
          <span>{t.role}</span>
        </p>
        <div className="dots" role="tablist">
          <button aria-label="Previous" onClick={() => setI((i - 1 + items.length) % items.length)}>‹</button>
          {items.map((_, n) => (
            <i key={n} className={n === i ? 'on' : ''} onClick={() => setI(n)} />
          ))}
          <button aria-label="Next" onClick={() => setI((i + 1) % items.length)}>›</button>
        </div>
      </div>
    </section>
  );
}
