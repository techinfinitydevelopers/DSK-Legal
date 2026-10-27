import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { Loader } from './v2/Mark.jsx';
import './v2/v2.css'; // scoped to .v2 / x- / xh- classes, so safe to ship with v1
import './v3/v3.css'; // ribbon intro styles (v3 only, but imported here: CSS in lazy chunks is not requested in production)

// /v2 → redesigned home (src/v2); /v2/awards → awards page; everything else → original replica.
const path = window.location.pathname.replace(/\/$/, '');
const isV2 = path.startsWith('/v2');
const isV3 = path.startsWith('/v3');
const AppV1 = React.lazy(() => import('./App.jsx'));
const AppV2 = React.lazy(() => import('./v2/App2.jsx'));
const AppV3 = React.lazy(() => import('./v3/App3.jsx'));
const AppAwards = React.lazy(() => import('./v2/AwardsPage.jsx'));
const App = path === '/v2/awards' ? AppAwards : isV3 ? AppV3 : isV2 ? AppV2 : AppV1;

createRoot(document.getElementById('root')).render(
  <React.Suspense fallback={isV2 || isV3 ? <Loader /> : null}>
    <App />
  </React.Suspense>
);
