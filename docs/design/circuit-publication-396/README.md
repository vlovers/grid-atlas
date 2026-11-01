# Circuit reader integration — issue #396 / PR #359

Depends on the trusted publication boundary in PR #358, including migration0016
and the least-privilege source-reuse staging fix. No public flag is enabled and
no historical manuscript or photograph is approved by this work.

The existing server-rendered EN/UK article component renders only the protected
API projection. Every claim has its individual HTTPS evidence links. The two
independent server switches remain default-off: `CIRCUIT_EDITORIAL_UI_ENABLED=1`
permits a request, while `CIRCUIT_EDITORIAL_READ_ENABLED=1` permits only already
published, exact-revision-verified results. A missing, withdrawn, invalid or
unavailable response leaves imported archive records available with localized
copy. The UI never substitutes a draft from a local registry.

The public circuit page previously bypassed this boundary through legacy
biography, moments and corner summaries whose own notes said independent human
approval was pending. Those public fallback imports/sections are removed. All
manuscripts/candidate components remain preserved; no parallel editorial files
are edited. Pinned F1DB identity facts, Grand Prix links/results, licensed circuit
layout illustrations, layout interaction and the media registry remain in place.
Editorial Racing typography/composition and the existing reader component are
retained; this is a publication-boundary repair, not a redesign.

## Executed browser verification

```sh
GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm build
# DATABASE_URL must point to disposable PostgreSQL with test role-creation rights.
GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm exec playwright test --config playwright.circuit-publication.config.ts
```

**15/15 passed**: Chromium desktop, Chromium mobile and WebKit. Both locales,
keyboard section/source navigation, reduced motion,320px at200%, no client JS
errors, UI-off/no API request, API-off, private draft/legacy Monza fallback,
503/malformed response, literal HTML/script escaping, no-store and withdrawal
followed by reload and actual client navigation are covered. These checks are
wired into the existing web CI. Full Python discovery passed434/434; the78-story audit and the pinned-archive25-brief research generator also passed. Their legacy public-render assertions were updated to require the trusted boundary while retaining every bilingual/provenance content check. The full baseline browser regression is546 tests;
its current branch run and exact-head GitHub CI are recorded on the PR.

The harness starts actual Nest/PostgreSQL and production Next servers, owns a
random schema, uses individual synthetic TCP logins and the actual protected
review/publish functions. It grants the API only essential archive SELECTs plus
the protected public view. Synthetic outage/invalid-response injection and
bearer-authenticated withdrawal controls exist only in the separately invoked,
loopback-bound test entrypoint, never in production application routes. Fixtures
are clearly synthetic and are removed after the run. No historical text is
marked human-approved.

macOS WebKit uses Option-Tab for links under the default Safari keyboard setting;
the test uses that native shortcut on macOS and Tab on other platforms, as
[documented by Apple](https://support.apple.com/en-gb/guide/safari/cpsh003/27.0/mac/27).
It does not replace keyboard traversal with direct focus on the evidence link.

## Screenshots

These are **synthetic security/reader fixtures**, not approved historical content.
Captured through the running production web/API builds and inspected visually:

| State | Evidence |
| --- | --- |
| EN desktop published article + keyboard focus |[capture](screenshots/en-desktop-published.png) |
| UK mobile published article + source links |[capture](screenshots/uk-mobile-published.png) |
| Private Monza-identity fixture retains archive UI without legacy prose |[capture](screenshots/en-mobile-private-fallback.png) |
| Withdrawn article state on mobile |[capture](screenshots/en-mobile-withdrawn.png) |

Core security/setup/release prerequisites: [operator runbook](../../engineering/circuit-publication-396.md).
No SSO/human identity verification is invented: verified individual enrollment,
independent historical EN/UK review, target-host credential/TLS/audit setup and
issue104 operational release gates remain required. Both flags stay off and the
PRs stay Draft; no merge or deployment is performed.
