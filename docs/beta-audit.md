# Public beta audit — 19 October 2026

Scope: all applications, importer and audit scripts, five SQL migrations, database runners,
tests, workflows and documentation, starting at `c093091` and PR #56. The Next.js / NestJS /
PostgreSQL / Python importer boundaries are appropriate; no architecture replacement is needed.

| Severity | Confirmed finding and impact | Action |
| --- | --- | --- |
| High | Constructor wins counted winning driver rows, inflating shared-car victories (real examples: 1951 round 4, 1956 round 1, 1957 round 5). | Count distinct winning races in career and season summaries; real PostgreSQL regression test. |
| High | Public lineage status filtering and exact identity resolution had no HTTP / real-DB regression coverage. Some schema changes did not trigger API or real-import CI. | Add isolated PostgreSQL identity tests and HTTP tests for both entity kinds, both endpoint directions, status override attempts and revoked reviews; expand workflow paths. |
| High, release gate | No independent editorial approval for the 2021 proposed rename; no verified historical lineage data. | Keep it proposed. Obtain a separate human review under the publication runbook; never seed historical verified edges to populate the graph. |
| High, release gate | Main has neither branch protection nor repository rulesets. | Maintainer should configure required checks and review policy before public release. No settings changed by this audit. |
| Medium | No catalogue search or circuit pages. Fans must page through 917 drivers; circuits are names without navigation. | Add bounded literal substring search and paginated circuit catalogue / race history. |
| Medium | Race results omit race identity and links to driver / constructor profiles; result rows hide retirement and shared-car context. | Add race detail API and connected result pages using imported fields. |
| Medium | API 404s become generic frontend failures; missing numeric profiles do not reach the intended not-found state. | Preserve API 404 semantics through the fetch boundary. |
| Medium | Mobile header cannot wrap; lineage SVG uses white node backgrounds with pale text; controls lack layout styles; no route loading state. | Focused responsive, contrast, focus and loading fixes, preserving the explorer. |
| Medium | README / roadmap / several package docs still describe an unimplemented foundation or incomplete import slices. | Replace with executable setup, actual capabilities, source coverage and release gates alongside functional changes. |
| Medium | No checked-in dependency lockfile, lint command or browser regression suite. CI resolves dependencies afresh. | Commit a reproducible lockfile and add application lint / browser checks. |
| Medium, release gate | No production hosting, monitoring, restore rehearsal, readiness probe or public traffic controls verified. | Validate local production processes; select hosting and perform an explicit release review before external deployment. |
| Low | Repeated catalogue paging and ID validation, relation labels, importer archive verification. | Consolidate only where touched; avoid speculative rewrites. |
| Low | Python audit file handle warning; migration string escape warning. | Close the archive handle and use an explicit escaped psql command. |

## Checks and data evidence

- Node 24: foundation checks and 2 tests; API and web type checks; API and Next.js production builds passed.
- Python: all 26 existing offline tests passed; PR #56's 5 preflight unit tests passed. No standalone lint configuration existed at audit start.
- PostgreSQL 17, in a separate disposable container: versioned migration replay, append-only migration, checksum-tampering rejection, provenance and historical constraints, constructor / entrant proposed imports, atomic failure and reviewed-claim protection passed.
- Fresh official F1DB v2026.17.0 download: SHA-256 `0f1717eaebae646b7ced9ca96f6be3282c1c1d435d0a9d75f2c00f40feb7d2a8`; matches the published checksum and prior audit. Eight configured cross-collection checks have no orphans; no duplicate IDs or missing season years. This is not exhaustive historical verification.
- Real import twice: 77 seasons, 917 drivers, 187 constructors, 830 entrants, 78 circuits, 1,172 races and 27,665 race-result rows; second pass inserted no duplicate historical rows. Six Silverstone constructor IDs resolved once each. The exact proposed manifest resolves `f1db / constructor / racing-point` and `aston-martin` once each; repeated proposed import leaves one proposed claim and zero verified claims.
- The [cited Formula 1 report](https://www.formula1.com/en/latest/article/aston-martin-target-becoming-one-of-f1s-top-teams-after-racing-point-re-brand.7HpHDVaOm5Gr2SR1CWoKz6), read during this audit, describes the naming transition from the start of 2021. This supports the manifest's narrowly scoped rename proposal; it is not independent editorial approval or evidence of legal continuity with the 1959–60 Aston Martin entry.

## Minimum useful beta

Searchable drivers, constructors and circuits; navigable seasons → named races → results → profiles;
visible source release and attribution; honest empty lineage state with independently reviewed edges only;
mobile navigation, usable loading / empty / error / not-found states; reproducible import / startup;
passing API, database, frontend and production-build checks. Championship standings, circuit layouts,
biographies, live timing and broader lineage research can follow. Driver-result points are not official
championship totals; constructor identities and entrant identities remain separate.

## Implemented after the audit

PR #56 was reviewed, wired into CI and merged after both checks passed. [PR #57](https://github.com/vlovers/grid-atlas/pull/57) fixed shared-car constructor wins and added exact PostgreSQL identity and public HTTP review-filter regressions; all six workflows passed before merge.

The connected archive changes add catalogue search, circuit/race pages, source release visibility, correct missing-record handling, loading/mobile/graph fixes, a frozen lockfile and lint/browser CI. Nine API/PostgreSQL checks and fourteen desktop/mobile browser checks passed locally with production builds, including explicit outage and not-found flows. The graph fix also moves arrowheads outside node rectangles so their fills cannot obscure direction. README/roadmap/package documentation now describe the working application.

Local production acceptance also passed against the real imported archive: 77 seasons and 78 circuits, Senna search/profile navigation using the imported full name, Silverstone → the 2026 British Grand Prix → linked results, source-release display and an empty verified-only lineage state. There were no browser runtime errors or page-level mobile overflow. The proposed 2021 claim remained absent from public output. `scripts/import-f1db.sh` was replayed successfully against the same disposable release database.

Remaining: independent editorial approval; main protection rules; external deployment/traffic/readiness monitoring and backup/restore rehearsal; full source schema/semantic validation and release-update reconciliation. Driver API `starts` is still a result-row count, not a validated official start count. Claims are not append-only/audit-history enforced and database constraints cannot establish reviewer independence. No production database or historical review status was changed.
