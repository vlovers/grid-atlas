# Editorial Content Release V1

Five bilingual research dossiers, an evidence-aware publication read model and public
record journeys. **No historical biography has received human approval in this release.**
No publication command has been executed for historical content. No photographs added.
The public journeys work without a biography: `/uk/stories`, `/en/stories`, then
`/stories/{ayrton-senna,alain-prost,michael-schumacher,lewis-hamilton,max-verstappen}`.

## Audit and consolidation

Based on main `46c5a9a` (21 October 2026), including merged #178, #180 and #181.
#131 and #182 are separate operational work; neither is incorporated or modified.

- #178 already implements exact-revision review → approved text export → explicit
  operator publication. Reused it; no competing CMS, approval schema or publisher.
- #180 restores five research briefs, 1988 scene/evidence work and three later-season
  evidence bundles. Briefs are research plans, not biographies. Preserved them.
- #181 integrates the Senna drafts/coverage audit. Preserved the older manuscripts
  as research, rather than publishing or duplicating their prose in the frontend.
- Existing canonical Senna pilot remains in `../../pilots/senna/`; Prost,
  Schumacher and Hamilton remain in `../../dossiers/`. Verstappen had a brief and
  evidence pack but no canonical dossier; added the two missing locale dossiers.
- Corrected stale gaps saying Ukrainian Prost/Schumacher drafts were absent.
  Retained genuine caveats: source independence, source contradictions, disputed
  incidents, incomplete periods and exact human review. These are bounded pilots,
  not claims to exhaustive biographies.

| Pilot | Claims per locale | Chapters | Remaining focus |
| --- | ---: | ---: | --- |
| Ayrton Senna | 8 | 5 | Independent review; contemporary Suzuka context and scoring |
| Alain Prost | 12 | 6 | Independent corroboration; Suzuka/date caveats |
| Michael Schumacher | 12 | 6 | Balanced 1994/1997 treatment; interested team testimony |
| Lewis Hamilton | 7 | 6 | Wider chronology/Ferrari; FIA context for 2021 |
| Max Verstappen | 6 | 5 | Early career/2022; independent title/scoring evidence |

`manifest.json` references canonical files; it does not duplicate prose. Both locales
cover the same claim IDs but require separate language decisions. Style/significance
claims are explicitly classified as attributed interpretations. Other claims are
statements supported by the cited source, not a certificate of historical truth.
Sources retain URL, title, publisher, author where known, access date, version and
publisher group. Review sidecars classify primary/secondary/community and publication
metadata. Unknown publication dates remain null. Official classification tables are
primary result evidence; later F1 retrospectives/team testimony are secondary for
historical reconstruction. One publisher group is not independent corroboration.

## Public experience and boundaries

- Five art-led covers, career entry points, selected season rail, all-observed-year
  selector, constructor chronology, four linked race records and another driver's
  perspective in a genuinely shared observed season.
- Career map reuses History Atlas components. Links open exact Atlas connections,
  seasonal Explorer evidence, Time Machine, profiles, constructors, seasons and races.
  Selection is in the URL; browser Back and language switching preserve the query.
- No draft dossier is imported by Next.js. Public curation holds neutral prompts and
  year/round coordinates only. Identity resolves through bounded API search, exact
  canonical external ID and confirmed `f1db` source; numeric IDs are never hardcoded.
- Missing imported picks disappear, unavailable identities remain explicit, malformed
  slugs are not found, API outages show retry. Reduced motion, keyboard disclosures,
  mobile reflow, canonical/hreflang and source links are retained.
- Imported race/result/win counts are archive aggregates. They do not supply official
  starts, title counts or championship standings. Constructor identity is not entrant
  identity or legal succession. Same-season links do not assert historical rivalry.
- Original abstract code art is labelled. No photograph, logo or historical image is
  generated, downloaded, licensed or implied.

### Confirmed publication defect fixed

Previously an article could link one verified claim while returning unrelated body
text. Both bundle publication and the API now require exact claim coverage: each
registered statement occurs once; only section headings may appear between claims.
The read query snapshots article, claims and supporting source locators together.
Invalid prose returns 404; no review metadata is exposed. This tightens the text-only
contract without changing historical storage or migrations. Existing legacy articles
with free-form prose must be reviewed/re-exported; they fail closed.

