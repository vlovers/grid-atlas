# Circuit pole and fastest-lap result flags

The circuit reader now reports F1DB main-race `polePosition` and `fastestLap`
flags for drivers and constructors, independently of the winning-race tables.
These are recorded classifications across the circuit's layouts. A fastest-lap
flag is not a lap time, a qualifying record, a circuit record or a bonus-point
award. Pole is not inferred from the first grid position or race finishing order.
Tied drivers remain separate; each constructor counts once per race/metric.

## Migration and import

Apply append-only migration `0017_race_result_flags.sql` before starting the new
API, then repeat the existing pinned result import. The migration's exact hash
is included in API readiness. An old schema fails readiness; no previous
migration is edited or rechecksummed.

```sh
python3 packages/database/scripts/migrate.py
python3 packages/data-importer/import_race_results.py --archive /path/to/f1db-json-splitted.zip --checksums /path/to/checksums_sha256.txt
```

The new columns default to NULL, preserving old rows and unknown states.
Source `false`, `true` and NULL retain their meanings. Each imported result
gets a flags-specific release FK, exact JSON-row locator and SHA-256 of the
canonical complete source row. That provenance supports the new flags, not a
claim that curated points/positions have been overwritten or independently
historically verified. Existing result values and display names remain intact.

The importer validates the pinned release before writing. It locks existing
result rows and checks identities. Its conflict update also checks driver and
constructor IDs at the write itself; a subsequent assertion rejects mismatches
and rolls back the entire transaction. This covers concurrent insertion into an
initially absent result slot as well as edits to an existing slot. It never
silently attaches one driver's source flags to another driver's curated result.
Identical reimports perform no flag updates. This is maintenance import logic,
not a general multi-release reconciliation policy.

A subsequent edit to a result's race, display-order slot, driver or constructor
automatically clears its flags and flag provenance. A point-only edit preserves
them. Restoring an old identity does not restore flags; a matching pinned import
must establish their provenance again.

## Coverage and public interface

`GET /api/circuits/:id/history` retains all existing fields and adds:

- `result_entries`, `pole_flags_recorded`, `fastest_lap_flags_recorded`;
- `pole_sitters` and `fastest_lap_drivers` with existing canonical profile links;
- `classification_sources` for positive flags, including release digest, locator
  and record hash. Non-positive rows are counted for coverage without sending
  every source row to the browser.

The EN/UK tables are progressively disclosed alongside win statistics. Coverage
counts only races with at least one result and non-NULL flags on every result
row. Totals count observed positive flags; missing races/flags are never silently
treated as zero. In the pinned archive all 20 fastest-lap flags for Spa 2021 are
NULL, which remains visible as incomplete fastest-lap coverage. New flags do not
approve biographies, corner names or media, and no publication switch changes.

The independent census reads original rows from the checksum-verified archive;
it does not use API aggregates or the frontend ranking function:

```sh
python3 scripts/audit-circuit-result-flags.py --archive /path/to/f1db-json-splitted.zip --checksums /path/to/checksums_sha256.txt --output /tmp/circuit-result-flags.json
```

`tests/real-archive/circuit-recorded-flags.spec.ts` compares every positive driver
and constructor total for all 72 targets with this census in both locales and
desktop/mobile browsers. Local runs may set `F1DB_ARCHIVE` and `F1DB_CHECKSUMS`;
CI uses its existing `/tmp/grid-atlas-f1db/` download. Migration tests exercise
legacy preservation, replay, unknowns, wrong identities/releases, rollback and
real PostgreSQL lock contention in owned disposable schemas.

Verification results and the exact handoff revision are recorded in the PR.
Timing imports, genuine independent historical/media approvals and production
hosting/publication remain separate outstanding mission work.

## Local verification checkpoint

Baseline: merged 72-reader PR #419 (`7d129a53`). Node 24.21.0, pnpm 10.18.3,
Python 3.13 and owned disposable PostgreSQL 17 on localhost 55483. Existing
localhost archive data and production credentials were not used for mutations.
No migration before 0017 changes. The new unpublished migration was finalized
against fresh disposable databases; no applied release checksum was rewritten.

| Check | Actual result |
| --- | --- |
| Foundation, lint, typecheck, API/Next.js production build | PASS |
| Full Node regression | 904 PASS; final readiness manifest additionally checked with all six API-reliability tests |
| Full Python regression | 471 PASS |
| Focused migration/backfill/concurrency/invalidation integration | Six PASS |
| Real source census + browser | Eight PASS: all 72 targets, 154 layout bindings and every driver/constructor flag total in EN/UK desktop/mobile |
| Real repeated pinned result import | 27,665 source rows; identical repeat reports `INSERT 0 0` |
| Final full API regression | 99 PASS, one existing skip (`pnpm test:integration`) |

The independent engineering reviewer identified the concurrent absent-slot
insertion race. The conflict-write identity guard, transactional postcondition
and actual PostgreSQL contention test resolved it. Final re-review also checked
automatic flag invalidation and readiness digest and found no blocker.
No human editorial, rights or public-release approval is asserted by this review.
