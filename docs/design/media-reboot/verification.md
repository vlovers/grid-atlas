# Media reboot verification — 21 October 2026

## Executed successfully

| Check | Actual result |
| --- | --- |
| `pnpm check` | Foundation validated |
| `pnpm lint` | Passed, zero warnings |
| `pnpm typecheck` | API + Next.js TypeScript passed |
| `pnpm build` | API + Next.js production build passed |
| `pnpm test` | 56 passed, 0 failed/cancelled |
| `python3 -m unittest discover -s tests -v` | 81 passed |
| `pnpm test:integration` | 29 passed, disposable schemas |
| `pnpm exec playwright test --reporter=list` | 226 passed, 0 failed, desktop Chromium + Pixel 7, 1.9 minutes |
| `pnpm exec playwright test --config playwright.real-archive.config.ts` | 40 passed, 0 failed, UK/EN desktop/mobile, 1.2 minutes |
| `SMOKE_API_URL=http://127.0.0.1:3382/api python3 scripts/verify-real-archive.py` | SQL/API parity passed: early/middle/modern, shared/repeated rows, no-data season, reciprocal graph and both Time Machine directions |
| `node scripts/capture-media-reboot.mjs` | 16 native JPEG captures, UK/EN home/driver/circuit/race × desktop/mobile |
| `git diff --check` | Passed |

The final browser suites used the same frozen production build. No concurrent development build, retries or test-server reuse. CI status is reported separately by the Draft PR.

Database: task-owned disposable PostgreSQL 17 container `grid-atlas-media-reboot-db`, localhost:55448. Fresh checksum-verified pinned F1DB `v2026.17.0`: 77 seasons, 917 drivers, 187 constructors, 830 entrants, 78 circuits, 1,172 races and 27,665 result rows. SQL/API parity was checked against this import, not production. This establishes internal consistency, not independent historical truth.

## Added coverage

Five Node cases cover exact API opening milestones, common recorded-season intersection, honest missing records, deterministic bounded season ranking without titles, bilingual copy and original decorative artwork boundaries.

Sixteen added synthetic browser cases cover honest no-results discovery, working circuit links, keyboard motion pause/resume and session persistence, reduced motion, race opening links, closed archival graphics, no hydration errors, entity headers, forced colors and 200% text reflow. Existing catalogue, Explorer, Time Machine, localization, error, loading, media-gate and editorial-boundary regressions still pass.

Four added pinned-archive cases independently resolve canonical Senna/Prost/circuit IDs, compare exact first-win destinations to the API, keyboard-scroll story rails, verify the actual shared recorded season, open race evidence and driver disclosures, and assert no unapproved images, articles, external media requests or page errors. Existing real driver tests also now capture hydration errors.

## Failures investigated and corrected

- Moving the career chart into a disclosure exposed React 19 SVG `<title>` hydration errors. Both existing mixed-child titles now use single scalar strings. Driver browser tests assert absence of page errors.
- The old career-map test focused a summary inside Next.js's hidden streamed container before insertion into the visible page. It now waits for the actual summary to be visible, then explicitly checks focus, presses Enter and follows the exact seasonal evidence link. No sleeps, retries or removed keyboard assertions.
- Story sections and their inner scrolling regions originally had identical accessible names. Inner rails now have localized `Story rail:` / `Стрічка історій:` prefixes. The motion assertion also uses the exact Resume control instead of matching every pressed button (including the selected decade).
- A sandboxed Node run timed out on the existing ephemeral-preview server test. With localhost binding permitted, all 56 Node tests passed in 236 ms. The failed run is not counted as successful.
- An earlier development diagnostic disturbed production build output; that interrupted exploratory run was discarded. The final build was recreated before the successful complete browser suites.
- Restarting the API preview reported port 3382 already occupied by the previously running task-owned process. The existing healthy API was used; no other process was killed.

The in-app browser bridge was unavailable. Repository Playwright provided browser execution and native screenshots, which were opened for visual review.

## Reproduction

Use Node 24 and the disposable setup in [README.md](README.md).

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

The real suite requires `DATABASE_URL` and genuine pinned import. Select `SMOKE_YEAR`, `SMOKE_DRIVER_ID`, `SMOKE_CONSTRUCTOR_ID` with the SQL in `.github/workflows/real-archive.yml`; run `scripts/select-real-archive-stress.py` with `GITHUB_ENV`, load the emitted environment values, then:

```sh
pnpm exec playwright test --config playwright.real-archive.config.ts
```

Run only production `start` previews while browser suites consume `.next`. Do not run `next dev` or rebuild the same worktree mid-suite.

## Remaining limits

No Safari/Firefox, hardware screen-reader, real-device or Lighthouse audit was run. No production deployment, historical source approval or media licensing approval is claimed. Full Explorer/Time Machine redesign and the deeper entity-template redesign remain later batches.
