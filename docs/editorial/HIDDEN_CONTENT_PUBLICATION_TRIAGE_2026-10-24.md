# Hidden editorial inventory and publication triage — 2026-10-24

**Scope:** repository editorial content only, based on the complete `docs/editorial/` Git tree on `main` (251 tracked files at audit time). **No public database or production deployment was inspected.** This document is a publication decision log, not a new CMS or approval engine.

## What exists, and what it actually means

| Cohort | Located materials | Readiness | Next editorial action |
| --- | --- | --- | --- |
| Driver release V1 | 5 bilingual dossiers (10 locale JSONs), source locators and review sidecars | No independent sign-offs | Independently check each claim, then approved export |
| Driver longform V1 | 2 drivers, 4 original EN/UK longform Markdown manuscripts | AI-authored drafts, not source reverified | Resolve gaps and integrate claim-atomic text into existing dossiers |
| Driver reading editions | 5 drivers, 10 EN/UK Markdown reading editions | Existing claim text reformatted; not new historical verification | Avoid treating as additional finished biographies |
| 2021 circuits | 16 circuits, 32 EN/UK Markdown drafts | Event-specific measurements, not circuit histories | Check layout/year identity, expand source-located history |
| 2025 constructors | 7 teams, 14 EN/UK Markdown drafts | Time-specific team observations, not full team histories | Check constructor identity, historical chronology and sources |
| Editorial release V2 | 25 bilingual briefs (5 constructors, 10 circuits, 10 seasons) | 5 researched pilots, 20 framework subjects, 0 approved | Reconcile canonical F1DB IDs, finish source-specific claims |
| V2 event leads | 11 event anchors | Unverified leads; not source-supported historical claims | Resolve race/venue/entrant identity before using |
| Bulk fifty drivers | Deterministic 50-driver research packet generator | Archive observations only, no completed biography prose | Write original EN/UK sourced chapters |
| Race/season/champion batches | Research workbooks, scenes and season chapter files | Mixed research states; not an approved publication cohort | Audit individual claim/source locators before promotion |
| Media | 160 attributed circuit SVGs already present; candidate Commons photos | Circuit SVG attribution exists; candidate photographs not cleared | Do not auto-publish unapproved photographs |

## Editorial decision

1. **Do not bulk-flip statuses to approved.** Existing `docs/editorial/PUBLICATION_REVIEW.md` requires independently recorded human decisions bound to exact revisions. User authorization to use an AI editorial route does not create those decisions.
2. **AI Reviewed must describe the real process.** A source URL or a pre-existing AI-authored manuscript is not proof that the linked evidence was reopened and checked. Use `AI-authored draft` until source-by-source review has actually occurred.
3. **Do not call a research brief a published article.** Especially avoid claiming 25 V2 finished histories or 50 finished biographies.
4. **Do not fabricate public deployment.** The current driver route reads `getOptionalPublishedArticle` from the API. Markdown files committed to Git are not served as published articles. Publishing requires an approved article bundle and an explicit operation against the intended PostgreSQL deployment.
5. **No rights shortcuts.** Approved SVGs and unapproved photographs are different categories; never infer photo permissions from Commons hosting or an archive citation.

## Publication order — maximize actual readable content

**Wave 1:** Senna and Prost EN/UK: resolve open dossier issues and reconcile longform prose with claim-atomic source citations. **Wave 2:** Schumacher, Hamilton, Verstappen EN/UK: expand substantive historical chapters and check each factual assertion. **Wave 3:** Ferrari/McLaren and Monaco/Silverstone, then the other 2021 circuit and 2025 constructor manuscripts. **Wave 4:** the 1988/2021 seasons and further researched V2 subjects. Keep drafts clearly labeled until each stage has genuine evidence review.

## What was NOT done

No historical claim was independently reverified during this inventory; no human review was impersonated; no article was exported or inserted into PostgreSQL; no production site was deployed; no candidate photo was licensed or published. The existing review and release workflow remains authoritative.

## Primary repo references

- [Release V1](releases/v1/README.md)
- [Release V2](releases/v2/README.md)
- [V2 readiness](releases/v2/READINESS.md)
- [V2 coverage](releases/v2/COVERAGE.md)
- [Circuit and constructor drafts](batches/README.md)
- [Bulk fifty](BULK_FIFTY_DELIVERY.md)
- [Human review contract](PUBLICATION_REVIEW.md)
- [Approved publication pipeline](APPROVED_RELEASE_PIPELINE.md)
