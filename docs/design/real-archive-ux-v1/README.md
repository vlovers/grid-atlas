# Real Archive UX & Visual Quality V1

Baseline UI: `8590405`, 24 October 2026. This work improves the existing driver,
constructor and circuit templates using pinned F1DB v2026.17.0. It changes
presentation and navigation, not historical records or publication eligibility.

## What changed

- Driver and constructor covers now use their existing seasonal API counts in a
  compact server-rendered graphic instead of repeating the name in a large empty
  typographic plate. Both series share one scale; missing calendar years remain
  empty. Driver result entries and constructor distinct races keep different,
  explicit labels. SVG descriptions preserve every exact count.
- Mobile covers show the headline and summary statistics before the graphic.
  The same serif/sans/monospaced hierarchy, charcoal surfaces and red accents apply
  across all three profile types. No photo, historical car drawing, invented
  circuit geometry or unapproved biography was added.
- Profile section links wrap instead of concealing later chapters in a horizontal
  strip. Keyboard activation focuses the actual destination. Constructor profiles
  with no recorded seasons no longer link to a nonexistent season section.
- Race results, full driver/constructor ledgers and F1DB classifications use a
  shared named, focusable table region, explicit scrolling guidance, readable
  header/body sizes and row context. Arrow keys scroll the table while document
  overflow remains zero. Source classifications remain separate from summed results.
- Circuit pages use the shared editorial hero and contents navigation. Layout
  selection is the first content section, before the long chronology. The layout
  drawing and measurements share a desktop row and stack on smaller screens.
  Comparison, year selection and event evidence reuse the site palette and native
  controls. Every existing F1DB outline retains its exact layout ID and attribution.
- Circuit chronology uses one first/middle/latest visual journey instead of a
  second duplicate journey. Winner records, paginated race history, decade
  navigation, identity provenance and rights-gated empty media remain available.
- Participation calendars have larger supporting text and keyboard targets.
  Existing gaps, shared drives, unknown observations and historical caveats remain.

All new graphics and table wrappers are Server Components. Existing client state
and API contracts are retained. No runtime dependency or framework change.

## Real pages and visual evidence

The capture script resolves canonical IDs through the real imported API; sequence
IDs are not portable identity contracts. The same database and API were used for
both phases, with the 1988 season selected where supported. All captures use
production Next.js, self-hosted fonts and reduced motion.

| Profile | Desktop before | Desktop after | Mobile before | Mobile after |
| --- | --- | --- | --- | --- |
| Senna EN | [Before](screenshots/before-senna-en-1440.jpg) | [After](screenshots/after-senna-en-1440.jpg) | [Before](screenshots/before-senna-en-390.jpg) | [After](screenshots/after-senna-en-390.jpg) |
| McLaren UK | [Before](screenshots/before-mclaren-uk-1440.jpg) | [After](screenshots/after-mclaren-uk-1440.jpg) | [Before](screenshots/before-mclaren-uk-390.jpg) | [After](screenshots/after-mclaren-uk-390.jpg) |
| Silverstone EN | [Before](screenshots/before-silverstone-en-1440.jpg) | [After](screenshots/after-silverstone-en-1440.jpg) | [Before](screenshots/before-silverstone-en-390.jpg) | [After](screenshots/after-silverstone-en-390.jpg) |

Both languages include matched 1440, 834 and 390px viewport captures. Additional
section views cover career/roster/layout evidence. Each phase has 18 viewport and
12 section images. [Before measurements](before.json) and [after measurements](after.json)
record routes, status, heading outlines, page height, overflow, browser errors and
external requests. These are local Chromium observations, not Lighthouse or field
performance scores. Scroll position inside a long section can differ when its
layout changes; viewport cover comparisons are directly matched.

## Verification and reproduction

Use Node 24 and frozen pnpm dependencies. Start an API against the original import
and a production web preview in an isolated checkout. The import used here was
created in a separate PostgreSQL database on port 55462; other databases were not
modified. Archive assets and checksums are the official pinned release.

```sh
PREVIEW_API=http://127.0.0.1:3480 PREVIEW_URL=http://127.0.0.1:3481 \
  node scripts/capture-real-archive-ux.mjs before
# Build and restart the web preview after making the changes.
PREVIEW_API=http://127.0.0.1:3480 PREVIEW_URL=http://127.0.0.1:3481 \
  node scripts/capture-real-archive-ux.mjs after
pnpm lint
pnpm typecheck
pnpm build
DATABASE_URL=postgresql://... pnpm exec playwright test
# With SMOKE_* selectors discovered by the existing real-archive workflow:
DATABASE_URL=postgresql://... pnpm exec playwright test --config playwright.real-archive.config.ts
```

The new synthetic regressions verify heading hierarchy, complete fragment targets,
keyboard focus transfer, tablet layout, 200% text/reflow, keyboard table scrolling
and circuit season selection. Real-archive regressions compare graphic counts to
actual APIs, canonical/hreflang/description, desktop/tablet/mobile geometry, 200%
text, forced colors and empty/high-degree profiles. Additional real identities are
Hamilton, Ferrari, Monaco, Adderly Fong and FIRST. Existing SSR-without-JavaScript,
metadata, licensing, pagination and circuit-asset checks are retained.

Final executed check results are recorded in the PR. The original 18 before views
and the first 18 after views each recorded zero overflow and zero browser errors.
The first real-archive run passed all 128 cases. The new keyboard regression also
caught the constructor archive focus defect against the earlier build; adding a
focusable destination fixes the behavior rather than weakening its assertion.

A pre-existing lint error in the Commons Markdown renderer required removing one
unnecessary regex escape. Its behavior and publication logic are unchanged. Files
owned by PRs #247/#248, media ingestion, evidence checksums and roadmap were not
edited by this work.

## Limits and next priority

Photographic assets and biographies still require their existing independent
approval. The graphic shows imported records, not an official title calculation,
contracts or proof of continuous legal team history. Circuit drawings remain
illustrations of exact pinned layouts, not surveyed engineering maps or sector data.

200% coverage combines text enlargement with CSS reflow widths (including 720px,
corresponding to a 1440px desktop at 200% zoom); native browser-chrome zoom and a
manual screen-reader walkthrough are not claimed. Chromium and the repository's
WebKit reliability gates are checked; this is not exhaustive device certification.

The next UX priority is to bring season and race evidence pages to the same visual
hierarchy and preserve the profile → selected season → exact race return journey.
