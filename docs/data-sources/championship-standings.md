# Source-reported F1DB championship standings

**Scope:** F1DB v2026.17.0, CC BY 4.0 with archive attribution. Driver and constructor season classification rows are imported from the pinned checksum-checked `f1db-seasons-driver-standings.json` and `f1db-seasons-constructor-standings.json`, **not** calculated from race results.

- Migration: `0010_championship_standings.sql`.
- Import: `packages/data-importer/import_championship_standings.py`, run after entities.
- APIs: `/api/seasons/:year/standings/drivers`, `/api/seasons/:year/standings/constructors`, `/api/drivers/:id/championships`, `/api/constructors/:id/championships`.
- Web: UK/EN season classifications, historical driver and constructor classification tables.
- Source metadata: release identity, checksum, per-row JSON SHA-256, exact archive locator; constructor engine IDs preserved.
- Season 2026 is **provisional** in this pinned October 2026 release; champion badges are not shown. Never infer final titles from ongoing rankings.
- Before 1958, constructors did not have a Constructors' Championship. Empty tables are valid and must not be represented as zero titles.
- Imported F1DB classifications are source-reported. They are not *independently verified* FIA records or a substitute for a documented year-by-year FIA cross-check.

## Existing installations

Apply migration 0010, then rerun the pinned full importer with the published checksum list. Use a disposable PostgreSQL database for verification before production; no production deployment is implied. The importer is repeatable and checks entity references and archive SHA-256.

## Release acceptance

Run Node/Python, migrations, API/PostgreSQL, and real-archive CI, and review actual generated values (including shared drives, disqualifications, drop-score eras, and constructor/engine variants) before merging. Do not merge while CI is red. Images, circuit geometry and separate technical evidence are unchanged.
