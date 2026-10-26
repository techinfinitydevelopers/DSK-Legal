import { useState } from 'react';
import { Reveal } from '../hooks.jsx';

const yearOf = (it) => (`${it.by} ${it.rank}`.match(/20\d\d/) || [''])[0] || '—';
const flatten = (groups) => groups.flatMap((g) => g.items.map((it) => ({ ...it, practice: g.practice, year: yearOf(it) })));
const label = (y) => (y === '—' ? 'Others' : y);

// 3D tilt + cursor glare; only on devices that really hover and when motion is allowed.
const canTilt = () => window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches;
const tilt = (e) => {
  if (!canTilt()) return;
  const el = e.currentTarget;
  const b = el.getBoundingClientRect();
  const px = (e.clientX - b.left) / b.width;
  const py = (e.clientY - b.top) / b.height;
  el.style.setProperty('--ry', `${((px - 0.5) * 9).toFixed(2)}deg`);
  el.style.setProperty('--rx', `${(-(py - 0.5) * 9).toFixed(2)}deg`);
  el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
  el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
};
const untilt = (e) => {
  e.currentTarget.style.setProperty('--rx', '0deg');
  e.currentTarget.style.setProperty('--ry', '0deg');
};

/** The logo mark, hidden until the tile is hovered, then its lines draw in. */
const TileMark = () => (
  <svg className="mk x-tile-mk" viewBox="0 0 80 100" fill="none" strokeLinecap="round" aria-hidden="true">
    {[0, 1, 2].map((i) => <line key={`r${i}`} className="mk-r" style={{ '--i': i }} x1={10 + 12 * i} y1="4" x2={50 + 12 * i} y2="44" />)}
    {[0, 1, 2].map((i) => <line key={`g${i}`} className="mk-g" style={{ '--i': i + 3 }} x1={10 + 12 * i} y1="96" x2={50 + 12 * i} y2="56" />)}
  </svg>
);

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

      <div className="x-tl-masonry" key={sel}>
        {list.map((r, n) => (
          <article key={`${r.practice}-${n}-${r.rank}-${r.by}`} className={`x-tile${/Firm of the Year/i.test(r.rank) ? ' win' : ''}`} style={{ animationDelay: `${Math.min(n, 12) * 45}ms` }} onMouseMove={tilt} onMouseLeave={untilt}>
            <span className="yr">{label(r.year)}</span>
            <b>{r.rank}</b>
            <p>{r.by}</p>
            <small>{r.practice}</small>
            <TileMark />
          </article>
        ))}
      </div>
    </div>
  );
}
