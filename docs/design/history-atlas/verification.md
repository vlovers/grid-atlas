# History Atlas v1 — verification

Local verification: 21 October 2026, Node 24.21.0, pnpm 10.18.3, macOS ARM64.
Feature branch `feat/history-atlas-v1`, isolated worktree based on main
`b00ab3f711df77ad6db41ddd0f74c6e177a05d26`. No production connection,
deployment, merge, publication review or archive modification.

## Executed checks

| Check | Result |
| --- | --- |
| `pnpm check` | Pass |
| `pnpm lint` | Pass, zero warnings |
| `pnpm typecheck` | Pass, API and Next.js |
| `pnpm build` | Pass, API and production Next.js; no compilation warnings |
| `pnpm test` | **75 passed**, no failed/cancelled/skipped tests |
| `python3 -m unittest discover -s tests -v` | **95 passed** |
| `pnpm test:integration` | **32 passed**, disposable PostgreSQL |
| `pnpm exec playwright test --reporter=list` | **282 passed**, UK/EN Chromium desktop + Pixel 7, zero retries |
| `pnpm exec playwright test --config playwright.real-archive.config.ts --reporter=list` | **68 passed**, UK/EN desktop/mobile, genuine pinned archive |
| Atlas search/focus/trail journey with `--repeat-each=10` | **40 passed**, both locales and device projects; hydration errors remain test failures |
| Cross-engine config, `--project=webkit-desktop --project=webkit-mobile` | **56 passed**, Atlas plus existing interactive-history suite |
| axe-core 4.14.0, scoped to `#content`, real dense graph, UK/EN × 375/1440 | **0 automated violations** in all four views; incomplete rules remain for manual review |
| `git diff --check` and staged diff check | Pass |

GitHub CI results are reported in the Draft PR after the normal push. This
report does not substitute local checks for GitHub checks or human review.
Firefox and Lighthouse were **not run in this batch**. The optional cross-engine
config includes Firefox for a working host; Chromium and WebKit were executed.
No claim of comprehensive WCAG conformance or production readiness is made.

## Data and coverage

Created a task-owned PostgreSQL 17 container on localhost port 55452. Imported
the existing, checksum-verified F1DB **v2026.17.0** zip through the unchanged
migration/import scripts. Synthetic browser/API suites create and drop their
own schema; genuine archive tests read the imported public schema.

The new tests cover:

- Strict graph contracts in both identity directions; exact BIGINT IDs,
  malformed state, unsupported identity kinds, duplicate/gapped observed years,
  bounded trails and external-return-URL rejection.
- Dagre sparse/dense layouts, non-overlap, final loaded window, vertical mobile
  windows and unchanged relationship direction/count/provenance fields.
- Bounded search/pagination, no results, missing identity, invalid year/selection,
  empty career/year and unavailable API with retry.
- React Flow zoom/fit/reset, pointer pan, keyboard identity selection, accurate
  accessible names/pressed state, reduced motion, forced colors and 200% text.
- Pair counts, three-race preview/loading/failure/retry, canonical evidence
  destinations, focus pivots, trail restoration, reload, share and locale switch.
- Real Senna 1988 journeys, Cooper 1960's 34 associations with a 25-edge slice,
  and Ascari 1950 repeated entries distinguished from distinct races. The
  existing early/middle/modern Explorer/Time Machine real tests also run.
- Selected final dense node retained across desktop → mobile → desktop and
  mobile → desktop → mobile breakpoint transitions.
- JavaScript-disabled explicit Atlas maps use the existing bounded text route,
  preserving selected pair and source/license credit.
- Existing publication, media, editorial and circuit identity regression gates
  remain in the full suites; their implementation/data files are unchanged.

## Failures found and resolved

- The initial isolated worktree lacked API dependencies after a web-only package
  add. A frozen workspace install restored the API typecheck.
- A sandboxed Node test could not start its local review server. The unchanged
  test passed with local-server permission. An integration invocation without
  `DATABASE_URL` failed; the configured disposable-database rerun passed.
- First browser failures exposed ambiguous alert selectors and a drag test
  aimed outside the visible canvas. Selectors now distinguish the product alert
  from Next's route announcer, and drag begins on the visible canvas.
