# Archive Reliability & Route Recovery · verification

Base: `c30d6571ed786bcd4c39d68678ce8ee6359fdb01`. Node 24.21.0,
pnpm 10.18.3, PostgreSQL 17, F1DB v2026.17.0. All results below were
executed locally on 23 October 2026; CI is reported separately on the PR.

## Root cause and change

All four reproduced failures shared one root cause: a database at migration 0007
running API/web code requiring 0008–0011. Season 2025 failed on standings;
Senna/McLaren failed on identity/championship dependencies; Monaco failed on
identity/layout dependencies. Catalogues and basic profile endpoints still worked.
The database already contained the full core archive. Requests failed promptly,
so extending the eight-second timeout would not repair the issue.

The backed-up local database was migrated and the existing pinned import wrapper
rerun. All four original localhost pages now return 200. Code now rejects schema
drift in readiness; logs endpoint templates and safe SQLSTATE; requires explicit
production API configuration; bounds both response headers and JSON parsing;
and isolates optional editorial failures with a distinct visible status.
Missing required records still produce not-found and infrastructure outages
still produce the retry boundary. No essential failure is converted to an empty array.

## Executed checks

| Check | Result |
| --- | --- |
| Baseline lint/types/build | Passed |
| Baseline Node tests | 96 passed |
| Final lint/types/production build | Passed |
| Node regressions | 101 passed |
| API/PostgreSQL tests | 42 passed, 1 existing skip |
| Python tests | 357 passed |
| Production Chromium desktop/mobile + WebKit reliability | 460 passed |
| Genuine archive SQL/API parity | Passed; 77 seasons, 917 drivers, 187 constructors, 830 entrants, 78 circuits, 1,172 races, 27,665 results |
| Exhaustive archive audit | Passed; 11,504 API requests, 2,364 UK/EN profiles, 2,406 web pages, 73,068 rendered archive links; zero failures |
| All imported race/result rows compared | 1,172 / 27,665; passed |
| Real detail routes in Chromium and WebKit | Season, driver, constructor, circuit and race passed |
| Pinned media identities/layout associations | Passed |

The initial sandbox runs could not bind preview sockets; reruns with permitted
loopback access passed. WebKit was initially absent; its pinned binary was
installed before the successful full run. These were environment failures,
not suppressed or reclassified application results.

## Screenshots

- Season UK: [before](screenshots/before-season-uk.png), [after](screenshots/after-season-uk.png).
- Driver EN: [before](screenshots/before-driver-en.png), [after](screenshots/after-driver-en.png).

The before captures use a clean production build against the old database,
independently of the user's development server. After captures use this batch's
production API/web against the migrated genuine archive. They show recovery;
visual redesign belongs to PR B.

## Limits

Schema readiness is not exhaustive import completeness; the doctor and archive
acceptance remain separate checks. This work does not deploy, merge, approve
photographs or manuscripts, establish independent historical truth, or change
branch protection. Existing operational/editorial launch gates remain applicable.

The first web CI run passed 459 browser cases and reported one React #418
hydration error on the synthetic mobile circuit route. This intermittent issue
was already recorded in the baseline sprint audit. No browser errors were filtered.
The exact CI trace was inspected and replayed, including 50 controlled streaming
replays; 35 development journeys under CPU throttling also did not reproduce it.
The navigation regression now anchors the destination URL exactly and records the
active URL with any browser error. The cause of the isolated hydration event
remains unconfirmed; a successful rerun does not constitute a root-cause repair.


Follow-up, 24 October: main subsequently merged the confirmed renderer repair in
PR [#234](https://github.com/vlovers/grid-atlas/pull/234). The
[separate investigation](circuit-hydration-232.md) records deterministic before/after
reproduction and the scoped upstream backport. The visual/media batch includes
that merged fix and revalidates its revised circuit cover and genuine archive
journeys; the earlier paragraph describes what was known at PR A's initial run.
