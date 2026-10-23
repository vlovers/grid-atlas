# Visual Storytelling V2 — implementation and evidence

23 October 2026; baseline `f9d193e`, integrated with main `d9768a5` (including #203, #216 and parallel #217). Screenshots and coverage use the same dossier code before the unrelated story-reader delta. This sprint changes dossier navigation and source-backed visualizations, not historical narratives. See the [sprint audit](../../sprint-audit-2026-10-23.md) for delivery and release boundaries.

## Routes and behavior

- `/uk/drivers/[id]`, `/en/drivers/[id]`: refined constructor-period calendar, immediately adjacent season comparisons, native season navigation and deduplicated major race milestones. Existing championship classifications, selected-season results, complete archive disclosures, Atlas and Time Machine links remain available.
- `/uk/constructors/[id]`, `/en/constructors/[id]`: driver lineup calendar with all recorded identities in a bounded calendar window, contiguous observed periods, exact pair/season evidence links, first/last race boundaries and explicit incomplete-data states. The window includes missing years instead of connecting across them. Long lists scroll inside a keyboard-focusable region; they are not silently truncated.
- Both dossier types share a server-rendered participation component and localized copy. Previous/next season links, a native GET selector and native disclosures work without JavaScript. Red accents, serif headings and monospaced year/data labels reuse the existing Editorial Racing tokens. Motion is limited to a reduced-motion-aware hover transition.
- Driver, constructor and circuit pages share a rights-gated media archive and a typographic missing-media state. No real image was added, no draft biography was approved, and circuit geometry remains on its independent exact-layout pipeline.

The career API remains unchanged. Counts mean distinct recorded main races per driver/constructor pair. They are not contracts, official starts or proof of non-participation. Changes compare only the immediately preceding calendar season; a missing year or empty comparison side suppresses inferred roster changes. Multiple constructors in one season and shared drives remain distinct.

## Visual evidence

The screenshot script resolves canonical Senna/McLaren IDs via the real imported API, selects 1988 and captures UK/EN at 1440, 1920, 1024 and 390 pixels. `before.json` and `after.json` record HTTP status, browser errors, remote requests and document overflow. Section screenshots show the new calendar as well as the matching viewport captures. Local sequence IDs in these snapshots are not public identity contracts.

| View | Before | After |
| --- | --- | --- |
| McLaren, English desktop | [Before](screenshots/before-mclaren-en-1440.jpg) | [After](screenshots/after-mclaren-en-1440.jpg), [calendar](screenshots/after-mclaren-en-1440-timeline.jpg) |
| Senna, Ukrainian desktop | [Before](screenshots/before-senna-uk-1440.jpg) | [After](screenshots/after-senna-uk-1440.jpg), [calendar](screenshots/after-senna-uk-1440-timeline.jpg) |
| McLaren, Ukrainian mobile | [Before](screenshots/before-mclaren-uk-390.jpg) | [After](screenshots/after-mclaren-uk-390.jpg), [calendar](screenshots/after-mclaren-uk-390-timeline.jpg) |
| Senna, English mobile | [Before](screenshots/before-senna-en-390.jpg) | [After](screenshots/after-senna-en-390.jpg), [calendar](screenshots/after-senna-en-390-timeline.jpg) |

Reproduce against a production preview backed by the pinned archive:

```sh
PREVIEW_API=http://127.0.0.1:3470 PREVIEW_URL=http://127.0.0.1:3471 \
  node scripts/capture-storytelling-v2.mjs after
```

The media audit snapshot is [media-readiness.json](media-readiness.json); the [approved imagery workflow](../../media/approved-imagery-workflow.md) explains how to move from a candidate to an independently reviewed, attributed publication.

## Verification

Final executed checks and archive coverage are recorded in the sprint audit. The first full browser run caught absolute screen-reader text escaping the horizontally scrolling calendar; positioning its scroll container fixed the mobile and 200% text overflow. The full suites were rerun after that correction. No test threshold was relaxed.
