import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CountUp, Reveal } from '../hooks.jsx';
import { Spotlight, Magnetic } from '../v2/fx.jsx';
import { Typewriter } from '../v2/Typewriter.jsx';
import { CATS, PRACTICE } from '../v2/practiceMeta.js';
import { Mark, ScrollMark } from '../v2/Mark.jsx';

export const SLIDES = [
  '/img/banner1.jpg', '/img/banner2.jpg', '/img/banner3.webp', '/img/banner4.webp', '/img/banner5.jpg',
  '/img/banner6.webp', '/img/banner7.jpg', '/img/banner8.jpg', '/img/banner9.jpg', '/img/banner10.jpg',
];
const DWELL = 6500;

// v3: each slide carries its own copy (slide 1 = data.hero). Text comes from DSK Legal's own site content.
const SLIDE_COPY = [
  null,
  { eyebrow: 'Our Values', title: 'True Value,', accent: 'True Values', tail: 'in everything we do.', body: 'Excellence in execution, fairness and integrity, and helping our people reach their professional aspirations: the commitments behind every mandate.', cta: ['Our Values', '#about'] },
  { eyebrow: 'Full-Service Law Firm', title: 'Solution-oriented,', accent: 'globally minded', tail: 'lawyers.', body: 'Proactive, pragmatic and innovative legal advice that helps clients tackle the complex legal and regulatory regimes of India.', cta: ['Firm Profile', '#about'] },
  { eyebrow: 'Our People', title: '300+ fee-earners.', accent: '74 partners.', tail: 'One firm.', body: 'A multi-disciplinary team of partners and associate partners working as one across India and the UAE.', cta: ['Meet the Team', '#about'] },
  { eyebrow: 'Thought Leadership', title: 'Insight that keeps you', accent: 'ahead', tail: 'of change.', body: 'Monthly newsletters and practice-area briefings on legislative amendments, Supreme Court rulings and regulatory updates.', cta: ['Knowledge Centre', '#knowledge'] },
  { eyebrow: 'Independent Industry Endorsement', title: 'Consistently ranked', accent: 'top tier', tail: 'by the leading guides.', body: 'Recognised by Chambers & Partners, Legal500 Asia-Pacific, IFLR1000, Asialaw Profiles and ALB.', cta: ['Awards & Rankings', 'AWARDS'] },
  { eyebrow: 'Multidisciplinary Capabilities', title: '14 practice areas.', accent: 'One', tail: 'trusted counsel.', body: 'From Banking & Finance and Corporate & Securities to Dispute Resolution, Real Estate, Technology and White Collar Crime.', cta: ['Explore Practice Areas', '#practice'] },
  { eyebrow: 'Client Feedback', title: 'Extremely client focused,', accent: 'quick', tail: 'turnaround.', body: 'Clients and the legal guides value our prompt responsiveness, technical ability and practical approach.', cta: ['Read Testimonials', '#testimonials'] },
  { eyebrow: 'Strategic Locations', title: 'Mumbai to', accent: 'Dubai,', tail: 'wherever you do business.', body: 'Offices in Mumbai, New Delhi, Bengaluru, Pune, Chennai, Dubai and Abu Dhabi: key commercial and regulatory centres.', cta: ['Find Us Here', '#offices'] },
  { eyebrow: 'Talk to Us', title: 'Clarity for your', accent: 'next', tail: 'strategic decision.', body: 'Speak with a DSK Legal partner about your matter in India or the UAE.', cta: ['Contact Us', '#footer'] },
];
const CITIES = ['Mumbai', 'New Delhi', 'Bengaluru', 'Pune', 'Chennai', 'Dubai'];

