import { Reveal } from '../hooks.jsx';

export function Practice({ data }) {
  return (
    <section className="practice" id="practice">
      <div className="container center">
        <p className="eyebrow">{data.eyebrow}</p>
        <h2 className="h2-lg">{data.title}</h2>
        <p className="sub">{data.sub}</p>
        <div className="grid-pa">
          {data.items.map((name, n) => (
            <Reveal as="a" delay={(n % 6) * 60} href="#practice" className="pa" key={name}>
              <span className="pa-n">{String(n + 1).padStart(2, '0')}</span>
              <h3>{name}</h3>
              <span className="pa-more">READ MORE <i>→</i></span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Awards({ data }) {
  return (
    <section className="awards" id="awards">
      <div className="container center">
        <p className="eyebrow">{data.eyebrow}</p>
        <h2 className="h2-lg">{data.title}</h2>
        <div className="logos">
          {data.logos.map((l, n) => (
            <Reveal key={l} delay={n * 70} className="logo-tile"><img src={`/img/${l}`} alt={`Award ${n + 1}`} loading="lazy" /></Reveal>
          ))}
        </div>
        <div className="marquee" aria-label="Rankings">
          <div className="track">
            {[...data.ranks, ...data.ranks].map((r, i) => <span key={i}>◆ {r}</span>)}
          </div>
        </div>
        <a className="btn btn-outline btn-sm" href="#awards">{data.cta}</a>
      </div>
    </section>
  );
}

export function Knowledge({ data }) {
  return (
    <section className="knowledge" id="knowledge">
      <div className="container">
        <div className="row-head">
          <div>
            <p className="eyebrow">{data.eyebrow}</p>
            <h2 className="h2-lg">{data.title}</h2>
          </div>
          <p className="sub right">{data.sub}</p>
        </div>
        <div className="grid-2">
          {data.cards.map((c) => (
            <Reveal as="article" className="card lift" key={c.title}>
              <p className="eyebrow">✉ {c.tag}</p>
              <h3 className="h3-lg">{c.title}</h3>
              <p className="body">{c.text}</p>
              <a className="link-red" href="#knowledge">{c.cta.toUpperCase()} →</a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Offices({ data }) {
  return (
    <section className="offices" id="offices">
      <div className="container center">
        <p className="eyebrow">{data.eyebrow}</p>
        <h2 className="h2-lg">{data.title}</h2>
        <p className="sub">{data.sub}</p>
        <div className="grid-off">
          {data.cities.map((c, n) => (
            <Reveal as="figure" delay={n * 70} key={c.city}>
              <div className="zoom"><img src={`/img/${c.img}`} alt={`${c.city} office`} loading="lazy" /></div>
              <figcaption>
                <b>{c.city}</b>
                <span>{c.note}</span>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
