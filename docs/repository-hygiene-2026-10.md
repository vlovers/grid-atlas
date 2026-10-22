# Repository hygiene audit — 22 October 2026

Scope: GitHub `main` at `e4d8c41768aecec2ef3f4c3154328904c890141b`. This is a structural audit, **not** a full file-by-file factual or link verification.

## Observed

- 948 tracked blobs, of which 379 are under `docs/` (including screenshots, JSON evidence and bilingual editorial manuscripts).
- Eleven SQL migrations (`0001`–`0011`). The architecture overview had incorrectly described five.
- `docs/design/` contains dated before/after/focus screenshot sets for several completed design stages. They are evidence, not current screenshots.
- `docs/media/README.md` is a phase-one pilot snapshot; it should not be read as a current inventory of all licensed circuit SVGs. Use `docs/media/historical-circuit-svg-provenance.md` for those assets.
- `docs/product/circuit-experience-v2.md` remains useful as a V2 data contract, but V3 historical SVGs and V4 chronological navigation have subsequently merged. Do not interpret V2 as the current entire feature.
- Several open issues describe work already substantially delivered by merged PRs; issue closure requires checking acceptance criteria, not just title similarity.
- The root README contains historical migration notes and detailed feature status. This index separates the durable entry points from dated evidence.

## Decisions

**Retain:** editorial dossiers and review JSON, F1DB audits and manifests, licensing records, reproducibility reports, old screenshots and dated verification. These are important for provenance and regression history.

**Improve:** navigation, version labels, canonical contracts, machine-checkable local links, and stale roadmap language. Avoid mass-moving hundreds of files before a link/reference inventory is available.

**Do not do:** automatically close issues, delete drafts, remove evidence, or claim historical facts/media approved solely because a feature shipped.

## Next safe cleanup batch

1. Audit all local Markdown links and update broken references without moving evidence directories.
2. Review every open issue against merged PRs and acceptance criteria; close only genuinely completed work.
3. Consolidate redundant status summaries into canonical pages with dated archive references.
4. Inspect root scripts, test fixtures, generated artifacts, ignored files and unused dependencies before deletion.
5. Refresh operational deployment gates separately; passing CI is not proof of production readiness.
