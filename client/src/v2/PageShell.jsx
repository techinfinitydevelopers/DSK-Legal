import { Fragment, useEffect, useState } from 'react';
import Header4 from '../v4/Header4.jsx';
import Footer from '../components/Footer.jsx';
import { Loader } from './Mark.jsx';
import { Typewriter } from './Typewriter.jsx';
import { seoTitle, headingParts } from '../seo.js';

/** Common frame for the inner pages: loads /api/home, then header + <main> + footer around `children(data)`. */
export default function PageShell({ title, children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    document.title = seoTitle(title ? `${title} — DSK Legal` : 'DSK Legal');
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [title]);
  useEffect(() => {
    fetch('/api/home').then((r) => (r.ok ? r.json() : Promise.reject())).then(setData).catch(() => setError(true));
  }, []);
  if (error) return <p className="state">Unable to load content. Please try again later.</p>;
  if (!data) return <Loader />;
  return (
    <div className="v2 v4">
      <Header4 data={data} />
      <main>{children(data)}</main>
      <Footer data={data.footer} />
    </div>
  );
}

/** Dark page hero: breadcrumb trail, h1 made of [{text, as?}] parts, optional lede and extra content. */
export function PageHero({ crumbs = [], parts, lede, children, className = '' }) {
  const intro = typeof window !== 'undefined' ? window.__SEO?.intro : null; // heading/lede edited in the admin dashboard (exact-page only)
  if (intro?.heading) parts = headingParts(intro.heading);
  if (intro?.lede) lede = intro.lede;
  return (
    <section className={`x-ap-hero ${className}`}>
      <div className="container">
        <nav className="x-crumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          {crumbs.map(([label, href]) => <Fragment key={label}><span>/</span>{href ? <a href={href}>{label}</a> : <b>{label}</b>}</Fragment>)}
        </nav>
        <Typewriter as="h1" delay={0.3} threshold={0.2} parts={parts} />
        {lede && <p>{lede}</p>}
        {children}
      </div>
    </section>
  );
}
