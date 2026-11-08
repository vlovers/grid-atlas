# Repository cleanup and release-readiness inventory — 8 November 2026

> **Snapshot, not release approval.** GitHub live-state review on 2026-11-08 against `main` commit `338394f726b83189d112ffa3f71eb49eb75d1aa9`. This document distinguishes observed GitHub metadata from unverified application behavior. Do not treat historic reports as proof of present-day CI.

## Verified repository inventory

- **395 remote branches**, from four paginated GitHub branch-list responses (100 + 100 + 100 + 95). There are substantially more branches than currently open PRs.
- **14 open pull requests at initial inspection** (before this audit PR #417): #395, #398, #400, #402, #403, #405, #406, #407, #408, #411, #412, #413, #415, #416.
- **21 open issues** (non-PR) at initial inspection, **20 remaining** after closing time-boxed issue #145 as superseded; GitHub's issues endpoint combines issues with PRs, so do not double-count them.
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

## Follow-up verification — PR overlap and branch ancestry (8 November)

### Exact changed-path overlaps

- **Governance #400 vs #415:** both modify the same seven paths: `.github/PULL_REQUEST_TEMPLATE.md`, `.github/workflows/ci.yml`, `AGENTS.md`, `docs/README.md`, `docs/engineering/MULTI_AGENT_WORKFLOW.md`, `scripts/check-governance.mjs`, `test/check-governance.test.mjs`. #415 is a current-main forward-port candidate, **not yet proof** of complete patch equivalence. Preserve both until a file-by-file comparison and one accepted merge.
- **CI #407 vs #416:** overlapping `api.yml`, `real-archive.yml`, `web.yml`; #407 additionally changes `commons-original-review.yml`. The Commons-only change must not be lost if #416 is chosen. Do not merge both without a merged change plan.
- **Circuit content #403 vs #406:** both modify `apps/web/src/components/editorial/circuit-next20-stories.json`. #406 also overlaps historical test files changed in #408. Establish a tested integration order and retain claim-specific evidence.
- **Reader #398:** modifies `web.yml`, `docs/README.md`, public circuit reader components, the API reader test server and browser tests; review together with the CI and documentation PRs rather than treating it as independently conflict-free.
- **Audit #417:** touches `docs/README.md` also changed in #400/#415/#398. Rebase/resolve deliberately after selecting governance and reader integrations.

### Sampled branch ancestry: 10 branches

Compared GitHub `main...branch` against `main` at `338394f726b83189d112ffa3f71eb49eb75d1aa9`. **Only `status=behind` and `ahead_by=0` establish ancestry-safe deletion**, not absence of relevant PR dependencies.

| Branch | Compare status | Ahead | Decision |
| --- | --- | ---: | --- |
| `feat/history-atlas-v1` | behind | 0 | Candidate to delete after SHA lease / dependency recheck |
| `beta/encyclopedia` | behind | 0 | Candidate to delete after SHA lease / dependency recheck |
| `feat/f1db-driver-identities` | diverged | 4 | Retain pending squash/patch equivalence |
| `feat/driver-profiles` | diverged | 3 | Retain pending squash/patch equivalence |
| `content/senna-source-dossier` | diverged | 2 | Retain source material until proven ported |
| `docs/senna-biography-draft-en` | diverged | 1 | Retain unpublished manuscript until proven ported |
| `feat/circuit-graphics-v3` | diverged | 20 | Retain pending design/asset evidence comparison |
| `feat/circuit-experience-v2` | diverged | 9 | Retain pending patch equivalence |
| `audit/circuit-78-completion-gates-20261102` | diverged | 1 | Retain audit/provenance |
| `chore/foundation-01` | diverged | 1 | Retain pending patch equivalence |

This sample **does not generalize** to the other 385 baseline branches. Neither of the two safe candidates was deleted, because the connected GitHub tool does not expose DELETE refs. At next opportunity obtain a fresh branch SHA, verify it is not a PR head or dependent base, then delete with an explicit lease and log the result.

### Verification performed

- #417 latest checked `foundation` check completed **successfully**; this is not a full application acceptance or release check.
- Current `main` remained `338394f726b83189d112ffa3f71eb49eb75d1aa9` during follow-up.
- No merge, force push, mass deletion or CI rerun was made during follow-up.

## Batch branch ancestry review — 8 November 2026, continuation

Fresh listing shows **396 branches total** (the preceding 395-branch snapshot predates the audit branch for #417). Of these, **15 are open PR heads**, including #417. The active `main` SHA remained `338394f726b83189d112ffa3f71eb49eb75d1aa9` during this check.

This continuation tested **45 distinct additional branch names** using GitHub compare `main...branch`. Seven are `behind` with `ahead_by=0` (listed below). The remaining **38** diverged from `main`; their distinct commit ancestry is not proof that the patch is absent, but they must not be deleted without patch-equivalence and evidence review.

### Confirmed ancestry-safe deletion candidates from this batch

| Branch | Ahead of main | Classification |
| --- | ---: | --- |
| `beta/encyclopedia` | 0 | behind |
| `beta/historical-integrity` | 0 | behind |
| `content/champion-chapter-evidence-gates` | 0 | behind |
| `content/circuit-expansion-3-final-eleven-20261027` | 0 | behind |
| `content/constructor-2025-evidence-batch` | 0 | behind |
| `content/coverage-and-senna-consolidation` | 0 | behind |
| `content/integrate-five-driver-1988-research` | 0 | behind |

Additionally `feat/history-atlas-v1` was confirmed earlier, giving **eight unique candidates** across both passes. `beta/encyclopedia` is repeated from the earlier sample and is not counted twice.

The remainder include potentially valuable unmerged source and manuscript commits (e.g. `content/circuits-20-completion-audit-20261027` ahead by 95, `content/consolidation-v1-20261026` ahead by 37, and `content/circuits-next25-editorial-20261027` ahead by 36). Treat as preservation candidates rather than garbage, pending patch comparison.

This verification does **not** authorize deleting these branches while a human or Codex worktree may use them. Re-check live SHA, associated closed PR / open worktrees, and active consumers immediately before deletion. No branches were deleted in this continuation.

## Further ancestry and CI-overlap review — 8 November

Forty **additional distinct historical branches** were checked against `main`: 39 diverged and one, `content/verified-circuit-2021-research-batch`, is `behind` with **zero ahead commits**. It is a deletion candidate, subject to a fresh ref SHA and dependency check. The three batches contain 10 + 45 + 40 comparisons; one `beta/encyclopedia` overlap means **94 distinct legacy branches** in total. Nine unique zero-ahead candidate branches have now been identified:

- `feat/history-atlas-v1`
- `beta/encyclopedia`
- `beta/historical-integrity`
- `content/champion-chapter-evidence-gates`
- `content/circuit-expansion-3-final-eleven-20261027`
- `content/constructor-2025-evidence-batch`
- `content/coverage-and-senna-consolidation`
- `content/integrate-five-driver-1988-research`
- `content/verified-circuit-2021-research-batch`

**Counts:** 94 unique legacy branch names evaluated; 9 candidates and 85 branches with nonzero ahead commits. This is not yet a full 396-branch classification and no branches were deleted.

### Exact CI-port blob comparison

Comparing #407 against #416 by blob SHA:

| Workflow | Blob equality | Integration decision |
| --- | --- | --- |
| `.github/workflows/api.yml` | Identical | Integrate once |
| `.github/workflows/web.yml` | Identical | Integrate once |
| `.github/workflows/real-archive.yml` | Different | Review the actual YAML diff before selecting #416 |
| `.github/workflows/commons-original-review.yml` | Only #407 touches this | Preserve #407's Commons scope; it is not included in #416 |

A review comment was added to #407 documenting this requirement. Likewise #400 has an earlier comparison comment against #415. Both are **keep-open-until-integrated**, not safe-to-close purely due to overlap.

### Retention guidance

The 39 divergent branches in this batch include Senna historical claims, period race arcs, media-licensing evidence and lineage research. Their Git history does not demonstrate editorial approval or public release. Never delete historical source registers or review evidence as generic generated files. Avoid GitHub Actions reruns while housekeeping is in progress.

