import { Fragment } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useInView } from '../hooks.jsx';

gsap.registerPlugin(useGSAP);

// v2 pages (/v2, /v2/awards) show headings as plain text: no typing. v3/v4 keep the animation.
const STATIC = /^\/v2(\/|$)/.test(window.location.pathname);

/**
 * Heading with a GSAP-driven typewriter animation.
 * Every character is rendered up-front (hidden), so the layout never shifts or re-wraps while typing;
 * a GSAP timeline reveals them one by one and moves a blinking caret. Starts when scrolled into view.
 *
 * parts: [{ text, className?, as? }]  — lets a heading mix plain text with an accent (<em>, gradient…).
 */
export function Typewriter({ as: Tag = 'h2', parts, text, className = '', delay = 0, threshold = 0.6, active, preset = 0 }) {
  const segs = parts || [{ text }];
  const full = segs.map((p) => p.text).join(' ');
  const [ref, inView] = useInView(threshold);
  // `active` (optional) lets a parent drive the start/reset, e.g. from scroll progress; otherwise start when in view.
  const seen = active === undefined ? inView : active;

  useGSAP(
    () => {
      const el = ref.current;
      if (STATIC) return;
      const chars = el.querySelectorAll('.tw-c');
      if (!seen) {
        chars.forEach((c) => c.classList.remove('on', 'cur'));
        return;
      }
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        chars.forEach((c) => c.classList.add('on'));
        return;
      }
      // `preset` leading chars appear at once (e.g. text that just morphed into place); the rest is typed
      const typed = Math.max(1, chars.length - preset);
      const per = Math.min(0.045, 2.2 / typed); // long headings type faster, capped at ~2.2s
      const tl = gsap.timeline({ delay });
      chars.forEach((c, i) => {
        if (i < preset) { c.classList.add('on'); return; }
        tl.call(() => {
          el.querySelector('.tw-c.cur')?.classList.remove('cur');
          c.classList.add('on', 'cur');
        }, null, (i - preset) * per);
      });
      tl.call(() => chars[chars.length - 1]?.classList.remove('cur'), null, typed * per + 1.4);
      return () => tl.kill();
    },
    { scope: ref, dependencies: [seen] }
  );

  return (
    <Tag ref={ref} className={`tw ${className}`} aria-label={full}>
      {segs.map((p, si) => {
        const Inner = p.as || 'span';
        const words = p.text.split(' ');
        return (
          <Fragment key={si}>
            {si > 0 && ' '}
            <Inner className={`tw-part tw-part${si}${p.className ? ' ' + p.className : ''}`}>
              {words.map((w, wi) => (
                <Fragment key={wi}>
                  <span className="tw-w" aria-hidden="true">
                    {[...w].map((ch, ci) => <span className={STATIC ? 'tw-c on' : 'tw-c'} key={ci}>{ch}</span>)}
                  </span>
                  {wi < words.length - 1 && ' '}
                </Fragment>
              ))}
            </Inner>
          </Fragment>
        );
      })}
    </Tag>
  );
}
