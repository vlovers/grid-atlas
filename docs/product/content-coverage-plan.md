# Grid Atlas — Content coverage audit and delivery gates

Status: initial repository/documentation audit, 20 October 2026. This is **not** a live SQL census or independent source verification. All unknown values require measurement against a fresh pinned import.

## Inventory and confidence

| Area | Pinned F1DB import inventory | Currently established | Missing / must be measured |
| --- | ---: | --- | --- |
| Seasons | 77 | Season browsing, races, result-backed comparisons | Official driver/constructor championship standings; season editorial coverage |
| Drivers | 917 | Search, profiles, career timeline, constructor associations, result milestones | Approved UK/EN biography counts; titles; licensed portraits; completeness per driver |
| Constructors | 187 | Profiles and observed driver/result associations | Reviewed histories, identity/succession claims, approved logos |
| Entrants | 830 | Distinct identities retained in import | Coverage and user-facing differentiation from constructors |
| Circuits | 78 | Searchable catalogue and linked race history | Licensed circuit maps/photos, independently sourced descriptions |
| Races | 1,172 | Race pages, imported result links | Event-specific primary citations and independently reviewed narratives |
| Results | 27,665 | Imported race-result rows and evidence drilldown | Row-level provenance, official starts/standings, historical adjudication |

Numbers above come from the previously recorded **pinned-import audit**, not a new database query. The SHA-256 pin verifies archive integrity, not historical truth. A published page is not equivalent to an approved article.

## Mandatory content coverage report (next implementation)

Create a reproducible, read-only command operating on a disposable database populated by the pinned importer, with machine-readable JSON and a concise Markdown summary. Do not connect to or mutate production.

For each entity type, report:
- imported total; routable records; missing required identity/name/relationship fields; orphan references; duplicate canonical IDs; null dates/years; records without linked results where expected;
- actual API route coverage (2xx/404), pagination and locale behavior, with bounded representative HTTP samples and separately labeled exhaustive SQL checks;
- publication status by locale: approved/published vs draft/unreviewed/absent, with reviewer/source checks; **never count a draft as published**;
- approved licensed media count vs candidate/unlicensed count; no image discovery or rights inference;
- clear denominator and exact query/method for every percentage; distinguish **not measured**, **not supported by schema**, and **zero**.

Output should include source-release identity, schema/migration version, timestamp, SQL query provenance and deterministic test fixtures. Re-run in CI on pinned import where practical; use an explicit baseline-diff report for later imports.

## Priority 0: historical championship records

The current public career contract says `race_points_not_championship_standings`. Never derive champion titles from summed race points or result-row win ranks.

Research an authoritative, rights-compatible season-level standings source and document its coverage, terms, scoring rules, shared drives, dropped scores, disqualifications, ties and correction policy. Propose a normalized import schema and provenance before implementation. Provide season + driver/constructor standings and explicit championship titles **only after independent validation**. Missing years remain unknown, not zero.

Acceptance: source-specific fixtures for historically tricky seasons, deterministic reconciliation, no false title assertions, bilingual UI labels, and regression tests across API, database and browser.

## Priority 0: bilingual editorial pipeline

Each article/section requires traceable atomic claims, precise source locators, independent human review, locale-specific approval and revision/revocation history. Editorial research and candidate assets stay private. No automatic approval by an AI agent; no placeholder reviewer signatures.

Start with 20 high-interest driver dossiers, but do not commit to publishing all 20 before verified source access and human review. Record a per-driver readiness matrix (source coverage, claim review, UK, EN, media rights, publish state). Prioritize Ayrton Senna as the existing research pilot; avoid hardcoded database IDs.

Acceptance: unapproved/withdrawn articles remain inaccessible in public API, routes and sitemap; each published claim has traceable provenance; both locales reviewed separately.

## Priority 1: constructor, race, circuit and season narratives

Use structured archive data to cover **all** routable entities before editorial prose. Then batch sourced narratives by season or historical theme. Constructor/entrant identities and lineage must remain distinct; observed result association is not a driver contract or corporate succession.

For each batch: evidence register → UK/EN draft → automated consistency checks → human fact review → rights review → publication gate → real-import browser review. Preserve meaningful empty states when evidence is absent.

## Suggested large implementation slices

1. **Content coverage observability:** read-only SQL + API audit, report artifact, deterministic tests, documentation, CI integration. No UI redesign.
2. **Standings source feasibility and normalized contract:** verified data model/import prototype and regression cases. Stop if license/provenance cannot be established.
3. **Editorial batch tooling:** source/claim matrix, bilingual workflow, validation and revocation tests, first pilot dossiers; no mass auto-publish.
4. **Structured completeness:** fill verified missing historical fields and user-facing coverage across driver/constructor/circuit/race/season entities.
5. **Approved media registry expansion:** rights metadata and opt-in reviewed assets only.

## Explicit non-goals

No visual redesign, generated historic portraits, guessed race dates, fabricated titles, automatic article approval, bulk unsourced biographies, production data writes, or deployment in these slices.

## Open verification questions

- What are the **current** counts of published UK and EN articles, per-entity field completeness, approved media, and valid title records on a fresh imported database?
- Which championship data sources permit the intended reuse and attribution?
- Which biographies have actually passed independent human review, rather than merely passing schema tests?
- Which high-traffic pages have missing structured fields versus intentionally unavailable historical information?
