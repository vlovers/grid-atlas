# GRID ATLAS web

Next.js App Router frontend in the pnpm monorepo. Run the NestJS API with an imported PostgreSQL database before browsing dynamic pages.

```sh
corepack pnpm install --no-frozen-lockfile
API_BASE_URL=http://127.0.0.1:3001 corepack pnpm --filter @grid-atlas/web dev
```

Open http://localhost:3000. The server-side API URL defaults to http://127.0.0.1:3001. The Next.js server performs requests directly; it does not require public CORS access to the API. The dynamic archive pages are fetched with 1-hour revalidation. For a local database that is updated frequently, restart/dev refresh or configure a shorter revalidation.

This is a first navigable prototype, not a full historical site. Drivers show the first 100; races show up to 100 results, no advanced search, author photos, copyright validation, or live race-data updates.
