# Batch 2 verification — 21 October 2026

## Environment and scope

Node 24.21.0, pnpm 10.18.3, PostgreSQL 17, Next.js 15.5.28, Playwright 1.64.1. Worktree `/private/tmp/grid-atlas-interactive-batch2`, branch `feat/interactive-history-batch2`, base #154 `ffda1775723abdcc71dc4073043b1a0c7b94525a`. Main at audit: `2efb6c3f3dcc61a3807e7f1cad2aa119be2f51f3`. No other worktree was modified.

Separate disposable container `grid-atlas-interactive-batch2-db`, localhost:55450. Fresh checksum-verified F1DB v2026.17.0 import: 77 seasons, 917 drivers, 187 constructors, 830 entrants, 78 circuits, 1,172 races, 27,665 result rows. No production connection. SQL/API parity verifies consistency with this import, not independent historical truth.

## Local verification

The complete Chromium and genuine-archive suites passed against the frozen review build. CI status is reported separately by the Draft PR.

| Check | Result |
| --- | --- |
| `pnpm check` | Foundation validated |
| `pnpm lint` | Passed, zero warnings |
| `pnpm typecheck` | API + web passed |
| `pnpm build` | Production API + web passed, no build warnings |
| `pnpm test` | 65 passed |
| `python3 -m unittest discover -s tests -v` | 81 passed |
| `pnpm test:integration` | 29 passed, disposable schemas |
| Chromium synthetic browser suite | 254 passed, 0 failed, UK/EN desktop/mobile, 2.0 minutes |
| Genuine pinned-archive browser suite | 56 passed, 0 failed, UK/EN desktop/mobile, 1.6 minutes |
| WebKit desktop/mobile focused suite | 28 passed, 0 failed, UK/EN, 14.1 seconds |
| SQL/API parity script | Passed early/middle/modern, shared/repeated rows, no-data year, reciprocal evidence and both Time Machine identity directions |
| `git diff --check` | Passed |
| Screenshots | 36 native JPEGs: before/after full pages plus focused viewport captures; sparse/dense Explorer and Time Machine, UK/EN, 1440×1000 + 375×812 |

No retries, weakened API assertions, unverified data fixtures or changes to the real-archive verification scripts. All complete browser passes use a frozen production artifact. Do not run `next dev` or rebuild `.next` during these runs.

### Added regression coverage

- Nine Node cases: sparse/medium/dense non-overlapping layouts, bounded visual pagination, zoom limits, complete identity labels, nullable comparison counts, additive entries without summing distinct races, comparison windows, bilingual boundaries, escaped text-view routing and plural forms.
- Twenty-eight added Chromium cases: actual pointer/keyboard pan/zoom/reset, browser zoom shortcut preservation, same-document selection and Back/Forward, exact race previews, failure/retry with canonical evidence, missing-vs-zero comparison counts, filters/share URLs, forced colors/reduced motion/200% reflow, unloaded selections, no-data/outage states and real JavaScript-disabled text access/attribution at desktop/mobile widths.
- Sixteen added real-archive cases: homepage → graph → selection → evidence → exact race → comparison → shared URL; full capped graph and remaining records; responsive selection retention across breakpoints; dense comparison pagination; early 1950/middle 1988/modern 2010 in both identity directions; API inverse comparisons; Alberto Ascari's actual repeated early rows preserve entries vs distinct races.
- Existing graph/SEO/localization/driver/media/publication regressions remain exercised. Assertions were adapted to the new visible windows, native archive disclosure and explicit accessible language names; evidence/count assertions remain intact.

## Failures found and corrected

