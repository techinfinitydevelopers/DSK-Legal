import { useEffect } from 'react';
import PageShell, { PageHero } from './PageShell.jsx';
import { Reveal } from '../hooks.jsx';
import { Spotlight } from './fx.jsx';

/** 404 — shown for unknown URLs (the server also answers them with a real 404 status). */
const LINKS = [
  { title: 'Practice areas', text: 'Our advisory, transactional and disputes practices.', href: '/practice' },
  { title: 'Our people', text: 'Meet the partners and lawyers of the firm.', href: '/people' },
  { title: 'Knowledge centre', text: 'Articles, newsletters and regulatory updates.', href: '/knowledge' },
  { title: 'Contact us', text: 'Talk to us about your matter.', href: '/contact' },
];

export default function NotFoundPage() {
  useEffect(() => {
    let m = document.querySelector('meta[name=robots]');
    if (!m) { m = document.createElement('meta'); m.name = 'robots'; document.head.appendChild(m); }
    m.content = 'noindex';
  }, []);
  return (
    <PageShell title="Page not found">
      {() => (
        <>
          <PageHero crumbs={[['Page not found']]} parts={[{ text: 'Page' }, { text: 'not found', as: 'em' }]} lede="The page you are looking for may have moved, been renamed or never existed.">
            <p className="x-nf-code" aria-hidden="true">404</p>
          </PageHero>
          <section className="x-sec">
            <div className="container">
              <Reveal className="x-head"><p className="x-kicker">Try one of these</p></Reveal>
              <div className="x-nf-grid">
                {LINKS.map((l, i) => (
                  <Reveal key={l.href} delay={i * 80}>
                    <Spotlight as="a" className="x-card x-cr-route" href={l.href}>
                      <h3>{l.title}</h3><p>{l.text}</p><span className="x-link">Go <b>→</b></span>
                    </Spotlight>
                  </Reveal>
                ))}
              </div>
              <p className="x-p"><a className="x-link" href="/">← Back to the home page</a></p>
            </div>
          </section>
        </>
      )}
    </PageShell>
  );
}
