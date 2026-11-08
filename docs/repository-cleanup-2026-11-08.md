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

Forty **additional distinct historical branches** were checked against `main`: 39 diverged and one, `content/verified-circuit-2021-research-batch`, is `behind` with **zero ahead commits**. It is a deletion candidate, subject to a fresh ref SHA and dependency check. The three batches contain 10 + 45 + 40 comparisons; three repeated names (`beta/encyclopedia`, `chore/foundation-01`, `content/senna-source-dossier`) mean **92 distinct legacy branches** in total. Nine unique zero-ahead candidate branches have now been identified:

- `feat/history-atlas-v1`
- `beta/encyclopedia`
- `beta/historical-integrity`
- `content/champion-chapter-evidence-gates`
- `content/circuit-expansion-3-final-eleven-20261027`
- `content/constructor-2025-evidence-batch`
- `content/coverage-and-senna-consolidation`
- `content/integrate-five-driver-1988-research`
- `content/verified-circuit-2021-research-batch`

**Counts:** 92 unique legacy branch names evaluated; 9 candidates and 83 branches with nonzero ahead commits. This is not yet a full 396-branch classification and no branches were deleted.

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


## Executable branch cleanup, review required

A conservative utility is now available at [`scripts/cleanup-merged-branches.py`](../scripts/cleanup-merged-branches.py). It uses the already expected authenticated `gh` CLI, GitHub's paginated branch/PR APIs and commit ancestry comparison. Its default behavior is **read-only** and writes a JSON report outside the repository. Neither this utility nor this audit claims that the remaining branches have been fully classified.

```sh
gh auth status
# Review a small, known cohort first (no deletion):
python3 scripts/cleanup-merged-branches.py --only beta/encyclopedia --only feat/history-atlas-v1
# Inventory all remote branches: may hit GitHub API rate limits, no Actions workflows:
python3 scripts/cleanup-merged-branches.py
cat /tmp/grid-atlas-branch-cleanup-manifest.json
```

Only after review of the manifest, cross-checking closed PRs, other worktrees and source-data preservation, an authorized maintainer may explicitly opt in:

```sh
python3 scripts/cleanup-merged-branches.py --apply --confirm DELETE-VERIFIED-ANCESTORS
```

**Warnings:** DELETE refs in GitHub REST is not transactional and has no atomic SHA lease; the script checks SHA immediately before deletion but cannot eliminate all races. Do not use it during concurrent branch updates, or with manifest candidates that have not been separately checked for dependencies. It never deletes protected branches, the default branch or open PR heads, and stops for shifted SHA or non-ancestor commits. The `--apply` operation is irreversible in the normal UI, is capped at 10 targets by default (maximum allowed `--max-delete 20`), and must be performed only after an independent decision. Do not treat "zero ahead commits" as proof that there are no valuable tags, worktrees, linked issues or content-dependency expectations.

**Audit code status:** source and five mock-only safety tests have been added on a draft PR. Run `python3 -m unittest tests/test_cleanup_merged_branches.py` (or the existing unittest discovery command). These tests do not perform any real GitHub deletes. Cleanup now also protects the **base branch** of any open stacked pull request, not only its head. A live dry-run and independent review are still required before any destructive operation.

## Safety follow-up — 8 November

- Final check on prior head `c9c957487edd2ac1f8ed91473d9fe97f9380d76e`: Foundation CI **passed**. Newer cleanup-script commits require their own checks.
- Hardened the script to protect both head **and base** branches of open PRs, including stacked review branches; extended mock tests accordingly.
- The attempted independent runtime test from this session could not retrieve repository source because direct access to `raw.githubusercontent.com` failed DNS resolution. This is **not** evidence of test failure or success. GitHub CI is the available check; no manual deletion was attempted.

## PR queue consolidation — 8 November 2026

