import { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import { Values, Profile, Recognition, Testimonials } from './components/About.jsx';
import { Practice, Awards, Knowledge, Offices } from './components/Content.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/home')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="state">Unable to load content. Please try again later.</p>;
  if (!data) return <p className="state">Loading…</p>;

  return (
    <>
      <Header data={data} />
      <main>
        <Hero data={data.hero} />
        <Values items={data.values} />
        <Profile data={data.profile} />
        <Recognition recognition={data.recognition} strengths={data.strengths} />
        <Testimonials items={data.testimonials} />
        <Practice data={data.practice} />
        <Awards data={data.awards} />
        <Knowledge data={data.knowledge} />
        <Offices data={data.offices} />
      </main>
      <Footer data={data.footer} />
    </>
  );
}
