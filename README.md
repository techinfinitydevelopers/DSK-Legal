# DSK Legal — Home page (React + Node)

- `client/` — Vite + React. `/` = replica of the original home, `/v2` = redesigned home (`client/src/v2`).
- `server/` — Express API (`/api/home`, `/api/subscribe`); serves `client/dist` in production.

```bash
npm run install:all   # install root, client and server deps
npm run dev           # client :5173 (proxy → API :5001)
npm run build && npm start   # production on http://localhost:5001
```

Brand: see `BRAND Guideline.pdf`. Fonts (IrisUPC, TheSans) live in `client/public/fonts`.
Project notes and build log: `memory.md`.
