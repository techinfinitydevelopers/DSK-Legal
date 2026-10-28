// v4 "Deloitte Nav design": starts as an exact copy of v2 (src/v2/App2.jsx); shared v2 modules are imported from ../v2.
import { useEffect, useState } from 'react';
import Header4 from './Header4.jsx';
import { Loader } from '../v2/Mark.jsx';
import Footer from '../components/Footer.jsx';
import { Recognition } from '../components/About.jsx';
import { Magnetic } from '../v2/fx.jsx';
import { Hero2, Values2, Profile2, Practice2, Testimonials2, Awards2, Offices2, Knowledge2, CtaBand } from './Sections4.jsx';

export default function App4() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch('/api/home').then((r) => (r.ok ? r.json() : Promise.reject())).then(setData).catch(() => setError(true));
  }, []);
  if (error) return <p className="state">Unable to load content. Please try again later.</p>;
  if (!data) return <Loader />;
  return (
    <div className="v2">
      <Header4 data={data} />
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
      <Footer data={data.footer} awardsHref="/v4/awards" />
    </div>
  );
}
