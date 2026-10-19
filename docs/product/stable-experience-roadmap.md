# Grid Atlas — History Explorer delivery status and next steps

Updated 19 October 2026. This status reflects the merged GitHub PRs; it is not a production deployment approval.

## Implemented in main

| Scope | Merged PR | Boundary |
| --- | --- | --- |
| HX-01 driver → constructor one-hop season associations | #66 | Recorded result association, not official race starts or contracts |
| Golden driver career page | #67 | Summaries and timeline derived from imported records, separate reviewed editorial content |
| HX-02 integration contract | #87 | Lists acceptance criteria and data limitations |
| Strict graph payload validator | #88 | Preserves BIGINT IDs as strings, validates nodes, edges and provenance |
| Driver-focused Explorer page, season URL, list and navigation | #89 | Localized Ukrainian/English route; no reciprocal constructor focus |
| SVG radial graph v1 | #90 | Keyboard-linked constructors, capped visual nodes; accessible full list remains |

## Remaining priorities

### P0 — independently verify release quality
1. Run fresh pinned-dataset import and restart, then end-to-end real-archive golden journey. Synthetic PostgreSQL/browser CI establishes behavior, **not** historical content correctness.
2. Check narrow viewport, keyboard navigation, reduced motion, graph legibility and graph/list parity on real content.
3. Keep editorial lineage in the verified-only view, separate from imported result associations. Audit actual copy/claims against source registry before publication.
4. Review and resolve redundant old Draft PRs without treating previous code-audit notes as current runtime verification.

### P1 — finish the core exploration journey
1. Connection inspector: focus, type, observed-result counts, year and source-scope caveat; synchronized selected edge in graph and list.
2. Reciprocal constructor → driver season endpoint and page, preserving constructor/entrant identity separation.
3. Race-level evidence drilldown with result-row vs distinct-race semantics and accurate provenance.
4. URL focus/year restoration and keyboard/mobile browser regression tests for all supported directions.
5. Localize Explorer strings through the existing next-intl message dictionaries and keep parity tests.

### P2 — differentiate through evidence and interaction
1. Time Machine: compare independently observed seasonal associations with explicit additions/removals.
2. Reviewed, bilingual, source-linked historical journeys; no auto-generated biography claims.
3. More polished responsive visual presentation with purposeful motion and reduced-motion fallback; no unlicensed official F1 branding or media.

## Release gate

A clean local import and restart succeed; Node/typecheck/lint/build, integration and browser tests pass; a **real archive** driver → constructor → Back journey is manually verified in both languages, on mobile and keyboard. Season and canonical identity persist in URLs. Unknown is not zero; recorded results are not called official starts; source attribution is not falsely presented as per-result evidence. No unverified lineage becomes a factual edge.

See [the HX-02 contract](hx02-explorer-ui-contract.md) for strict response rules and [the October competitor notes](competitor-landscape-2026-10.md) for earlier positioning hypotheses.