export function Hero2({ data }) {
  // v3: the preloader's heading morphs into this h1's first line; wait for it, then type the rest
  const [heroReady, setHeroReady] = useState(() => ({ ready: !window.__dskMorphPending, morphed: false }));
  useEffect(() => {
    if (heroReady.ready) return;
    const on = (e) => setHeroReady({ ready: true, morphed: !!e.detail?.morphed });
    window.addEventListener('dsk:morph-done', on);
    return () => window.removeEventListener('dsk:morph-done', on);
  }, [heroReady.ready]);
  const [s, setS] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = SLIDES.length;
  const moved = useRef(false); // after the first slide change, headings re-type without the preloader morph
  const go = (i) => { moved.current = true; setS(i); };
  const c = SLIDE_COPY[s] || { eyebrow: data.eyebrow, title: data.title, accent: data.accent, tail: data.titleTail, body: data.body, cta: ['Explore Practice Areas', '#practice'] };
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => { moved.current = true; setS((x) => (x + 1) % n); }, DWELL);
    return () => clearTimeout(t);
  }, [s, paused, n]);

  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    const st = e.currentTarget.style;
    st.setProperty('--mx', `${e.clientX - r.left}px`);
    st.setProperty('--my', `${e.clientY - r.top}px`);
    st.setProperty('--px', x.toFixed(3));
    st.setProperty('--py', y.toFixed(3));
  };

  return (
    <section className="x-hero" onMouseMove={move} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="x-slides" aria-hidden="true">
        {SLIDES.map((src, i) => (
          <div key={src} className={`x-slide${i === s ? ' on' : ''}`} style={{ backgroundImage: `url(${src})` }} />
        ))}
      </div>
      <div className="x-hero-shade" />
      <div className="x-hero-glow" />

      <div className="container x-hero-in">
        <div className="x-hero-copy" key={s}>
          <p className={`x-eyebrow x-fade${moved.current ? ' x-quick' : ''}`}><i /> {c.eyebrow}</p>
          <Typewriter
            as="h1"
            delay={moved.current ? 0.1 : heroReady.morphed ? 0.15 : 0.5}
            threshold={0.2}
            active={heroReady.ready}
            preset={!moved.current && heroReady.morphed ? data.title.replace(/\s/g, '').length : 0}
            parts={[{ text: c.title }, { text: c.accent, className: 'x-accent' }, { text: c.tail }]}
          />
          <p className={`x-lead x-fade${moved.current ? ' x-quick' : ''}`} style={{ animationDelay: moved.current ? '250ms' : '900ms' }}>{c.body}</p>
          <div className={`x-cta x-fade${moved.current ? ' x-quick' : ''}`} style={{ animationDelay: moved.current ? '400ms' : '1050ms' }}>
            <Magnetic><a className="x-btn x-btn-red" href={c.cta[1] === 'AWARDS' ? '/v3/awards' : c.cta[1]}>{c.cta[0]} <b>→</b></a></Magnetic>
            <Magnetic><a className="x-btn x-btn-line" href="#offices">Find Us Here</a></Magnetic>
          </div>
        </div>

        <aside className="x-stat-card x-fade" style={{ animationDelay: '1200ms' }}>
          <p className="x-stat-title">DSK Legal at a glance</p>
          <dl>
            {data.stats.map((st) => (
              <div key={st.label}>
                <dt><CountUp value={st.value} /></dt>
                <dd>{st.label}</dd>
              </div>
            ))}
          </dl>
          <p className="x-cities">{CITIES.join(' · ')}</p>
        </aside>
      </div>

      <div className="container x-rail x-fade" style={{ animationDelay: '1350ms' }}>
        <div className="x-count">
          <b key={s}>{String(s + 1).padStart(2, '0')}</b>
          <span>/ {String(n).padStart(2, '0')}</span>
        </div>
        <div className="x-thumbs" role="tablist">
          {SLIDES.map((src, i) => (
            <button key={src} role="tab" aria-selected={i === s} aria-label={`Slide ${i + 1}`} className={i === s ? 'on' : ''} onClick={() => go(i)}>
              <img src={src} alt="" loading="lazy" />
              {i === s && <i key={`${s}-${paused}`} style={{ animationDuration: `${DWELL}ms`, animationPlayState: paused ? 'paused' : 'running' }} />}
            </button>
          ))}
        </div>
        <div className="x-nav">
          <button aria-label="Previous" onClick={() => go((s - 1 + n) % n)}>←</button>
          <button aria-label="Next" onClick={() => go((s + 1) % n)}>→</button>
        </div>
      </div>
    </section>
  );
}

