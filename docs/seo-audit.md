# SEO and encyclopedia discoverability audit

Audited 2026-10-19 at `a691741601958e9c01eeffe8902a548a9559df09` (then-current
`origin/main`). Implementation branch: `feat/seo-encyclopedia-discoverability`.
All work remains local. No workflows, editorial datasets, biographies, batch
pipeline, CI runs, remote branches, merges or force-pushes were changed.

## Existing solutions retained

| Area | Finding |
| --- | --- |
| Routing | Next.js 15.5.28 App Router; Ukrainian-first `/uk` and `/en`; unprefixed routes redirect to Ukrainian; unsupported locale/unknown routes reach localized not-found. |
| Rendering | Archive pages fetch on the server with `cache: no-store`. Details validate numeric IDs; missing API records call `notFound()`. API outages remain errors rather than empty records. |
| Titles | Catalogue titles are localized; drivers/constructors/circuits/entrants use imported names; seasons use the year; races include the year and official name. |
| Editorial publication | `EditorialController.driverArticle` requires published/reviewed articles, verified/reviewed claims, and supporting evidence. Missing/unpublished biographies are omitted from otherwise valid historical profiles. No public draft route exists. |
| Internal links | Driver → seasons/constructors; constructor → seasons/verified relationships; season → races/driver–constructor lineups; race → drivers/constructors/circuit/season; circuit → races. Native catalogue links and pagination are already crawlable anchors. |
| Existing tests | Browser tests cover localized titles, missing-page `noindex`, navigation, search and locale behavior. API integration tests cover draft/publication and lineage revocation gates. No dedicated canonical/sitemap/JSON-LD tests existed. |

## Confirmed gaps and changes

| Gap | Implementation |
| --- | --- |
| Descriptions inherited the same site-wide text on most routes | Catalogue descriptions reuse their existing localized lead. Detail descriptions combine the imported name/year with factual, existing page copy. Constructor and entrant titles explicitly distinguish their entity kinds. |
| No canonical origin or URL policy | Validated runtime `SITE_URL`; explicit per-route canonicals and reciprocal Ukrainian/English alternates, with Ukrainian `x-default`. Disabled next-intl's request-host alternate headers to avoid conflicting origins. |
| Search/filter variants and empty overflow pages indexable | Internal catalogue search and empty overflow pagination emit `noindex, follow`. Valid pagination keeps separate canonical URLs; tracking parameters and page-one aliases consolidate to clean URLs. |
| No sitemap or robots endpoint | Dynamic Next metadata routes at the origin root, with exact middleware exclusions. Sitemap enumerates every API page, validates IDs/years, deduplicates paths, and fails on API errors or pagination inconsistency. Includes both languages and public verified-lineage entrants. |
| No explicit deployment indexing default | Without `SITE_URL`, pages are `noindex`, robots disallows crawling, sitemap is empty, and no absolute structured URLs are fabricated. |
| No structured navigation | Accessible, wrapping breadcrumbs for drivers, constructors, seasons, races, circuits and entrants. They add links to parent catalogues/seasons and match the `BreadcrumbList` data. |
| No JSON-LD | Conservative `WebPage` and `BreadcrumbList` only, with canonical URLs and `<` escaping. No unverified Person/SportsTeam/Event/Article fields, affiliations, dates or results are generated. |
| Season page ignored an empty successful detail response | The shared detail loader also checks record existence before emitting SEO or breadcrumbs; missing seasons cannot receive valid detail metadata. |
| No direct crawlability checks | Unit tests plus inert parsing of raw server responses, public-route metadata checks and a crawl of all synthetic sitemap URLs. |