The API adds `claims` (statement + evidence URL/title/publisher/author/access date/
locator) and `sections` (heading + claim IDs), preserving previous fields. The web
renders plain text, compact chapters and per-claim source disclosures. It never
executes body Markdown/HTML. A withdrawn/disputed claim or wrong locale cannot be
substituted with a draft or another language. Existing synthetic test approvals are
explicit test fixtures, never historical approvals.

## Review the ten drafts privately

```sh
node scripts/preview-editorial-release.mjs --acknowledge-unreviewed-draft --port 3429
```

Open the opaque URL printed by the command. Uses the existing loopback-only transport,
random token, exact Host, no-store, noindex, no-referrer and restrictive CSP. Do not
forward/expose this port. All five drivers, sections, claim locators, source classes,
unsigned checks and missing evidence are visible in UK/EN. This is read-only: it
cannot approve or publish. The token is not an internet authentication system.

```sh
python3 scripts/editorial_release.py \
  --archive /tmp/grid-atlas-f1db/f1db-json-splitted.zip \
  --checksums /tmp/grid-atlas-f1db/checksums_sha256.txt > /tmp/editorial-readiness.json
# Expected: ten structurally valid locales, ready_locales: 0, no public writes.
# Adding --require-ready must fail until real human approval is recorded.
```

The manifest fixes `as_of: 2026-10-21` for reproducible validation. Bump it deliberately
when research is inspected later; never backdate source inspection to satisfy a test.
CI verifies the actual checksum-pinned driver identities and uploads the readiness
report. A green structural check is not an independent human review.

## Remaining manual release gates

1. Assign accountable authors, reopen exact passages, assess independent corroboration
   and resolve/appropriately scope every gap and contradiction. Some historical
   contexts are deliberately omitted pending evidence; do not publish a one-sided
   full biography by silently removing the caveats.
2. Review original writing and Ukrainian/English separately. Check transliterations,
   source classifications, publication dates, race coordinates and metric meanings.
3. Record genuine independent human decisions bound to the current digest using the
   existing [publication review workflow](../../PUBLICATION_REVIEW.md). Text/evidence
   edits invalidate those decisions. Automation must not impersonate a reviewer.
4. Export only an approved, ready locale through `scripts/export_approved_editorial.py`.
   Use the existing [publication runbook](../../APPROVED_RELEASE_PIPELINE.md) for explicit
   operator dry-run/transaction steps. This release does not execute them.
5. The operator must authenticate the actual human review in repository history.
   Bundle provenance is checked operationally, not by cryptographic signer identity.
   Source kinds/versions and the revision-bound review remain in the repository;
   the existing database does not store an immutable signed bundle revision.
6. Media remains empty. Any later asset needs its own licence/creator/attribution and
   exact-revision human media approval. Do not reuse source-page photographs.

## Local public preview

Use Node 24+, pnpm 10.18.3, PostgreSQL 17 and the pinned v2026.17.0 archive. In a
**disposable** database:

```sh
pnpm install --frozen-lockfile
export DATABASE_URL=postgresql://USER:PASSWORD@127.0.0.1:PORT/DISPOSABLE_DB
bash scripts/import-f1db.sh /tmp/grid-atlas-f1db/f1db-json-splitted.zip /tmp/grid-atlas-f1db/checksums_sha256.txt
pnpm build
HOST=127.0.0.1 PORT=3422 pnpm --filter @grid-atlas/api start
# Separate terminal, with the same checkout/build:
API_BASE_URL=http://127.0.0.1:3422 SITE_URL=http://127.0.0.1:3423 pnpm --filter @grid-atlas/web start --hostname 127.0.0.1 --port 3423
```

Visit `http://127.0.0.1:3423/uk/stories` or `/en/stories`. Do not rebuild/start dev
against the same `.next` while browser acceptance uses that production build.
See [verification](VERIFICATION.md) for actual executed checks and limitations.
