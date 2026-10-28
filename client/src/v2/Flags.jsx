import { useId } from 'react';

// Round country flags for the header country selectors (v2, v3, v4). Inline SVG: no extra requests, crisp at any size.
const SPOKES = Array.from({ length: 24 }, (_, i) => i * 15);

function India() {
  return (
    <>
      <rect width="36" height="12" fill="#FF9933" />
      <rect y="12" width="36" height="12" fill="#fff" />
      <rect y="24" width="36" height="12" fill="#138808" />
      <g stroke="#000080" fill="none">
        <circle cx="18" cy="18" r="4.4" strokeWidth=".8" />
        {SPOKES.map((a) => <line key={a} x1="18" y1="18" x2="18" y2="13.8" strokeWidth=".35" transform={`rotate(${a} 18 18)`} />)}
      </g>
      <circle cx="18" cy="18" r=".9" fill="#000080" />
    </>
  );
}

function UAE() {
  return (
    <>
      <rect width="36" height="12" fill="#00732F" />
      <rect y="12" width="36" height="12" fill="#fff" />
      <rect y="24" width="36" height="12" fill="#000" />
      <rect width="11" height="36" fill="#FF0000" />
    </>
  );
}

const FLAGS = { India, UAE };

export function Flag({ country, size = 28 }) {
  const Art = FLAGS[country];
  // unique per instance: a shared id breaks the circle clip when the first copy sits in a display:none subtree
  const id = `flag-${useId().replace(/:/g, '')}`;
  if (!Art) return null;
  return (
    <svg className="flag" width={size} height={size} viewBox="0 0 36 36" role="img" aria-label={`${country} flag`}>
      <clipPath id={id}><circle cx="18" cy="18" r="18" /></clipPath>
      <g clipPath={`url(#${id})`}><Art /></g>
      <circle cx="18" cy="18" r="17.5" fill="none" stroke="rgba(0,0,0,.12)" />
    </svg>
  );
}
