# Historical read API

NestJS / PostgreSQL inside the pnpm monorepo. Requires Node 24, frozen workspace installation and all five migrations. Start after importing data:

```sh
pnpm --filter @grid-atlas/api build
DATABASE_URL=postgresql://... pnpm --filter @grid-atlas/api start
```

The API defaults to `127.0.0.1:3001`; `HOST` and `PORT` are configurable. `/api/health` is process liveness, not database readiness. The public API is read-only; deployment still needs private database credentials, TLS/traffic controls and operational monitoring.

| Endpoint under `/api` | Behavior |
| --- | --- |
| `/health`, `/sources` | Liveness; registered source releases and attribution |
| `/seasons`, `/seasons/:year` | Seasons and season existence |
| `/seasons/:year/races`, `/seasons/:year/lineups` | Calendar and result-derived driver/constructor lineups |
| `/drivers?q=...`, `/constructors?q=...`, `/circuits?q=...` | Literal case-insensitive substring search on display name or source ID |
| `/drivers/:id`, `/drivers/:id/seasons`, `/drivers/:id/teams` | Driver profile and result summaries |
| `/constructors/:id`, `/constructors/:id/seasons` | Constructor result summaries; wins count distinct winning races |
| `/circuits/:id`, `/circuits/:id/races` | Circuit and paginated race history |
| `/races/:id`, `/races/:id/results` | Race name/date/circuit and linked results, shared-car/retirement context |
| `/entrants/:id` | Entrant identity, distinct from constructor |
| `/lineage/network`, `/constructors/:id/lineage`, `/entrants/:id/lineage` | Verified claims only; query parameters cannot opt into private statuses |

Responses are `{data}` or, for paginated lists, `{data, limit, offset}`. Pagination limits are 1–100 and offsets 0–100000; `q` is at most 100 characters. Network output is capped at 500 verified edges. Date-only fields remain `YYYY-MM-DD`. IDs are local database IDs, not portable F1DB identifiers. BIGINT IDs and numeric points are strings to preserve precision.

Profile endpoints return 404 for missing records and 400 for malformed/bounded parameters. Empty child lists return `data: []`. Driver `starts` currently counts result rows, including non-start statuses; it must be displayed as appearances/results, not official starts. Driver-result points and constructor driver-point sums are not championship standings.

`DATABASE_URL=postgresql://... pnpm test:integration` builds and tests real HTTP behavior using a random PostgreSQL schema, then removes only that schema. Synthetic reviewed fixtures are explicitly test data, never historical publications. The root README describes complete import and startup.