- **PR #400 closed unmerged as superseded by #415.** The seven changed paths were reviewed: four blobs were byte-identical, and the remaining three in #415 retained every nonempty trimmed line from the older #400 versions. No substantive earlier line was lost in this comparison; the later PR also adds documentation-impact guidance. This does **not** mean #415 was merged, approved, or tested here.
- Closed #400 with a detailed handoff comment. Its branch remains present and must not be deleted before #415's integration is confirmed.
- The active PR queue therefore moved from **15 to 14** after closure, assuming no concurrent new PR. The separate count of genuine open Issues remains 20.
- **CI #407 vs #416 still unresolved:** two workflows match exactly, but `real-archive.yml` differs and Commons workflow changes exist only in #407. Keep both until changes are reconciled; do not mark either as redundant without porting.
- **PR #417** previous head `696eeea5839ea43c910886d670b73566de9fca76` passed its Foundation CI. That workflow runs `python3 -m unittest discover -s tests -v`, which includes the new mock-only branch cleanup test module. This constitutes CI validation on that SHA, not a live deletion test or production verification.

## CI PR #407/#416 resolution — 8 November 2026

**Verified and executed:** PR #407 was closed **unmerged** as superseded by #416, after exact comparison of all four workflow paths:

- `api.yml`, `web.yml`: identical blobs in both PR heads.
- `commons-original-review.yml`: the #407 version is byte-identical to `main` (blob `21a9fc0d0a30ab2047101fae12a64ed7b56040d8`). There is **no Commons delta to port**; an earlier triage warning that #407 had a unique Commons change is now resolved.
- `real-archive.yml`: #416 adds fallback on an empty direct-download file, beyond #407's fallback on a failed HTTP command. All other lines are identical.
- #416 head `df27252d13c1b4ccbbba6a50c8d2e445aae43cb0`: Foundation, API, Web and Archive checks were all **successful** when inspected. This verifies the #416 PR head checks only, not a merge or production deployment.

A detailed handoff comment was added to #407 before closure. Do **not** delete its branch until #416 is integrated and its contents are present in `main`. This eliminates a duplicate review path without discarding the remaining reviewed CI delivery.

The PR count decreased from 14 to **13** following closure (subject to concurrent changes). #416 remains draft pending owner/integrator review despite green checks.

## Product Issue cleanup — 8 November 2026

- **Issue #134 closed as `not_planned` / superseded** (with explanation). It was a one-off October Phase 1 editorial redesign delivery brief. Merged #205 delivered the editorial homepage, driver/constructor dossier foundations, typography and responsive acceptance evidence. The broader ongoing visual review remains under #152 and #195; media approval remains under #290. Closure is **not** a claim of final owner approval of every visual goal.
- Issue #155 still describes a historical stacked PR #153/#154 worktree arrangement and includes large current-product UX acceptance criteria. Treat it as potentially superseded but **do not close** until the newer Explorer/Time Machine tests and screenshot acceptance are reconciled. There are current browser test suites for Explorer/Time Machine/History Atlas, but test-file presence alone does not prove every criterion.
- Issues #275/#283 retain precise historical Chromium/WebKit 200%-text overflow failures. Preserve until current equivalent regression and both-engine CI evidence are inspected.
- Editorial Issues #107/#133/#278 and media #290 remain open because independent human approval is not implied by archived drafts or merged display templates.

After closing #134, the open non-PR issue count becomes **19**, subject to concurrent work. PR queue is **13** after closing legacy #407, with #416 preserved for integration. Neither cleanup changes `main` or publishes any candidate content.

## Base-SHA pinning hardening (8 November)

The manifest now records the exact `base_sha` of `main` at inventory time. The tool aborts if `main` changes during inventory, between inventory and deletion, or during the apply loop. This is intentionally strict: if concurrent PRs merge, regenerate and re-review the manifest rather than continuing with stale cleanup assumptions. The existing per-branch SHA and open-PR head/base checks still apply. Test coverage includes the stale-main rejection case. Previous manifests lacking `base_sha` **cannot** be used to delete branches; they must be regenerated. GitHub REST ref deletion remains non-atomic, so no deletion should occur during concurrent branch modifications.

## Larger historical branch review — 8 November 2026

Verified **60 additional distinct branch refs** from the `docs/`, `editorial/`, and `feat/` cohorts against the unchanged `main` commit `338394f726b83189d112ffa3f71eb49eb75d1aa9`. Of those, **58 are diverged with nonzero unique history**, and **two are behind with zero ahead commits**:

