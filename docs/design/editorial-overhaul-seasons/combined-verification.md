# Combined verification of three independent PRs

This is a temporary detached QA checkout, not a fourth PR, merge or deployment. Base `a2ba42901062b3b54d950366582f50b15b5bfb46`; source candidates PR1 `daf9623e23d82d063dac5dbbf64d2a2be2f5907e`, PR2 `69c4250852ab057a6f9273156ef2de097c94025c`, PR3 `461731d410c69046272b27b6775978356d6df971`. Subsequent changes are verification artifacts/capture script and one retired disclosure test locator, not application behavior.

Applied each original base-to-head patch with `git apply --3way`. PR1/2 Select source/CSS/package/lock entries are identical and were included once. One catalogue import overlap was resolved by retaining PR1's compact header imports and adding PR2's CircuitCatalogueFeatures; no template, fact or action was discarded. Other shared test/template edits applied cleanly. The source policy remains append-only; no migration added.

Executed with Node24.21.0 / pnpm10.18.3:

| Command | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm check` / `pnpm lint` / `pnpm typecheck` | PASS |
| `pnpm test` |354 PASS |
| `python3 -m unittest discover -s tests -v` |434 PASS |
| `GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm build` |PASS |
| `GRID_ATLAS_NEXT_DIST_DIR=.next-test DATABASE_URL=<disposable> pnpm exec playwright test` |528 PASS,0 fail,0 skipped; Chromium desktop/mobile and WebKit route reliability |
| Shared genuine-archive capture |78 pages:13 routes ×2 languages ×1440/768/390; allHTTP200,0 page errors,0 width overflows. [Report](combined-visual-audit.json). |
| Full encyclopedia audit, independent circuit branch |PASS:917 drivers,187 constructors,78 circuits,77 seasons,1172 races,27665 result rows;11504 API requests,2364 profiles/2406 pages; canonical paths and full result/race pagination compared. [Report](encyclopedia-coverage.json). |

The full synthetic browser run includes enlarged text, forced colors, keyboard navigation, native/no-JS forms, reduced motion, API outage and missing-data checks. Shared visuals cover home, all three catalogues, Senna/McLaren profiles, Monaco/Spa,1988/provisional2026 seasons, Time Machine, Atlas and Explorer. Before captures use an immutable main checkout and the same official checksum-verified F1DB import. Lazy images are loaded and rails reset before each shot.

The imported archive is isolated in a new localhost-only disposable PostgreSQL database. Synthetic integration publication acceptance passed45/45 in a separate fresh fixture DB; it did not alter the genuine import. No production credentials were used.

Independent source review found no remaining code blockers at the source SHAs above; PR1 whitespace-only follow-up was explicitly rechecked. New numbered guides and27 source-linked narratives remain private with0 edition approvals. Neither this QA composition nor green candidate CI grants publication, media, real-origin or #104 release acceptance. Maintainers still decide merge and release.

Full real-archive browser result and final candidate CI are recorded in the PR handoff after completion.
