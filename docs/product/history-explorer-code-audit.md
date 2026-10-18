# History Explorer — Existing Code Audit and Implementation Slices

Date: 2026-10-19  
Status: code-reviewed against `main` at the start of the three parallel agent workstreams. This is a **static source audit**, not a runtime validation.  
Companion: [History Explorer product specification](history-explorer.md).

## What already exists

- `apps/web/src/app/lineage/lineage-explorer.tsx`: searchable, sortable, entity-kind-filtered **verified lineage claims** with list/map toggle and source links.
- `apps/web/src/app/lineage/lineage-network.tsx`: custom SVG directed graph with layered layout, edge-type patterns, selection inspector, focus/depth filters and zoom.
- `apps/api/src/historical.controller.ts`: independently reviewed constructor/entrant lineage endpoints; season lineups; driver teams/seasons; constructor seasons; race details/results and circuit history.
- `docs/architecture/team-lineage.md`: explicit constraints against conflating entrant/constructor identity, inferred legal succession and unsourced transitive claims.

**Conclusion:** do not replace the lineage explorer with an all-purpose graph. Keep it as the specialized, verified-only historical succession view. Build cross-entity exploration separately, reusing verified imported facts and existing endpoints where possible.

## Confirmed gaps and risks

| Priority | Observation | Consequence / action |
| --- | --- | --- |
| P0 | Existing lineage UI contains Russian literal strings and links without locale prefixes. | Localization agent owns fixing this. Do not edit these routes in the Explorer branch while localization is in progress. |
| P0 | `/lineage/network` returns verified claims only, currently no verified records. | Do not use this endpoint as the source of ordinary driver/team/race connections; do not insert fake lineage edges to populate a demo. |
| P0 | No cross-entity explorer contract or focused API. | Start with a typed, bounded one-hop read model built from imported observations, then add reviewed lineage as an optional distinct layer. |
| P1 | Existing SVG graph derives its layout from the full edge set before focus filtering. | Focus dims unrelated edges rather than reducing layout complexity; an explorer must query and render a bounded neighborhood. |
| P1 | Directed-layer layout uses a fallback for cycles; positions depend on available edges. | Test cycles, multiple parents, parallel edges, stable positions and layout bounds before considering reuse. |
| P1 | Graph selection state, focus, zoom and depth are in local React state, not URL state. | A new explorer needs shareable focus/season and browser back/forward restoration. |
| P1 | Nodes are drawn as SVG text/rectangles; edge groups carry keyboard handlers, with a list alternative. | Verify screen-reader/keyboard usability in real browser tests; favor semantic list/card navigation on mobile. |
| P1 | Existing `seasonLineups` provides driver–constructor co-participation by season; `driverTeams` and race results provide further observed joins. | Reuse precise evidence, but do not label a result-row count as official starts or infer rivalries from co-participation. |
| P2 | Network `LIMIT 500` lacks a truncation indicator. | Return an explicit `truncated` flag for any bounded explorer result; no silent omission. |
| P2 | Existing line/node sizing and long-label truncation are hardcoded in SVG. | Revisit after measuring real-data densities and mobile usability; avoid speculative graph-library migration. |

## Proposed relation registry (first iteration)

Use stable typed relation IDs, localized labels and explicit direction. This is a **design proposal**, not a claim of existing implementation.

| Relation ID | Source | Semantics | Publication |
| --- | --- | --- | --- |
| `driver_competed_for_constructor` | race-result driver/constructor/race IDs | Driver appeared in imported race results for a constructor in a season; not necessarily an official start | imported |
| `constructor_entered_race` | race-result constructor/race IDs | Constructor has imported result rows for a race | imported |
| `driver_recorded_result_in_race` | race-result driver/race IDs | Imported result row exists; may include retirement or shared car | imported |
| `race_held_at_circuit` | race/circuit FK | Calendar race refers to a circuit | imported |
| `race_part_of_season` | race/season FK | Race belongs to a championship season | imported |
| `constructor_renamed_to` | independently reviewed lineage claim | Narrow editorial naming transition, not proof of legal continuity | verified-only |
| `entrant_operations_succeeded_by` | independently reviewed entrant lineage claim | Narrow operations succession, not generic corporate identity | verified-only |

Do not expose `rival`, `friend`, `same_organization` or `influenced` without separate reviewed editorial evidence. Do not invent a relation for a null circuit.

## Recommended PR sequence after current agents stabilize

### HX-01 — Contract and evidence tests (API-focused)

- Inspect current database indexes, source-release references and Agent 2 profile endpoints.
- Define a discriminated typed node/edge contract and query bounds.
- Implement one **driver-centered, season-filtered** neighborhood (constructors and recorded races) from actual imported rows; deterministic ordering and capped expansion.
- Return source release, relation semantics and `truncated` when capped.
- Test exact identities, missing driver, empty season, shared-car cases, no duplicate edges and no proposed lineage exposure.

**Boundary:** API/data branch only. Coordinate with Agent 2 before touching `apps/api`; if Agent 2 is still editing it, wait for that PR to merge.

### HX-02 — Focused interaction (web-focused)

- Build a dedicated Explorer screen with URL-driven focus and season state.
- Start with semantic cards and accessible relationship list, then a compact central-node visualization.
- Reuse Agent 3 components and Agent 1 locale helpers **after** their PRs merge.
- Cover keyboard, reduced motion, mobile and back/forward restoration.

**Boundary:** new explorer route/components only; no editing active localization agent routes until merged.

### HX-03 — Temporal and contextual expansion

- Extend supported focus types to constructors, races, circuits and seasons incrementally.
- Preserve season-scoped evidence and canonical IDs; distinguish “no data” from “not yet reviewed”.
- Add deterministic next-step suggestions based on actual connections.
- Test realistic high-degree nodes, pagination, bounded rendering and provenance.

### HX-04 — Editorial journeys

- Only after sourced UA/EN editorial content exists, add short “why it matters” cards and curated historical paths.
- Do not auto-generate prose or portray historical interpretations as imported facts.

## First acceptance demo

1. Start from an existing driver profile and open Explorer.
2. See a short validated focus card and three or fewer context suggestions.
3. Select a constructor from a recorded season, inspect why it is connected and open its profile.
4. Change season without silently mixing future/past career relationships.
5. Switch between Ukrainian and English without losing focus or selected year.
6. Repeat core path with keyboard and mobile list mode.
7. With zero verified lineage edges, see no invented succession graph or suggestions.

## Immediate coordination

**Do not begin HX-01 implementation while Agent 2 owns API changes.** Request its finalized profile contract first. Similarly, defer HX-02 route integration until Agent 1 finishes localized routing and Agent 3 exposes reusable component props. This audit can merge independently as documentation; it does not modify their worktrees.

## Explicitly deferred

Deployment/hosting, public-release hardening, arbitrary coverage targets, global force graph, unsupported historical interpretations, copyrighted media and custom graph npm packages.
