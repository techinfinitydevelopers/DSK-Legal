import { useCallback, useEffect, useState } from 'react';
import Header3 from './Header3.jsx';
import RibbonPreloader, { canRibbon } from './RibbonPreloader.jsx';
import Footer from '../components/Footer.jsx';
import { Recognition } from '../components/About.jsx';
import { Magnetic } from '../v2/fx.jsx';
import { Hero2, Values2, Profile2, Practice2, Testimonials2, Awards2, Offices2, Knowledge2, CtaBand } from './Sections3.jsx';

// Ribbon intro plays once per browser; /v3?intro replays it. Storage may throw (private mode) → just play it.
const SEEN = 'dsk:ribbon-seen';
const seenRibbon = () => {
  if (new URLSearchParams(window.location.search).has('intro')) return false;
  try { return localStorage.getItem(SEEN) === '1'; } catch { return false; }
};

/**
 * /v3 = the v2 page behind a full-screen ribbon preloader.
 * phase: 'pre' (only the preloader: no header/footer) → 'leaving' (site mounts under the lifting overlay) → 'site'.
 */
export default function App3() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [phase, setPhase] = useState(() => (canRibbon() && !seenRibbon() ? 'pre' : 'site'));
  const onLeave = useCallback(() => {
    try { localStorage.setItem(SEEN, '1'); } catch { /* ignore */ }
    setPhase('leaving');
  }, []);
  const onDone = useCallback(() => setPhase('site'), []);

  useEffect(() => {
    fetch('/api/home').then((r) => (r.ok ? r.json() : Promise.reject())).then(setData).catch(() => setError(true));
  }, []);

  const site = error ? (
    <p className="state">Unable to load content. Please try again later.</p>
  ) : data ? (
    <>
      <Header3 data={data} />
      <main>
        <Hero2 data={data.hero} />
        <Values2 items={data.values} />
        <Profile2 data={data.profile} />
        <Recognition
          recognition={data.recognition}
          strengths={data.strengths}
          renderCta={(label) => <Magnetic><a className="x-btn x-btn-red" href="#awards">{label} <b>→</b></a></Magnetic>}
        />
        <Testimonials2 items={data.testimonialsAll || data.testimonials} />
        <Practice2 data={data.practice} />
        <Awards2 data={data.awards} />
        <Offices2 data={data.offices} />
        <Knowledge2 data={data.knowledge} />
        <CtaBand />
      </main>
      <Footer data={data.footer} awardsHref="/v2/awards" />
    </>
  ) : null;

  return (
    <div className="v2">
      {phase !== 'site' && <RibbonPreloader onLeave={onLeave} onDone={onDone} />}
      {phase !== 'pre' && site}
    </div>
  );
}
