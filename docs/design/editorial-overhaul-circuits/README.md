# Circuit Experience V3 — information architecture and review candidates

Independent PR 2. Base main was audited before implementation and refreshed to preserve upstream research. Monaco/Spa research from c6d006b is **reused**, not copied into a competing editorial manuscript. No migration, archive pin, publication approval or image-rights decision changes.

## One page, six purposes

1. Hero: place, Grand Prix/season/layout counts, leading winners derived from distinct race IDs, and an exact circuit-owned historical outline.
2. Circuit history: one existing sourced introduction/capsule plus the existing identity disclosure.
3. Corner guide: existing named-corner summaries remain; the new systematic numbered model is fail-closed until independent review.
4. Memorable moments: one collection of existing public sourced stories; new candidates are private until approved.
5. Changing layouts: one year/layout explorer and optional comparison/gallery. Removed its separate all-years button chronology.
6. All Grands Prix: one server-rendered searchable archive with year/name/winner search, dates, preserved shared-car winners, source links and 25-row pagination. GET navigation works before JS.

Removed overlapping ArchiveRhythm chronology, first/middle/last journey, decade-count cards, repeated Grand Prix history, generic newcomer/brief summaries and the second results/list view. Each race now has one archive row. A selected layout's technical measurements remain a distinct disclosure: dimensions of a specific event, not another results chronology. Page-two canonical/breadcrumb/WebPage paths agree. Search pages remain noindex.

The circuit catalogue gets three equal-width cards with smaller full names, source-matched outlines, aligned image/action baselines and compact year/GP facts. No guessed geometry is substituted for a missing outline.

## Systematic model and coverage

The [checksum-verified 78-circuit coverage report](coverage.json) distinguishes **candidate coverage** from publication. Four numbered guide candidates: Monaco 19, Spa 19, Silverstone 18, Monza 11. Five narrative collections contain 27 sourced candidates: Monaco 7 and Spa 5 reused from upstream; Monza/Silverstone/Suzuka 5 each. The other 74 circuits still need official numbered-plan/naming reconciliation; legacy race-result-only prose is not counted as a corner guide. The report lists every circuit and next action.

Numbered turns, named groups and aliases are separate. Monaco retains unnamed T17; Nouvelle Chicane covers T10–11 and Swimming Pool T13–16. The F1.com article's introductory count conflicts with its own T19 section and the FIA 2025 plan: use FIA's 19 numbered turns. Modern names are scoped to an exact F1DB layout and reference year, not retroactively applied to old layouts. The historical alias list does not invent date ranges.

FIA plans were inspected for numbering; F1.com explainers supply names/origins. F1DB supplies the matching layout lengths/counts and event associations. Monaco's original local CC BY 4.0 outline has approximate editorial annotation anchors reconciled visually with the FIA plan. These are illustrative positions, never surveyed coordinates or sector/DRS telemetry. The FIA/F1 copyrighted diagram itself is not reproduced. All markers retain 44px targets; the map scrolls inside a labelled keyboard-focusable region on narrow screens, with a separate lap-order number index.

## Publication boundary and concrete local review

`circuit-release.json` is empty. No runtime flag can publish the candidates. `isCircuitEditionApproved` requires one exact bilingual content digest, distinct author/reviewer, a human approval record and date. The registry is a trusted maintained publication record, not cryptographic authentication; it must never be populated with automated or synthetic human signatures. Every text/source/layout/annotation edit changes the digest and requires review again. Current approved editions: **zero**.

New material is reviewable through the existing loopback-only editorial transport:

```sh
node scripts/preview-circuit-v3.mjs --acknowledge-unreviewed-draft --port 3468
```

The process prints a temporary opaque EN URL; UK is linked inside. It requires an explicit draft acknowledgement, binds 127.0.0.1, rejects foreign Host/public paths/non-GET requests and sends no-store/noindex headers. It cannot sign, publish or expose a normal app route. Do not expose/forward this port. Public templates reuse existing published summaries and do not import the new research as released content.

Remaining acceptance gate: independent review of exact EN/UK editions, aliases, configuration matches and Monaco annotation locations. Until then, the full new numbered diagram and 27 candidates are intentionally absent from public pages. A source check, reviewer opinion, GitHub draft or green CI is not publication approval.

## Validation and source audit

```sh
node scripts/audit-circuit-coverage-v3.mjs --archive /path/to/f1db-json-splitted.zip --checksums /path/to/checksums_sha256.txt --output /tmp/circuit-coverage.json
```

This reuses the pinned importer checksum verifier, checks complete nonduplicated numbering, and reports approval separately. Unit tests cover grouped numbers, unnamed T17, four complete guide sets, source/bilingual fields, all five collections, absent 2026 retrospectives, exact digest gates, and the guarded preview. Browser checks cover the single searchable/paged archive, locale links, layout selection, shared winners, reload/hydration, table access and responsive type. Final commands/results and screenshots are recorded in verification.md / the PR; merge/deployment remain separate.
