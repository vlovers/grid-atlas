# Media batch 01 — Issue #290 handoff

28 October 2026. Base `0fe9555f16f3c80d936e22329780fe9866090e8b`. One dedicated media branch; no merge, deployment or publication. Engineering review is separate from human rights approval.

## Delivered behavior

- Shared Editorial Racing photo contact sheets now show the complete approved collection rather than silently stopping at six. The leading frame has an editorial split composition; smaller screens use one column. Images retain their full composition (`object-fit: contain`).
- Enlargement uses a native modal dialog, localized controls, previous/next and arrow keys, Escape, focus cycling and restoration. Credits, source/license links, modifications and historical context remain attached to each frame. The enlarged image mounts only when opened; other images remain lazy. Missing bytes retain the reserved frame and an honest error state.
- Driver/constructor photo heroes retain the existing publication gate and now request an approved lead image with eager/high priority. Circuit dossiers gained the previously missing photo archive and approved-only photo hero; existing attributed SVG covers/layouts remain the fallback. No manuscript, circuit story inventory or SVG geometry was edited.
- A separate loopback-only Next preview at `/en/batch` and `/uk/batch` displays twelve research cards, subject filters, search, proposed EN/UK alt/captions, exact source revision, attribution/derivative notes, byte-verification status and blockers. This route is absent from production (404). It cannot approve or publish anything.
- Optional source-matching private originals are served only from an explicit owner-private external directory. Unknown, changed, malformed, cross-site and foreign-Host requests fail closed; responses use `private, no-store` and same-origin resource policy. No remote image hotlinks, new dependencies, schema/API changes or public raster files.
- The dated media audit now includes the twelve-reference research worklist and validates five new strict candidate records. Seven candidates are reused by ID from the existing two lanes. Fifteen canonical subject records and two layout mappings are verified against the original checksum-verified F1DB v2026.17.0 ZIP.

## Twelve candidates — observations, not clearance

The [machine-readable worklist](batch-290.json) retains exact description oldid, source SHA-1, original byte count/dimensions, proposed EN/UK text, chain and individual blockers. [Five new candidates](batch-290-new-candidates.json) use the existing `MediaAsset` candidate schema; seven references point to existing records. Source-declared licenses below are observations, not legal decisions. Each row still needs independent source/identity/rights and bilingual text review.

