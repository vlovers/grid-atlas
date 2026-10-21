# Encyclopedia identities

`GET /api/{drivers|constructors|circuits}/:id/identity` returns `data: [identity]`.
IDs are canonical positive PostgreSQL BIGINT strings. Malformed IDs return 400;
unknown identities return 404. A known identity without imported details returns
`fields: {}` and `provenance: null`, including identities without result rows.

The identity includes `external_id`, `source_slug`, `source_url`, `attribution`,
allowlisted `fields`, and provenance containing the release tag, artifact name,
archive SHA-256, exact record locator, canonical record SHA-256, observation
import timestamp and `method: source_reported`. Country names are resolved from
the same pinned archive. This reports source identity fields, not independently
reviewed biographical claims or historical nationality changes.

Driver fields: full name, abbreviation, permanent number, birth/death dates,
birthplace, nationality and second nationality. Constructor fields: full name
and country. Circuit fields: full name, place, country and source circuit type.
Null source fields are omitted. Permanent number preserves the archive string,
including zero; it must not be applied to every historical season. The driver
season result API separately returns the actual `driver_number` for each row.

Profile and season `points` / `driver_points` now return `string | null`, with
`points_missing` counting result entries lacking points. No results or all-null
points produce null; recorded zero remains a decimal string. Partial sums remain
sums of known values and must be shown with an incomplete-data indicator.
`starts` in the legacy driver API still means result-entry count, including DNS
and shared entries. Career `races` means distinct race IDs; constructor winning
races deduplicate shared-car rows. These are not official starts, championships,
standings, counted points or historical scoring-rule calculations.

Migration 0009 adds source-bound identity details. Run the normal full import or
`import_identity_details.py` after existing identities/races are imported. The
backfill verifies archive checksum and every entity's existing observation hash
in one transaction; missing/mismatched observations abort rather than silently
producing partial profiles. Repeated backfills update only source details,
preserving canonical IDs, curated names, reviewed facts, lineage and media.
