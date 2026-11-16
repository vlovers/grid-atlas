# Twenty-circuit visual intake — issue #410

This batch makes **20 source-bound research records structurally ready for
review, with 0 publishable images and 0 human rights clearances**. It delivers a
read-only audit, pinned-archive verification, regression tests and an isolated
EN/UK reader proposal with original CSS/data graphics. No photo originals were
downloaded, no external circuit artwork is rendered by the proposal, and no
publication permissions were granted.

The [generated twenty-circuit report](REPORT.md) gives each circuit's exact
reference year/layout, original source pages, declared license, blockers and
next actions. The full intake is split into:

- [intake.json](intake.json): canonical circuit/race/layout bindings and caveats;
- [archive-snapshot.json](archive-snapshot.json): exact selected F1DB records and
  season coverage, checked against the original pinned ZIP;
- [candidates.json](candidates.json): existing schema-2 media candidate records,
  including creator, attribution, modifications and license conditions;
- [source-observations.json](source-observations.json): observation time/method,
  file-page revision, locator, source assertions, byte availability and conflicts.

## Baseline and ownership

Inspected `main` is `392683c3af21587a858f2e1933ad1a20b81e79e2`.
The independent branch starts there, rather than from a research Draft.
At the initial inspection, latest main Foundation/editorial checks and the
preceding main API/web/real-archive/schema checks were successful. At the
12:46 UTC recheck on 2026-11-05, [PR #401](https://github.com/vlovers/grid-atlas/pull/401)
had seven successful checks and [PR #409](https://github.com/vlovers/grid-atlas/pull/409)
had six; both remained Drafts. No queued or running workflows were returned.
[PR #407](https://github.com/vlovers/grid-atlas/pull/407) owns Actions scheduling
and had existing Foundation/Commons failures; this batch does not modify it.
No other active media-intake PR was found in the open queue.

Only new intake/prototype/audit/test/evidence paths are owned here. Existing
editorial datasets, claims, private preview, production media registry, API,
migrations, lockfile and workflows are unchanged. In particular, migrations
0013–0016 and the trusted PostgreSQL publication model are not rewritten.
The existing public page designs and routes are unchanged.

## What the evidence establishes

All 20 SVG candidates refer to already vendored F1DB artwork. Their existing
manifest git-blob SHA-1 and locally calculated SHA-256 agree with those bytes.
The manifest names Jules Roy; the pinned repository's
[root license](https://github.com/f1db/f1db/blob/v2026.17.0/LICENSE)
declares [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
That repository-level declaration is recorded as a source assertion. It does
not authenticate each historical configuration or replace independent review
of an individual file's author, rights chain, attribution and modifications.

Six additional Commons photo candidates cover Monaco, Silverstone, Suzuka,
Montréal, Spa and Bahrain. Their exact description-page revisions and original
file URLs are recorded; creators are taken from source metadata, not assumed
from the uploader. Reported original SHA-1/size/dimensions are **external
metadata**, with local SHA-256 explicitly null. No downloaded originals or
thumbnail copies are included in this batch. Reuse must follow the actual
file-specific terms and author authority, as explained by
[Commons reuse guidance](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia).

The Monaco source declares [CC0](https://creativecommons.org/publicdomain/zero/1.0/deed.en).
CC0 does not impose copyright attribution as a condition; retaining source
credit is this project's provenance policy. The dedicator's authority and
third-party rights still need individual review. CC BY and CC BY-SA candidates
have version-specific attribution/change/share-alike conditions recorded in
their candidate records; these are not approvals to publish.

The complete next actions appear per circuit in [REPORT.md](REPORT.md).
The additional photo investigations are:

| Candidate | Required next investigation |
| --- | --- |
| Monaco | Review the CC0 dedication and Flickr/creator chain; confirm the 2022 capture and venue before considering original-byte inspection. |
| Silverstone | Confirm Harvey Milligan's authorship and the 2019 venue/capture context; preserve CC BY-SA 4.0 credit and change conditions. |
| Suzuka | Retain the 2018-08-26 capture date as venue context; it does not identify the F1 event or numbered corner geometry. Review author/CC BY-SA 4.0 terms. |
| Montréal | Review pedrik's Flickr-to-Commons chain, 2017 capture identity and CC BY 2.0 attribution conditions. |
| Spa | Retain the 2005 photograph date; find separate evidence for the selected 2025 layout. Review LINOTTE Auguste/CC BY-SA 3.0 terms. |
| Bahrain | Resolve United Autosports versus EXIF Author/Copyright JEP before reuse; retain the 2021 WEC context rather than labelling it 2025 F1. |

For the other 14 circuits, no photo has been proposed: Monza, Interlagos,
Brands Hatch, Donington, Bugatti, Mont-Tremblant, Aida, Ain-Diab,
Clermont-Ferrand, Dallas, Detroit, Pescara, Porto and Sebring. Their SVG source
records are structurally complete but individually unapproved. None of the
20 has authenticated period geometry or independent bilingual/rights approval.
Bugatti's 1967 event (8 turns, 4.422 km) remains distinct from layout metadata
(14 turns, 4.185 km). Mont-Tremblant's 2001 comparison is not evidence of the
1968/1970 F1 geometry. No corner numbering has been invented.

## Inspect the proposal locally

After the existing frozen dependency install, from the repository root:

```sh
node apps/web/src/components/media/circuit-visual-intake/preview/server.cjs
```

Open `http://127.0.0.1:3487/en` or `/uk`. The default reader view offers all
20 circuit contexts; “Sources & rights intake” exposes the read-only evidence.
The server binds IPv4 loopback, checks Host and cross-site requests, accepts
only GET/HEAD, sends no-store/noindex and blocks external image loading. It is
outside the production App Router and exposes no approval/publish controls.
Do not deploy this development proposal as a public service.

The reader has an original CSS cover and a source-derived season trace, exact
layout/event reference, source attribution, period caveats, a responsive photo
slot and the existing honest empty gallery. The season trace is explicitly
not circuit geometry; 2026 records remain provisional. Only the production
publication registry can supply images. An approved diagram would additionally
need the exact circuit, layout and race and must pass the existing live rights
selector. Candidates never enter media props. Memory-only synthetic tests
exercise that positive path and rejection of changed/withdrawn/other-era files;
they create no real approvals.

## Executed verification

Node 24.21.0, pnpm 10.18.3, Python 3.13; disposable PostgreSQL 17 on local port
55474 (`integration_only` test credentials), never a production database.
Commands are run from this isolated worktree. The archive command uses existing
local release files whose digest matches the repository pin.

| Check | Actual local result |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS; unchanged lockfile |
| `pnpm check` | PASS |
| `pnpm lint` | PASS, zero warnings |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS, 574 tests, no skips |
| `python3 -m unittest discover -s tests -v` | PASS, 462 tests |
| `GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm build` | PASS, existing CSS build warnings only |
| `DATABASE_URL=… pnpm test:integration` | PASS, 92 tests; one existing opt-in publisher DB acceptance test skipped because `RUN_EDITORIAL_PUBLICATION_DB_ACCEPTANCE` is unset |
| `DATABASE_URL=… pnpm test:browser` | PASS, 558/558; includes production Next.js build, existing archive journeys and 12 prototype desktop/mobile tests |
| `pnpm exec playwright test --config playwright.circuit-media410.config.ts` | PASS, 18/18; Chromium desktop, Pixel 7 and WebKit, EN/UK |
| `node scripts/audit-circuit-media-intake.mjs` | PASS, 20/20 structural records, 26 candidates, 6 metadata-only photos, 0 publishable |
| Same audit with `--require-publishable` | Expected exit 1; no cleared media |
| `python3 scripts/verify-circuit-media-intake.py --archive /private/tmp/grid-atlas-c396-f1db/f1db-json-splitted.zip --checksums /private/tmp/grid-atlas-c396-f1db/checksums_sha256.txt` | PASS, all 20 exact source records and full season lists; archive SHA-256 `0f1717eaebae646b7ced9ca96f6be3282c1c1d435d0a9d75f2c00f40feb7d2a8` |

The exact commit and remote CI links are recorded in the Draft PR after
execution. They are not inferred from main or from another PR's checks.

An independent reviewer inspected the original new files, issue criteria,
handoff, source boundaries and three browser screenshots. The reviewer also
executed the 26 focused Node tests, four focused Python tests and the actual
pinned-archive verifier. All passed. Findings fixed before handoff: source text
and URL escaping in Markdown; exact 20-record archive cardinality/relationships;
CC0 legal conditions versus project credit policy; Ukrainian candidate labels.
No high/medium technical findings remain. This review grants no media rights.

## Browser and visual evidence

The isolated browser suite executes Chromium desktop, Pixel 7 and WebKit in
both languages. It checks all 20 bindings, no product images or external
requests, zero approval controls, loopback/method isolation, keyboard form and
gallery operation, EN/UK, text contrast, 320px reflow with 200% text, reduced
motion and forced colors. With the main browser configuration it also checks
that the proposal URL returns 404 on the actual production server.

Run the separate local QA configuration without adding a workflow:

```sh
pnpm exec playwright test --config playwright.circuit-media410.config.ts
```

Screenshots are captured by those real tests and visually inspected:
[EN desktop reader](screenshots/reader-en-desktop.png),
[UK mobile reader](screenshots/reader-uk-mobile.png),
[Bahrain source conflict](screenshots/source-conflict-en.png).
They contain original CSS/data presentation, not third-party photographs/maps.
The native browser bridge was unavailable in this environment; browser evidence
comes from the repository's locally executed Playwright browsers.

This is a technical intake and design handoff, not editorial/media release
approval. The next maintainer action is independent source/rights/identity and
EN/UK review using the per-circuit queue, then a separately approved publication
change. No merge, deployment or publication is part of this batch.
