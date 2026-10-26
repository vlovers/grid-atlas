# Editorial verification — 24 October 2026

Stacked base: PR A #297 (rebased onto main `8dfcfa7` on 26 October). Design files do not overlap A's discovery/copy diff. The first design build was also tested against main; final evidence uses A+B together. No deployment or release approval.

| Command | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed with the repository lockfile |
| `pnpm check` | Passed |
| `pnpm lint` | Passed on stacked base; current main includes the shared local media-preview lint repairs |
| `pnpm typecheck` | Passed |
| `pnpm test` | 244 passed |
| `python3 -m unittest discover -s tests -v` | 378 passed |
| `pnpm build` | Passed; existing archive-rhythm autoprefixer warnings remain |
| `V3_API=http://127.0.0.1:3480 pnpm exec playwright test --config playwright.product-editorial-v3.config.ts` | 60 passed on the real archive, Chromium/WebKit/mobile Chromium |
| `pnpm audit:media --as-of 2026-10-24` | Passed; zero public photographs |
| `python3 scripts/audit-doc-links.py` / `git diff --check` | Passed |

API/database integration on A: 42 passed, one existing optional approved-publication case skipped, disposable owned schemas. B changes no API, SQL, importer or migrations. The same checksum-verified pinned F1DB v2026.17.0 import powers both previews. API 3480; A web 3481; A+B web 3483. Node 24.21.0, pnpm 10.18.3.

## What the browser suite verifies

Nine required subjects in both languages: Senna, Hamilton, Verstappen, Ferrari, McLaren, Silverstone, Monaco, Spa-Francorchamps, Monza. Canonical identities resolve through actual source IDs. Chromium uses 1440px, WebKit 1024px, mobile Chromium 390px. Each profile is checked at 200% text, with native identity/source disclosures and exact chart table values checked against API counts. Tools are checked for overflow, keyboard skip navigation, clipped containers, reduced-motion animation state and public page errors. SEO titles and existing canonical routes remain intact.

The initial tests incorrectly requested Ukrainian font glyphs on English pages that do not load that subset, and treated normal serif glyph overhang as clipping. Corrected tests use each page’s actual language, and detect text overflow only in clipping containers. Rendered screenshots were inspected alongside these tests. A zero-height patterned bar finding was fixed and tested as zero visible height.

Independent original-diff review found no remaining blockers after fixes to zero values and native disclosure markup. The existing encyclopedia fixture test now expands identity metadata using keyboard activation before querying its definitions. No accessibility checks are disabled.

## Visual evidence

Matching baseline and final native captures: EN/UK at 1440×1000, 1024×1000 and 390×844, all five tool views. Thirty core before / thirty after screenshots report zero document overflow and zero page errors. Four additional captures show the live map inspector and Stories at 200% text. Source JSON includes status, loaded font family/weight and height. Cormorant/Manrope Cyrillic subsets render correctly; existing OFL files remain unchanged. No new font or imagery dependency.

| Surface | Before | Final A+B |
| --- | --- | --- |
| Atlas | [UK desktop](screenshots/before-atlas-uk-1440.jpg) | [UK desktop](screenshots/after-b-atlas-uk-1440.jpg) · [map inspector](screenshots/after-b-atlas-focus-uk-1440.jpg) |
| Time Machine | [UK desktop](screenshots/before-comparison-uk-1440.jpg) | [UK desktop](screenshots/after-b-comparison-uk-1440.jpg) |
| Stories | [UK mobile](screenshots/before-stories-uk-390.jpg) | [UK mobile](screenshots/after-b-stories-uk-390.jpg) · [200% text](screenshots/after-b-stories-uk-390-text200.jpg) |
| Lineage | [EN desktop](screenshots/before-lineage-en-1440.jpg) | [EN desktop](screenshots/after-b-lineage-en-1440.jpg) |

Reproduce: start the production API on 3480 and this branch's production web on 3483, then run `node scripts/capture-product-editorial-v3.mjs after-b`. Keep build and preview output directories separate when rebuilding.

## Boundaries and next action

Source/copy work is in A; B retains all qualification and public evidence access. Chart first-place/top-three result entries are not relabelled unique race wins/podiums. No legal succession, official starts, source approval, rights clearance or deployed acceptance is inferred. No image or article publication changed. Existing approved SVGs and recorded-data fallbacks remain.

PR C is blocked by #290's independent human media clearance. PR A's Commons research-original CI run encountered HTTP 429 for three of five source files; the fail-closed gate remains intact. That check is automated byte verification, not publication approval. Do not merge while CI is red. Production hosting, operational checks, editorial/media acceptance and #104 remain release gates. Physical-device and hardware screen-reader review are not claimed.

## Resume on 26 October

The stack was refreshed onto main `8dfcfa7`, preserving newly merged circuit reading guides and editorial research. PR A’s CI compatibility correction removes its repeated subject heading and updates scoped existing tests. The 16 existing Time Machine tests and 94 affected route/encyclopedia/graph/outage tests pass locally. The final PR description records the exact head SHA and CI state.
