# Interactive historical stories — routing, sourcing and publication contract

**Implementation brief, 2026-10-20.** Scoped to the Senna × Prost story research merged via #138. This is an executable specification for a future **unpublished-preview first** implementation, not consent to publish the story.

## Actual app constraints found in main

- The route `/[locale]/drivers/[id]` uses a **numeric positive database ID** and calls `/api/drivers/:id`. The research outline's links such as `/en/drivers/ayrton-senna` **will not work**; driver `external_id` must be resolved through the existing API/imported identity before linking.
- `/[locale]/constructors/[id]` also requires a numeric database ID. `/en/constructors/mclaren` in the draft is NOT a verified route.
- `/[locale]/seasons/[year]` accepts 4-digit years and is the only direct story-deep-link shape already justified by route code (e.g. `/en/seasons/1988`).
- The project has `/[locale]/time-machine`, but query/deep-link parameters must be confirmed against its deployed page before story cards target it.
- The existing public driver article endpoint uses `getPublishedArticle`; this contract MUST remain the publication gate. A draft story cannot bypass that gate by embedding manuscript paragraphs in React components.

## Content source of truth

Research manuscript: `docs/editorial/stories/senna-prost-rivalry.en-uk.draft.md`, including the appended 1988–1990 classification evidence. It is an outline, not a valid approved versioned per-locale claim dossier.

Break the work into stable units:
1. `two-champions-one-garage` — teams and prior titles.
2. `season-1988` — season results and period scoring caution.
3. `relationship-1989` — source-dependent interpretation; BLOCKED.
4. `suzuka-1989` — official grid/result observation only; stewards/intent BLOCKED.
5. `suzuka-1990` — official grid/result observation only; intent BLOCKED.
6. `beyond-rivalry` — 1991/1993 titles and independent careers.

Each locale must have original wording, source-linked atomic claims, author and independent human decision bound to an immutable revision. Reuse the v1 dossier/review semantics or extend them deliberately with tests, rather than inventing a looser story-specific approval flag.

## Internal entity-link contract

Store **semantic target keys**, never hard-coded unverified destination URLs:

| Semantic key | Identity | Browser target after API resolution | Failure |
| --- | --- | --- | --- |
| `driver:ayrton-senna` | F1DB external driver ID | `/{locale}/drivers/{numeric_db_id}` | Disable navigation, show source label |
| `driver:alain-prost` | F1DB external driver ID | `/{locale}/drivers/{numeric_db_id}` | Same |
| `constructor:mclaren` | Pinned constructor external ID, confirm exact slug in archive | `/{locale}/constructors/{numeric_db_id}` | Same |
| `constructor:ferrari` | Confirm canonical external constructor ID | `/{locale}/constructors/{numeric_db_id}` | Same |
| `season:1988` | Calendar year | `/{locale}/seasons/1988` | Only enable if season exists |
| `season:1990` | Calendar year | `/{locale}/seasons/1990` | Same |
| `season:1993` | Calendar year | `/{locale}/seasons/1993` | Same |
| `race:japan-1989` | Numeric F1DB race ID needs verification | `/{locale}/races/{numeric_db_id}` | Keep external official result link, never guess |
| `race:japan-1990` | Numeric F1DB race ID needs verification | `/{locale}/races/{numeric_db_id}` | Same |

Resolve identities **server-side** from a verified mapping/API query. Never silently render an unverified slug as a working link, and do not conflate a Formula1.com path index with a local database ID.

## UX — story-first reader experience

- **Hero:** editorial headline, concise contextual standfirst, distinct year/constructor markers, one licensed/attributed image *only if the media registry approves it*; otherwise a tasteful non-photographic timeline graphic.
- **Chapter rail:** six anchored chapters (mobile horizontal accessible index / desktop vertical rail). On click, move focus to heading; direct hash links can be shared.
- **Evidence:** expose footnotes/claim detail beside the actual assertion. Group repeated citations, clarify primary vs retrospective sources and the last checked date. No green verified badges for pending claims.
- **Explore jumps:** seasons, drivers, teams and races presented as real navigational opportunities, and never as unverified text URLs.
- **Disputed scenes:** 1989/1990 paragraphs attributed carefully; display unknown/conflicting details instead of dramatized made-up quotes. Unapproved material stays in internal editorial preview, not public production.
- **Responsive:** meaningful width on mobile, minimum text contrast, keyboard traversal and reduced-motion support. Avoid autoplay animations or content shifting during hydration.
- **No media rights available:** use custom vector diagrams (year chips, season-score visualization based on official classifications with scoped disclaimer), not hotlinked race photos.
- **Localization:** both `uk` and `en` must be fully supported by the same data-driven reader; avoid duplicated hardcoded narratives.

## Gate and tests

1. A story cannot appear in sitemap, public story list or public route without explicit per-locale human review and an authorized publication action.
2. Unit tests must reject unapproved/withdrawn story revisions and source edits that invalidate reviews.
3. Integration tests must resolve both numeric driver IDs and constructor IDs against disposable imported Postgres, then check no guessed URLs are generated.
4. Playwright: EN/UK, mobile and desktop, hash navigation, keyboard, sourced claims and missing-media fallback.
5. CI includes the story's gate tests, Next.js type/build and browser smoke. Do not modify Claude's independent UI redesign PR without coordination.
6. No change to publication or identity semantics for existing F1DB statistics pages.

## Editorial milestone acceptance

A reviewed, bilingual, linked interactive story of Senna and Prost is an excellent showcase; **research alone is not publishability**. The first implementation should be a safe reader/preview fixture with synthetic or explicitly non-public data, until the human review and publication adapter exist.