export function Values2({ items }) {
  return (
    <section className="x-sec x-values" id="about">
      <ScrollMark className="x-values-mk" />
      <div className="container">
        <Reveal className="x-head">
          <p className="x-kicker">Foundational Tenets</p>
          <Typewriter text="Our Values" />
        </Reveal>
        <div className="x-grid3">
          {items.map((v, i) => (
            <Reveal key={v.n} delay={i * 120}>
              <Spotlight className="x-card">
                <span className="x-num">{v.n}</span>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Profile2({ data }) {
  return (
    <section className="x-sec x-profile">
      <div className="container x-profile-in">
        <Reveal className="x-pimg">
          <img src="/img/about.png" alt="Scales of justice" loading="lazy" />
          <span className="x-badge"><b>2001</b> Est.</span>
        </Reveal>
        <Reveal delay={150}>
          <p className="x-kicker">{data.eyebrow}</p>
          <Typewriter parts={[{ text: data.title }, { text: data.accent, as: 'em' }, { text: data.titleTail }]} />
          {data.paras.map((p) => <p key={p.slice(0, 18)} className="x-p">{p}</p>)}
          <a className="x-link" href="#offices">{data.link} <b>→</b></a>
        </Reveal>
      </div>
    </section>
  );
}

export function Practice2({ data }) {
  const [cat, setCat] = useState('All');
  // sliding pill behind the active filter: measured from the active chip, re-measured on resize/font load
  const chipsRef = useRef(null);
  const [ind, setInd] = useState(null);
  useLayoutEffect(() => {
    const wrap = chipsRef.current;
    if (!wrap) return;
    const place = () => {
      const b = wrap.querySelector('button.on');
      if (b) setInd({ x: b.offsetLeft, y: b.offsetTop, w: b.offsetWidth, h: b.offsetHeight });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(wrap);
    document.fonts?.ready.then(place);
    return () => ro.disconnect();
  }, [cat]);
  const all = data.items.map((name, i) => ({ name, i, ...(PRACTICE[name] || { cat: 'Advisory', desc: '' }) }));
  const list = all.filter((x) => cat === 'All' || x.cat === cat);
  const [active, setActive] = useState(all[0].name);
  const cur = list.find((x) => x.name === active) || list[0];

  return (
    <section className="x-sec x-practice" id="practice">
      <div className="container">
        <Reveal className="x-head x-center">
          <p className="x-kicker">{data.eyebrow}</p>
          <Typewriter text={data.title} />
          <p className="x-sub">{data.sub}</p>
        </Reveal>

        <Reveal className="x-chips" role="tablist" aria-label="Filter practice areas">
          <div className="x-chips-in" ref={chipsRef}>
            <span
              className="x-chip-ind"
              aria-hidden="true"
              style={ind ? { transform: `translate(${ind.x}px, ${ind.y}px)`, width: ind.w, height: ind.h } : { opacity: 0 }}
            />
            {CATS.map((c) => (
              <button key={c} role="tab" aria-selected={c === cat} className={c === cat ? 'on' : ''} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="x-pa">
          <ul className="x-palist">
            {list.map((x, n) => (
              <li key={x.name} style={{ animationDelay: `${n * 40}ms` }}>
                <button
                  className={x.name === cur.name ? 'on' : ''}
                  onMouseEnter={() => setActive(x.name)}
                  onFocus={() => setActive(x.name)}
                  onClick={() => setActive(x.name)}
                >
                  <span className="x-pn">{String(x.i + 1).padStart(2, '0')}</span>
                  <span className="x-pname">{x.name}</span>
                  <span className="x-parr">→</span>
                </button>
                {x.name === cur.name && (
                  <div className="x-pa-inline">
                    <p>{x.desc}</p>
                    <a className="x-link" href="#practice">Explore Practice <b>→</b></a>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <Spotlight as="aside" className="x-papanel">
            <div key={`bg-${cur.name}`} className="x-pabg" style={{ backgroundImage: `url(${SLIDES[cur.i % SLIDES.length]})` }} />
            <div className="x-pashade" />
            <span key={`n-${cur.name}`} className="x-pabig">{String(cur.i + 1).padStart(2, '0')}</span>
            <div key={cur.name} className="x-pabody">
              <span className="x-patag">{cur.cat}</span>
              <h3>{cur.name}</h3>
              <p>{cur.desc}</p>
              <Magnetic><a className="x-btn x-btn-red" href="#practice">Explore Practice <b>→</b></a></Magnetic>
            </div>
          </Spotlight>
        </div>
      </div>
    </section>
  );
}

export function Testimonials2({ items }) {
  const half = Math.ceil(items.length / 2);
  const rows = [items.slice(0, half), items.slice(half)];
  return (
    <section className="x-testi" id="testimonials">
      <div className="container x-head x-center">
        <p className="x-kicker light">Client Testimonials</p>
        <Typewriter text="What clients and guides say" />
      </div>
      {rows.map((list, r) => (
        <div key={r} className={`x-mrow${r ? ' rev' : ''}`}>
          <div className="x-mtrack" style={{ animationDuration: `${list.length * 9}s` }}>
            {[...list, ...list].map((t, i) => (
              <figure className="x-tcard" key={i} aria-hidden={i >= list.length}>
                <blockquote title={t.quote}>“{t.quote}”</blockquote>
                <figcaption><b>{t.who}</b><span>{t.role}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export function Awards2({ data }) {
  const logos = [...data.logos, ...data.logos];
  return (
    <section className="x-sec x-awards" id="awards">
      <div className="container">
        <Reveal className="x-head x-center">
          <p className="x-kicker">{data.eyebrow}</p>
          <Typewriter text={data.title} />
        </Reveal>
      </div>
      <div className="x-logos" aria-label="Awards and rankings">
        <div className="x-logos-track">
          {logos.map((l, n) => (
            <div className="x-logo" key={n} aria-hidden={n >= data.logos.length}>
              <img src={`/img/${l}`} alt={n < data.logos.length ? `Award ${n + 1}` : ''} decoding="async" />
            </div>
          ))}
        </div>
      </div>
      <Reveal className="x-rk-min">
        <Magnetic><a className="x-btn x-btn-dark" href="/v3/awards">{data.cta} <b>→</b></a></Magnetic>
      </Reveal>
      <div className="x-ranks">
        <div className="x-rtrack">
          {[...data.ranks, ...data.ranks, ...data.ranks].map((r, i) => <span key={i}><Mark instant loop className="mk-sm" />{r}</span>)}
        </div>
      </div>
    </section>
  );
}

export function Offices2({ data }) {
  const [on, setOn] = useState(0);
  return (
    <section className="x-sec x-offices" id="offices">
      <div className="container">
        <Reveal className="x-head x-center">
          <p className="x-kicker">{data.eyebrow}</p>
          <Typewriter text={data.title} />
          <p className="x-sub">{data.sub}</p>
        </Reveal>
        <Reveal className="x-acc">
          {data.cities.map((c, n) => (
            <button
              key={c.city}
              className={`x-off${n === on ? ' on' : ''}`}
              onMouseEnter={() => setOn(n)}
              onFocus={() => setOn(n)}
              onClick={() => setOn(n)}
            >
              <img src={`/img/${c.img}`} alt={`${c.city} office`} loading="lazy" />
              <span className="x-olabel"><b>{c.city}</b><i>{c.note}</i></span>
            </button>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

const KNOW_IMG = ['/img/banner4.webp', '/img/banner7.jpg'];
const KNOW_PILLS = ['Monthly digest', 'Practice-wise briefings', 'Free to subscribe'];

export function Knowledge2({ data }) {
  return (
    <section className="x-sec x-know" id="knowledge">
      <div className="container x-know-in">
        <Reveal className="x-know-intro">
          <p className="x-kicker">{data.eyebrow}</p>
          <Typewriter text={data.title} />
          <p className="x-sub left">{data.sub}</p>
          <ul className="x-pills">
            {KNOW_PILLS.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </Reveal>

        <div className="x-know-cards">
          {data.cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 130}>
              <Spotlight as="a" href="#knowledge" className="x-kcard2">
                <div className="x-kbg" style={{ backgroundImage: `url(${KNOW_IMG[i % KNOW_IMG.length]})` }} />
                <span className="x-kidx">{String(i + 1).padStart(2, '0')}</span>
                <div className="x-kbody">
                  <span className="x-ktag">{c.tag}</span>
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                  <span className="x-kcta">{c.cta}</span>
                </div>
                <span className="x-kgo" aria-hidden="true">↗</span>
              </Spotlight>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="x-band">
      <Mark className="x-band-mk" />
      <div className="container x-band-in">
        <Typewriter parts={[{ text: 'Have a complex mandate?' }, { text: 'Let’s talk.', as: 'em' }]} />
        <Magnetic><a className="x-btn x-btn-red" href="mailto:Contactus@dsklegal.com">Contact Us <b>→</b></a></Magnetic>
      </div>
    </section>
  );
}
