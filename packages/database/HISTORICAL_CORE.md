# Historical read model — phase 1

This migration introduces distinct drivers, constructors, entrants, circuits, seasons and races, without asserting corporate team lineage.

## Boundaries
- Every named entity (except season) references a namespace-scoped external identity from the provenance schema.
- `historical_races` has unique (season, round) and optional circuit/date so incomplete historical source data remains representable.
- Team succession, race entries, chassis, engine suppliers, circuit layouts, and cited historical relationships are intentionally deferred.
- This is a **source-backed staging/read model**, not a completed ontology or API contract.
- Actual imported F1DB records have **not** been tested in this migration; fixture tests verify relational behavior only.
- Migration runner is intentionally one-shot for clean databases; incremental production migration tracking is still a blocker.
