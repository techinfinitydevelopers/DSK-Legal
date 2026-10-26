import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { Loader } from './v2/Mark.jsx';
import './v2/v2.css'; // scoped to .v2 / x- / xh- classes, so safe to ship with v1

// /v2 → redesigned home (src/v2); /v2/awards → awards page; everything else → original replica.
const path = window.location.pathname.replace(/\/$/, '');
const isV2 = path.startsWith('/v2');
const AppV1 = React.lazy(() => import('./App.jsx'));
const AppV2 = React.lazy(() => import('./v2/App2.jsx'));
const AppAwards = React.lazy(() => import('./v2/AwardsPage.jsx'));
const App = path === '/v2/awards' ? AppAwards : isV2 ? AppV2 : AppV1;

createRoot(document.getElementById('root')).render(
  <React.Suspense fallback={isV2 ? <Loader /> : null}>
    <App />
  </React.Suspense>
);
