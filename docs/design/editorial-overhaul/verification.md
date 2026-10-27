# PR 1 verification — global editorial UX

Base audited at ba29d55 and refreshed over c6d006b (upstream Monaco/Spa research retained). Latest observed upstream a2ba429 adds research only; UI baseline captures use that unchanged main. No migrations, publication decisions or deployment changes.

## Changed experience

EN/UK home now uses the featured driver's exact first-win (or first available result) race and its event-linked historical layout. No guessed geometry is used. Empty careers get actual season links instead of a large empty media panel. Removed the detached Senna chart/next-chapter aside. Circuit spotlight cards share dimensions/actions; long names use a smaller consistent scale. Driver/constructor discovery cards omit career charts and redundant season jumps; catalogue headers omit duplicated preview media. All index cards expose bounded API race/year/win summaries and final-source title counts when available.

Driver/constructor catalogues count **distinct Grands Prix with results**, including DNS/retirements, not official starts. Circuit cards count calendar Grands Prix; unfinished seasons can include future rounds. Shared drives do not double wins. Title counts require historical final classifications; missing or provisional-only classification coverage is null. No title is inferred from race points. A native disclosure retains definitions.

Radix Select replaces controls in Home comparison, Atlas, Time Machine, Lineage, Stories and constructor profiles. Native selects remain in server HTML before hydration; GET form names/values are retained after enhancement. Option groups are recursive, individually selectable and labelled. Circuit controls are handled by PR 2 using the identical shared component/dependency, so either PR builds independently.

Font file inspection confirms Ukrainian Ґ/Є/І/Ї (upper/lowercase) in both local files. Cormorant has a 300–700 variable weight axis, Manrope 200–800; the existing declared 400–700 range is valid. Kept licensed families; relaxed leading/tracking, reduced oversized headings, disabled synthetic font styles, and repaired intrinsic grid widths. [Measured glyph/axis report](font-audit.json).

## Executed checks

All commands used Node 24.21.0 and pnpm 10.18.3 in `/private/tmp/grid-atlas-ux1`.

| Check | Actual outcome |
| --- | --- |
| `pnpm check` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS, 350 tests after upstream refresh |
| `python3 -m unittest discover -s tests -v` | PASS, 434 tests at audited source baseline |
| `GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm build` | PASS, production build |
| `DATABASE_URL=.../grid_atlas_ux_editorial_test RUN_EDITORIAL_PUBLICATION_DB_ACCEPTANCE=1 pnpm test:integration` | PASS, 45 pass / 0 skip; opt-in publication check ran in a separate fresh disposable database, never the genuine archive |
| Full `GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm exec playwright test` | 516 passed; four Time Machine checks had an ambiguous text locator after copy changes. Corrected it to the exact definition term; no product check disabled. |
| `... pnpm exec playwright test tests/browser/time-machine.spec.ts tests/browser/editorial-overhaul.spec.ts` | PASS, 28 tests; includes every remaining failed check, grouped career/archive years, native form submission, Escape/focus, enlarged UK/EN headings. |
| Final public-copy browser recheck | PASS,72 tests covering profile status disclosures, constructor sources, no-JS evidence, Explorer outages and navigation. |
| Genuine-archive profile/story recheck | PASS,16 tests; Senna/Hamilton, preserved publication boundary, keyboard season submit, race/Atlas/back navigation. |
| Genuine-archive capture | PASS, 48 changed-route pages; UK/EN × 1440/768/390, HTTP 200, zero page errors/overflow. [Machine report](after-global.json). |
| `git diff --check` | PASS |

The first full browser run exposed actual 200%-text overflow (repaired intrinsic widths) and stale expectations for removed chart/placeholder blocks (replaced with explicit no-chart and meaningful fallback assertions). Integration tests exercise shared-car wins, nullable titles and a synthetic provisional 2026 champion flag that cannot become a title count.

The API/web for screenshots use the official checksum-verified v2026.17.0 import in a dedicated localhost database. Before/after screenshots use the same database, locale, viewport and reduced-motion setting. The capture scrolls each lazy image into view before shooting; blank unloaded-image screenshot artifacts are not presented as product defects.

## Review and boundaries

Independent reviewer inspected the original diff and found the initial optgroup defect, obsolete Ukrainian heading selector, and overbroad submit-button styling. All repaired and exercised. Final SHA/CI links are in the PR handoff. A passing test or a source attribution does not grant editorial/media approval. No photograph, independent human signature, source release, hosting, production-origin acceptance or #104 release gate was invented.

Remaining limits: archival media rights remain subject to existing review; native no-JS forms work while interactive maps/charts require JS and retain existing text/data alternatives. Brand typography and original canonical imported names remain unchanged. Public release and merge require maintainer approval.

## Complete public-copy review

The independent audit covered the public profile, Time Machine, Atlas and Explorer messages as well as the shared dictionaries. Removed prominent “identity”, “loaded list”, “earlier records” and reviewed-claims labels; actions now refer to names, seasons, results and team history. Repeated contract/legal-continuity caveats live in native source disclosures. Driver biography absence is a compact truthful status, not a large process placeholder. Distinct race counts, result-row metrics, provisional standings, missing data and graph/window truncation remain separate. Circuit catalogue counts explicitly describe calendar events, which may include an incomplete season’s future rounds.

All 45 API integration checks, including the opt-in publisher, passed in a separate fresh fixture database (`grid_atlas_ux_editorial_test`); synthetic publication data never entered the imported archive. Updated candidate CI and final combined evidence are recorded in the PR.

The expanded copy pass completed 510 of 520 synthetic checks; ten remaining failures used retired wording. Updated their accessible locators and verified all in the72-test recheck above. Real-archive checks use the new career navigation label and an explicit submit-button selector after Select enhancement. Candidate CI reruns the whole suite.

Final capture resets horizontal rail positions after lazy image loading, so comparison images show the same initial rail position. Updated homepage/catalogue screenshots also match the combined rendering; no season/circuit detail code changes those components.
