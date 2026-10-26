import { Fragment } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useInView } from '../hooks.jsx';

gsap.registerPlugin(useGSAP);

/**
 * Heading with a GSAP-driven typewriter animation.
 * Every character is rendered up-front (hidden), so the layout never shifts or re-wraps while typing;
 * a GSAP timeline reveals them one by one and moves a blinking caret. Starts when scrolled into view.
 *
 * parts: [{ text, className?, as? }]  — lets a heading mix plain text with an accent (<em>, gradient…).
 */
export function Typewriter({ as: Tag = 'h2', parts, text, className = '', delay = 0, threshold = 0.6 }) {
  const segs = parts || [{ text }];
  const full = segs.map((p) => p.text).join(' ');
  const [ref, seen] = useInView(threshold);

  useGSAP(
    () => {
      if (!seen) return;
      const el = ref.current;
      const chars = el.querySelectorAll('.tw-c');
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        chars.forEach((c) => c.classList.add('on'));
        return;
      }
      const per = Math.min(0.045, 2.2 / chars.length); // long headings type faster, capped at ~2.2s
      const tl = gsap.timeline({ delay });
      chars.forEach((c, i) => {
        tl.call(() => {
          el.querySelector('.tw-c.cur')?.classList.remove('cur');
          c.classList.add('on', 'cur');
        }, null, i * per);
      });
      tl.call(() => chars[chars.length - 1]?.classList.remove('cur'), null, chars.length * per + 1.4);
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
            <Inner className={p.className}>
              {words.map((w, wi) => (
                <Fragment key={wi}>
                  <span className="tw-w" aria-hidden="true">
                    {[...w].map((ch, ci) => <span className="tw-c" key={ci}>{ch}</span>)}
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