- `editorial/three-source-verified-circuit-stories-20261028` — `behind`, ahead 0.
- `feat/approved-editorial-release-pipeline` — `behind`, ahead 0.

**Updated cumulative ancestry sample:** **152 distinct historical branches** checked (earlier 92 + these 60), of which **11** are zero-ahead deletion candidates and **141** diverge with at least one ahead commit. No branch deletion occurred. Active PR heads and bases must be excluded from any real cleanup independently of ancestry.

Notable preservation risks in this batch:

- `editorial/people-who-changed-f1-20261025` — 262 ahead commits;
- `editorial/circuit-33-reader-journeys-20261028` — 44 ahead commits;
- `feat/boxbox-inspired-facts-v1` — 25 ahead commits;
- numerous `docs/senna-*` and `editorial/20-*` branches have unmerged research history.

Those ahead counts are Git ancestry, **not proof of missing user-visible content** after possible squash merges. They are reasons to perform patch-equivalence and provenance review, not reasons to delete.

### Current integration check

- PR #417 at `9d608170d4acaf25bd77272fba78fcc92644bd17` completed Foundation CI successfully. Newer commits must have their own checks verified.
- PRs #415 and #416 are **ready for review**, not independently approved or merged. Preserve their branches.
- Docs/README and cleanup tool fixes remain only in #417, not `main`.


## Further 75-ref ancestry review — 8 November 2026

Compared 75 `feat/` branches covering circuit reader, Commons research, constructor/driver UX, editorial waves and F1DB import against unchanged `main` SHA `338394f726b83189d112ffa3f71eb49eb75d1aa9`.

- **11 with `ahead_by=0` / `status=behind`** (candidates only):
  - `feat/circuit-production-reader-20261105`
  - `feat/circuit-research-batch-audit-pipeline`
  - `feat/constructor-circuit-archive-overviews`
  - `feat/constructor-driver-career-chronicles`
  - `feat/driver-archive-biographical-overviews`
  - `feat/editorial-bulk-50-driver-cohort`
  - `feat/editorial-cohort-release-readiness`
  - `feat/editorial-driver-biography-evidence-wave2`
  - `feat/editorial-driver-biography-wave3`
  - `feat/editorial-nine-champions-story-copy`
  - `feat/f1db-importer-foundation`
- **64 diverged** with one or more ahead commits (patch equivalence and provenance review required). In particular `feat/editorial-content-factory-batch01-20261024` had 166 ahead, `feat/editorial-five-driver-research-pack` 76, `feat/content-factory-circuits-batch01-20261025` 50, `feat/circuit-reviewed-public-reader-20261029` 49, and `feat/circuits-reader-journeys-v2-20261025` 40. These are not blanket-deletion candidates.
- Two of the 75, `feat/driver-profiles` and `feat/f1db-driver-identities`, were included in the original 10-ref sample and are **not double counted**.

**Cumulative count correction:** earlier 60-ref continuation repeated `docs/senna-biography-draft-en` from the original 10-ref sample. Thus the corrected earlier cumulative unique count was **151**, rather than 152. With 73 genuinely new refs from this 75-ref pass, the current documented sample is **224 unique legacy branches**: **22 zero-ahead candidates** and **202 with divergent history**. The remaining branches have **not** all been checked; total remote branch count at this checkpoint was still 396, including `main` and active PR heads.

Zero-ahead is merely a Git ancestry signal. Require a fresh ref SHA, review of active worktrees/PR bases, source citation dependencies, and per-run deletion cap before any removal. **No remote branches were deleted.**

### Test checkpoint

Foundation CI for PR #417 head `a0a49d42aa03a06c71212d9fbd425b2851f5275d` completed successfully before this audit-only commit. The latest head requires a fresh status observation. No workflow was manually rerun.

## Additional 78-reference feature scan — 8 November 2026

At `main` SHA `338394f726b83189d112ffa3f71eb49eb75d1aa9`, compared **78 further previously unclassified feature branch refs** from the historical UI/Explorer (HX), lineage, media, web/API foundation and seasonal UX cohorts. The earlier verified `feat/history-atlas-v1` was intentionally excluded to avoid double counting.

- **Three new zero-ahead branches (`behind`):**
  - `feat/interactive-history-batch2`
  - `feat/media-batch-290-20261028`
  - `feat/media-storytelling-reboot`
