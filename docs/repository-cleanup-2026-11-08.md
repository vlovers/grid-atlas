# Repository cleanup and release-readiness inventory — 8 November 2026

> **Snapshot, not release approval.** GitHub live-state review on 2026-11-08 against `main` commit `338394f726b83189d112ffa3f71eb49eb75d1aa9`. This document distinguishes observed GitHub metadata from unverified application behavior. Do not treat historic reports as proof of present-day CI.

## Verified repository inventory

- **395 remote branches**, from four paginated GitHub branch-list responses (100 + 100 + 100 + 95). There are substantially more branches than currently open PRs.
- **14 open pull requests**: #395, #398, #400, #402, #403, #405, #406, #407, #408, #411, #412, #413, #415, #416.
- **21 open issues** (non-PR) after closing time-boxed issue #145 as superseded; GitHub's issues endpoint combines issues with PRs, so do not double-count them.
- CI history has repeated workflow runs. The latest examined set of five primary checks for PR #413 at 2026-11-08 14:14 UTC succeeded; that does **not** establish green CI for all 14 PRs or `main`.
- `README.md` states public beta is in preparation, external hosting has not been deployed by this work, and circuit publication is disabled by default. F1DB is pinned to `v2026.17.0`.
- Current open governance work overlaps: #400 and #415. Do not merge both blindly or create a third conflicting governance implementation. #407 and #416 also both touch CI; require a file-overlap review.

## Preserve / do not bulk-delete

1. **Active PR heads and dependencies.** The 14 open PRs have live branches; preserve their head refs and any stacked branches.
2. **Unmerged commits and historical research.** Before deleting any of the remaining remote branches, compare its SHA with `main` and other retained refs, check related closed PRs (merged/closed-unmerged), and confirm no unique work remains. A naming pattern or age alone is insufficient.
3. **Provenance records and manuscripts.** Retain source registers, claim-level evidence, editorial review receipts, licensing records, F1DB manifests, reproducibility tests and historical screenshot evidence. These are not disposable generated artifacts.
4. **Operational scripts and configuration.** Do not remove scripts, Playwright configs, migrations, or CI workflows without reference checks, source-code inspection and test proof.
5. **Protected release boundaries.** Do not publish unapproved circuit stories, unverified lineage or unlicensed media as part of housekeeping.

## Classification and proposed cleanup

| Area | Action | Gate |
| --- | --- | --- |
| Issue #145 | Closed as superseded (not planned), preserving historical context | Time-limited 20 October overnight plan; other issues track remaining editorial/media work |
| Issues #104, #107, #278, #290, #396, #404, #410 | Keep open | Release protection, source review, biography/media publication, security, ongoing governance and rights-safe visual delivery still require explicit acceptance |
| Issues #106, #123, #133, #134, #155, #199, #275, #283 | Review original acceptance against merged code/tests, then close individually if complete; do not infer completion from titles | Need explicit acceptance evidence and current regressions |
| PR #400 / #415 | Reconcile as one governance outcome | Compare files, retain reviewed work and close superseded PR only after the replacement is merged or content is ported |
| PR #407 / #416 | Reconcile overlapping CI changes | No duplicate workflow checks or speculative reruns |
| Editorial PRs #395 / #402–#406 / #408 / #412 | Sequence and consolidate without losing manuscripts or source QA | Check app-content overlap, provenance, editorial gating and CI |
| Media PR #411 and issue #410 | Keep | Human rights clearance and public fallback checks |
| Story PR #413 | Keep | New driver/constructor exploration work, individually verified CI required |
| Old branches without open PRs | Candidate for lease-protected batch deletion **only after merged/unique-commit classification** | Preserve active refs, base branches and any unmerged evidence; export an inventory before deletion |
| Dated docs and visual audits | Archive/index or remove provably generated duplicates only | Search references, backlinks and tracked provenance first |

## Actionable next batch (no CI churn)

1. Gather **all** branch names/heads and PR associations; classify each as open PR, retained base, merged into `main`, closed unmerged, or unknown. Use Git merge-base/ancestor checks, not last-updated heuristics.
2. Compare each open PR to `main` and one another; triage overlapping governance, CI, editorial and reader changes; request one coherent nonduplicative integration order.
3. Close obsolete issues with a short evidence comment linking the implementing commit/PR; never mark 'completed' merely because an older plan expired.
4. Run local Markdown-reference audit, generated-file inventory and source/test references before deleting files. Preserve old audits that still document prior decisions; label them dated.
5. Review branch protections, latest **main** CI, integration tests, production dependency recovery, database migration/backups, media rights and editorial sign-off before considering beta release.
6. Delete verified merged branches with a freshly checked expected SHA (lease), in batches. Retain a deletion log and do not delete active heads.
7. After the actual integration and cleanup, replace this snapshot with a new verified inventory; do not claim this plan is already executed.

## Operational limitations of this review

The connected GitHub operations used for this audit can list, compare and update refs but do not expose remote ref deletion. **No remote branches were deleted.** Similarly, GitHub Actions retention/artifact deletion is not available in these operations; no action artifacts were purged. No local checkout, full test suite, dependency vulnerability scan or production smoke test was executed in this pass.

See [repository hygiene snapshot of 22 October](repository-hygiene-2026-10.md), [documentation entry points](README.md), and [release gates](roadmap/README.md) for context. These historic documents are not current completion certificates.
