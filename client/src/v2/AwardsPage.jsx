import { useEffect, useState } from 'react';
import Header2 from './Header2.jsx';
import Header3 from '../v3/Header3.jsx';
import Header4 from '../v4/Header4.jsx';
import Footer from '../components/Footer.jsx';
import { Loader } from './Mark.jsx';
import { Timeline } from './Rankings.jsx';
import { CtaBand, LogoMarquee } from './Sections2.jsx';
import { Reveal } from '../hooks.jsx';
import { Typewriter } from './Typewriter.jsx';

/** /v2/awards, /v3/awards and /v4/awards — full recognition page: logos + year-by-year timeline of all rankings. Links stay in the version it was opened from. */
const home = window.location.pathname.match(/^\/v[34]/)?.[0] || '/v2';
const Header = { '/v3': Header3, '/v4': Header4 }[home] || Header2;
const NAME = { '/v3': 'Ribbon Intro', '/v4': 'Deloitte Nav design' }[home] || 'DSK Liked Version';
export default function AwardsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    document.title = `Awards & Recognition — ${NAME}`;
    window.scrollTo(0, 0);
    fetch('/api/home').then((r) => (r.ok ? r.json() : Promise.reject())).then(setData).catch(() => setError(true));
  }, []);
  if (error) return <p className="state">Unable to load content. Please try again later.</p>;
  if (!data) return <Loader />;

  const groups = data.awardsByPractice || [];
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="v2">
      <Header data={data} />
      <main>
        <section className="x-ap-hero">
          <div className="container">
            <nav className="x-crumbs" aria-label="Breadcrumb">
              <a href={home}>Home</a><span>/</span><b>Awards</b>
            </nav>
            <Typewriter as="h1" delay={0.3} threshold={0.2} parts={[{ text: 'Awards &' }, { text: 'Recognition', as: 'em' }]} />
            <p>{total} rankings and awards across {groups.length} practice areas, from the leading independent legal guides.</p>
          </div>
        </section>

        <section className="x-sec x-ap-logos">
          <div className="container">
            <Reveal className="x-head x-center">
              <p className="x-kicker">Independent industry endorsement</p>
              <Typewriter text="Recognised by" />
            </Reveal>
          </div>
          <LogoMarquee logos={data.awards.logos} />
        </section>

        <section className="x-sec x-ap-tl">
          <div className="container">
            <Reveal className="x-head">
              <p className="x-kicker">Recognition by year</p>
              <Typewriter parts={[{ text: 'A timeline of' }, { text: 'recognition', as: 'em' }]} />
            </Reveal>
            <Timeline groups={groups} />
          </div>
        </section>
        <CtaBand />
      </main>
      <Footer data={data.footer} awardsHref={`${home}/awards`} />
    </div>
  );
}
