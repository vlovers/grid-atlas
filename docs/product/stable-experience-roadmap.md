# Grid Atlas — MVP status, delivery order and release gates

Historical baseline updated 20 October 2026; implementation delta checked against main `5920465` on 23 October 2026; later parallel story work is tracked separately in the sprint audit. Production acceptance remains separate. **Code and CI state are distinct from production acceptance.**
This document records merged GitHub work and known blockers, not an approval to publish.

## Release evidence checkpoint — 24 October 2026

This checkpoint separates **merged implementation**, **reproducible verification**, and **independent release approval**. Earlier sections preserve their dated historical baselines; do not interpret an old PR/issue snapshot as today's queue.

| Gate | Current evidence | Still required |
| --- | --- | --- |
| Open PR queue | Recheck live GitHub PRs before every merge; the queue was empty at this checkpoint | Never infer future queue status from this document; verify final head SHA and required CI before merging |
| F1DB identities | Five staged media subjects mapped to original pinned F1DB v2026.17.0 records; source-record SHA-256 checks exist | Independent verification of historical claims and image subject/context |
| Commons original bytes | Two locally computed binary SHA-256 observations (Schumacher, Alonso), recorded in [verified-original-observations](../media/verified-original-observations.json) | McLaren MP4/4, Ferrari F2004, Silverstone originals remain unverified; do not substitute source-record hashes |
| Rights and imagery | Five research candidates; no human-approved photographic publication records | Independent source/creator/license/derivative-chain/subject review; bilingual captions and accessibility review; no premature publication |
| Circuit artwork | 160 attributed pinned historical SVG illustrations, separate from photographs | Preserve attribution and exact-layout mapping; do not present illustrations as surveyed geography |
| Browser confidence | Existing synthetic browser coverage and historical API/archive checks | Review actual real-import UK/EN desktop/mobile/keyboard flows, Lighthouse and screen-reader checks; confirm deployed origin |
| Production | Code/CI readiness is not deployment approval | Hosting, protected main, credentials, TLS, backups and restore rehearsal, observability, sitemap/robots/canonicals on actual domain (issue #104) |

### Next independent work packages

1. **Original-byte research:** manually run one pending Commons original per dispatch after rate limits clear. Keep files in private ephemeral storage, export only research receipts, record SHA-256 and exact source provenance. A hash is not a license.
2. **Rights-gated visual acceptance:** with no approved photographs, inspect the real driver/constructor/circuit fallback states and existing licensed SVGs in UK/EN. Fix visible responsive, keyboard, focus, alt-text, layout-shift and SEO regressions without inventing media approvals.
3. **Human review handoff:** use the offline bilingual review worklist to collect independent creator, derivative-chain, historical-subject and rights decisions. Do not self-approve or copy research candidates to publication.
4. **Beta operations:** resolve issue #104 and demonstrate actual deployment checks. A green GitHub Actions run alone does not satisfy the release gate.

## Merged product delta — 22 October 2026

- Circuit Experience V2 added event-linked layout identities, sourced technical history, and UK/EN circuit pages. [V2 contract](circuit-experience-v2.md).
- Circuit Graphics V3 added 160 pinned historical SVG layout assets with explicit CC BY 4.0 provenance; see [SVG attribution and source limits](../media/historical-circuit-svg-provenance.md).
- [PR #201](https://github.com/vlovers/grid-atlas/pull/201) merged the V4 chronological year explorer, year-specific layout selection, keyboard/accessibility improvements and real-archive coverage. This is **implemented in main**, not a pending feature.
- Historical circuit geometry is an attributed illustration, **not** a measured geographic map. Missing sector/DRS/tyre/elevation facts are not inferred.
- The latest merged feature is not proof of production deployment, independent FIA verification, or editorial approval.

## Current stabilization and dossier milestone — 23 October 2026

- Race constructor field (#214) and reviewed repository hygiene (#203) merged only after green CI. The latter fixes an actual broken documentation link and worktree/symlink-safe link auditing.
- Source-reported championship classifications (#197), historical circuit selection/rendering (#201/#207), Editorial Racing dossiers (#205), archive journeys (#206), driver density/season charts (#208/#209) and the career rail (#213) are already implemented.
- Visual Storytelling V2 extends existing career APIs with a shared accessible participation calendar, adjacent recorded roster comparisons, exact race evidence and a compact milestone chronology. See [screenshots and implementation](../design/visual-storytelling-v2/README.md).
- [Current audit](../sprint-audit-2026-10-23.md) distinguishes passing archive checks from operational release approval. [Media readiness](../media/approved-imagery-workflow.md) does not approve photographs or manuscripts.

## Editorial release V1 review candidate

The [five-driver release](../editorial/releases/v1/README.md) adds canonical UK/EN record journeys and source-located chapter rendering, consolidates ten unapproved dossiers and reuses the merged #178 approval/export pipeline. This candidate does not approve historical biographies, media or production deployment. See its verification report for executed checks.

## Implemented in main

| Area | Relevant merged PRs | Actual boundary |
| --- | --- | --- |
| Pinned historical archive, ingestion and linked catalogue/race/profile pages | baseline through #67 | F1DB v2026.17.0; result-based summaries remain distinct from separately imported source championship classifications |
| Driver → constructor and reciprocal constructor → driver seasonal result associations | #66, #89, #93, #94 | Observed result records, not contracts or official starts |
| Strict Explorer graph contract and accessible radial display | #87–#90 | Bounded view with full-list fallback and explicit imported-data limitations |
| Edge inspector and exact race-evidence drilldown | #92, #95, #96 | Distinct recorded races vs result rows; no per-result primary-source citations |
| Responsive polish, selected edge URLs and neighbor navigation | #97–#99 | Synthetic desktop/mobile browser coverage; real-archive audit pending |
| Reciprocal-focus traversal and shareable relationship links | #100, #101 | Year and canonical identities preserved across two-way navigation |
| Result-count explanation in inspector | #102 | User-facing clarification without official starts or career-win inference |
| Real pinned import, SQL parity, browser acceptance and reproducible report | #111–#114, #116 | Verified consistency on sampled actual archive rows; not independent historical fact-checking |
| Time Machine season comparison API, UK/EN UI and browser coverage | #117, #119, #124 lineage | Read-only observed results; synthetic UI tests are not real-archive visual acceptance |
| Paginated complete association list beyond initial radial graph | #120 | 34-association 1960 stress case: all accessible; SVG still limited to 10 |
| UK/EN archive routing, sources, SEO groundwork | existing merged work | External domain, Search Console and production crawl not verified |
| Driver profile visual/navigation foundations | #140–#144 | Story reader is private by default; licensed-media registry does not imply approved images; accessible section navigation and compact career overview merged |

## Historical editorial and interface PR notes (status at time of original audit)

- [PR #124](https://github.com/vlovers/grid-atlas/pull/124): historical Time Machine UI implementation; PR is closed and equivalent feature files are present in `main`. Do not re-merge its divergent branch. Real-import visual acceptance remains outstanding.
- [PR #71](https://github.com/vlovers/grid-atlas/pull/71): sourced Senna biography draft; **independent editorial review required**, no automatic publication.
- [Issue #145](https://github.com/vlovers/grid-atlas/issues/145): historical Senna showcase tracking issue. Later design and dossier work merged; reassess the issue acceptance criteria against current `main` before closing.
- [PR #59](https://github.com/vlovers/grid-atlas/pull/59): **closed, superseded without merge** after retaining distinct useful notes in the [legacy specification review](legacy-explorer-spec-review.md). Old API sketches are not current contracts.

## Prioritized work items

### P0 — release confidence and operational gates
1. [#103](https://github.com/vlovers/grid-atlas/issues/103) **Completed:** pinned F1DB import, SQL/API parity, UK/EN browser acceptance; [recorded evidence](../real-archive-acceptance-2026-10.md). Synthetic CI success is not historical proof.
2. [#104](https://github.com/vlovers/grid-atlas/issues/104) Protected main and required checks, hosting/domain, DB readiness, private connectivity, TLS, observability, rate limits, backup **restore rehearsal**, SITE_URL, sitemap production checks.

### P1 — useful product differentiation
3. [#105](https://github.com/vlovers/grid-atlas/issues/105) **Completed:** bounded Time Machine backend and PostgreSQL boundary tests; [contract](../api/time-machine-comparison.md).
4. [#106](https://github.com/vlovers/grid-atlas/issues/106) **UI present in main; acceptance outstanding:** bilingual comparisons, deep links, accessibility and evidence traversal require final real-import visual review.
5. [#107](https://github.com/vlovers/grid-atlas/issues/107) Editorial pilot: independently source, fact-check and approve bilingual biographies. Source attribution for imported identities is **not** a citation for biography claims.
6. [#108](https://github.com/vlovers/grid-atlas/issues/108) Reconcile stale draft docs, synchronize project status and track whether to centralize inline Explorer translations.
7. [#115](https://github.com/vlovers/grid-atlas/issues/115) **Completed:** browse all large constructor-season result associations using bounded pagination (#120).

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
