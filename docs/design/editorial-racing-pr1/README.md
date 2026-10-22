# Editorial Racing — foundation, homepage and dossiers

Dated implementation and verification evidence, 22 October 2026. This is the first
redesign milestone, based on main `99863bb`. The supplied concept image was inspected
as art direction; its photographs, quotations and example statistics are not assets
or historical evidence for this implementation.

## Implemented surface

- `/en`, `/uk`: editorial cover, source-backed featured drivers and constructors,
  decade browsing, race journeys, circuit discovery, Time Machine and Atlas entry.
- `/en/drivers/:id`, `/uk/drivers/:id`: shared dossier for every archive identity,
  demonstrated with Ayrton Senna. Career overview, race opening, selected-season
  ledger, consecutive constructor eras, milestones, observed peer links, separate
  F1DB championship classifications, timeline and complete archive disclosures.
- `/en/constructors/:id`, `/uk/constructors/:id`: constructor dossier demonstrated
  with McLaren. Race-derived history, leading recorded drivers, native GET season
  selection, season roster and race evidence, prominent seasons, participation
  timeline, full season/driver tables, reviewed lineage and F1DB classifications.
- All public routes inherit the masthead, navigation, footer, fonts and palette.
  Circuit, season, race, story, Atlas and Time Machine template redesigns remain
  later milestones; their existing functions are retained.

The implementation composes existing historical APIs on the server. Curated names
resolve to canonical imported identities. Peer enrichment uses at most two observed
constructors and three distinct other drivers. It does not assert rivalries or
contracts. No database schema, historical counts, article manuscript, review state
or media approval is changed.

## Design and delivery choices

Obsidian, charcoal and ivory with restrained racing red, burgundy and silver. Display
serif headlines, sans-serif reading/navigation and monospaced archive values; thin
rules, asymmetric editorial rows and compact statistics replace accumulated page
CSS. Shared server components cover the header, hero, media gate/fallback, headings,
statistics, section links, source attribution and missing imagery.

Cormorant Garamond and Manrope are self-hosted, including Ukrainian character
coverage. Their OFL licenses, exact download URLs, byte counts and SHA-256 values are
in `apps/web/public/fonts/`. Builds and page rendering do not fetch remote fonts.
No new dependency or animation bundle is added. Section reveals use the existing
motion controller; reduced motion, pause state and keyboard operation remain.

The publication registry currently contains **zero approved media assets**. Archive
compositions are explicitly labelled as typography and recorded data. They are not
portraits, historical car drawings or documentary photographs. The car-gallery
placeholder explains the season-specific imagery requirement. Biographies and
published story chapters continue to use the existing approval gates.

The generic locale loading boundary was removed because it left streamed dossier
HTML hidden without JavaScript. Dossiers and native season selection now render
without hydration. Dedicated Atlas, Explorer, Time Machine and story loading
boundaries remain. The outage test server checks a static font for readiness: a
data-backed page correctly returns HTTP 500 when its API is unavailable.

## Review the screenshots

All captures use the production build and the actual pinned F1DB import, not the
synthetic browser fixtures. Both languages have before/after viewport captures at
**1440, 1920, 1024 and 390 pixels**. There are 24 before views, 24 after views and 18
after section views. Original concept imagery is not committed.

| Surface | Before, 1440 | After, 1440 | After, 390 | Inside the page |
| --- | --- | --- | --- | --- |
| Homepage | [EN](screenshots/before-home-en-1440.jpg) | [EN](screenshots/after-home-en-1440.jpg) | [UK](screenshots/after-home-uk-390.jpg) | [Constructors](screenshots/after-home-en-section-2.jpg) |
| Senna | [EN](screenshots/before-senna-en-1440.jpg) | [EN](screenshots/after-senna-en-1440.jpg) | [UK](screenshots/after-senna-uk-390.jpg) | [Constructor eras](screenshots/after-senna-en-section-2.jpg) |
| McLaren | [EN](screenshots/before-mclaren-en-1440.jpg) | [EN](screenshots/after-mclaren-en-1440.jpg) | [UK](screenshots/after-mclaren-uk-390.jpg) | [Season selection](screenshots/after-mclaren-en-section-2.jpg) |

`before-capture.json` and `after-capture.json` contain individual HTTP statuses,
viewport sizes, overflow, browser errors, external requests and observed layout
shift. These are single local Chromium runs, not Lighthouse or field-performance
scores. Section views are supplementary visual evidence.

To reproduce after starting a production web preview and its imported API:

```sh
PREVIEW_URL=http://127.0.0.1:3461 PREVIEW_API=http://127.0.0.1:3460 \
  node scripts/capture-editorial-racing.mjs after
```

Use Node 24, the pinned pnpm lockfile and the repository Playwright Chromium. The
script discovers Senna and McLaren IDs from the API. `before` captures must run
against the baseline build. Do not rebuild a Next output directory while a running
preview or browser suite is using it.

## Historical coverage

[Archive audit](archive-coverage.json): pinned F1DB `v2026.17.0`, ZIP SHA-256
`0f1717eaebae646b7ced9ca96f6be3282c1c1d435d0a9d75f2c00f40feb7d2a8`.
The audit exhausts entity pagination, compares all imported result fields and race
identities against the archive, checks reciprocal APIs, and renders every canonical
driver/constructor/circuit profile in UK and EN. Coverage means consistency with
that pinned release, not independent verification of historical truth or newer
results. Empty result histories remain explicit: 57 drivers and one constructor.

See [verification](verification.md) for actual checks and remaining limits.
