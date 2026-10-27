import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Typewriter } from '../v2/Typewriter.jsx';

const Ribbon3D = lazy(() => import('./Ribbon3D.jsx')); // three.js is only fetched when the preloader actually runs

/** The preloader needs WebGL and motion; otherwise the site just opens. */
export const canRibbon = () => {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

const morphDone = (morphed) => {
  window.__dskMorphPending = false;
  window.dispatchEvent(new CustomEvent('dsk:morph-done', { detail: { morphed } }));
};

const waitFor = (fn, timeout = 2500) =>
  new Promise((resolve) => {
    const t0 = performance.now();
    const tick = () => {
      const v = fn();
      if (v || performance.now() - t0 > timeout) resolve(v || null);
      else requestAnimationFrame(tick);
    };
    tick();
  });

/** A fixed copy of the heading's text, placed exactly over it, that can fly to the hero. */
function makeClone(src) {
  const r = src.getBoundingClientRect();
  const cs = getComputedStyle(src.closest('h2'));
  const el = document.createElement('div');
  el.className = 'x-morph';
  el.setAttribute('aria-hidden', 'true');
  el.textContent = src.textContent;
  Object.assign(el.style, {
    left: `${r.left}px`, top: `${r.top}px`, fontFamily: cs.fontFamily, fontWeight: cs.fontWeight,
    fontSize: cs.fontSize, lineHeight: `${r.height}px`, letterSpacing: '0px', textShadow: cs.textShadow,
  });
  document.body.appendChild(el);
  return el;
}

/**
 * Full-screen preloader (no header/footer). Scroll / swipe / arrow keys drive a virtual progress 0..1:
 * the knotted ribbon loosens into one straight line under the heading, then the overlay lifts away.
 */
export default function RibbonPreloader({ onLeave, onDone }) {
  const progress = useRef(0);
  const endAt = useRef(0);
  const leaving = useRef(false);
  const [heading, setHeading] = useState(false);
  const [cueOff, setCueOff] = useState(false);
  const [out, setOut] = useState(false);

  const copyRef = useRef(null);

  const leave = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    // if the heading is fully typed, it flies into the hero's first line (shared-element morph)
    const head = copyRef.current?.querySelector('.x-pre-h');
    const src = head?.querySelector('.tw-part0');
    const typed = head && [...head.querySelectorAll('.tw-c')].every((c) => c.classList.contains('on'));
    const clone = src && typed ? makeClone(src) : null;
    if (clone) copyRef.current.style.visibility = 'hidden';
    setOut(true);
    onLeave(); // mount the site underneath while the overlay slides up
    setTimeout(onDone, 1100);
    if (!clone) { morphDone(false); return; }
    waitFor(() => document.querySelector('.x-hero h1 .tw-part0')).then((target) => {
      if (!target) { clone.remove(); morphDone(false); return; }
      const tr = target.getBoundingClientRect();
      const h1 = getComputedStyle(target.closest('h1'));
      gsap.to(clone, {
        left: tr.left, top: tr.top, fontSize: h1.fontSize, lineHeight: `${tr.height}px`, letterSpacing: h1.letterSpacing,
        textShadow: '0 0 0px rgba(255,255,255,0)', duration: 1.2, ease: 'power3.inOut',
        onComplete: () => {
          morphDone(true); // hero shows its first line instantly and types the rest
          requestAnimationFrame(() => requestAnimationFrame(() => clone.remove()));
        },
      });
    });
  }, [onLeave, onDone]);

  useEffect(() => {
    window.__dskMorphPending = true;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    window.scrollTo(0, 0);

    // Reverse is allowed (scroll up re-ties the ribbon), but only when it's deliberate:
    // tiny negative deltas, and any negative delta right after scrolling down (trackpad bounce / momentum
    // wobble), are ignored. Upward input must add up to a real gesture before it moves the ribbon back.
    const intent = { neg: 0, lastPos: 0, lastNeg: 0 };
    const BOUNCE_MS = 260;   // negatives this soon after a downward scroll are a bounce, not intent
    const GESTURE_MS = 320;  // gap that starts a new upward gesture
    const NEG_DEADZONE = -0.035; // upward travel needed before reversing starts

    const apply = (d) => {
      const p = Math.min(1, Math.max(0, progress.current + d));
      progress.current = p;
      setCueOff(p > 0.03);
      setHeading(p > 0.84);
      if (p >= 0.985) {
        if (!endAt.current) endAt.current = performance.now();
        else if (d > 0 && performance.now() - endAt.current > 1400) leave(); // scrolled again once the heading is in
      } else {
        endAt.current = 0;
      }
    };
    const bump = (d, deliberate = false) => {
      if (leaving.current || d === 0) return;
      const now = performance.now();
      if (d > 0) {
        intent.lastPos = now;
        intent.neg = 0;
        apply(d);
        return;
      }
      if (!deliberate) {
        if (now - intent.lastPos < BOUNCE_MS) return;
        if (now - intent.lastNeg > GESTURE_MS) intent.neg = 0;
        intent.lastNeg = now;
        const before = intent.neg;
        intent.neg += d;
        if (intent.neg > NEG_DEADZONE) return;                 // still inside the dead-zone
        if (before > NEG_DEADZONE) d = intent.neg - NEG_DEADZONE; // only the part beyond the dead-zone counts
      }
      apply(d);
    };
    const onWheel = (e) => { e.preventDefault(); bump(e.deltaY / 1800); };
    let ty = null;
    const onTouchStart = (e) => { ty = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      e.preventDefault();
      const y = e.touches[0].clientY;
      if (ty !== null) bump((ty - y) / (window.innerHeight * 1.6));
      ty = y;
    };
    const onKey = (e) => {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); bump(0.08); }
      else if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); bump(-0.08, true); }
      else if (e.key === 'Escape') leave();
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKey);
    const dwell = setInterval(() => { if (endAt.current && performance.now() - endAt.current > 3200) leave(); }, 300); // never trap anyone
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
      clearInterval(dwell);
      root.style.overflow = prevOverflow;
    };
  }, [leave]);

  return (
    <div className={`x-pre${out ? ' out' : ''}`} role="dialog" aria-label="Introduction">
      <div className="x-pre-canvas" aria-hidden="true">
        <Suspense fallback={null}>
          <Ribbon3D progress={progress} running />
        </Suspense>
      </div>
      <div className="x-pre-copy" ref={copyRef}>
        <Typewriter as="h2" text="Clarity in Complexity." className="x-pre-h" active={heading} threshold={0} />
        <p className={`x-pre-sub${heading ? ' on' : ''}`}>Proactive, pragmatic and innovative legal advice</p>
      </div>
      <div className={`x-pre-cue${cueOff ? ' off' : ''}`}><i /><span>Drag to turn · Scroll to loosen</span></div>
      <button className="x-pre-skip" onClick={leave}>Skip intro <b>→</b></button>
    </div>
  );
}
