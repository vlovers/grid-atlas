# Grid Atlas web

Next.js App Router frontend. Install from the repository root using `pnpm install --frozen-lockfile`, migrate/import PostgreSQL and start the API as described in the root README.

```sh
API_BASE_URL=http://127.0.0.1:3001 pnpm --filter @grid-atlas/web dev --port 3000
pnpm --filter @grid-atlas/web build
API_BASE_URL=http://127.0.0.1:3001 pnpm --filter @grid-atlas/web start --hostname 127.0.0.1 --port 3000
```

API requests run on the Next.js server and do not need browser CORS. They have an eight-second timeout and no persistent fetch cache, so rejected/revoked lineage is not retained for an hour. Missing API profiles render not-found; outages have a retry state.

Implemented: searchable/paginated drivers, constructors and circuits; profiles and career/season timelines; season calendars and result-derived lineups; circuit race history; named race results with profile links; source release and attribution; verified-only lineage list and interactive map with filters, evidence, keyboard selection and zoom. The current interface is Russian and retains its existing visual design with focused mobile/contrast fixes.

`pnpm lint`, `pnpm typecheck`, `pnpm build` and `DATABASE_URL=postgresql://... pnpm test:browser` run from the root. Browser tests start production servers on ports 3339–3341 and use real PostgreSQL with isolated, synthetic fixtures on desktop/mobile. Trace/screenshots are retained on failure.

Not yet implemented: standings and historical scoring rules, circuit configurations, media/biographies, live updates, broader language support or production hosting. Lineage can be empty until independently approved claims exist. Do not manufacture verified data for the UI.
