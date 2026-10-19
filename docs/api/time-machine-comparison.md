# Time Machine comparison API (read-only)

The first version shipped in [PR #117](https://github.com/vlovers/grid-atlas/pull/117).
This reference documents the implemented contract; it does **not** assert
contracts, employment, transfers, official starts or corporate succession.

## Endpoints

- `GET /api/explorer/drivers/:id/compare?fromYear=1950&toYear=1951`
- `GET /api/explorer/constructors/:id/compare?fromYear=1950&toYear=1951`

`:id` is a canonical positive PostgreSQL BIGINT, not an F1DB external ID.
Both years are distinct, four-digit values between 1950 and 2200 inclusive.
A missing/malformed input or equal years responds 400; absent focus 404.
Comparisons exceeding the 500 distinct-neighbor bound or 1,000 grouped
neighbor-year rows respond **422**, rather than silently omitting associations.

## Success response shape

```json
{
  "data": {
    "focus": { "entity_type": "driver", "entity_id": "1", "name": "Example driver" },
    "from_year": 1950,
    "to_year": 1951,
    "added": [],
    "removed": [],
    "unchanged": [
      {
        "entity_type": "constructor",
        "entity_id": "2",
        "name": "Example constructor",
        "from": { "result_entries": 2, "races": 1, "winning_races": 0 },
        "to": { "result_entries": 1, "races": 1, "winning_races": 0 }
      }
    ],
    "provenance": "imported-main-race-results",
    "limitations": [
      "seasonal_observations_not_contracts_or_transfers",
      "absence_of_record_not_proof_of_absence",
      "race_results_not_official_starts",
      "constructor_identity_not_entrant_or_legal_continuity",
      "no_individual_result_row_provenance"
    ]
  }
}
```

The example is a **synthetic shape illustration**, not a published F1 historical
claim. For constructor focus, `entity_type` of each neighbor is `driver`.
Objects contain the imported counts for each observed year; a `null` `from`
or `to` means **no imported result association in that season**, not proof
the actual relationship was impossible.

`added` = records seen only in `to_year`; `removed` = only in
`from_year`; `unchanged` = present in **both** (the counts can still differ).
Ordering is deterministic by canonical neighbor ID; the snapshot is
`REPEATABLE READ READ ONLY`. The comparison is read-only and inserts no
metadata or editorial claims.

## Testing and boundaries

- The [Historical API workflow](../../.github/workflows/api.yml) runs synthetic
  PostgreSQL integration tests for observed changes, shared-car result rows,
  empty years, 400/404 validation, and explicit 422 rather than partial results.
- The [real F1DB workflow](../../.github/workflows/real-archive.yml) independently
  compares 1950/1951 Time Machine output against single-season Explorer graphs
  on pinned F1DB v2026.17.0.
- Source identity attribution is **not independent per-row result provenance**.
  Only imported main-race results participate. Other race classes and uncertain
  historical coverage are not inferred.
- Graph lists have their own independent 25-neighbor bound; see
  [#115](https://github.com/vlovers/grid-atlas/issues/115).
  Time Machine UI is tracked under
  [#106](https://github.com/vlovers/grid-atlas/issues/106).
