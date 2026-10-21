# Encyclopedia implementation and verification — issue #194

This change completes archive-backed identity fields and navigation across the
existing driver, constructor and circuit profiles. It adds no articles,
manuscripts, external images, reviewed claims or inferred championships.

## Measured pinned archive coverage

Source: F1DB `v2026.17.0`, `f1db-json-splitted.zip`, SHA-256
`0f1717eaebae646b7ced9ca96f6be3282c1c1d435d0a9d75f2c00f40feb7d2a8`.
The archive was imported into an isolated PostgreSQL 17 database, then imported
again. The new identity backfill was also repeated independently.

| Imported records | Measured rows |
| --- | ---: |
| Drivers | 917 |
| Constructors | 187 |
| Circuits | 78 |
| Entrants (separate identities) | 830 |
| Seasons | 77 |
| Races | 1,172 |
| Race-result entries | 27,665 |

All 1,182 profile identities have source-bound details. The final exhaustive
run checked 11,504 API requests, 2,364 localized profiles (2,406 responses including circuit pagination) and 53,942
rendered archive links, with zero missing entities, API failures, row mismatches
or dead archive links. It compared all 1,172 race rows and 27,665 result rows,
and verified 18 malformed/unknown localized missing responses. The measured
[JSON report](verification/encyclopedia/coverage.json) is committed; real-archive
CI also retains it as `encyclopedia-coverage-and-screenshots`.

57 drivers and one constructor have no imported race-result evidence. They
render useful identity profiles with empty careers, no fabricated participation
or milestones, and unknown point totals. This is not evidence that they never
participated historically.

| Source-reported identity field | Populated records |
| --- | ---: |
| Driver full name, code, birth date, birthplace, nationality | 917 each |
| Driver death date | 506 |
| Driver permanent number | 28 |
| Driver second nationality | 7 |
| Constructor full name and country | 187 each |
| Circuit full name, country, location and type | 78 each |

Absent fields are omitted; absence of a death date does not assert that someone
is alive. A permanent number is an identity attribute in this release, not a
claim about the number used in every season. The season race ledger now shows
the separately imported race-specific driver number.

## Product and contract changes

- Shared UK/EN archive identity sections with source identifier, field provenance,
  exact record locator, release and both archive/record hashes. Labels are
  localized; source names and dates are preserved.
- Constructor season rosters link to recorded first/last race boundaries and
  complete pair evidence. These do not establish uninterrupted contracts.
- Circuit winners and chronological event lists share 25-race native GET pages instead of
  repeating an unbounded winner table on every archive page.
- Profile and season point sums preserve null, zero and partial data. Constructors
  identify incomplete sums. Statistics remain race-result summaries, with
  distinct-race wins separated from podium result entries and official standings.
- PR #193's eight UK/EN acceptance journeys are integrated once and strengthened
  with positive localized missing-state and `noindex` checks. Empty profiles and
  source identity fields have additional desktop/mobile coverage.
- Production verification uses `.next-test` via `GRID_ATLAS_NEXT_DIST_DIR`, so a
  concurrent local development server cannot replace its assets. An initial local
  run was invalidated by exactly that collision; it is not counted as a passing
  run.

See the [API and backfill contract](../apps/api/docs/encyclopedia-identities.md).

## Missing-state HTTP and SEO

Next.js 15 can commit HTTP 200 before an asynchronous `notFound()` completes.
The [framework contract](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)
documents HTTP 200 for streamed missing responses and HTTP 404 for non-streamed
responses. Both are tested for the real localized missing UI, absence of a
fabricated profile and server-rendered `noindex`; API endpoints retain real 404s
for unknown IDs and 400s for malformed IDs.

The noindex prevents these streamed missing profiles from being eligible for
indexing by compliant crawlers. Transport-only monitors must also inspect the
missing UI or use the API. This does not claim independent search-engine ranking
verification. Valid profiles retain canonical URLs, bilingual alternates and
structured breadcrumbs.

## Reproduction and evidence

Use `scripts/import-f1db.sh` with the pinned archive/checksums and an isolated
`DATABASE_URL`. Build with `GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm build`, start
the production API/web with the same web build directory and explicit `SITE_URL`,
then run:

```sh
python3 scripts/audit-encyclopedia.py --archive /tmp/grid-atlas-f1db/f1db-json-splitted.zip --checksums /tmp/grid-atlas-f1db/checksums_sha256.txt --api-url http://127.0.0.1:3001/api --web-url http://127.0.0.1:3000 --output /tmp/encyclopedia-coverage.json
pnpm test:browser
GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm exec playwright test --config playwright.real-archive.config.ts
```

The real-browser suite needs the `SMOKE_*` variables selected by the SQL in
`.github/workflows/real-archive.yml`. It discovers canonical IDs through the API
and checks early shared entries, long careers, constructors, circuits and a
driver without results in both locales and viewport projects.

Local checks passed: foundation validation, lint, typecheck, production build,
85 Node tests, 271 Python tests, 41 API integration tests (one existing opt-in
editorial test skipped), 342 synthetic browser tests, fresh/repeated migrations
and checksum-tampering rejection, repeated real imports and the existing
real-archive SQL/API smoke. All 92 real-archive browser tests passed. The final circuit pagination also has
a dedicated 16-test UK/EN desktop/mobile verification; GitHub CI results are
reported on the implementation PR.

## Remaining boundaries

This verifies complete coverage of the pinned archive, not completeness of F1
history or independent verification of every source claim. Official championship
standings/titles, historical scoring adjustments, poles and retirement categories
are not inferred from winners or points. Year-specific chassis, engines,
principals, bases, layouts, lengths, corners, DRS and lap records still require
their separate evidence/review workflows. Archive identity fields do not bypass
the existing research-only technical-fact or editorial publication gates.

No new driver portraits, helmets, cars or track maps are published. Authentic
assets still require per-file licensing, identity/layout verification and rights
clearance. Existing reviewed lineage remains separate; constructor identity
does not establish entrant identity or legal continuity. Hosting and deployment
are outside this implementation. No merge or deployment is performed here.
