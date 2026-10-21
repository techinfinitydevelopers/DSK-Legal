import { useEffect, useState } from 'react';
import { CountUp } from '../hooks.jsx';

const SLIDES = ['/img/banner1.jpg', '/img/banner2.jpg'];

export default function Hero({ data }) {
  const [s, setS] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setS((x) => (x + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true">
        {SLIDES.map((src, i) => (
          <div key={src} className={`slide${i === s ? ' on' : ''}`} style={{ backgroundImage: `url(${src})` }} />
        ))}
        <div className="hero-shade" />
      </div>
      <div className="container hero-in">
        <div className="hero-copy">
          <p className="eyebrow light rise" style={{ '--d': '0ms' }}>{data.eyebrow}</p>
          <h1 className="rise" style={{ '--d': '100ms' }}>
            {data.title} <em>{data.accent}</em> {data.titleTail}
          </h1>
          <p className="lead rise" style={{ '--d': '220ms' }}>{data.body}</p>
          <div className="actions rise" style={{ '--d': '340ms' }}>
            <a className="btn btn-red" href="#practice"><span>Explore Practice Areas</span> <i className="arr">→</i></a>
            <a className="btn btn-light" href="#offices">Find Us Here</a>
          </div>
        </div>
        <aside className="glass rise" style={{ '--d': '460ms' }}>
          <dl className="stats">
            {data.stats.map((st) => (
              <div key={st.label}>
                <dt><CountUp value={st.value} /></dt>
                <dd>{st.label}</dd>
              </div>
            ))}
          </dl>
          <div className="pips">
            {SLIDES.map((_, i) => (
              <button key={i} aria-label={`Slide ${i + 1}`} className={i === s ? 'on' : ''} onClick={() => setS(i)} />
            ))}
          </div>
        </aside>
      </div>
      <a href="#about" className="scroll-cue" aria-label="Scroll down"><i /></a>
    </section>
  );
}
