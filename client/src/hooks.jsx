import { useEffect, useRef, useState } from 'react';

export function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return setSeen(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen];
}

export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, seen] = useInView(0.12);
  return (
    <Tag ref={ref} className={`reveal${seen ? ' in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}

export function CountUp({ value, duration = 1400 }) {
  const [ref, seen] = useInView(0.5);
  const num = parseInt(value, 10);
  const suffix = String(value).replace(/[0-9]/g, '');
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return setN(num);
    let raf; const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      setN(Math.round(num * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, num, duration]);
  return <span ref={ref}>{value.length === 4 && !suffix ? (seen ? String(n).padStart(4, '0') : '0000') : n}{suffix}</span>;
}
