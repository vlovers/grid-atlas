# Grid Atlas read-only NestJS API

Experimental backend in the pnpm monorepo. Requires Node 24, pnpm, and PostgreSQL with migrations 0001–0003 applied. Dataset is imported separately using the existing verified F1DB loaders.

```sh
corepack pnpm install --no-frozen-lockfile
corepack pnpm --filter @grid-atlas/api build
DATABASE_URL=postgresql://... corepack pnpm --filter @grid-atlas/api start
```

Endpoints: `GET /api/health`, `GET /api/seasons`, `GET /api/seasons/:year/races`, `GET /api/drivers`, `GET /api/races/:id/results`.

List endpoints return `{data, limit, offset}` (seasons only `{data}`). Lists are paginated (limit 1–100, offset 0–100000). Race ID is a **local database ID**, not F1DB's external race ID. BIGINT IDs and numeric points are strings in JSON to preserve precision. This is intentionally read-only. Authentication and public rate-limiting are not yet implemented; deploy only behind appropriate protections.
