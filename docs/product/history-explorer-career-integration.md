# History Explorer — Career API Integration Contract

Status: **Integration plan only**; depends on review and merge of [PR #60](https://github.com/vlovers/grid-atlas/pull/60). The career endpoints below are not on `main` as of this note.

## Existing proposed career endpoints

- `GET /api/drivers/:id/career?locale=uk|en`
- `GET /api/constructors/:id/career?locale=uk|en`

The proposed payload contains `data[0].entity_type`, canonical string `id`, `participation` grouped by season and related entity, `milestones`, `summary`, `observations`, `limitations`, and nullable `editorial`. It is **not** a generic graph response.

### Safe first slice

For a focused **driver** with selected `year`, filter the career's `participation` by `year`. Each row gives a constructor observed in race results for that year. Use one node per canonical `constructor:<id>`, and an edge `driver_competed_for_constructor` with `year` and evidence semantics. Include `result_entries` and distinct `races` only when labeled precisely. Do **not** treat this as an employment contract or official start count.

For a focused **constructor**, invert the same relation to observed drivers by year. Never merge entrant identity into constructor identity.

`first_race` and `last_race` are chronology affordances, not proof that every race between them was contested. `milestones` represent mechanical first/last appearances or wins, not curated “most important” moments.

### Data availability / provenance

- `observations` prove imported **entity** observations; current result rows have no per-result release linkage. Show archive-level attribution and explicitly label derived relationships as imported result observations, not individually cited claims.
- Do not produce rivalry, friendship, mentorship, ownership, legal succession or team renaming edges from this API.
- `editorial.introduction` and `editorial.biography` are null until independently reviewed content exists. Empty editorial content is a normal state, not an error.
- `recorded_points: null` means no recorded values, distinct from a known zero. Do not compute championship standings from these fields.
- Treat IDs as strings end to end; do not convert PostgreSQL BIGINT IDs to JS Number.

## API changes required for full Explorer (later PR)

1. **Bounded server-side one-hop queries:** a career response may cover decades; a focused Explorer query should accept a year and explicit limits rather than download and graph every career relation.
2. **Exact race membership:** participation currently exposes first/last race per season/related entity, not all races. Use a dedicated bounded race-edge query when the user expands into individual races.
3. **Stable relation IDs and deterministic ordering:** define typed edge keys from source identity + relation + year; never rely on array indices or translated names.
4. **Explicit truncation and pagination:** a capped graph response must report when additional connections exist.
5. **Provenance and publication separation:** archive-derived observation edges and verified-only lineage claims must be separate categories, not visually indistinguishable.
6. **Temporal correctness:** time filters should exclude later seasons, with clear treatment of missing or incomplete imported records.

## UI integration after other agents merge

- Use Agent 1's locale-aware link builder and translated machine-code descriptions. Never construct hard-coded `/drivers/:id` paths that discard locale.
- Use Agent 3's reusable quick-fact/relationship components where suitable; avoid embedding data queries inside presentation components.
- Preserve URL state for focus, season, selected relation and browser history.
- Render an accessible relationship list by default on mobile; graph view is progressive enhancement.
- For the first demo, limit suggestions to three real, explainable links.

## Acceptance matrix

| Case | Expected |
| --- | --- |
| Driver has multiple result rows for the same race | Distinct race counts and edge identity remain correct |
| Constructor has shared-car victory rows | Winning race counted once |
| Career season gap | No inferred participation in missing year |
| Missing editorial text | UI remains useful with validated facts only |
| Unverified lineage proposal | Never appears as established relationship |
| `uk` → `en` switch | Focus entity and year remain unchanged |
| Browser back | Previous focus and season restored |
| Empty season | Explicit “no recorded participation” state |
| Missing source observations | No fabricated citation |
| Mobile + keyboard | All connections accessible without SVG interaction |

## Coordination gate

Do not start implementation in `apps/api` until the historical-profile agent's PR is merged or ownership is explicitly transferred. Do not integrate route-level UI before locale and component agents have completed their branches. Keep this document on the dedicated documentation PR.
