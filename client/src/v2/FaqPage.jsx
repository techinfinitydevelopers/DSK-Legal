import { useEffect } from 'react';
import PageShell, { PageHero } from './PageShell.jsx';
import { CtaBand } from './Sections2.jsx';
import { Reveal } from '../hooks.jsx';

/** /faq — questions and answers managed in the dashboard (FAQs tab). Answers keep their paragraph breaks. */
export default function FaqPage() {
  return (
    <PageShell title="FAQs">
      {() => <Faq items={window.__FAQS || []} />}
    </PageShell>
  );
}

function Faq({ items }) {
  // structured data so search engines can show the questions
  useEffect(() => {
    if (!items.length) return undefined;
    const s = document.createElement('script'); s.type = 'application/ld+json';
    s.text = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((x) => ({ '@type': 'Question', name: x.question, acceptedAnswer: { '@type': 'Answer', text: x.answer } })) });
    document.head.appendChild(s);
    return () => s.remove();
  }, [items]);
  const groups = []; const idx = {};
  for (const x of items) { const c = x.category || ''; if (!(c in idx)) { idx[c] = groups.length; groups.push({ c, items: [] }); } groups[idx[c]].items.push(x); }
  return (
    <>
      <PageHero crumbs={[['FAQs']]} parts={[{ text: 'Frequently asked' }, { text: 'questions', as: 'em' }]} lede="Answers to common questions about our firm and how we work." />
      <section className="x-sec x-faq">
        <div className="container x-faq-in">
          {!items.length && <p className="x-p">No questions have been published yet.</p>}
          {groups.map((g) => (
            <Reveal key={g.c || 'all'} className="x-faq-group">
              {g.c && <h2 className="x-faq-cat">{g.c}</h2>}
              {g.items.map((x) => (
                <details className="x-pg-svc x-faq-item" key={x.id}>
                  <summary><h3>{x.question}</h3><i aria-hidden="true" /></summary>
                  <div className="x-pg-svc-body x-faq-a">{x.answer.split(/\n{2,}/).map((p, i) => <p className="x-p" key={i}>{p.split('\n').map((l, j) => (j ? [<br key={j} />, l] : l))}</p>)}</div>
                </details>
              ))}
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
