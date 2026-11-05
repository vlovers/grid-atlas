# PR395 integration and CI stabilization

Baseline: main `392683c3af21587a858f2e1933ad1a20b81e79e2`; research PR395
`337fd331b1adac818095660b0b6a01f823068dc9`. A dedicated integration branch
merges both histories without rewriting the author branch or unrelated local files.

Acceptance: all Foundation steps, lint/types, production Next build, disposable
PostgreSQL publication/API/migration tests, pinned import and browser checks pass;
all 78 identities are accounted for with exact layout/year and bilingual candidate
coverage checks; private review works on desktop/mobile and keyboard in UK/EN;
unreviewed content remains unavailable publicly. Preserve source URLs, locators,
roles and competing observations while fixing page-key comparison.

Contracts: migrations0013–0016 and trusted author/reviewer/publisher enforcement
remain unchanged from main. Research metadata cannot grant approval. Page keys
are comparison identifiers, not URLs; only documented tracking/alias variations
collapse. Unknown selectors and repeated values retain document distinctions.

Non-goals: human historical approval, authenticating every apex, rights clearance,
publishing research, merging, deployment and issue104 operational acceptance.
Principal risks: source identity collisions, stale historical numbering, accidental
public draft exposure, legacy migration regression and misleading completeness.

## Implementation and review

- Source comparison keys are compared directly; an identifier such as
  `lapledger.org/circuits/dallas` is never reparsed as a URL. Original source URLs,
  evidence roles, locators and competing counts are retained. Arbitrary selectors,
  repeated values and unknown host/slash identities remain distinct.
- Four public fallback JSON snapshots are byte-identical to the baseline main.
  Original PR395 paths retain all research revisions. Both public story components
  share one accessor; the legacy corner fallback uses the preserved snapshot.
  Existing summaries are not newly granted historical approval by this isolation.
- Private preview now renders all 71 candidate guides and seven unnumbered routes.
  It preserves 1,015 study positions, 68 route sections, 53 bend studies and 13 named
  features. Provisional positions use Study/Позиція labels; missing biographies have
  honest empty states. Historical names are not automatically verified apex names.
- Bugatti preserves conflicting F1DB records: layout attribute 14 turns / 4.185km
  versus 1967 event 8 turns / 4.422km. Its 14 studies remain comparison-only.
  Mont-Tremblant's 2001 comparison is explicitly separate from the 1968/1970 F1
  course even though F1DB shares a layout identifier.
- Genuine pinned-archive CI now checks all 78 circuit/layout/year associations and
  documents the two comparisons. The completion audit includes inherited Monaco
  and Spa but reports **zero complete circuits**. No per-apex approval is inferred.

Independent AI code review inspected the original PR and corrective diff against
the acceptance criteria and publication policies. High findings (public draft
leakage, source-page collisions, Bugatti provenance) were resolved. Medium findings
(missing preview guides, provisional labels, vacuous negative tests, incomplete
audit counts and audit error cases/path filters) were resolved. Reviewer reported
no remaining code blockers. This is not independent human historical/media review.

## Local verification

Node24.21.0, pnpm10.18.3, Python3.13, PostgreSQL17 in the dedicated disposable
`grid-atlas-pr395-qa-db` container, localhost55473. No existing database or production
credentials used. Test suites own temporary schemas; migration tests use a separate
empty database; genuine imports use another separate database. Network/HTTP tests
required host execution because the sandbox rejects localhost connect/listen.

