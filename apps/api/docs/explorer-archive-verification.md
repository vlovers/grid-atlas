# QA-02 real archive verification

The new `apps/api/test/explorer.archive.cjs` test compares the HTTP Explorer graph with independently aggregated individual rows from the pinned F1DB v2026.17.0 PostgreSQL import.

It selects four real-data scenarios: earliest observed driver season, highest constructor diversity, repeated driver/race result rows, and a season with no observed results. It checks canonical identities, deterministic ordering, distinct race counts, stable keys, provenance limitations and absence of invented connections.

Run it after importing the complete pinned archive and building the NestJS API, using the Node test runner. It requires `DATABASE_URL` to point to a disposable PostgreSQL database. The test reads data only.

**Not yet executed or enforced by CI.** A workflow edit was blocked during this review. QA-02 remains incomplete until the test passes against the pinned import and is wired into the F1DB integration workflow.

This checks consistency with imported records, not independent historical accuracy.
