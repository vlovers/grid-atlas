# Grid Atlas web

Next.js App Router frontend. Install from the repository root using `pnpm install --frozen-lockfile`, migrate/import PostgreSQL and start the API as described in the root README.

```sh
API_BASE_URL=http://127.0.0.1:3001 pnpm --filter @grid-atlas/web dev --port 3000
pnpm --filter @grid-atlas/web build
API_BASE_URL=http://127.0.0.1:3001 pnpm --filter @grid-atlas/web start --hostname 127.0.0.1 --port 3000
```

## Search discovery

Set `SITE_URL` on the Next.js server to the public origin (for example,
`https://your-public-host.example`, with no path/query/credentials). The same
origin supplies canonical URLs, language alternates, JSON-LD and the sitemap.
Do not derive it from request headers. Leave it unset on private previews:
pages then emit `noindex`, robots disallows crawling, and the sitemap is empty.
Malformed origins fail explicitly. This setting is evaluated at request time.

`/robots.txt` and `/sitemap.xml` bypass locale redirects. The dynamic sitemap
enumerates the existing public API, including all catalogue/race pages and
entrants exposed by verified lineage. It never reads editorial files or draft
APIs, and does not invent modification dates. An API failure fails the response
instead of publishing a partial sitemap. Indexable historical profiles do not
require a biography; only the existing publication-gated API can supply one.

Each localized public page has its own canonical. Search results are `noindex,
follow`; genuine catalogue/circuit pagination has its own canonical, and empty
overflow pages are `noindex`. Tracking parameters and page-one aliases resolve
to the clean canonical. Unsupported IDs/routes retain Next's `noindex` fallback.
Detail pages expose visible breadcrumbs and matching `WebPage` / `BreadcrumbList`
JSON-LD. No `Article`, sporting record, legal succession, or event facts are inferred.

`tests/seo.test.mjs` tests origin/canonical rules, sitemap enumeration/failure
handling and script-safe JSON-LD. `tests/browser/seo.spec.ts` checks raw production
HTML before hydration, crawls every synthetic sitemap URL, and covers both locales
on desktop/mobile. See [the SEO audit](../../docs/seo-audit.md) for scope and limitations.
Run production builds/tests in a separate checkout if a development server is
running: Next 15 development and production builds share `.next`.

API requests run on the Next.js server and do not need browser CORS. They have an eight-second timeout and no persistent fetch cache, so rejected/revoked lineage is not retained for an hour. Missing API profiles render not-found; outages have a retry state.

Implemented: searchable/paginated drivers, constructors and circuits; profiles and career/season timelines; season calendars and result-derived lineups; circuit race history; named race results with profile links; source release and attribution; verified-only lineage list and interactive map with filters, evidence, keyboard selection and zoom. The interface is Ukrainian-first (`/uk`) with English (`/en`), preserving the existing visual design. Unprefixed URLs default to Ukrainian independently of browser language or cookies. The language switcher preserves the current path, canonical IDs and search parameters.

`pnpm lint`, `pnpm typecheck`, `pnpm build` and `DATABASE_URL=postgresql://... pnpm test:browser` run from the root. Browser tests start production servers on ports 3339–3341 and use real PostgreSQL with isolated, synthetic fixtures on desktop/mobile. Trace/screenshots are retained on failure.

Not yet implemented: standings and historical scoring rules, circuit configurations, media/biographies, live updates, additional languages or production hosting. Lineage can be empty until independently approved claims exist. Do not manufacture verified data for the UI.

## Localization

Next.js stays at the locked 15.5.28 version. `next-intl` 4.14.9 declares support for Next.js 15 and React 19; no framework upgrade was needed. On this version use `src/middleware.ts` and the supported `requestLocale` API, rather than Next 16 proxy/root-params APIs. `skipMiddlewareUrlNormalize` preserves the incoming origin for locale redirects. Both locale segments own the document root so client language changes update `<html lang>`.

See the official [routing setup](https://next-intl.dev/docs/routing/setup), [locale-aware navigation](https://next-intl.dev/docs/routing/navigation) and [error-file guidance](https://next-intl.dev/docs/environments/error-files) when extending routes.

Only `uk` and `en` are supported. Messages live in `messages/{uk,en}.json`; both dictionaries must have identical keys and valid ICU messages. The Ukrainian plural forms are tested. Use `Link` / `getPathname` from `@/i18n/navigation` for app destinations and localized form actions. Keep external citations as their original URLs. Unknown public paths, including dotted paths, receive the Ukrainian default or the explicit locale's not-found page; Next internals and the separate API are excluded from locale middleware. There are currently no files in a public-assets directory; add an explicit matcher exclusion if introducing one.

Next.js returns HTTP 404 before streaming starts, but can retain HTTP 200 when a missing page is discovered after streaming begins. It injects a `noindex` robots tag in either case ([framework behavior](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)). Browser tests assert the localized not-found UI, the status boundary and `noindex` for missing profiles, unknown routes and unsupported locale paths.

Translate interface text, navigation, metadata and accessibility labels. Do not translate or filter imported identities, canonical IDs, results, original evidence or source attribution. Technical API errors are neutral English internally and render through the localized error boundary. There is no Russian dictionary or interface copy. `pnpm test` checks message parity/ICU/plurals; the archive browser suite covers both locales on desktop/mobile, defaults, language switching, metadata, source preservation, error/not-found states and locale-preserving links.

The catalogue does not prefetch every profile card: prefetched profiles in a 100-row catalogue were delaying deliberate pagination during route tests.

Catalogue search submits, resets, previous/next pages and profile cards use native GET navigation with locale-prefixed destinations. Production browser traces showed aborted client requests for reset and pagination, leaving stale queries/results; repeated local checks also caught a catalogue-to-profile request that did not commit. Native catalogue anchors avoid that client-router path. Browser tests assert document GETs, locale/query preservation, both pagination directions, cleared reset query/input and reloaded records. Other application destinations use the locale-aware Next.js link. The current Next.js streamed interface requires JavaScript to reveal page content; full browsing with JavaScript disabled is not supported.
