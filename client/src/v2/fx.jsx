import { useRef } from 'react';

/** Card with a cursor-following radial glow (React Bits SpotlightCard style). */
export function Spotlight({ as: Tag = 'div', className = '', children, ...rest }) {
  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <Tag className={`x-spot ${className}`} onMouseMove={move} {...rest}>
      {children}
    </Tag>
  );
}

/** Pulls its child toward the cursor. */
export function Magnetic({ children, strength = 0.3 }) {
  const ref = useRef(null);
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    ref.current.style.transform = `translate(${x}px, ${y}px)`;
  };
  const leave = () => (ref.current.style.transform = '');
  return (
    <span ref={ref} className="x-mag" onMouseMove={move} onMouseLeave={leave}>
      {children}
    </span>
  );
}

/** 3D tilt on hover. */
export function Tilt({ children, className = '' }) {
  const ref = useRef(null);
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(700px) rotateX(${-py * 14}deg) rotateY(${px * 14}deg) translateY(-4px)`;
  };
  const leave = () => (ref.current.style.transform = '');
  return (
    <div ref={ref} className={`x-tilt ${className}`} onMouseMove={move} onMouseLeave={leave}>
      {children}
    </div>
  );
}

/** Word-by-word masked reveal; words in `accent` get the shiny red treatment. */
export function SplitWords({ parts, delay = 0 }) {
  let i = 0;
  return (
    <>
      {parts.flatMap(({ text, accent }) =>
        text.split(' ').map((w) => (
          <span key={i}>
            <span className="x-w">
              <span className={accent ? 'x-shiny' : ''} style={{ animationDelay: `${delay + i++ * 70}ms` }}>
                {w}
              </span>
            </span>{' '}
          </span>
        ))
      )}
    </>
  );
}
