# Legacy History Explorer product drafts — reconciliation

Reviewed 20 October 2026 against merged Grid Atlas `main`. Source:
[Draft PR #59](https://github.com/vlovers/grid-atlas/pull/59), six **documentation-only**
files. This document preserves useful product decisions and open questions without
treating old API sketches or unreviewed audit findings as the current implementation.

## Material worth preserving

- **Golden driver journey:** read three accurately labeled recorded-result facts,
  choose season and constructor, inspect actual race evidence, navigate back, switch
  locale and retain focus. A real bilingual driver profile is an important acceptance
  scenario; biography/images must not be fabricated or auto-published.
- **Three depth levels:** quick facts for a newcomer, season-level relationship
  exploration, and direct evidence/primary-source drilldown where available.
- **Explicit semantic boundary:** imported result association does not prove
  contracts, starts, employment, legal succession, relationships or rivalries.
  Independently reviewed editorial lineage stays separate and verified-only.
- **Accessibility:** semantic list must provide full access when SVG is too dense.
  Keyboard, reduced motion, narrow screens and language switch are acceptance gates.
- **Provenance and update limitations:** entity observations and release checksum
  prove import integrity but not independently cited per-result historical facts.
- **Potential performance follow-up:** measure real production-sized SQL query
  cost with `EXPLAIN (ANALYZE, BUFFERS)` before speculative indexes.
- **Career chronology caution:** if first/last race queries order by round alone,
  inspect deterministic tie-breaking for multiple races in the same round.

## Ideas already addressed since the draft

| Legacy requirement | Current evidence |
| --- | --- |
| Driver and constructor one-hop seasonal observed-result graph | merged #89–#94 |
| Inspector, selected evidence and exact race list | merged #92, #95–#102 |
| Shareable selection and reciprocal traversal | merged #98–#101 |
| Explicit cap and accessible list beyond 25 results | merged #120, verified real 1960 case |
| UK/EN desktop/mobile real archive journeys | merged #111–#114, #116 |
| Compare two seasons without inferred transfers | API merged #117/#119; UI draft #118 |

## Do not copy verbatim into main

- The original speculative API fields (`sourceIds`, `validSeasons`,
  `driver_competed_for_constructor`) are **nonbinding designs**, not contracts
  for currently implemented endpoints.
- Assertions that profile API, locale routing, graph, evidence or page components
  are not on main were time-specific and no longer hold.
- Original implementation instructions referencing parallel agents and PR #60/#61
  are stale.
- Earlier static audit observations about other modules must be reverified on
  current code before filing correctness issues.

## Still open

- Independently verified editorial biography pilot: [#107](https://github.com/vlovers/grid-atlas/issues/107), Draft [#71](https://github.com/vlovers/grid-atlas/pull/71).
- Time Machine UI: [#106](https://github.com/vlovers/grid-atlas/issues/106), Draft [#118](https://github.com/vlovers/grid-atlas/pull/118).
- Release operational gates: [#104](https://github.com/vlovers/grid-atlas/issues/104).
- Centralizing UK/EN strings in the Explorer and verifying language-state
  persistence deserves a scoped follow-up, not an unreviewed large refactor.

The six originals remain accessible in PR #59's diff. After review of this
reconciliation, it is safe to **close the stale docs PR as superseded** rather
than merging its inaccurate current-state instructions. This document does
not independently verify those original code-audit allegations.
