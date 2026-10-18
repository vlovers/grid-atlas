# Historical Career API — Independent Review Notes

Date: 2026-10-19. Scope: static code and migration inspection of [PR #60](https://github.com/vlovers/grid-atlas/pull/60) at `1c905fc`. **Not a runtime test, approval or merge authorization.** No changes made to the agent's branch.

## Verified against source

- Driver and constructor read endpoints use a closed server-side table/column registry; client ID and locale validation is explicit.
- Identity, summary, participation and milestones are queried inside a read-only repeatable-read transaction.
- Aggregate `COUNT(DISTINCT rr.race_id)` avoids counting multiple driver/race result rows as multiple races.
- `SUM(rr.points)` remains nullable, distinguishing unknown values from known zero.
- `historical_race_results` has indexes on `driver_id` and `constructor_id` (migration `0003_race_results.sql`), plus `UNIQUE(race_id, position_display_order)`.
- Source observations are scoped to the exact external identity and matching source, but do **not** provide per-result provenance; the API explicitly documents that limitation.
- Editorial content returns null in both supported locales; no fabricated biography or approved lineage is introduced.
- Synthetic PostgreSQL fixtures cover duplicate driver/race entries, shared-car winners, noncontiguous seasons, null points, identity separation and BIGINT string IDs.

## Findings and targeted follow-up

### R1 — Deterministic first/last ordering (minor correctness)

`participation` picks `first_race` and `last_race` via ordered `array_agg` using season round and position display order. The database guarantees `UNIQUE(race_id, position_display_order)`, but does **not** guarantee one race per `(season_year, round)`. Add a stable `r.id` tie-breaker (and preferably `rr.id`), or document and enforce the stronger invariant. Extend fixtures to include same-round races if that ambiguity is intentionally supported.

The `milestones` CTE also selects a single first/last race by `season_year, round` without a tie-breaker. Use `r.id` in the ordering, so identical season/round values have deterministic selection.

### R2 — Avoid overstating archive completeness (integration guard)

The career summary is derived from imported main-race result rows. It is not an official starts count, all-event participation count or championship classification. Localized UI must display the limitation close to the metric, not buried behind an unrelated help page.

### R3 — Provenance boundaries (integration guard)

`observations` describe entity imports. Never attach their artifact hash to an individual result, win or race relationship as though it were row-level evidence. The Explorer can describe its edges as derived from the pinned archive, with an explicit limitation until result-level provenance is implemented.

### R4 — Query cost must be measured, not guessed (future work)

Career endpoints execute several grouped queries and milestone aggregates over result rows. Indexes exist on the two relevant FK columns. Before expanding this into a general Explorer endpoint, run `EXPLAIN (ANALYZE, BUFFERS)` against representative full-archive profiles with a disposable database, including a high-activity driver and constructor. Record the actual plan and timings; add composite indexes only when measured need warrants it. The 27,665-row pinned archive is modest, so no speculative migration is justified.

### R5 — Integration route boundary

The current career API returns *all* season/related-entity participation, but not a bounded one-hop graph or a list of every race in a season. A client can derive season→constructor cards without an API change; race expansion requires a separate scoped query or a careful reuse of existing endpoints. Do not pretend `first_race` / `last_race` enumerate all races.

## Review gate

1. Agent 2 responds to PR review and adds deterministic ordering regression or demonstrates the invariant.
2. CI green on the latest PR head.
3. No UI claims “official starts” from `result_entries` or `races`.
4. Provenance language remains precise.
5. Merge independently of localization and discovery UI once approved.

## Suggested post-merge test

Create a dedicated API Explorer contract test using the real imported archive (not fabricated source claims), and validate that a driver-focused selected-season neighborhood contains exactly the distinct canonical constructors with recorded result rows in that season. Verify empty season, no lineage edges and deterministic stable keys. This is HX-01's smallest meaningful backend slice.