| Command | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm check` | PASS; all17 workflows retain immutable action pins |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS864/864, no skips (includes Commons retry regressions) |
| `python3 -m unittest discover -s tests -v` | PASS462/462 |
| `GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm build` | PASS; existing CSS compatibility warnings |
| `pnpm test:integration` | PASS92, existing opt-in publisher test skipped1 (93 total) |
| `RUN_EDITORIAL_PUBLICATION_DB_ACCEPTANCE=1 node --test apps/api/test/editorial-publisher.integration.cjs` | PASS1/1 separately on disposable migration DB; synthetic content only |
| `bash packages/database/scripts/test-versioned-migrations.sh` | PASS; append-only replay/checksum/failure rollback and legacy circuit upgrade |
| `bash scripts/import-f1db.sh /private/tmp/grid-atlas-c396-f1db/f1db-json-splitted.zip /private/tmp/grid-atlas-c396-f1db/checksums_sha256.txt` | PASS twice on disposable archive;160 layouts/1172 race facts |
| `python3 scripts/audit-circuit-research-archive.py --archive /private/tmp/grid-atlas-c396-f1db/f1db-json-splitted.zip --checksums /private/tmp/grid-atlas-c396-f1db/checksums_sha256.txt --output /private/tmp/pr395-research-archive.json` | PASS78 identities,0 unexplained errors,0 approvals |
| `pnpm exec playwright test tests/browser/circuit-research-review.spec.ts` | PASS4/4; UK/EN desktop/mobile,68/53/13 inventory, keyboard navigation, links, no overflow, private transport |
| `pnpm exec playwright test --config playwright.real-archive.config.ts tests/real-archive/circuit-research-boundary.spec.ts` | PASS4/4; all78 actual public routes plus article API in UK/EN desktop/mobile, no new research prose |
| `pnpm test:browser` | PASS550/550; full production build and desktop/mobile Chromium plus WebKit route checks |
| `pnpm exec playwright test --config apps/web/src/components/media/preview/playwright.config.ts` | PASS39/39; Chromium/mobile/WebKit media desk |
| `pnpm exec playwright test --config playwright.unified.config.ts` | PASS24/24; Chromium/mobile/WebKit archive/reflow |
| `pnpm exec playwright test --config playwright.real-archive.config.ts` | PASS236/236; actual imported archive with SQL-selected stress samples |
| `python3 scripts/verify-real-archive.py` | PASS; actual SQL/API reciprocal evidence, counts and Time Machine parity |
| `python3 scripts/audit-encyclopedia.py --archive /private/tmp/grid-atlas-c396-f1db/f1db-json-splitted.zip --checksums /private/tmp/grid-atlas-c396-f1db/checksums_sha256.txt --api-url http://127.0.0.1:3470/api --web-url http://127.0.0.1:3471 --output /private/tmp/pr395-encyclopedia-coverage.json` | PASS2364 profiles/2406 pages,11504 API requests,71268 archive links,27665 result rows |
| `python3 scripts/editorial_release.py --archive /private/tmp/grid-atlas-c396-f1db/f1db-json-splitted.zip --checksums /private/tmp/grid-atlas-c396-f1db/checksums_sha256.txt` | PASS; unsigned/unapproved preflight |
| `node scripts/preview-commons-originals.mjs` | First real attempt4/5 (HTTP429); second attempt5/5 verified, reusing4 SHA-checked local originals |
| `python3 scripts/audit-repository-assets.py --json` | PASS; read-only inventory |
| `python3 scripts/audit-doc-links.py --json` | PASS;0 broken links |
| `git diff --check` | PASS |

Browser commands used `GRID_ATLAS_NEXT_DIST_DIR=.next-test` and the corresponding
disposable `DATABASE_URL`; the real suite used `scripts/select-real-archive-stress.py`
and SQL-selected `SMOKE_YEAR/SMOKE_DRIVER_ID/SMOKE_CONSTRUCTOR_ID`.
SQL/API smoke used `SMOKE_API_URL=http://127.0.0.1:3470/api`. Exact-head GitHub CI
outcomes are recorded in the PR handoff after completion. The screenshots are actual private
browser captures: [Bugatti EN desktop](../verification/pr395/private-bugatti-en.png)
and [Dallas UK mobile](../verification/pr395/private-dallas-uk.png).
The in-app Browser connection failed with a native trusted-bridge error; repository
Chromium browser tests supplied the recorded runtime and screenshot evidence.

## Additional actual CI failure: Commons throttling

On integration commit `dd86c6b8`, Foundation CI and editorial preflight passed,
but Commons job126962803181 failed after2/5 downloads with HTTP429. This reproduces
the existing main failure in job125011105948. The network helper now retries only
429/502/503/504, at most four attempts with20s per request and120s cumulative wait.
It honors Retry-After seconds/HTTP dates, never retries before a server delay and
fails when that delay exceeds its fixed budget. Missing/unauthorized files and
network failure remain errors. Retry diagnostics are recorded in CI logs.

Original-target/final-origin validation, SHA1/size/JPEG/SHA256 checks and rights
flags remain unchanged. No alternate image, forged bytes, download success or
rights approval is substituted. Independent AI review found no retry blocker;
unit tests cover persistent throttling, cumulative budget and advancing date-clock
semantics. Real transport succeeded on the second local invocation with verified
cache reuse; remote persistent throttling still fails closed and is not a green
check until the final workflow actually succeeds.

## Remaining release and research limitations

None of the 78 circuits is certified complete. All71 candidate guides and seven
unnumbered routes still require independent per-apex, names, chronology, source
passage and bilingual editorial review. Seven unfinished circuits: Ain-Diab,
Clermont-Ferrand, Dallas, Detroit, Pescara, Porto and Sebring. Their studies are
research coverage rather than official FIA turn mappings. Dallas retains15 exact
bilingual evidence gaps and unresolved count/direction/map-version conflicts;
other same-page count conflicts remain observations, not independent witnesses.

No new map artwork, photograph, rights grant, author identity, human approval or
publication receipt is introduced. Third-party maps remain external references;
conditional Commons licensing and independent per-asset rights checks remain.
F1DB/Jules Roy artwork retains its existing attribution and license boundaries.
Source links are structurally checked, not independently adjudicated historical
proof. No source scraping or fabricated source signatures were used.

Migrations0013–0016 and API code are identical to main. PostgreSQL subjects,
author/contributor exclusion, exact-revision review, least privilege and atomic
revocation remain enforced. Both public editorial flags stay disabled. PR398's
separate reader and PR395's author branch remain untouched. Final maintainer code
review, human editorial/media approval and issue104 operational gates remain;
this task neither merges, deploys nor enables publication.
