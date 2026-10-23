# Encyclopedia Completion — entity UX and QA acceptance

**Scope:** drivers, constructors, circuits, links and media. Historical feature stories are **deferred**. This is an independent product/editorial acceptance specification, not a claim of implementation. Codex owns the app/API changes.

## Baseline: what has and has not been proved

The 2026-10-23 archive audit confirms the pinned F1DB **main-race import**: 917 drivers, 187 constructors, 78 circuits, 1,172 races and 27,665 results. All observed records were reconciled against the pinned import. This is **statistical archive coverage**, not a guarantee of published biographies, photo rights, historical car specifications, independently verified championship calculations or site availability in the user's local environment. Of the driver records, 57 have no recorded main-race result; one constructor has no result. Do not erase those identities.

## Driver dossier: acceptance checklist

**Identity:** canonical F1DB ID, names, nationality where supported, active period derived from observed entries/results and clearly distinguished from full biography; alternate spellings must be provenance-backed.

**Career:** observed seasons, constructor associations with exact season links, championship classifications from their actual source, first/last recorded race and source-backed milestones. Distinguish entries, starts, classifications, wins, podiums and shared drives. Do not infer contract length, employment or personal relationships from constructor association.

**Biography:** original readable UK and EN lead, early background, F1 trajectory, meaningful career turning points, post-F1/life information where relevant and sourced. The biography is a separately reviewed editorial product, not a templated rewrite of statistical fields. No synthetic praise or unsupported personality descriptors.

**Media:** approved documentary portrait with date/context and credit, optionally car photo matched to **correct season and constructor**; otherwise elegant labeled fallback, not a fictional portrait. A portrait from 1989 must not illustrate a claimed 1985 moment without context.

**Discoverability:** click a constructor period → exact constructor dossier and season; a race milestone → exact race; circuit from a race → correct circuit/layout; a comparison → canonical counterpart. Deep links preserve locale and season context.

**Missing data:** explain precisely what the archive does not establish. Keep all records reachable, including drivers without recorded main-race results.

## Constructor dossier: acceptance checklist

Canonical constructor identity separate from entrants, sponsor names, branding and legal succession. Recorded seasons, drivers, race participation, championship standings, chronology and reciprocal driver links. A car photo requires independently confirmed model, year, constructor and photographer/license. No invented vehicle specifications or automatically inferred team ownership continuity. Show visual roster/era progression without turning missing years into continuous participation.

## Circuit dossier: acceptance checklist

Canonical venue identity and location, supported historical configurations, exact layout-to-race linkage, race calendar, winners/results only from supported records, source/attribution per SVG. Circuit photos must show the venue and preferably known era; a current photograph cannot silently stand in for a historical configuration. Never invent sectors, DRS zones, corner labels, tyre wear or engineering dimensions.

## Relationship contract

| Edge | Evidence required | Avoid |
| --- | --- | --- |
| Driver → constructor | Source-backed season/result association | Employment contracts or exclusive membership inferred from results |
| Constructor → driver | Reciprocal archive association, exact season | Flattening shared drives or multi-constructor seasons |
| Driver → race | Exact result and race ID | Treating one result row as a whole race |
| Race → circuit | Exact race circuit ID and layout ID where present | Mapping modern outline to an older race |
| Constructor → race | Result/entrant grouping with identity semantics | Assuming entrant equals constructor |
| Driver → driver | Same recorded race/season, with named comparison metric | Invented rivalry or personal relationship |
| Season → entity | Source-backed calendar/entry/classification | Fabricated participation in missing years |

Every edge should have a return path, EN/UK parity, correct canonical IDs, a human-readable link label and an explicit empty state when unsupported.

## UX acceptance journeys (manual + Playwright)

1. From `/uk/drivers`, search Senna, open profile, choose 1988, follow McLaren, open the corresponding season and one exact race, return to Senna. Assert no 404, locale drift, broken back navigation or false season.
2. From `/en/constructors`, find McLaren, select a historically recorded season, open a listed driver, inspect the same constructor association, and follow a result. Assert reciprocal IDs and season.
3. From `/uk/circuits`, open Monaco, select an available historical layout, open a race that explicitly used that layout, and navigate back. Assert year/layout identity and licensed SVG attribution.
4. From `/en/seasons/2025`, follow a race → circuit → participating driver/constructor. Assert API readiness and meaningful failure if infrastructure unavailable; no fake empty data.
5. Visit a driver with **no recorded main-race results** and a constructor with **no results**. Verify identity survives, page loads, and no invented statistics.
6. Test desktop 1440/1920, tablet 1024, mobile 390 and 320, 200% text, keyboard only, no JS, reduced motion, forced colors, slow API and one optional endpoint returning 404/500. Essential data failures must remain distinguishable from optional enrichment failures.
7. Every entity route exposes one meaningful next step without requiring the user to understand internal F1DB terminology. Mobile link targets and tables remain navigable.

## Editorial QA rubric (0–3 each)

Score **accuracy**, **source traceability**, **readability**, **locale quality**, **contextual relevance of media**, **relationship integrity**, **accessibility** and **empty/error states**:
- 0: absent or misleading
- 1: present but materially flawed
- 2: acceptable with documented gaps
- 3: verified, coherent and production-quality

A dossier with any **0 in accuracy, traceability, rights or relationship integrity** is blocked from editorial publication, regardless of aggregate score. A photo cannot receive a passing rights score solely because its file page advertises a Creative Commons tag. Require independent review under `docs/media/approved-imagery-workflow.md`.

## Prioritization and evidence

**Tier 1:** Senna, Fangio, Hamilton (existing media candidates); McLaren, Ferrari (existing product/identity coverage); Monaco (existing layout mapping). These are review targets, not automatically completed biographies. **Tier 2:** other high-traffic identities and representative eras chosen by real traffic/editorial criteria. **Tier 3:** long tail with honest structured-data profiles and no fabricated prose.

Track each subject as `structured-data / narrative-draft / narrative-reviewed / photo-candidate / photo-reviewed / UX-reviewed`. The statuses are independent; do not collapse into a single “complete” flag. Use per-entity evidence and exact source links.

## Release criteria

- Zero reproducible broken entity-to-entity links in the pinned archive acceptance set.
- All required EN/UK journeys work in production-like preview and relevant CI is green.
- No unreviewed narrative or media is published.
- Media coverage is reported separately by **driver / constructor / circuit / decade**, with candidate and approved counts.
- Human visual review compares actual before/after pages and records unresolved defects.
- Hosting, protected-main and backup readiness remain governed separately by #104.
