# Entity completeness matrix V1 — editorial and UX audit

**Snapshot:** 2026-10-23 pinned F1DB v2026.17.0 main-race scope. This is a *coverage framework*, not a claim that all 917 biographies were manually reviewed. Do not conflate imported records, pages that render, approved narrative text and licensed photographs.

## Coverage denominators and caveats

| Scope | Pinned archive count | Verified import contract | Editorial/media conclusion |
| --- | ---: | --- | --- |
| Drivers | 917 | Source records and route identities compared | Full biography coverage **unknown**, photographic publication **0** |
| Constructors | 187 | Source records and reciprocal records compared | Constructor history and car media completeness **unknown** |
| Circuits | 78 | Source records and exact circuit/layout facts compared | Venue-photo publication **0**; 160 separately attributed SVGs are not photos |
| Races | 1,172 | Main-race records compared | Not every race has a reviewed editorial description |
| Results | 27,665 | Main-race result rows compared | Statistical observations, not narrative claims |

Counts above originate in `docs/sprint-audit-2026-10-23.md` and `docs/design/visual-storytelling-v2/coverage.json`. Distinct entrants are not constructor identities. Of the drivers, 57 have no recorded main-race result; one constructor has none. These are valid identities with explicit absence of recorded results, not errors to hide.

## Independent completeness dimensions

Use **five independent flags** per canonical entity rather than a single `complete` boolean:

1. `identity`: exact F1DB ID, alias/nationality/era support and confidence.
2. `archive`: route/API response, results, years and reciprocal link integrity.
3. `editorial`: `absent | draft | evidence_review | approved | published`; UK/EN independently.
4. `media`: `none | candidate | verified` per kind and context; source/rights separate from identity.
5. `ux`: `untested | tested_with_gaps | accepted` per locale and viewport.

The publication status must come from the actual existing dossier and review sidecar, not a guess based on route text. Media `verified` must come from `apps/web/src/components/media/publication.json` with valid review, not Commons metadata. Keep `circuit SVG` in its own attributed artwork lane.

## Tiered editorial queue

| Tier | Subjects | Why first | Review requirement |
| --- | --- | --- | --- |
| P0 | Senna, Fangio, Hamilton | Existing canonical identity snapshots and portrait candidates; representative eras | Claim-by-claim UK/EN biography review, photo rights and precise race/constructor links |
| P0 | McLaren, Ferrari | Strong historical navigation value; driver/constructor associations already in product | Constructor/entrant semantics, year-specific car identity and approved photography |
| P0 | Monaco | Two exact historic layouts in identity snapshot and existing full layout manifest | Era-specific race links, SVG attribution, separate venue photo |
| P1 | Other championship-era drivers and constructors | Cross-era discoverability and visual coverage | Prioritize on verified archive relationships, not fabricated rankings |
| P1 | Monza, Silverstone and other heavily linked venues | Circuit coverage across eras | Historical layout mapping, photo context, source checks |
| P2 | Remaining long-tail subjects | Complete navigability and honest gaps | No auto-generated unsourced biographies; structured record remains public |

These are prioritization suggestions, not assertions that all subjects have reviewed narratives.

## Subject acceptance record (repeat per canonical external ID)

| Field | Meaning |
| --- | --- |
| `subject.type`, `subject.id` | Exact pinned archive entity, never local sequence ID |
| `locale` | `uk` or `en`; both required for final acceptance |
| `identity.source` | Exact source record and version |
| `archive.coverage` | Observed race/season/constructor link counts with semantics |
| `editorial.dossier_path` | Existing v1 dossier file and human review sidecar, if any |
| `editorial.claims` | Counts by review status; not a fabricated completeness percentage |
| `media.photograph` | Candidate vs approved, context/year and exact file page |
| `media.circuit_layout` | Pinned layout mapping, separate from photography |
| `ux.journeys` | Locale, viewport, exact URLs, result and screenshot evidence |
| `blockers` | Missing citations, disputed identity, absent rights, broken links |
| `reviewer` | Human decision only, if actually performed |

## Audit procedure for Codex/QA integration

1. Resolve canonical subject IDs and expected relationships from the pinned F1DB archive. Record source release/hash.
2. Inspect published editorial claims and existing dossiers separately; do not mark a biography as complete merely because it has a lead or timeline.
3. Inspect the actual photo publication registry and exact-layout SVG manifest independently. Produce per-type, per-decade counts for candidates, verified photos and attributed SVGs.
4. Traverse profile → constructor → season → race → circuit and reverse links with EN/UK, direct load and client navigation. Use exact source IDs and record broken edge endpoints.
5. Score accuracy, evidence, language, media context, link integrity and accessibility using [acceptance rubric](encyclopedia-completion-acceptance.md).
6. Report `not_checked` distinctly from `missing` and `failed`. Include the tested revision/commit and local API/DB conditions.

## Publication boundaries

Existing `docs/editorial/PUBLICATION_REVIEW.md` requires separate UK and EN dossiers with per-claim evidence, reviewer decisions and explicit publication. No agent may sign off as a human. An automated audit may identify missing fields and contradictions but cannot approve historical prose or media rights.

**Exit condition for this phase:** all entity pages are reliable and linked; P0 dossiers have real source-backed UK/EN drafts and independent reviews before publication; an initial selection of correctly licensed photos is approved by real reviewers; remaining entities expose truthful, well-designed structured profiles rather than filler.
