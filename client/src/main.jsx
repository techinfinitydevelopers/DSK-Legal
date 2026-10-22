import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './v2/v2.css'; // scoped to .v2 / x- / xh- classes, so safe to ship with v1

// /v2 → redesigned home (src/v2); everything else → original replica.
const isV2 = window.location.pathname.startsWith('/v2');
const AppV1 = React.lazy(() => import('./App.jsx'));
const AppV2 = React.lazy(() => import('./v2/App2.jsx'));
const App = isV2 ? AppV2 : AppV1;

createRoot(document.getElementById('root')).render(
  <React.Suspense fallback={null}>
    <App />
  </React.Suspense>
);
