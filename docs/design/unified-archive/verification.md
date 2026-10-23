# Reliability and unified archive delivery evidence

24 October 2026. This report separates executed checks from publication and
production approval. PR A is [#222](https://github.com/vlovers/grid-atlas/pull/222),
commit `77fe1456c0bdda37d2f6c2faa463b72f8438dadb`, merged externally as
`90b401035896a988c29557835a3fab4c3e457fa4`. Its four CI jobs passed.
The visual/media batch is based on main `41612ad`, preserving the reliability,
SVG-cover and Commons research changes merged during implementation.

## Reproduced failures and root causes

| Route / observation | Root cause | Repair and evidence |
| --- | --- | --- |
| `/uk/seasons/2025`: HTTP 500 and localized data failure | Local PostgreSQL stopped at migration 0007; current queries needed 0008–0011 tables | Backed up DB; ran existing checksum-pinned migration/import workflow; route returned 200 |
| Senna driver 72, McLaren constructor 114, Monaco circuit 45: HTTP 500 | Same schema drift in identity, standings, historical-fact and circuit-layout endpoints | Restored current archive; direct and internal-link regressions cover all five detail types in UK/EN |
| API readiness returned success despite missing tables | `/ready` only checked a database connection | PR A validates every migration name/checksum and returns 503 on drift; doctor probes meaningful endpoints |
| Optional article failure could reject an otherwise valid driver | Essential records and optional prose shared a failure path | Separate two-second optional request and visible unavailable state; expected unpublished 404 stays distinct |
| Intermittent React 418/419 during production navigation | Vendored React host replay did not restore the hydration cursor | Main PR [#234](https://github.com/vlovers/grid-atlas/pull/234) supplies the upstream backport and deterministic regression; retained and revalidated in this batch |
| Driver related-record enrichment could reject the profile | Optional constructor-roster calls used essential-data handling | Two-second isolated reads, explicit unavailable status, partial available links retained; essential requests still throw |

Docker networking, API origin and the eight-second essential timeout were
inspected, but were not the cause of the reproduced local HTTP 500s. Production
now requires explicit server-only `API_BASE_URL`; development retains its
loopback fallback. Diagnostics use endpoint templates and safe error categories,
without origins, query values, SQL or credentials.

Before incorporating #234, the broader visual branch reproduced six hydration
failures in 480 browser cases and one in 120 genuine-import cases. Errors were
not filtered and retries were not enabled. Configuration and framework-upgrade
experiments were discarded; the final branch retains main's focused backport.
See [the original recovery evidence](../../delivery/reliability/verification.md)
and [confirmed renderer investigation](../../delivery/reliability/circuit-hydration-232.md).

## Delivered product surface

Drivers, constructors and circuits catalogues now share the existing editorial
hero, search/index styling, real record previews, sourced statistics and streamed
featured identities. Seasons has keyboard decade exploration and a complete
static year index. Season, race and circuit dossiers share covers, statistics,
section navigation and short record-reading disclosures. Existing driver and
constructor dossiers are retained and integrated, rather than duplicated.
All nine route templates are checked in both languages.

The main-merged SVG cover selector is preserved: only a matching recorded
layout can use its attributed artwork. Synthetic/unknown circuits get linked
record typography. Circuit and archive-journey panels use the existing warm
tokens. Small-screen testing fixed wordmark shrink/wrapping and Ukrainian
statistic-label overflow. Catalogue copy now describes the implemented layout
history instead of claiming it is absent.

## Media and editorial boundaries

- The existing 160 F1DB/Jules Roy SVG illustrations retain their pinned bytes,
  exact-layout association, creator/source and **CC BY 4.0** attribution. They are
  illustrations, not photographs or surveyed geometry.
- No new photographic asset or AI reconstruction is published. Commons source
  statements alone are not a grant verified by this implementation.
- The researched cross-era pilot includes Fangio (CC BY-SA 3.0 crop with an
  unresolved public-domain parent/creator chain), Senna and Hamilton (source
  statements of CC BY 2.0; original/derivative and independent review outstanding).
  See [asset-specific research](../../media/library-v1-foundation.md).
- Current main's separate five-candidate research worklist, pinned descriptions
  and two verified original-byte observations remain intact. Binary hashes do
  not establish license, subject or independent approval.
- Registry schema 2 adds explicit AI provenance and sourced historical context;
  both affect the publication fingerprint. Unknown provenance blocks publication.
  `LicensedMedia` keeps dimensions, fallbacks, visible credits/license details and
  an explicit generated-illustration label where applicable.
- New editorial patterns explain how to read records. No researched biography,
  rivalry, quotation, emotion or race narrative is invented or auto-published.

## Executed verification

The reproducible stack uses Node 24, locked pnpm dependencies, production Next/API
builds and PostgreSQL. Browser fixtures use owned schemas; genuine acceptance
uses pinned F1DB v2026.17.0. Final browser/coverage results are recorded after the
last run; CI is checked against the published PR head.

| Check | Result |
| --- | --- |
| Lint | Passed |
| TypeScript | Passed |
| Production API/web build | Passed |
| Node tests | 203 passed |
| Offline Python/database/import/media tests | 364 passed |
| API/PostgreSQL integration | 42 passed; one existing skip |
| Full production browser suite | Final run in progress |
| Genuine-import browser suite | Final run in progress |
| Dedicated Chromium/mobile/WebKit visual acceptance | Final run pending |
| Exhaustive pinned archive/API/page/link audit | Final run in progress |
| Real screenshots | 36 captures passed across nine templates, EN desktop / UK mobile, Chromium / WebKit |

The full browser suite includes main's four-locale/project circuit stress cases
and the installed-vendored-renderer regression, plus direct navigation, internal
links, errors/404s, editorial gates, keyboard interactions and source/layout tests.
The dedicated visual acceptance also checks reduced motion, forced colors,
320px reflow at 200% text, one h1 and valid section anchors. It is not a claim
of a complete screen-reader or WCAG conformance audit.

During integration, lint found an unnecessary regex escape in main's new Commons
Markdown renderer. Removing that escape preserves its Markdown escaping behavior;
its existing hostile-input/report tests remain enabled. A superseded experiment
left three owned listeners; they were stopped before the final suite. Neither
condition is presented as a passing application test.

## Screenshots

| Subject | Before | After |
| --- | --- | --- |
| EN drivers | [Catalogue](screenshots/before-drivers-en.png) | [Editorial cover](screenshots/after-drivers-en.png), [discovery](screenshots/after-driver-discovery-en.png) |
| EN circuits | [Catalogue](screenshots/before-circuits-en.png) | [Editorial cover](screenshots/after-circuits-en.png) |
| Monaco dossier | — | [Attributed SVG cover](screenshots/after-monaco-en.png) |
| 1988 season | — | [Calendar cover](screenshots/after-season-1988-en.png) |
| Monaco 1988 race | — | [Classification cover](screenshots/after-monaco-1988-race-en.png) |
| UK mobile seasons | — | [Decade discovery](screenshots/after-seasons-uk-mobile.png) |

Before catalogues were captured against the initial clean production baseline.
After views use the actual imported archive. [Capture metadata](capture-report.json)
records all 36 checked paths/viewports/headings; selected durable PNGs are linked
above. Reproduce with `node scripts/capture-unified-archive.mjs --web-origin
http://127.0.0.1:3000 --api-origin http://127.0.0.1:3001 --output /tmp/grid-atlas-captures`.

## Remaining gates

Independent photographic rights/context and editorial publication reviews remain
open. A cleared photographic pilot was not established, so the UI deliberately
uses existing licensed circuit artwork and record-based fallbacks. Authored
historical storytelling needs its own sourced review. Manual screen-reader and
Lighthouse checks, deployed-origin acceptance and the operational launch gates
in [the current roadmap](../../product/stable-experience-roadmap.md) remain
separate. No merge or production deployment is performed by this batch.
