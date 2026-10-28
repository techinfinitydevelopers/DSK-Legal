import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { Loader } from './v2/Mark.jsx';
import './v2/v2.css'; // scoped to .v2 / x- / xh- classes, so safe to ship with v1
import './v4/v4.css'; // Deloitte-style header (v4 only, scoped to .dl classes)
import './v3/v3.css'; // ribbon intro styles (v3 only, but imported here: CSS in lazy chunks is not requested in production)

// /v2 → redesigned home (src/v2); /v3 → v2 + ribbon intro; /v4 → Deloitte nav design (v2 copy); /vN/awards → awards page; everything else → original replica.
const path = window.location.pathname.replace(/\/$/, '');
const isV2 = path.startsWith('/v2');
const isV3 = path.startsWith('/v3');
const isV4 = path.startsWith('/v4');
const AppV1 = React.lazy(() => import('./App.jsx'));
const AppV2 = React.lazy(() => import('./v2/App2.jsx'));
const AppV3 = React.lazy(() => import('./v3/App3.jsx'));
const AppV4 = React.lazy(() => import('./v4/App4.jsx'));
const AppAwards = React.lazy(() => import('./v2/AwardsPage.jsx'));
const App = /^\/v[234]\/awards$/.test(path) ? AppAwards : isV4 ? AppV4 : isV3 ? AppV3 : isV2 ? AppV2 : AppV1;
// tab names tell the versions apart (the awards page sets its own)
document.title = isV4 ? 'DSK Legal — Deloitte Nav design' : isV3 ? 'DSK Legal — Ribbon Intro' : isV2 ? 'DSK Legal — DSK Liked Version' : 'DSK Legal — Classic';

createRoot(document.getElementById('root')).render(
  <React.Suspense fallback={isV2 || isV3 || isV4 ? <Loader /> : null}>
    <App />
  </React.Suspense>
);
