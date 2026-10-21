# DSK Legal — Project Memory

## Knowledge base
- Client: DSK Legal (India + UAE law firm, est. 2001). Tagline: "True Value, True Values".
- Brand (from BRAND Guideline.pdf): grey #9a9c9e, charcoal #292929, red #e11e25; secondary #db5c56, #000. Fonts: IrisUPC Bold (titles), TheSans B3 Light/Italic + B5 Plain (body) — commercial, not bundled. REAL brand fonts now installed (from ~/Downloads/Fonts) in `client/public/fonts` + @font-face in `styles.css` (IrisUPC Bold with size-adjust 128% since it renders small; TheSans B3 Light/Italic, B5 Plain). Google Fonts link removed; fallbacks Georgia/system-ui. Coral #db5c56 = --coral (hover accents).
- Images: pulled from dsklegal.com/wp-content/uploads (user confirmed rights) into `client/public/img` (banners, about, 6 offices, 6 award badges). Offices on site: Mumbai, New Delhi, Bengaluru, Chennai, Pune, Dubai.
- Original nav: About Us, Practice Areas, Sectors & Industries, Our Team, Knowledge Centre, Careers, Contact Us.
- Assets: `Firm Logo.jpeg` (cropped to `client/public/logo.jpg`).
- Port 5000 is taken by macOS AirPlay → server uses 5001.

## Stack / layout
- `client/` Vite + React 18 (components in `src/components`, styles in `src/styles.css`).
- `server/` Express; `GET /api/home` (content in `server/data/home.js`), `POST /api/subscribe` (in-memory), serves `client/dist` in prod.
- Run: `npm run install:all`; dev `npm run dev` (client :5173 proxies to :5001); prod `npm run build && npm start` → http://localhost:5001.

- v2 redesign lives in `client/src/v2/` (App2, Sections2, fx.jsx, v2.css), route `/v2`; v1 untouched at `/`. `main.jsx` switches by pathname. No Tailwind — React Bits/Magic UI effects hand-ported in plain CSS (no new deps).

## Open items
- All 10 original hero banners downloaded (`client/public/img/banner1..10`) and used in v2 hero; v1 hero uses first 2.
- Team/sector/practice inner pages not built.
- Nav links are anchors only; no inner pages yet. Subscribe not persisted.
- Copy transcribed from a low-res screenshot; verify text.

## Build log
- 2026-10-21 — Home page replicated (header, hero, values, profile, recognition, testimonials carousel, practice areas, awards, knowledge centre, offices, footer). Client build passes; served on :5001 and visually checked (hero/header).
- 2026-10-21 (v2) — Redesign against original dsklegal.com: real copy/images, full-bleed hero crossfade slider + glass stats with count-up, scroll reveals, sticky header w/ progress bar, hover lifts/zoom, award marquee. Build OK, no broken images.
- 2026-10-21 (v2 sections) — Built /v2: word-reveal hero + shiny accent + cursor glow + magnetic buttons, spotlight value cards, bento practice grid, 2-row testimonial marquee, tilt award badges + rank ticker, hover-accordion offices, CTA band. Build OK; checked hero, practice, offices visually. Profile/Recognition/Footer reused from v1.
- 2026-10-21 — v2 hero now cycles all 10 original banners (10 pips, 6.5s). Build OK.
- 2026-10-21 — v2 Hero redesigned (Ken-Burns+mouse parallax, glass stat card, thumbnail rail w/ progress, counter, prev/next, pause on hover). v2 Practice redesigned (category filter chips + numbered list + sticky live panel; copy/categories in `v2/practiceMeta.js` — blurbs are drafted by me, verify with firm). Checked visually.
- 2026-10-21 — v2 header: floating pill island (announcement chip collapses on scroll, sliding hover highlight, scroll-spy dot, hide on scroll-down/show on up, progress line, full-screen circle-reveal mobile menu). File: v2/Header2.jsx. v2 nav uses section anchors (About, Practice, Recognitions, Offices, Knowledge); original Sectors/Team/Careers only in the mobile menu.
- 2026-10-21 — Brand guideline applied: font stack swapped to Philosopher/Source Sans 3 look-alikes, headings weight 700, coral secondary added, v2 h1 resized for wider font.
- 2026-10-21 — v2 header v2: utility strip (email, Read: Law Meets AI, Country Selector India→dsklegal.com / UAE→dsklegal.ae), full original nav with Practice Areas (14 groups) + Sectors (37) mega menus from `server/data/menu.js` (served in /api/home as `menu`), transparent logo `client/public/logo.png` on white pill so it merges. Sub-item links all scroll to #practice (no inner pages yet).
- 2026-10-21 — v2 header: start state is now full-width flat bar (red strip + white bar, like original); morphs into floating pill only after scroll.
- 2026-10-21 — v2 testimonials: all 47 unique quotes from dsklegal.com (`server/data/testimonials.js`, API key `testimonialsAll`) in 2 marquee rows; v1 still uses the 5-item `testimonials`. Fintech quote trimmed to its first sentence; role shown as 'Asia-Pacific' (Chambers/Legal500) or 'Client feedback' (Asialaw).
- 2026-10-21 — v2 mobile pass (375px): compact header, hero spacing + stacked CTAs, Practice list becomes tap-accordion (side panel hidden <700px), awards 2-col, smaller testimonial cards. No horizontal overflow; mobile menu verified.
- 2026-10-21 — Real brand fonts wired. Fixed stray `.xh.sc ` selector in v2.css (left over from progress-line removal) that hid/leaked `.x-pa-inline` on desktop.
- 2026-10-21 — Mobile re-check with real fonts: no horizontal overflow; fixed hero eyebrow wrap + testimonial card heights (flex-start, 8-line clamp). Hero headings animate in a moment after load (screenshots right after navigate can look empty).
- 2026-10-21 — v2 Knowledge Centre redesigned: sticky intro + feature pills, 2 big cards (index number, image reveal on hover, rotating arrow), working subscribe strip (POST /api/subscribe).
- 2026-10-21 — v2 Knowledge: removed subscribe strip (duplicate CTA; footer already has mailing list) → sticky intro no longer overlaps. Single closing CTA = 'Have a complex mandate? Let's talk.' band.