- **75 branches** have nonzero ahead commits and require patch-equivalence/source-preservation review. This includes the HX01–HX11 graph implementation branches, lineage evidence and media rights research: none is automatically safe for deletion.
- **Cumulative manual ancestry review:** 302 distinct historical branches inspected: **25** are zero-ahead candidates, **277** have nonzero ahead commits. Total remote branches observed: 396, including `main`, live PR branches and the audit branch. Remaining branch names are not yet all classified; the above 302 refers to sampled historical non-PR refs, not 302 safely deletable branches.
- PR #417 `a0a49d42aa03a06c71212d9fbd425b2851f5275d` passed Foundation CI at the start of this continuation. The latest audit-only commit needs its own check status.

### Decision and handoff

Do not delete any of these 25 branches automatically from this agent. The GitHub connector does not expose DELETE ref, and outside worktree/agent ownership cannot be proven from remote Git history alone. The read-only manifest tool is available; use a maintenance window after independently verifying open PR head/base refs, linked branch consumers, protected rulesets, and fresh `main`/candidate SHAs. Review evidence and human editorial/media approval records before pruning historical refs. Avoid splitting this work into additional micro-PRs.

## Final near-complete manual branch cohorts — 8 November 2026

At `main` SHA `338394f726b83189d112ffa3f71eb49eb75d1aa9`, checked an additional **80 historical refs** across:
- `feat/senna-*`, Time Machine, SEO, media, UK/EN, F1DB, various historical UI (19 comparisons);
- `fix/` content/provenance/media/browser repairs (20);
- `integration/`, `research/`, `review/`, `security/` and `test/` (20);
- remaining `test/` refs (8);
- skipped earlier `feat/circuit-*` cohort (13, including one previously checked `feat/circuit-graphics-v3`).

**Zero-ahead refs surfaced in this cohort** (candidate-only; one duplicate follows):
1. `feat/verified-season-facts-contract`
2. `fix/driver-result-row-labels`
3. `integration/boxbox-162-current-main`
4. `integration/pr395-main-20261105`
5. `feat/circuit-decade-history-navigation`
6. `feat/circuit-editorial-forward-port-pr401-20261105`
7. `feat/interactive-history-batch2` **was already counted in the earlier 78-ref cohort** — do not count twice.

**Deduplicated enumeration:** In this 80-ref pass, the newly found `behind` branches are **six**. There were 19 + 20 + 20 + 8 + 13 = **80 compare calls**, including one prior duplicate `feat/circuit-graphics-v3`. Therefore **79 distinct additional refs** and **six newly identified zero-ahead candidates**; the remaining 73 new refs have divergent histories. Earlier cumulative tally was 302 distinct / 25 zero ahead / 277 divergent. The *current reconciled manual count* is therefore **381 distinct historical refs**, **31 zero-ahead candidates** and **350 divergent refs**.

**Important coverage qualification:** The repository had 396 branches, with 13 open PR head branches and `main`. This leaves 382 non-PR, non-main refs at this snapshot. Manual comparisons cover **381/382** by our reconciled count; there may be one unaccounted historical ref, or a historical sample was double counted. This ledger does **not** assert 100% audit completion until a complete manifest has been generated and deduplicated by branch name. The script has that capability but has not been run against GitHub with `gh` in this session. No branch or source artifacts deleted.

Among current newly compared divergent refs, `security/workflow-pin-guard-reconcile-20261027` is ahead by 59 commits, and `feat/circuit-editorial-publication-boundary-20261029` is ahead by 43. Never treat these as archival trash without reviewing patch-equivalence and unpublished evidence retention.

### Exit criteria for #417

- Automated read-only inventory across **all** remote branches, recording exact `main` SHA and open PR head/base refs, with output stored outside the repository.
- Cross-check all candidate branches against PRs, worktrees and dependency owners. Prepare batches of at most 10 and record live SHA before any deletion.
- Ensure an independent review of cleanup utility tests and safe use. The script includes a deliberate opt-in for deletion but no deletion has been executed here.
- Preserve source provenance, media rights evidence, reviewed-vs-unreviewed publication flags and release gates.
