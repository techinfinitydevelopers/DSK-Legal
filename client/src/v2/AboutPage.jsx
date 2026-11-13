import { useEffect, useState } from 'react';
import { seoTitle } from '../seo.js';
import Header4 from '../v4/Header4.jsx';
import Footer from '../components/Footer.jsx';
import { Loader } from './Mark.jsx';
import { CtaBand } from './Sections2.jsx';
import { Reveal, CountUp } from '../hooks.jsx';
import { Spotlight, Magnetic } from './fx.jsx';
import { Typewriter } from './Typewriter.jsx';

/** /about — copy from dsklegal.com/about-us; layout follows the home page (dark hero, kicker + typewriter heads, spotlight cards, CTA band). */
const STATS = [
  { v: '2001', l: 'Established in India' },
  { v: '300+', l: 'Fee-earners' },
  { v: '74', l: 'Partners & associate partners' },
  { v: '6', l: 'Offices, incl. UAE (2025)' },
];

const PILLARS = [
  { n: '01', title: 'Enduring client relationships', text: 'We believe in establishing strong and enduring relationships with our clients by ensuring that we are always available to attend to their needs. It is always our endeavour to understand our clients’ commercial goals. We are transparent in our working and commit ourselves to time-bound and cost-effective advice that protects our clients’ interests.' },
  { n: '02', title: 'Trusted by business and government', text: 'The reputation that we have so strenuously built for ourselves has led us to be appointed by market leading international and domestic businesses on several path-breaking deals. Our advice is also sought by Governments, and this valuable interaction has in turn helped us establish a significant knowledge base within our firm – a base that we tap into for the benefit of our clients.' },
  { n: '03', title: 'Talent and a global network', text: 'Our commitment to our clients and work, attention to detail, transparent approach and formidable expertise in various areas of corporate and commercial law have won us recognition and awards from our peers and professional bodies, and attracted some of the best talent from leading law schools in India and abroad. We have strong relations with international and domestic law firms across the world, which help us assist clients on cross-border matters.' },
];

// "We believe in" (graphic on dsklegal.com/about-us), set as text; the words in <b> are the ones highlighted in red there.
const BELIEFS = [
  [<><b>collaborating</b> to leverage our collective experience and specialization</>],
  [<>facilitating our people to realise their <b>full potential</b></>],
  [<><b>fairness</b> and <b>integrity</b> in all that we do</>],
  [<>the pursuit of <b>excellence</b> taking precedence above all else</>],
  [<>a <b>solution-oriented</b> approach to provide effective responses to complex situations</>],
  [<>being a <b>trusted advisor</b></>],
];

const OFFICES = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Pune', 'UAE'];

export default function AboutPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    document.title = seoTitle('About DSK Legal');
    window.scrollTo(0, 0);
    fetch('/api/home').then((r) => (r.ok ? r.json() : Promise.reject())).then(setData).catch(() => setError(true));
  }, []);
  if (error) return <p className="state">Unable to load content. Please try again later.</p>;
  if (!data) return <Loader />;

  return (
    <div className="v2 v4">
      <Header4 data={data} />
      <main>
        <section className="x-ap-hero x-ab-hero">
          <div className="container">
            <nav className="x-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><b>About</b></nav>
            <Typewriter as="h1" delay={0.3} threshold={0.2} parts={[{ text: 'About' }, { text: 'DSK Legal', as: 'em' }]} />
            <p>Set up in 2001 in India and in 2025 in the UAE, DSK Legal is known for integrity and value-based, proactive, pragmatic and innovative legal advice.</p>
          </div>
        </section>

        <section className="x-ab-stats" aria-label="DSK Legal at a glance">
          <div className="container">
            <dl>
              {STATS.map((s) => (
                <Reveal key={s.l} as="div" className="x-ab-stat">
                  <dt>{/^\d+\+?$/.test(s.v) && s.v.length < 4 ? <CountUp value={s.v} /> : s.v}</dt>
                  <dd>{s.l}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        <section className="x-sec x-ab-story">
          <div className="container x-ab-story-in">
            <Reveal className="x-head">
              <p className="x-kicker">Institutional profile</p>
              <Typewriter parts={[{ text: 'Navigating India’s complex' }, { text: 'legal landscape', as: 'em' }]} />
            </Reveal>
            <Reveal delay={150}>
              <p className="x-p">DSK Legal was set up in 2001 in India and in 2025 in the UAE, and has since established an excellent reputation for its integrity and value-based proactive, pragmatic and innovative legal advice and its ability to help clients effectively traverse the complex legal and regulatory regime in India.</p>
              <p className="x-p">With offices in Mumbai, Delhi, Bengaluru, Chennai and Pune, DSK Legal has grown rapidly on the strength of its expertise to a multi-disciplinary team with over 300 fee-earners, including 74 partners and associate partners, as also experienced consultants. We are modern and inclusive in our outlook, and have a solution oriented approach. We strongly promote diversity of thought because we believe it helps us build strong teams with varied approaches and ideas to offer solutions that clients find value in.</p>
              <ul className="x-ab-offices" aria-label="Offices">
                {OFFICES.map((o) => <li key={o}><a href="/#offices">{o}</a></li>)}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="x-sec x-values x-ab-pillars">
          <div className="container">
            <Reveal className="x-head">
              <p className="x-kicker">How we work</p>
              <Typewriter parts={[{ text: 'Commitment, transparency and' }, { text: 'expertise', as: 'em' }]} />
            </Reveal>
            <div className="x-grid3">
              {PILLARS.map((v, i) => (
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

        <section className="x-sec x-ab-believe">
          <div className="container x-ab-believe-in">
            <Reveal className="x-head">
              <p className="x-kicker">Our philosophy</p>
              <Typewriter parts={[{ text: 'We believe' }, { text: 'in', as: 'em' }]} />
              <span className="x-ab-bar" aria-hidden="true" />
            </Reveal>
            <ol className="x-ab-list">
              {BELIEFS.map((b, i) => <Reveal key={i} as="li" delay={i * 90}><span>{b}</span></Reveal>)}
            </ol>
          </div>
        </section>

        <section className="x-sec x-ab-close">
          <div className="container x-ab-close-in">
            <Reveal>
              <p className="x-kicker">In summary</p>
              <p className="x-ab-lead">DSK Legal is widely recognized for its integrity, innovative solutions, and pragmatic legal advice. Known for navigating India’s complex legal and regulatory landscape, the firm has earned the trust of leading businesses and government entities.</p>
            </Reveal>
            <Reveal delay={150}>
              <p className="x-p">With a client-centric approach, we focus on understanding commercial goals and delivering transparent, time-bound, and cost-effective solutions, building strong and enduring relationships.</p>
              <p className="x-p">Our culture of diversity and inclusivity fosters innovative thinking and practical problem-solving, enabling us to deliver exceptional legal strategies. Recognized for excellence by peers and professional bodies, we continue to attract top talent and maintain strong networks with experts around the world, providing seamless support for cross-border matters and reinforcing our position as a trusted legal partner.</p>
              <Magnetic><a className="x-btn x-btn-dark" href="/people">Meet our team <b>→</b></a></Magnetic>
            </Reveal>
          </div>
        </section>
        <CtaBand />
      </main>
      <Footer data={data.footer} awardsHref="/awards" teamHref="/people" aboutHref="/about" />
    </div>
  );
}
