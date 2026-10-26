import { useEffect, useRef } from 'react';
import { useInView } from '../hooks.jsx';

/**
 * The DSK Legal logo mark (3 red lines "\" over 3 grey lines "/") as an animatable SVG.
 * - draws itself in when scrolled into view (or immediately with `instant`)
 * - `loop` repeats draw → erase (used for loaders / tiny ticker icons)
 */
export function Mark({ className = '', loop = false, instant = false, threshold = 0.25 }) {
  const [ref, seen] = useInView(threshold);
  const on = instant || seen;
  return (
    <svg ref={ref} className={`mk${on ? ' in' : ''}${loop ? ' loop' : ''} ${className}`} viewBox="0 0 80 100" fill="none" strokeLinecap="round" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <line key={`r${i}`} className="mk-r" style={{ '--i': i }} x1={10 + 12 * i} y1="4" x2={50 + 12 * i} y2="44" />
      ))}
      {[0, 1, 2].map((i) => (
        <line key={`g${i}`} className="mk-g" style={{ '--i': i + 3 }} x1={10 + 12 * i} y1="96" x2={50 + 12 * i} y2="56" />
      ))}
    </svg>
  );
}

export function Loader() {
  return (
    <div className="x-loader" role="status" aria-label="Loading">
      <Mark instant loop />
    </div>
  );
}

/**
 * Scroll-scrubbed version: the lines draw in as the parent section scrolls into view
 * (and un-draw when scrolling back up), with a light vertical parallax.
 */
export function ScrollMark({ className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const svg = ref.current;
    const host = svg?.parentElement;
    if (!svg || !host) return;
    const lines = [...svg.querySelectorAll('line')];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const clamp = (v) => Math.min(1, Math.max(0, v));
    const update = () => {
      raf = 0;
      const r = host.getBoundingClientRect();
      const vh = window.innerHeight;
      const t = (vh - r.top) / (vh + r.height); // 0 → section enters, 1 → section leaves
      const p = reduce ? 2 : t / 0.36; // fully drawn by the time the section is ~centred
      lines.forEach((l, i) => {
        const lp = clamp(p * 1.3 - i * 0.1);
        l.style.strokeDashoffset = String(60 * (1 - lp));
      });
      if (!reduce) svg.style.transform = `translateY(calc(-50% + ${(0.5 - t) * 90}px))`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);
  return (
    <svg ref={ref} className={`mk scrub ${className}`} viewBox="0 0 80 100" fill="none" strokeLinecap="round" aria-hidden="true">
      {[0, 1, 2].map((i) => <line key={`r${i}`} className="mk-r" x1={10 + 12 * i} y1="4" x2={50 + 12 * i} y2="44" />)}
      {[0, 1, 2].map((i) => <line key={`g${i}`} className="mk-g" x1={10 + 12 * i} y1="96" x2={50 + 12 * i} y2="56" />)}
    </svg>
  );
}
