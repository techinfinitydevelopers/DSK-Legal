import { useEffect, useState } from 'react';
import Header2 from './Header2.jsx';
import Footer from '../components/Footer.jsx';
import { Recognition } from '../components/About.jsx';
import { Hero2, Values2, Profile2, Practice2, Testimonials2, Awards2, Offices2, Knowledge2, CtaBand } from './Sections2.jsx';

export default function App2() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch('/api/home').then((r) => (r.ok ? r.json() : Promise.reject())).then(setData).catch(() => setError(true));
  }, []);
  if (error) return <p className="state">Unable to load content. Please try again later.</p>;
  if (!data) return <p className="state">Loading…</p>;
  return (
    <div className="v2">
      <Header2 data={data} />
      <main>
        <Hero2 data={data.hero} />
        <Values2 items={data.values} />
        <Profile2 data={data.profile} />
        <Recognition recognition={data.recognition} strengths={data.strengths} />
        <Testimonials2 items={data.testimonialsAll || data.testimonials} />
        <Practice2 data={data.practice} />
        <Awards2 data={data.awards} />
        <Offices2 data={data.offices} />
        <Knowledge2 data={data.knowledge} />
        <CtaBand />
      </main>
      <Footer data={data.footer} />
    </div>
  );
}
