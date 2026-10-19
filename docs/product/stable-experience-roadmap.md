# Grid Atlas — MVP status, delivery order and release gates

Updated 20 October 2026. **Code and CI state are distinct from production acceptance.**
This document records merged GitHub work and known blockers, not an approval to publish.

## Implemented in main

| Area | Relevant merged PRs | Actual boundary |
| --- | --- | --- |
| Pinned historical archive, ingestion and linked catalogue/race/profile pages | baseline through #67 | F1DB v2026.17.0; result-based summaries rather than official standings |
| Driver → constructor and reciprocal constructor → driver seasonal result associations | #66, #89, #93, #94 | Observed result records, not contracts or official starts |
| Strict Explorer graph contract and accessible radial display | #87–#90 | Bounded view with full-list fallback and explicit imported-data limitations |
| Edge inspector and exact race-evidence drilldown | #92, #95, #96 | Distinct recorded races vs result rows; no per-result primary-source citations |
| Responsive polish, selected edge URLs and neighbor navigation | #97–#99 | Synthetic desktop/mobile browser coverage; real-archive audit pending |
| Reciprocal-focus traversal and shareable relationship links | #100, #101 | Year and canonical identities preserved across two-way navigation |
| Result-count explanation in inspector | #102 | User-facing clarification without official starts or career-win inference |
| UK/EN archive routing, sources, SEO groundwork | existing merged work | External domain, Search Console and production crawl not verified |

## Remaining unmerged drafts and editorial reviews

- [PR #102](https://github.com/vlovers/grid-atlas/pull/102): **merged** after Foundation and Next.js web CI passed; result-count explanations are in main.
- [PR #71](https://github.com/vlovers/grid-atlas/pull/71): sourced Senna biography draft; **independent editorial review required**, no automatic publication.
- [PR #59](https://github.com/vlovers/grid-atlas/pull/59): old Explorer product draft; **six documentation files are not in main**; audit their unique useful material before closing.

## Prioritized work items

### P0 — release confidence and operational gates
1. [#103](https://github.com/vlovers/grid-atlas/issues/103) Fresh checksum-validated pinned F1DB import in disposable PostgreSQL, API/web restart, SQL parity and real-archive UK/EN mobile/desktop/keyboard Explorer acceptance. Synthetic CI success is not historical proof.
2. [#104](https://github.com/vlovers/grid-atlas/issues/104) Protected main and required checks, hosting/domain, DB readiness, private connectivity, TLS, observability, rate limits, backup **restore rehearsal**, SITE_URL, sitemap production checks.

### P1 — useful product differentiation
3. [#105](https://github.com/vlovers/grid-atlas/issues/105) Time Machine backend delivered in [PR #117](https://github.com/vlovers/grid-atlas/pull/117); the read-only contract, deterministic diff, bounds and provenance limits are documented in [the API reference](../api/time-machine-comparison.md).
4. [#106](https://github.com/vlovers/grid-atlas/issues/106) Time Machine bilingual UI, deep links, accessibility, reduced motion and evidence traversal. The UI is under review in a Draft PR; the separate genuine-import review journey is documented in [time-machine-real-import-journey.md](time-machine-real-import-journey.md).
5. [#107](https://github.com/vlovers/grid-atlas/issues/107) Editorial pilot: independently source, fact-check and approve bilingual biographies. Source attribution for imported identities is **not** a citation for biography claims.
6. [#108](https://github.com/vlovers/grid-atlas/issues/108) Close stale draft work only after reconciliation; synchronize all product/technical status docs and consider centralizing Explorer UI translations.

## Non-negotiable content boundaries

- **Result row ≠ distinct race ≠ official race start**; constructor-point sums ≠ official standings.
- Driver, constructor and entrant are distinct canonical identities; constructor association ≠ contract or legal succession.
- F1DB checksum proves byte integrity, **not historical truth or row-level provenance**.
- Only independently reviewed verified lineage is publishable. The Racing Point → Aston Martin 2021 candidate remains proposed.
- Missing evidence is not proof an event never occurred. A season comparison reflects the **imported result coverage** only.
- No invented biographies, editorial approvals, images, logos or historical citations.

## Acceptance milestone: first public beta

- Pinned import reproducible, migration/startup and real-archive human acceptance documented.
- CI green for affected areas (Foundation, API/PostgreSQL, real import, web browsers) and branch protections verified.
- UK/EN key journeys work on desktop, mobile and keyboard; error, zero-data, truncation and source-limits states are honest.
- At least a small **independently verified** editorial slice ready, or explicitly ship a statistical archive without claiming biographies.
- Domain and host selected, DB credentials private, TLS, production readiness/alerting and backup restore demonstrated.
- Canonicals, robots, sitemap and actual public API verified on real origin before indexing.

Time Machine and broad biography coverage are **product goals**, not excuses to delay basic correctness or release safety. Dates and percentages are planning estimates, never verified delivery evidence.
