# First twenty: production reader implementation

The exact [twenty-circuit batch](COHORT.md) now has expanded English/Ukrainian
candidate histories and forty source-linked historical moments. The actual
production circuit routes have a coordinated reader with exact-event layout
selection, era navigation, result/driver/constructor links, source details,
original season illustrations and protected published-article support.
Other 58 circuits retain their existing page presentation.

## Integration and boundaries

The integration branch reuses #401 and actual #409
`98a99bcb239137178d761889773a929d4f157286` over main
`392683c3af21587a858f2e1933ad1a20b81e79e2`.
The reviewed article implementation is adapted from #398 `5b4480d8`.
#411 media research and #412 identity research remain separate evidence;
neither is treated as an approval or imported into public media.
One final integration PR contains this package. No new Actions workflow.

Existing public short summaries remain intact and do not repeat their biography
paragraph in the moment card. Expanded batch editions cannot be enabled through
the legacy static edition registry: both summary renderers explicitly receive
`allowExpandedEdition=false`. A published longform replaces the short summary and moment card, avoiding duplicate stories.
New longform text requires the existing default-off
UI/API switches and migration0016's protected PostgreSQL publication projection,
with genuine independent subjects and exact-revision receipts.
Migrations0013–0016 and their security functions remain unchanged.

The technical-history API adds canonical `external_race_id` alongside internal
`race_id`. Navigation uses internal IDs; media binds canonical F1DB race IDs.
A left join preserves records without a canonical identity, while diagrams
fail closed for such a record. No existing response field is removed.
The reading model joins exact race/year/round and internal/external layout IDs;
missing or ambiguous matches never substitute a modern layout. Differences
between an event measurement and a layout attribute remain visible.
Configuration chapters describe observations, not continuous use.

## Editorial and source work

All twenty candidate biographies now describe origins/location, configuration
changes and driving character. Two moments per circuit retain their dated
sources and independent-review-pending status. `supporting_sources` preserves
precise URL/locator/scope when one biography uses several authorities.
Unrelated narrative entries and public snapshot bytes are preserved.

Primary-source comparison excluded conflicting Interlagos measurements,
Zandvoort banking attribution, Hungaroring construction duration and Spielberg
1982 margin; corrected Magny-Cours four-stop wording and Kyalami/Nürburgring
citations. Sepang's 2017 farewell is scoped to its initial Malaysian GP chapter,
not a timeless assertion about all future racing.
This is AI-assisted source comparison, not independent human historical approval.
No new historical corner numbers, apex crosswalks, geometry or approval identities.

## Visual and revocation behavior

Every batch page can render an original data illustration of seasons actually
recorded in F1DB. It is labelled as a season graphic, not a map, and needs no
borrowed photograph. No empty photograph gallery is displayed.
Available SVG files, license labels and candidate URLs cannot approve a diagram.

`readCircuitPublication` reads the existing publication registry on every server
request and validates rights fingerprint, subject, canonical race/layout IDs,
review status and actual local bytes. The existing SVG/raster size, checksum and
symlink validator is shared with the CLI. Research lanes, changed bytes,
withdrawals, missing reviews and unsupported remote delivery fail closed.
Only the selected exact event's eligible diagram is sent to the client.
Changing a local selection hides that snapshot. Opening the selected event
performs a new document request, including when the query URL is unchanged,
so withdrawal cannot be bypassed through a cached selection.
Already downloaded bytes cannot be recalled; withdrawing served files remains
part of the existing operator procedure.

## Verification

Node24.21.0, pnpm10.18.3, Python3.13, disposable PostgreSQL17 on localhost55475.
The genuine pinned F1DB import includes all78 circuit identities; only the
requested twenty receive the new reader and content changes.
Exact archive digest and executable bindings are in [the batch report](COHORT.md).
No production database credentials were used.

Final command outcomes, exact commit SHA and CI links are recorded in the PR.
Checks include `pnpm check`, lint, typecheck, full Node/Python tests, production
build, disposable API integration, full browser, full real-archive, trusted
publication browser and media-desk suites. Browser suites run sequentially
against a frozen production build; retries are zero.
The twenty-circuit case inspects all40 language routes on desktop and mobile,
checks exact source IDs/year/layout/measurements, source locators, keyboard
navigation, unknown selection, mobile reflow and expanded-draft exclusion.
Trusted tests establish genuine disposable PostgreSQL actor permissions and
eligible synthetic article/media baselines, then revoke approval/evidence and
verify suppression through actual production routes without a rebuild.
Synthetic decisions never modify production registries.

Captured evidence: [Interlagos EN desktop](screenshots/interlagos-en-desktop-real.png),
[Montreal UK mobile](screenshots/montreal-uk-mobile-real.png),
[synthetic reviewed EN article](screenshots/en-desktop-published.png),
[synthetic reviewed UK article](screenshots/uk-mobile-published.png),
[withdrawal](screenshots/en-mobile-withdrawn.png).
Screenshots establish rendering, not human approvals or deployed acceptance.
The optional in-app Browser bridge was unavailable; repository Playwright
Chromium/mobile/WebKit and captured images supply the actual browser evidence.

## Exact external release blockers

All20 expanded editions still require genuine independent human historical and
translation review, exact-revision PostgreSQL receipts and an enrolled publisher.
Period corner mapping and photographic/diagram rights have no approval in this
package. Original season illustrations keep the reader useful without them.
No publication registry or release-gate decision is invented or changed.

GitHub has no production environments, deployments or deployment workflow;
repository homepage is unset and Pages is disabled. Issue[#104](https://github.com/vlovers/grid-atlas/issues/104)
remains open for hosting/domain/TLS, private DB/roles/secrets, backup/restore,
monitoring and real-origin smoke. A maintainer must provision those and provide
an actual origin before deployment and all40 public URLs can be verified.
`racearchive.net` is a documented competitor, not this application's deployment.
CI green establishes engineering validation, not release of these histories.
