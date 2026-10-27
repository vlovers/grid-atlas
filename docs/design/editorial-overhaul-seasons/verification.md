# PR 3 verification

Executed in isolated `/private/tmp/grid-atlas-ux3`, Node24.21.0 / pnpm10.18.3. Independent branch; no API/schema changes. Main's research-only refresh is preserved before handoff.

| Check | Actual outcome |
| --- | --- |
| `pnpm check` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS,350 after final upstream refresh |
| `python3 -m unittest discover -s tests -v` | PASS,434 |
| `GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm build` | PASS |
| Full Playwright synthetic archive suite | 510 passed, six failed: four stale source-copy assertions and two real 200%-text overflow checks on the cover year. Assertions now check retained F1DB source identity; reduced the year’s minimum type size. |
| `... playwright test tests/browser/championship-classifications.spec.ts tests/browser/unified-archive.spec.ts` | PASS,24 tests including all six failures, both languages, desktop/mobile,320px/200%, forced colors and keyboard navigation |
| `... playwright test --config playwright.real-archive.config.ts tests/real-archive/season-editorial-overhaul.spec.ts` | PASS,8 genuine-archive scenarios;1988/2008 → published story,2026 provisional, both locales on desktop/mobile |
| Genuine archive capture |24 pages, allHTTP200, zero page errors/width overflow. [Report](visual-audit.json). |
| No-JS inspection | EN/UK home, searched drivers/constructors and1988 season had visible real headings; existing native GET and map text-alternative suites retained. This does not claim a JS-free interactive map. |
| API integration / migrations | N/A new API/schema work: none. Real UI reads the official import in a separate disposable DB; synthetic browser fixtures own random schemas. CI/API baseline checks remain separate. |
| Local documentation links / whitespace | PASS;0 unresolved links / `git diff --check` |

The full suite's failures were addressed without removing an interaction or disabling a check. A separate simultaneous run initially refused the occupied test ports; it was rerun after the other owned suite stopped. That infrastructure refusal is not counted as a successful test.

Independent review found that the first season-story links used the separate driver-journey route. Corrected both links to `/stories/moments/:slug`; the genuine archive test now follows them and verifies a real story heading. The existing exact bilingual digest gate is unchanged. No approval, biography, photograph or historical event was fabricated.

Selected before/after files compare the same locale/viewport/archive with reduced motion and loaded lazy images. The final three-PR combined sweep is tracked separately; no screenshot or green CI is deployment/publication acceptance. Media rights, editorial sign-off and real-origin/#104 gates remain outstanding release work.
