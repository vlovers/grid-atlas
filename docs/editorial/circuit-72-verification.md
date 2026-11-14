# 72-circuit implementation and release checkpoint

Scope: implement a consistent EN/UK reader for exactly 72 source-derived identities,
retain the six other pages, preserve existing summaries and research, and validate
the genuine imported archive. The [completion matrix](circuit-72-completion.md)
and `apps/web/src/components/editorial/circuit-targets.json` define the cohort.

Acceptance for this engineering change: all 144 language routes render, each of
154 layouts remains bound to its own circuit/event, statistics deduplicate shared
victories correctly, identity fields retain source provenance, missing evidence
is explicit, and no research text or uncleared media gains publication approval.
Construction history, per-corner historical research, lap timing imports and
production provisioning are still required for the complete-publication mission;
this change does not certify them.

## Implemented

- Expanded the existing reader from 20 to 72 canonical identities, including
  historical and single-event venues. Six later identities retain their pages.
- Reused exact-event chronology, configuration selector, race links, reviewed
  article read path and per-request media revocation checks.
- Added source-reported GPS coordinates, direction and previous names through
  the existing identity JSONB importer/API, with coordinate/name validation.
  Existing curated names and event/layout measurements remain untouched.
- Added driver and constructor win tables from existing history relationships.
  A shared victory counts for each driver and once per constructor/race.
- Preserved independent editorial/media gates and original season illustrations.
  Opening/status and absent technical/record fields have EN/UK evidence-gap copy.
- Added deterministic target selection and an archive-verified inventory of all
  154 layouts, including event/layout measurement disagreements. Text inventory
  inspects actual EN/UK bytes: 50 biography drafts and 22 short summaries.

## Verification

Environment: Node 24.21.0, pnpm 10.18.3, Python 3.13, PostgreSQL 17 in the
owned disposable `grid-atlas-72-test` container, bound to localhost port 55482.
No production database or credentials were used. Source archive SHA-256:
`0f1717eaebae646b7ced9ca96f6be3282c1c1d435d0a9d75f2c00f40feb7d2a8`.

| Check | Actual result |
| --- | --- |
| `python3 scripts/audit-circuit-targets.py --archive /private/tmp/grid-atlas-72/f1db-json-splitted.zip --checksums /private/tmp/grid-atlas-72/checksums_sha256.txt --output /private/tmp/grid-atlas-72/completion.json` | PASS: 72 targets, 154 layouts, 1,150 race records; all six exclusions explicit |
| Pinned archive import, then identity enrichment reimport | PASS: migrations and genuine imported relationships; coordinate/name/direction backfill through existing importer |
| Existing localhost Compose archive, `BEGIN READ ONLY` inspection | PASS: all 78 exact canonical circuit IDs match the target/exclusion union and pinned digest; editorial article table is absent in this older local schema. No existing data was changed |
| `pnpm check` | PASS |
| `pnpm lint` | PASS after removing generated custom-build artifacts from the source tree |
| `GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm typecheck` | PASS |
| `pnpm test` | PASS: 903 tests; required localhost access for preview-server tests |
| `python3 -m unittest discover -s tests -v` | PASS: 469 tests |
| `pnpm test:integration` against the disposable DB | PASS: 92 tests, one existing skip |
| `GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm build` | PASS: API and Next.js; existing CSS/workspace-lockfile warnings |
| Initial real-archive circuit browser batch | PASS: 24 desktop/mobile tests, all 72 targets in EN/UK and draft/rights isolation for all 78 identities |
| Expanded real-archive browser regression | PASS: 76 desktop/mobile tests, all 154 target layouts opened in EN/UK, identity/profile/pagination/keyboard/200% checks |
| Visual QA follow-up on the final rebuilt application | PASS: four EN/UK desktop/mobile runs revisit all 72 readers and 154 layouts; explicit assertions keep win totals visible beside names |
| Trusted publication browser regression (`playwright.circuit-publication.config.ts`) | PASS: 24 Chromium/mobile/WebKit tests using synthetic reviews/media in owned disposable schemas; revocation, default-off, escaping and outage behavior retained |
| `python3 scripts/audit-doc-links.py --json` | PASS: zero broken tracked-document links |
| `git diff --check` | PASS |

The final browser command uses `playwright.real-archive.config.ts` with the
disposable `DATABASE_URL` and `GRID_ATLAS_NEXT_DIST_DIR=.next-test`, selecting
`circuit-72-reader`, `circuit-production-reader`, `circuit-research-boundary`,
`circuit-svg-assets`, `profile-visual-quality`, `encyclopedia` and `product-final`
specs under `tests/real-archive/`. It opens an event for every target layout,
checks both locales on desktop/mobile, retains the six other identity pages,
and covers keyboard navigation, 200% text, source digests, pagination, responsive
identity/profile flows and default-off publication. Browser source links are
not an independent historical review or exhaustive external-link audit.

Independent engineering review inspected the original diff under
`docs/engineering/REVIEW_POLICY.md`. Its medium finding about assumed bilingual
coverage was fixed by reading actual locale fields and adding missing/blank
translation tests; re-review found no unresolved engineering blocker. This is
AI engineering review, not a human historical, translation or rights approval.
The handoff commit and remote CI results belong to the PR's exact head revision.

Screenshot inspection covered Monaco EN desktop and Mugello UK mobile hero and
statistics sections. Evidence is emitted to `test-results/real-archive/` by the
72-reader spec. Existing dated screenshots are preserved. The shared table's
42rem minimum width originally pushed win totals off-screen inside narrow
columns; a circuit-scoped override and a browser width assertion now protect
the side-by-side name/count presentation. No global table styling changed.

## Remaining release blockers

- Completed historical publications: **0/72 evidenced**. Existing research is
  preserved, but nonempty drafts/summaries do not satisfy rich approved histories.
  Opening dates, venue status, construction/safety history and claim-level
  completeness need independent period-specific source work and human review.
- **899 candidate numbered positions**, not 899 approved historical corners.
  Some are modern comparison studies. Historical apex crosswalks and the seven
  unnumbered period-route studies remain unresolved; no candidate numbering is
  promoted to the public reader by this change.
- No approved third-party photo/diagram assets in `media/publication.json`.
  Original season graphics provide a rights-safe cover for all targets. They
  do not substitute for geographic layout diagrams or historical photographs.
- Pole flags, fastest-lap times, qualifying records and per-layout lap records
  are absent from the current imported result schema. The UI states this;
  winning-race aggregates are not substituted for those records.
- Genuine independent EN/UK review, enrolled PostgreSQL subjects and protected
  exact-revision publication receipts are absent. The default-off switches and
  publication functions were preserved; no human identity or approval is forged.
- Live GitHub inspection found no homepage, Pages site, deployment environment
  or deployment records. Main reports unprotected. Issue #104 remains open for
  protections, hosting/domain/TLS, DB roles/secrets, backups/restore and monitoring.
  There is no established deployment target to invoke or origin to smoke-test.

Verified public pages: **0/72**; production URLs are unavailable. Local HTTP 200
and CI are engineering evidence only. Next action: finish outstanding research,
obtain genuine independent revision-bound approvals, provision the release target
and resolve #104, then publish through the existing trusted operation and verify
all 144 routes at the actual public HTTPS origin. User authorization to publish
is present; these are missing evidence/access gates, not a request for routine
permission.
