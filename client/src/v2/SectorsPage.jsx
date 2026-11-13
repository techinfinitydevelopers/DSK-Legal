import { useMemo, useState } from 'react';
import PageShell, { PageHero } from './PageShell.jsx';
import { CtaBand } from './Sections2.jsx';
import { Reveal } from '../hooks.jsx';

/** /sectors — intro copy from dsklegal.com/sectors-and-industries; the sector list comes from the menu data (/api/home). */
export default function SectorsPage() {
  return (
    <PageShell title="Sectors & Industries">
      {(data) => <Sectors list={data.menu.sectors} />}
    </PageShell>
  );
}

function Sectors({ list }) {
  const [q, setQ] = useState('');
  const shown = useMemo(() => list.filter((s) => s.toLowerCase().includes(q.trim().toLowerCase())), [list, q]);
  return (
    <>
      <PageHero
        crumbs={[['Sectors & industries']]}
        parts={[{ text: 'Sectors &' }, { text: 'Industries', as: 'em' }]}
        lede="Tailored legal solutions across a diverse range of sectors and industries."
      />
      <section className="x-sec">
        <div className="container">
          <Reveal className="x-head x-sc-intro">
            <p className="x-kicker">Service sectors and industries</p>
            <p className="x-pg-lead">At DSK Legal, we leverage our extensive expertise across a diverse range of sectors and industries to provide tailored legal solutions. Our dedicated team of legal professionals understands the unique challenges faced by businesses in these fields and is committed to delivering comprehensive support to help our clients achieve their objectives while mitigating risks.</p>
          </Reveal>
          <div className="x-sc-bar">
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sectors" aria-label="Search sectors" />
            <span>{shown.length} of {list.length} sectors</span>
          </div>
          {shown.length ? (
            <ul className="x-sc-grid">
              {shown.map((s) => (
                <li key={s}><a href={`/contact?topic=${encodeURIComponent(s)}`}><span>{String(list.indexOf(s) + 1).padStart(2, '0')}</span>{s}<b>→</b></a></li>
              ))}
            </ul>
          ) : <p className="x-p">No sector matches “{q}”.</p>}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
