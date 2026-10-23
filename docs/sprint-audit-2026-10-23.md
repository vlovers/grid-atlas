# Stabilization and Visual Storytelling V2 — 23 October 2026

This is a dated engineering audit, not production-release approval. The user checkout was preserved; implementation used isolated worktrees. The supplied Grid Atlas concept was used as art direction, without copying its photography or inventing documentary imagery.

## Actual repository and integration state

Initial main was `7dc4d76`, already beyond the earlier visual milestone. README, architecture, roadmap, media/editorial gates, Actions and current issues/PRs were inspected before implementation. Main's Actions were green; old issue descriptions were not treated as current implementation contracts.

| Work | Audit and disposition |
| --- | --- |
| [#214](https://github.com/vlovers/grid-atlas/pull/214), Race Constructor Field | Reviewed imported result grouping, shared drives, exact profile links and the result limit disclaimer. Three checks passed on `77dd31b`; marked ready and squash-merged with an exact-head guard (`f9d193e`). |
| [#203](https://github.com/vlovers/grid-atlas/pull/203), repository hygiene | Integrated current main into the stale branch rather than merging blindly. Preserved useful read-only asset/doc audits and Foundation gates. Fixed a broken reconciliation link and symlink/worktree containment handling, added a regression test. 357 Python tests and all four CI checks passed on `61a5600`; squash-merged with an exact-head guard (`5920465`). No asset or research deletion. |
| Parallel editorial work | #216 merged documentation separately; #217 merged the Senna story evidence panel separately (`d9768a5`). #218 was an open draft touching the story route at recheck. These changes were not authored or approved by this sprint; V2 does not modify the story reader or manuscripts. |
| Visual Storytelling V2 | One coherent PR for reciprocal dossiers, media readiness and regression fixes. Source behavior, routes and screenshots are in the [implementation report](design/visual-storytelling-v2/README.md). No database/API contract rewrite or new animation dependency. |

## Existing implementation represented by broad or stale issues

- #106: Time Machine API, UI, deep links and browser regressions are implemented. Final maintainer visual/production acceptance remains separate; a new implementation is not required just because the issue is open.
- #155: Explorer, Time Machine and History Atlas are present. Broad visual acceptance still needs a maintainer decision against the actual product.
- #195/#152: design milestones have merged, but the original large design scope is not automatically complete. This sprint completes the reciprocal dossier participation experience, not all proposed race/season/story redesigns.
- #199: all 160 pinned circuit SVG assets and year/layout navigation exist; the rendering fix #207 merged. Per-asset rights review and unsupported technical overlays are separate outstanding matters.
- #123: inline Explorer localization centralization remains an engineering follow-up; the product currently supports only UK/EN.
- #107/#133: independent editorial review remains required. Existing record journeys and publication tooling do not approve all biographies.
- #197 source-reported driver/constructor championship classifications are implemented. Older claims that standings are absent were corrected. Result-sum statistics remain separate; independent historical scoring-rule verification is not claimed.

No broad issue was closed solely from an implementation overlap. Historical audit snapshots retain their original dates.

## Historical archive coverage

The complete pinned **F1DB v2026.17.0 main-race import scope** was compared against the checksum-verified ZIP, database, API and both locale profile routes. [Machine-readable report](design/visual-storytelling-v2/coverage.json):

- 917 drivers, 187 constructors, 78 circuits, 830 entrants and 77 seasons.
- All 1,172 race rows and 27,665 main-race result rows compared; no failures.
- 11,504 API requests; 2,364 localized entity profiles and 2,406 web responses checked; 73,068 rendered archive links checked.
- 57 drivers and one constructor without recorded main-race results retain their canonical identities and explicit empty states.
- Separate SQL/API smoke verified 160 layout records, 1,172 event/layout fact rows, all 160 attributed SVG mappings and no orphan/cross-circuit references. Repeated early result rows remain distinct from races.

This does not mean every artifact in the upstream repository is imported. Sprint, practice, qualifying and other out-of-scope datasets are not silently counted as covered. Archive consistency and source attribution are not independent historical fact-checking. This audit does not recompute every championship's historical scoring rules or approve media rights.

Reproduce using a migrated, already imported local DB and production API/web servers:

```sh
python3 scripts/audit-encyclopedia.py \
  --archive /path/to/f1db-json-splitted.zip \
  --checksums /path/to/checksums_sha256.txt \
  --api-url http://127.0.0.1:3470/api \
  --web-url http://127.0.0.1:3471 \
  --output /tmp/grid-atlas-coverage.json
SMOKE_API_URL=http://127.0.0.1:3470/api python3 scripts/verify-real-archive.py
```

Both commands require `DATABASE_URL`; credentials are deliberately excluded from this report.

## Executed verification

Baseline lint, typecheck, production build and 89 Node tests passed before feature edits. Final feature evidence:

| Check | Actual result |
| --- | --- |
| ESLint, TypeScript, production API/web build | Passed |
| Node unit/contract suite | 96 passed |
| Python offline suite | 357 passed |
| PostgreSQL API integration | 41 passed, one existing opt-in publisher check skipped in the default suite |
| Opt-in editorial publisher DB acceptance | Separately enabled on a fresh migrated synthetic DB: one passed, zero skipped; no real narrative published |
| Genuine F1DB desktop/mobile Playwright | 120 passed, UK/EN; McLaren 1988, Fangio gaps, 34-driver dense case, old explorer/Atlas/Time Machine journeys |
| Synthetic desktop/mobile Playwright | 442 passed; initial failed runs were investigated and followed by a complete successful rerun |
| Responsive screenshots | 16 before + 16 after viewport images and 16 after section images, UK/EN at 1440/1920/1024/390; final captures have zero errors, remote requests or document overflow |
| Documentation links / repository inventory | Zero broken links; 1,199 tracked files, 238 raster images including 48 sprint screenshots; read-only, no deletions |
| Media preflight and source identity verifier | Five candidates, zero approved publication images; seven exact identities and two exact historical layout mappings validated |

The first full run found hidden calendar labels escaping the scroll container. Its positioned container fixes the defect without hiding page overflow. A remaining existing season-calendar summary and race identity flex item needed wrapping/min-width fixes at 200% text. Tests retain their original overflow and browser-error assertions. An intermittent hydration error in one synthetic navigation run did not reproduce in 15 diagnostic dev navigations or the final 442-test production rerun. Its cause is unconfirmed; error assertions remain enabled. A final refinement keeps period marks continuous across the bounded calendar window; targeted API-parity checks and CI cover that change.

The in-app browser bridge was unavailable (`privileged native pipe bridge ... not trusted`); repository Playwright/Chromium provided actual browser verification instead. Automated keyboard, forced-colors, reduced-motion, no-JS navigation, 200% text and accessible landmark checks are included; this is not a formal accessibility certification.

## Remaining release blockers, in priority order

1. **Main protection:** direct GitHub API inspection returned HTTP 404 “Branch not protected”; repository rulesets were `[]`. Required checks/reviews are not enforced by repository settings. This sprint did not change governance settings; each merge was checked manually against its exact head.
2. **Staging/operations acceptance (#104):** hosting/domain, private database connectivity, public TLS/API limits, production `SITE_URL`, monitoring/alerts, backup restore rehearsal and deployment cache withdrawal remain unverified. Local production builds and CI are not deployment approval. No deployment was performed.
3. **Independent content/media decisions:** five media candidates remain unapproved, the photographic publication registry is empty, and constructor/car imagery has no candidate yet. Circuit SVG rights use their separate review lane. Proposed lineage and draft biographies need their own reviewers; an agent cannot invent clearance. Follow the [approved imagery workflow](media/approved-imagery-workflow.md).
4. **Product acceptance and follow-up scope:** maintainer UK/EN visual acceptance, translation review, broader circuit/season/race editorial composition and additional independently supported technical datasets remain outside this reciprocal dossier milestone. Public release may explicitly remain a statistical archive until approved biographies/images exist.

The next highest-priority engineering task is to establish protected-main required checks and complete a documented staging restore/readiness rehearsal under #104 before any public launch.