1. Initial enlarged-text comparison overflow: fixed wrapping, year sizing and constrained cells; both locales now reflow at 200%.
2. JavaScript-disabled browsers remained on Next.js's streaming loading screen: reproduced in an actual disabled-JS context. Added an explicit bounded HTML text view linked from the current loading request. It preserves IDs/query, native pagination, source/license attribution and public-data-only readers, with escaped HTML, no scripts, no-store and noindex.
3. Old stress assertions assumed ten SVG nodes and horizontal overflow on mobile. The new deterministic windows are eight desktop/four mobile; tests now verify fitted geometry, actual pan/reset and off-window selection. A mistakenly broad status filter was corrected to assert the actual pagination range.
4. Lighthouse's unscored label-in-name diagnostic found inherited abbreviated language labels and SVG title/text concatenation. Controlled browser probing reproduced the exact rule. Visible language abbreviations now lead full accessible names; SVG links retain complete names/counts with a native title attribute and separated text. A browser regression verifies the visible count/name is represented in the accessible name. The diagnostic passes in both final audits.
5. Responsive review found the selected node could leave its window on resize. The active window now follows the current selection; real-data tests cross the breakpoint in both directions.
6. Formatting changed quote spelling in the middleware matcher, exposing a source-level media test assumption. The original matcher/exclusions were restored exactly. No media-gate test was weakened.
7. CSS prefixer warnings were corrected using supported alignment values. Lint/build finish without warnings.

## Cross-browser limitation

The combined optional run passed **28 WebKit cases** but **14 Firefox cases failed before opening any app page**. Firefox 1555 reported `Could not find profile folder` and exited during launch. A separate two-case probe using a canonical task-owned temporary profile directory failed identically. This is not counted as Firefox application coverage. The final WebKit result is recorded separately; no Firefox skip was added to CI, and the optional Firefox project remains available on a working host.

## Lighthouse

[Sanitized measured summary](lighthouse-summary.json). Lighthouse 13.5.0, default mobile emulation, real pinned archive, local production preview. Final visual implementation:

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| Explorer | 87 | 100 | 100 | 100 |
| Time Machine | 88 | 100 | 100 | 91 |

The label-in-name diagnostic passes. Time Machine's meta-description audit still reports a missing description; its existing localized metadata workflow is retained. The no-store policy prevents back/forward cache restoration; this policy was preserved. These are local observations, not production benchmarks or a WCAG certification. No metadata/SEO setting was weakened to improve a score. Hardware screen readers and real devices remain manual review work.

## Reproduction

Use the disposable setup in [README.md](README.md), Node 24 and unused ports.

```sh
pnpm check
pnpm lint
pnpm typecheck
pnpm build
pnpm test
python3 -m unittest discover -s tests -v
pnpm test:integration
pnpm exec playwright test --reporter=list
```

For real data, select `SMOKE_YEAR`, `SMOKE_DRIVER_ID`, `SMOKE_CONSTRUCTOR_ID` using `.github/workflows/real-archive.yml`, run `scripts/select-real-archive-stress.py` with `GITHUB_ENV`, load its generated values, then:

```sh
pnpm exec playwright test --config playwright.real-archive.config.ts
```

Optional engines (install separately; no project dependency change):

```sh
pnpm exec playwright install firefox webkit
pnpm exec playwright test --config playwright.cross-browser.config.ts \
  --project webkit-desktop --project webkit-mobile
# On a host with a working Firefox runtime:
pnpm exec playwright test --config playwright.cross-browser.config.ts --project firefox-desktop
```

Lighthouse (set `CHROME_PATH` to an installed Chromium executable, resolve a real driver ID from the API):

```sh
pnpm dlx lighthouse@13.5.0 'http://127.0.0.1:3393/en/explorer/drivers/DRIVER_ID?year=1993' \
  --chrome-flags='--headless=new --no-sandbox' --output=json --output-path=/tmp/explorer-lighthouse.json
```

## Remaining review

Human visual review and dependency order #153 → #154 → Batch 2 remain mandatory. Firefox application coverage, hardware assistive technology, real-device use and the Time Machine metadata audit need follow-up. No merge, deployment, new publication approval, photography license approval or independent historical verification is claimed.