The implementation follows the pinned [Next 15 metadata API](https://nextjs.org/docs/15/app/api-reference/functions/generate-metadata),
[sitemap](https://nextjs.org/docs/15/app/api-reference/file-conventions/metadata/sitemap)
and [robots](https://nextjs.org/docs/15/app/api-reference/file-conventions/metadata/robots)
conventions. Separate pagination canonicals follow
[Google's pagination guidance](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading).
Structured navigation uses [Schema.org BreadcrumbList](https://schema.org/BreadcrumbList).

## Open-PR overlap review

Read-only `gh pr list` inspection found no open SEO implementation PR.
[PR #67](https://github.com/vlovers/grid-atlas/pull/67) changes the driver page,
both translation files and localization unit tests. Those files are untouched;
driver SEO lives in a new detail layout and shared helpers. Recheck metadata
inheritance after #67 lands.

Other open work at audit time: editorial/data PRs #71, #82, #83, #84; Explorer/API
PRs #62, #64, #66; product contracts #59, #63; and older lineage ordering #41.
None of their changed files are part of this implementation.

## Changed files

- `apps/web/src/lib/seo.ts`: origin, canonical, robots metadata and JSON-LD helpers.
- `apps/web/src/lib/entity-seo.ts`: validated public detail lookup, existing-copy descriptions and breadcrumb models.
- `apps/web/src/lib/sitemap.ts`: API pagination and sitemap path enumeration.
- `apps/web/src/app/sitemap.ts`, `apps/web/src/app/robots.ts`: dynamic discovery endpoints.
- `apps/web/src/components/seo-breadcrumbs.tsx`, `seo-breadcrumbs.module.css`: visible navigation and structured data.
- New `apps/web/src/app/[locale]/{drivers,constructors,entrants,races}/[id]/layout.tsx` and `seasons/[year]/layout.tsx`: detail SEO integration.
- `apps/web/src/app/[locale]/circuits/[id]/page.tsx`: query-aware circuit metadata and breadcrumbs.
- `apps/web/src/app/[locale]/{constructors,entrants}/[id]/page.tsx`: entity-kind titles.
- `apps/web/src/app/[locale]/seasons/[year]/page.tsx`: inherit the unique season description.
- `apps/web/src/app/[locale]/{drivers,constructors,circuits}/page.tsx`: pass query parameters into metadata.
- `apps/web/src/app/[locale]/layout.tsx`, `page.tsx`: deployment indexing default and home canonical.
- `apps/web/src/i18n/metadata.ts`, `routing.ts`, `apps/web/src/middleware.ts`: localized route policies and discovery endpoint routing.
- `tests/seo.test.mjs`, `tests/browser/seo.spec.ts`: SEO verification.
- `tests/browser/archive.spec.ts`: update the former shared-description assertion.
- `playwright.config.ts`: explicit local canonical origins for production test servers.
- `apps/web/README.md`, `docs/seo-audit.md`: deployment contract and audit.

## Local validation

Validation results are recorded below after the final production browser run.

## Remaining limitations and follow-up

1. A production domain was not supplied and production hosting is not configured
   in the repository. Set `SITE_URL` to the actual public origin for launch; leave
   it unset on private previews. Verify public HTTP redirects and sitemap access
   on that host, then submit the sitemap in Search Console and inspect real URLs.
2. Canonical tags are consolidation signals, not a guarantee of a search engine's
   chosen canonical. Existing locale redirects and invalid-ID rejection remain
   in place; tracking-query normalization does not add new redirects.
3. The sitemap reads the existing public API and deliberately has no durable
   cache. It is not an atomic snapshot during imports. If archive scale warrants
   it, add a stable enumeration endpoint and split sitemaps before 50,000 URLs;
   current code fails explicitly at that limit rather than truncating.
4. Entrants without a verified public lineage edge lack a listing API and are
   omitted from the sitemap; their valid detail pages still have canonical SEO.
5. Next's existing streamed not-found behavior may return HTTP 200 after headers
   are sent, with `noindex` in the body. Tests cover the directive. Raw HTML tests
   establish crawler-visible content/links, not full browsing with JavaScript
   disabled or a guarantee of Google indexing/rich results.
6. JSON-LD syntax, breadcrumb semantics and visible-data agreement are locally
   tested. External rich-result validation and production Search Console checks
   remain launch work; no richer entity/article schema is inferred from names.
7. No new editorial content is created. Profiles remain useful public statistical
   records even without a published biography; existing publication tests protect
   drafts and unsupported claims. Current statistics/coverage limitations remain.