| Candidate / pinned source | Observed creator / license | Context and specific blocker | Original SHA-256 |
| --- | --- | --- | --- |
| [research-schumacher-portrait-2007](https://commons.wikimedia.org/w/index.php?title=File:Michael_Schumacher.jpg&oldid=990331871) | Gunnar Richter Namenlos.net / CC BY-SA 3.0 | Source names Daniel Milbord as well as creator Gunnar Richter. Resolve their roles; do not credit the uploader as photographer. | Prior observation 2026-10-23; not rechecked |
| [research-alonso-2024](https://commons.wikimedia.org/w/index.php?title=File:Fernando_Alonso_(53838437751).jpg&oldid=1157917780) | Peter Menzel / CC BY-SA 2.0 | Confirm subject, venue and Flickr rights; do not infer a race result. | Prior observation 2026-10-23; not rechecked |
| [research-mclaren-mp44-2007](https://commons.wikimedia.org/w/index.php?title=File:McLaren_MP4-4.jpg&oldid=1248162600) | John Chapman (Pyrope) / CC BY-SA 3.0 | Check museum photography conditions, visible sponsorship and car identification. | Not verified |
| [research-ferrari-f2004-2004](https://commons.wikimedia.org/w/index.php?title=File:Ferrari_F2004.jpg&oldid=1082605957) | storem / CC BY-SA 2.0 | Confirm car and capture context; do not assign a driver or Grand Prix. | Not verified |
| [research-silverstone-2019](https://commons.wikimedia.org/w/index.php?title=File:Silverstone_Racing_Circuit.jpg&oldid=1042021018) | Harvey Milligan / CC BY-SA 4.0 | Confirm location and viewpoint. Do not use as an historical layout diagram. | Not verified |
| [ayrton-senna-commons-pilot](https://commons.wikimedia.org/w/index.php?title=File:Ayrton_Senna_1989_Belgian_GP_podium_(cropped).jpg&oldid=1070636551) | madagascarica from Verneuil Grand, France / CC BY 2.0 | Review original Flickr photo and all crop revisions; retain original creator and modification credit. | Not verified |
| [juan-manuel-fangio-commons-pilot](https://commons.wikimedia.org/w/index.php?title=File:J.M._Fangio_1957.jpg&oldid=958088047) | Unresolved / CC BY-SA 3.0 | Creator is unresolved in the existing candidate; parent credits Carlos Alberto Navarro. Confirm original release and crop chain. Low resolution unsuitable for hero. | Not verified |
| [research-clark-action-1965](https://commons.wikimedia.org/w/index.php?title=File:Clark_at_1965_Dutch_Grand_Prix.jpg&oldid=861710533) | Eric Koch for Anefo / neg. stroken, 1945-1989, 2.24.01.05, item number 917-9751 / CC BY-SA 3.0 nl | Check Nationaal Archief item 917-9751 and exact Netherlands license; caption does not claim a finishing position. | Not verified |
| [research-lauda-pitwall-1976](https://commons.wikimedia.org/w/index.php?title=File:Niki_Lauda_1976_Long_Beach.jpg&oldid=899547791) | Christian Sinclair / CC BY 2.0 | Resolve 1976 description versus 2011 scan/EXIF date before approval. Confirm original photographer and Flickr chain. | Not verified |
| [research-prost-ferrari-1991](https://commons.wikimedia.org/w/index.php?title=File:AlainProst_Ferrari_1991.jpg&oldid=832228570) | StuSeeger / CC BY 2.0 | File permission text says BY-SA 2.0, but license template/Flickr review say BY 2.0. Resolve discrepancy; tobacco logos require intended-territory review. | Not verified |
| [research-lotus72-museum-2007](https://commons.wikimedia.org/w/index.php?title=File:Lotus_72_JPS.jpg&oldid=1248469624) | John Chapman (Pyrope) / CC BY-SA 3.0 | Confirm car/chassis identity, museum conditions and visible tobacco branding. Canonical Lotus constructor, not Lotus F1 or Lotus Racing. | Not verified |
| [research-monaco-sainte-devote-2022](https://commons.wikimedia.org/w/index.php?title=File:Circuit_de_Monaco_-_Virage_de_Sainte-D%C3%A9vote_(54763577980).jpg&oldid=1165226849) | crash71100 / CC0 | Confirm viewpoint and Flickr CC0 dedication. Original is 8000×6000; prepare and review an efficient delivery derivative before publication. | Not verified |

**Approved: 0 / 12. Newly retained/verified originals this iteration: 0 / 12.** Two SHA-256 values are prior GitHub runner observations, explicitly linked per card; they are not fresh checks or approvals. Ten candidates have no verified original SHA-256. Every candidate has a pinned source SHA-1 and observed source dimensions/byte count; those are not local byte verification.

The [actual original attempt](batch-290-original-attempt.json) is preserved: the first three files were rejected because the new adapter omitted width/height, then Commons returned HTTP 429 for Ferrari and the remaining eight were not attempted. The adapter now passes exact pinned dimensions and has a regression test. Temporary rejected bytes were discarded by the existing ingester; no source pin was weakened. No further download was attempted after the rate limit. A later explicit run after throttling clears is needed; do not automatically retry or replace original hashes with metadata hashes.

## Reproduce local review

Node 24 / pnpm 10.18.3, frozen dependencies:

```sh
pnpm install --frozen-lockfile
node scripts/media-batch-290.mjs
node apps/web/src/components/media/preview/server.cjs
# Open http://127.0.0.1:3358/en/batch or /uk/batch.
# Shared component exercise: /en?test=gallery-multiple (synthetic only).
```

Optional **research-only**, only after Commons throttling clears:

```sh
mkdir -m 700 /tmp/grid-atlas-batch01-private
node scripts/media-batch-290.mjs --download --originals /tmp/grid-atlas-batch01-private
# Offline inspection of already available originals; no network:
node scripts/media-batch-290.mjs --originals /tmp/grid-atlas-batch01-private
MEDIA_REVIEW_ORIGINALS=/tmp/grid-atlas-batch01-private node apps/web/src/components/media/preview/server.cjs
```

The CLI reuses the existing source-pinned ingester/structural inspector and private-directory guard. Existing strict candidate IDs without a `research-` prefix receive that prefix for private filenames only; registry identities are unchanged. Do not copy these originals into public/. Restart the preview after adding files. A configured cache never creates approval, delivery derivatives or publication entries.

## Validation and screenshots

Local command evidence is summarized below; CI status is recorded in the draft PR for its actual head SHA. Development preview images are explicitly distinguished from public real-archive fallbacks. All committed screenshots contain either the real archive’s existing non-photographic fallback, empty research frames, or labeled synthetic geometry — **none demonstrates cleared historical photography**.

| Check | Result |
| --- | --- |
| `pnpm check` | PASS |
| `pnpm audit:media --as-of 2026-10-28` | PASS: zero approved photos; twelve-reference worklist |
| `pnpm lint`, `pnpm typecheck` | PASS |
| `pnpm test` | PASS: 386 Node tests |
| `python3 -m unittest discover -s tests -v` | PASS: 434 tests |
| `pnpm build` | PASS; existing Autoprefixer mixed-support warnings retained |
| `pnpm test:integration` | PASS: 44 tests, 1 existing skip; disposable PostgreSQL :55468 |
| `python3 scripts/verify-media-identities.py --archive … --checksums …` | PASS: 15 canonical subjects, 2 exact mappings; original pinned ZIP |
| Isolated preview Playwright | PASS: 39 tests, Chromium desktop/mobile + WebKit; UK/EN, keyboard, focus, 200% text, missing/stale/withdrawn/rejected assets, Host, zero hotlinks |
| Full project browser suite | PASS: 542 tests; before final circuit-route addition. Final circuit-specific recheck recorded in PR. |
| Actual imported archive smoke | PASS: 24 combinations (3 subject types × UK/EN × desktop/mobile × Chromium/WebKit), final production circuit gallery; review route 404 |

[Research contact sheet](batch-290-screenshots/research-contact-sheet-en-desktop.jpg) · [Expanded provenance](batch-290-screenshots/research-evidence-uk-mobile.jpg) · [Desktop research desk](batch-290-screenshots/research-desk-en-desktop.jpg) · [Ukrainian mobile desk](batch-290-screenshots/research-desk-uk-mobile.jpg) · [Synthetic gallery](batch-290-screenshots/synthetic-gallery-en-desktop.jpg) · [Synthetic viewer](batch-290-screenshots/synthetic-viewer-uk-mobile.jpg) · [Real driver](batch-290-screenshots/public-drivers-en-desktop.jpg) · [Real constructor](batch-290-screenshots/public-constructors-uk-mobile.jpg) · [Real circuit](batch-290-screenshots/public-circuits-en-desktop.jpg).

Recreate with a local production web process connected to an API backed by the imported pinned archive:

```sh
PREVIEW_URL=http://127.0.0.1:3364 PREVIEW_API=http://127.0.0.1:3361 node scripts/capture-media-batch-290.mjs
pnpm exec playwright test --config apps/web/src/components/media/preview/playwright.config.ts
```

The capture command resolves real canonical IDs through the API, checks production review-route 404, UK/EN/mobile/desktop/200% reflow, zero public photographs/remote image requests and JS errors in Chromium/WebKit. [Machine-readable smoke measurements](batch-290-screenshots/smoke.json) distinguish unsupported CLS (`null`) from measured values. These are local measurements with no approved photo payload; real photo delivery performance and screen-reader acceptance remain unverified. No Lighthouse score or deployed acceptance is claimed.

## Exact publication blockers / next action

1. An independent human must resolve each listed creator/source/derivative/historical-context question, license obligations, museum terms, personality/trademark/tobacco/local-use restrictions, final attribution and both locale texts. No reviewer identity or decision has been fabricated.
2. Obtain source-matching originals after Commons allows access, fully decode and visually inspect them, then prepare efficient delivery derivatives without silent cropping or removed notices. Record original/derivative SHA-256, MIME/dimensions and transformations. In particular the 8000×6000 Monaco original is not an appropriate delivery payload.
3. Use the existing [approved imagery workflow](approved-imagery-workflow.md): prepare the complete publication record/local bytes, obtain real independent sign-off on its exact `mediaFingerprint`, then add only cleared bytes and entries in a reviewed PR. This batch keeps `publication.json` empty and public raster bytes absent.
4. Repeat actual approved-photo browser/performance/attribution checks before publication. Deployment remains separately gated by issue #104; draft PR/green CI is not merge, rights or release approval.

Independent engineering review: separate reviewer inspected the original base-to-head diff and acceptance criteria. Host validation, shared CSS variable scope, Next preview loader, WebKit focus and unsupported CLS evidence findings were fixed; exact reviewed SHA and final disposition are recorded in the PR. This review does not confer media clearance.
