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

## Follow-up inventory — 22 October 2026

A subsequent live tree inventory on `main` after PR #202 found **952 tracked blobs**, including **124 PNG/JPEG/WebP files totalling 34,620,490 bytes (~33.0 MiB)** and **48 files in `scripts/`**. The earlier 948-file count is retained above as the original snapshot, not overwritten.

Largest image-bearing areas (aggregate tracked image bytes):

| Directory | Image bytes |
| --- | ---: |
| `docs/design/interactive-batch2/` | 7,522,634 |
| `docs/design/media-reboot/` | 6,535,519 |
| `docs/design/grid-atlas-2/` | 4,671,704 |
| `docs/product/previews/` | 4,503,341 |
| `docs/design/history-atlas/` | 4,246,598 |
| `docs/editorial/releases/` | 4,207,973 |

No tracked `node_modules/`, `.next/`, `__pycache__/`, `test-results/`, or `playwright-report/` paths were found in that tree. The repository `.gitignore` already excludes these build and test outputs.

**Retention decision:** do not delete or relocate screenshots solely because they are large. They may be visual acceptance evidence, and moving them can break Markdown references. First establish references, provenance, and whether each screenshot is superseded. Similarly, the 48 script files are an inventory, **not** 48 unused scripts: scripts may be called from CI, docs, tests or manual editorial workflows.

**Next validation:** run `pnpm check:docs` (or `python3 scripts/audit-doc-links.py`) locally. The scanner checks tracked relative Markdown destinations and deliberately does not verify remote URLs, fragment anchors, or rendered Markdown. Resolve its findings before enforcing it as a required CI gate.


## Current-main integration — 23 October 2026

PR #203 was updated against `f9d193e` (including Race Constructor Field #214).
The read-only audit now reports 1,130 tracked files, 190 raster evidence images
(40,229,727 bytes), and 67 root scripts. These are dated inventory figures, not
an instruction to delete unreferenced files. Earlier inventories above remain
historical snapshots.

The current-tree link audit found and corrected a relative link in the editorial
reconciliation runbook. A macOS/symlink containment defect in the audit itself was
also fixed and regression-tested. Documentation validation and asset inventory
are now part of Foundation CI; neither publishes editorial material nor removes
existing evidence. The inventory is available with `pnpm audit:repo`; local tracked
Markdown destinations with `pnpm check:docs`. Remote URLs, anchor correctness,
dynamic imports and manual script use remain outside these static checks.
