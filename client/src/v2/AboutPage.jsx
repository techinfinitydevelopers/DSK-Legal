import { useEffect, useState } from 'react';
import { seoTitle, tx } from '../seo.js';
import Header4 from '../v4/Header4.jsx';
import Footer from '../components/Footer.jsx';
import { Loader } from './Mark.jsx';
import { CtaBand } from './Sections2.jsx';
import { Reveal } from '../hooks.jsx';
import { Typewriter } from './Typewriter.jsx';

/** /about — copy taken word for word from dsklegal.com/about-us: "We believe in" panel on the left, "Profile" and six paragraphs on the right. **text** is shown in bold, as on the live page. */
const PARAS = [
  'DSK Legal was set up in 2001 in India and in 2025 in the UAE, and has since established an excellent reputation for its integrity and value-based proactive, pragmatic and innovative legal advice and its ability to help clients effectively traverse the complex legal and regulatory regime in India. With offices in Mumbai, Delhi, Bengaluru, Chennai and Pune, DSK Legal has grown rapidly on the strength of its expertise to a multi-disciplinary team with **over 300 fee-earners, including 74 partners and associate partners**, as also experienced consultants. We are modern and inclusive in our outlook, and have a solution oriented approach. We strongly promote diversity of thought because we believe it helps us build strong teams with varied approaches and ideas to offer solutions that clients find value in.',
  'At DSK Legal, we believe in establishing strong and enduring relationships with our clients by ensuring that we are always available to attend to our clients’ needs. It is always our endeavour to understand our clients’ commercial goals. We are transparent in our working and commit ourselves to time-bound and cost-effective advice that protects our clients’ interests.',
  'The reputation that we have so strenuously built for ourselves has led us to be appointed by market leading international and domestic businesses on several path-breaking deals. Our advice is also sought by Governments, and this valuable interaction has in turn helped us establish a significant knowledge base within our firm – a base that we tap into for the benefit of our clients.',
  'Our commitment to our clients and work, attention to detail, transparent approach and formidable expertise in various areas of corporate and commercial law have not only won us recognition and awards from our peers and professional bodies, but has also attracted some of the best talent from leading law schools in India and abroad to work with us. We have strong relations with several international and domestic law firms in jurisdictions across the world, which help us provide clients with assistance on cross-border matters, or sometimes just introductions that our clients value.',
  'DSK Legal is widely recognized for its integrity, innovative solutions, and pragmatic legal advice. Known for navigating India’s complex legal and regulatory landscape, the firm has earned the trust of leading businesses and government entities. With a client-centric approach, we focus on understanding commercial goals and delivering transparent, time-bound, and cost-effective solutions, building strong and enduring relationships.',
  'Our culture of diversity and inclusivity fosters innovative thinking and practical problem-solving, enabling us to deliver exceptional legal strategies. Recognized for excellence by peers and professional bodies, we continue to attract top talent and maintain strong networks with experts around the world, providing seamless support for cross-border matters and reinforcing our position as a trusted legal partner.',
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

const rich = (t) => t.split('**').map((x, i) => (i % 2 ? <strong key={i}>{x}</strong> : x));

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
          </div>
        </section>

        <section className="x-sec x-ab-live">
          <div className="container x-ab-live-in">
            <Reveal as="aside" className="x-ab-card" aria-label="We believe in">
              <h2>{tx('about.believe.title', 'We believe in')}</h2>
              <span className="x-ab-bar" aria-hidden="true" />
              <ol className="x-ab-list">
                {BELIEFS.map((b, i) => <li key={i}><span>{b}</span></li>)}
              </ol>
            </Reveal>
            <Reveal delay={120} className="x-ab-profile">
              <h2>{tx('about.profile.title', 'Profile')}</h2>
              {PARAS.map((t, i) => <p key={i} className="x-p">{rich(tx(`about.p.${i + 1}`, t))}</p>)}
            </Reveal>
          </div>
        </section>
        <CtaBand />
      </main>
      <Footer data={data.footer} awardsHref="/awards" teamHref="/people" aboutHref="/about" />
    </div>
  );
}
