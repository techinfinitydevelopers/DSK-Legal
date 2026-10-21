import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

// /v2 → redesigned home (src/v2); everything else → original replica.
const isV2 = window.location.pathname.startsWith('/v2');
const App = React.lazy(() => (isV2 ? import('./v2/App2.jsx') : import('./App.jsx')));

createRoot(document.getElementById('root')).render(
  <React.Suspense fallback={null}>
    <App />
  </React.Suspense>
);