- Native screenshot review found clipped node names. Fixed node dimensions,
  text shrink behavior and pluralized race/result-entry labels.
- WebKit caught a long Ukrainian heading overflowing at 200% text. Scoped word
  wrapping fixes the page; the original overflow assertion remains.
- A locale-switch test was matching the old URL and old-language inspector.
  It now requires the destination locale, HTML language and translated inspector.
- A repeated Chromium run caught a streamed-loading hydration error and missing
  segment parent. The Atlas fallback now resolves its asynchronous text link
  before rendering the loading fragment; 40 repeated journeys and the final
  full suite pass without filtering browser errors.
- Axe caught missing text separators between node label fragments. Visible
  content now matches accessible names, with a browser regression assertion.

## Visual and accessibility artifacts

`screenshots/` contains **24 native browser JPEGs**: before, after (full page)
and focused map views for driver/dense constructor × UK/EN × desktop/mobile.
Desktop is 1440×1000; mobile is 375×812. Subjects resolve via canonical F1DB
external IDs; photographs, logos, unapproved prose and synthetic facts are not
introduced. Baseline is the existing #157 Explorer at `08ee955`; the baseline
preview was read only. Attribution: F1DB data, CC BY 4.0; Grid Atlas derives
the association view. React Flow attribution remains visible on its canvas.

- [Desktop dense map](screenshots/focus-dense-en-desktop.jpg)
- [Mobile dense map](screenshots/focus-dense-en-mobile.jpg)
- [Ukrainian driver map](screenshots/focus-driver-uk-desktop.jpg)
- [Native visual smoke results](visual-check.json): no page errors or horizontal
  overflow in the eight captured after views.
- [Axe results](accessibility-check.json): `aria-prohibited-attr`,
  `color-contrast` and `label-content-name-mismatch` have incomplete/manual
  items, despite no automated violations. Screen-reader/voice-control and
  human visual acceptance remain review steps.

The Next build reports the Atlas route at about 10.3 kB / 126 kB First Load JS.
The additional lazy map chunks total **73,241 gzipped JS bytes**, with 2,676
gzipped CSS bytes; these exclude shared framework/initial route chunks. The
search-only page does not render/load the map. These are local build sizes,
not measured production transfer or Core Web Vitals.
See [bundle measurement](bundle-measurement.json) and
[library/license decision](README.md#graph-library-decision).

## Reproduction

Follow the feature [preview instructions](README.md#local-preview), with a
disposable imported `DATABASE_URL` exported. Standard synthetic ports are
3339–3341; real-archive tests use 3350/3351. Use the existing CI SQL selection
and `scripts/select-real-archive-stress.py` to populate `SMOKE_*` variables;
do not hardcode database-local IDs into tests.

```sh
pnpm check && pnpm lint && pnpm typecheck && pnpm test
python3 -m unittest discover -s tests -v
pnpm build && pnpm test:integration
pnpm exec playwright test --reporter=list
pnpm exec playwright test --config playwright.real-archive.config.ts --reporter=list
pnpm exec playwright test tests/browser/history-atlas.spec.ts \
  -g 'Atlas search, focus pivot' --repeat-each=10 --reporter=list
pnpm exec playwright test --config playwright.cross-browser.config.ts \
  --project=webkit-desktop --project=webkit-mobile --reporter=list
git diff --check
```

Install the matching Playwright engines first. If using an isolated browser
cache, set `PLAYWRIGHT_BROWSERS_PATH` for the relevant command.

```sh
PREVIEW_URL=http://127.0.0.1:3403 PREVIEW_API=http://127.0.0.1:3402 \
  node scripts/capture-history-atlas.mjs
AXE_SCRIPT=/absolute/path/to/axe-core/axe.min.js \
  node scripts/audit-history-atlas.mjs
```

Optional `BASELINE_URL` captures the old Explorer read only; ensure its archive
IDs match the preview. The axe script requires a locally installed axe-core
4.14.0; it is a verification tool, not a new runtime dependency. Stop only your
own preview processes before rebuilding their `.next` artifact.
