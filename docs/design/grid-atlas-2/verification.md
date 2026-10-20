# Batch 1 verification — 20 October 2026

## Successful local checks

| Check | Actual result |
| --- | --- |
| `pnpm check` | Foundation validated |
| `pnpm lint` | Passed, zero warnings |
| `pnpm typecheck` | API and Next.js TypeScript passed |
| `pnpm build` | Production API and Next.js build passed |
| `pnpm test` | 51 passed, 0 failed |
| `python3 -m unittest discover -s tests -v` | 81 passed |
| `pnpm test:integration` | 29 passed, 0 failed, disposable schemas |
| `pnpm exec playwright test --reporter=list` | 210 passed, 0 failed, desktop Chromium + Pixel 7, 1.7 minutes |
| `pnpm exec playwright test --config playwright.real-archive.config.ts` | 36 passed, 0 failed, UK/EN desktop/mobile, 55.8 seconds |
| `SMOKE_API_URL=http://127.0.0.1:3372/api python3 scripts/verify-real-archive.py` | SQL/API parity passed: early, middle, modern, shared/repeated rows, missing season, reciprocal graph/evidence and both Time Machine directions |
| `git diff --check` | Passed |
| Final screenshots | EN/UK home, catalogue and Senna, desktop 1440×1000 and mobile 375×812; visually inspected |

Database: disposable `grid-atlas-2-batch1-db`, PostgreSQL 17, localhost:55447, fresh checksum-verified F1DB `v2026.17.0` import. No production connection. Counts checked: 77 seasons, 917 drivers, 187 constructors, 830 entrants, 78 circuits, 1,172 races and 27,665 result rows. Real fixture identities are selected by SQL/API, not assumed numeric IDs. This verifies consistency with the pinned import, not independent historical truth.

The browser regression suite includes the previous Explorer, Time Machine, SEO, localization, media-gate and editorial-boundary coverage. New tests cover imported-decade selection, bounded driver search/pagination/reset, honest no-result fallback, real keyboard evidence links, current-route navigation, 200% text reflow, reduced motion, keyboard skip navigation and homepage outages. New real-archive journeys cover canonical Senna discovery, the actual latest imported season, valid comparison repair, catalogue-to-dossier navigation and absence of remote media requests.

## Failures found and resolved

The first run passed 198/210. It exposed a 200% text reflow issue and stale test expectations for the previous background token, decorative heading text and synthetic catalogue order. The next pass found a fixed-width arrow column and a decorative skew frame overflowing enlarged text. Both layouts were corrected; the test's year locator was also changed to its actual accessible name (the arrow is intentionally hidden from assistive technology).

A subsequent synthetic run was explicitly interrupted after a development-preview process disturbed its production build. That run is not counted as successful. The final build was recreated, development mode stopped, owned test servers cleaned up, and **all 210 + 36 cases passed from the frozen production build**. No retries or weakened assertions were used to obtain these results. The old graph fill assertion now checks the required `#0B0F14` opaque background.

The in-app browser connection was unavailable. Repository Playwright supplied the browser, screenshots and interaction checks; screenshots were opened for visual inspection.

## Reproduction

Use Node 24 and the database setup in [README.md](README.md). All test databases must be disposable.

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

For the entire real suite, use the existing workflow's SQL selection of `SMOKE_YEAR`, `SMOKE_DRIVER_ID`, `SMOKE_CONSTRUCTOR_ID`, then `scripts/select-real-archive-stress.py` with `GITHUB_ENV` and load its generated environment values. Run `pnpm exec playwright test --config playwright.real-archive.config.ts`. See `.github/workflows/real-archive.yml` for the exact disposable-import and fixture-selection commands. The new `atlas-discovery.spec.ts` itself discovers Senna's ID from the API; existing Explorer suites additionally require those selected stress cases.

Run only production previews (`pnpm --filter @grid-atlas/web start`) while browser suites use the built `.next` output. Do not run `next dev` or rebuild that same worktree during a production browser run.

## Not claimed / remaining review

- CI status is reported by the Draft PR checks; this document records local execution.
- No deployment, merge, production traffic measurement, Lighthouse score or production-readiness certification.
- No full Safari/Firefox, hardware screen-reader or real-device audit. Chromium mobile emulation, keyboard, forced-color and reduced-motion checks are covered.
- No independent historical verification of imported facts, editorial publication approval or media licensing approval.
- Full Explorer/Time Machine compositions are Batch 2; remaining entity templates and the complete accessibility/performance audit are Batch 3.
