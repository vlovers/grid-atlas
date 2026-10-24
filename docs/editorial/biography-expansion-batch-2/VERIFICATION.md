# Batch 2 — executed verification and review disposition

24 October 2026. Worktree branch: `codex/driver-biographies-batch2`.
Base main: `ed0967b` (catalogue headline wrapping, PR #270).

## Delivered content

Ten drivers, twenty EN/UK manuscripts: Fangio, Clark, Graham Hill, Brabham,
Stewart, Fittipaldi, Lauda, Mansell, Häkkinen and Vettel. Approximately **5,815 EN
and 4,987 UK words** in claim prose; 121 paragraph pairs. References, headings,
review notes and duplicated Markdown renders are not counted as extra content.

The new lane contains 20 standard evidence dossiers, 20 ordinary review sidecars
and 20 readable manuscripts generated through the existing dossier renderer.
All source references, claim IDs and chapter ordering are paired across locales.
No claim/reviewer/publication decision was promoted. Existing canonical dossiers,
release manifests, public reader, API and UI remain unchanged.

## Reproducible executed checks

Node 24.21.0, pnpm 10.18.3, pinned F1DB v2026.17.0 archive and release checksums.

| Check | Actual result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed |
| `pnpm check` | Passed |
| `pnpm lint` | Passed |
| `pnpm typecheck` | Passed for API and web |
| `pnpm build` | Production API and web passed |
| `pnpm test` | 225 passed |
| `python3 -m unittest discover -s tests -v` | 378 passed, including 14 new batch regressions |
| `python3 scripts/audit_driver_biography_batch2.py --archive /tmp/grid-atlas-f1db/f1db-json-splitted.zip --checksums /tmp/grid-atlas-f1db/checksums_sha256.txt` | Ten canonical identities and 231 authored statistical assertions passed |
| Existing approved exporter, exercised for all 20 actual dossiers | Every export rejected without independent approval, as required |
| Local article inventory | Read-only query returned zero article rows; no deployed database queried |

The new CI job repeats the fourteen regressions and real checksum-verified archive
comparison, retaining a research-only report artifact. It does not fetch source
articles, download media, publish content or use database credentials. Foundation
CI discovers the new Python tests without changing shared package scripts.

The numerical checks cover explicit fields and selectors: title years, race wins,
season win lists, final championship points, constructors, individual results and
qualifying. The 1951 French shared drive and 1973 US DNS entry have dedicated
boundary tests. They do not turn row matches into semantic or human approval.
Non-F1 achievements, early careers and attributed driving-style assessments need
the separately cited historical sources and human review.

Database/browser integration was not rerun for this unpublished offline-only
content batch: no runtime application, database migration, API response or route
is changed. The existing publisher’s actual export gate is tested directly on
every delivered locale revision. Production build/type checks still pass.

## Independent review

An independent AI agent read all twenty initial claim sets, checked selected
primary sources and re-reviewed the staged original diff. This is engineering
and draft-content review under the repository policy, **not independent human
historical/editorial approval**. No historical reviewer signature was created.

| Finding | Severity | Resolution |
| --- | --- | --- |
| Häkkinen “never returned to championship racing” incorrectly excluded DTM | P2 | Narrowed to Formula 1 and added a primary DTM-series source and a paragraph covering 2005–2007/three wins |
| Biography prose contained methodology commentary and stock filler | P2 | Removed or rewrote repeated process sentences in both locales; retained source cautions in gaps and SOURCE_NOTES |
| Stewart locator incorrectly implied no 1973 US result row | P2 | Corrected to the existing DNS entry with null laps; narrative specifies no start; typed archive assertion and regression added |
| Ukrainian Spa sentence could imply a Finnish national title | P3 | Changed to “не приніс Гаккінену чемпіонства” |
| Graham Hill museum page has errors outside its cited early-career passage | P3 | Added a source-risk gap and handoff note; later results use independent event records and pinned data |

The independent reviewer reran all 14 new tests and all 231 actual-archive
assertions; their generated report matched the committed report and revision
digests. The reviewer found no remaining P1/P2 blocker for this unpublished handoff.
A final author copyedit also addressed the remaining P3 process phrasing in six
paragraphs; archive checks were rerun and retained all 231 matches.
The final provenance pass also corrected a stale local evidence filename in
locators and added the specific team-profile passage supporting Fittipaldi’s
smooth technique. New regressions reject missing named evidence files and stale
committed dossier-revision evidence.
Final review disposition is recorded in the PR description.

## Parallel ownership and remaining gates

The batch started from freshly fetched main in a separate worktree. No file in
`docs/editorial/batches/drivers-30-v1/`, Content Factory V1 script/test, PR #274
workflow/UI file, or shared package script is edited. The only existing index
change links this separate research lane.

Remaining: source-semantic and contradiction review, publication-date research,
independent EN/UK language and originality review, human identity/name checks,
and explicit publication authorization. Zero photographs/media are included.
The [README](README.md) and [source notes](SOURCE_NOTES.md) identify known gaps.
No branch is merged and no dossier is published by this work.
