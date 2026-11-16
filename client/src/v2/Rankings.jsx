import { useState } from 'react';
import { Reveal } from '../hooks.jsx';

const yearOf = (it) => (`${it.by} ${it.rank}`.match(/20\d\d/) || [''])[0] || '—';
const flatten = (groups) => groups.flatMap((g) => g.items.map((it) => ({ ...it, practice: g.practice, year: yearOf(it) })));
const label = (y) => (y === '—' ? 'Others' : y);

/** Every ranking as a tile in a masonry grid, newest first, with a year filter. */
export function Timeline({ groups }) {
  const rows = flatten(groups).sort((a, b) => (a.year === '—') - (b.year === '—') || b.year.localeCompare(a.year));
  const years = [...new Set(rows.map((r) => r.year))];
  const [sel, setSel] = useState('all');
  const list = sel === 'all' ? rows : rows.filter((r) => r.year === sel);

  return (
    <div className="x-rk-tl">
      <Reveal className="x-tl-filter" role="tablist" aria-label="Filter by year">
        {['all', ...years].map((y) => (
          <button key={y} role="tab" aria-selected={sel === y} className={sel === y ? 'on' : ''} onClick={() => setSel(y)}>
            {y === 'all' ? 'All' : label(y)}
            <i>{y === 'all' ? rows.length : rows.filter((r) => r.year === y).length}</i>
          </button>
        ))}
      </Reveal>

      <div key={sel}>
        {years.filter((y) => sel === 'all' || y === sel).map((y, n) => {
          const items = list.filter((x) => x.year === y);
          return (
            <section className="x-lg" key={y} style={{ animationDelay: `${n * 60}ms` }}>
              <h3 className="x-lg-yr">{label(y)}<small>{items.length} {items.length === 1 ? 'ranking' : 'rankings'}</small></h3>
              <ul className="x-lg-rows">
                {items.map((x, m) => (
                  <li key={`${x.practice}-${m}-${x.rank}`} className={`x-lg-row${/Firm of the Year/i.test(x.rank) ? ' win' : ''}`}>
                    <b>{x.rank}</b>
                    <p>{x.by}</p>
                    <small>{x.practice}</small>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
