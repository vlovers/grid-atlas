# Historical career contract

`GET /api/drivers/:id/career` and `GET /api/constructors/:id/career`
are additive read endpoints. Existing profile/season/team endpoints are unchanged.
Use `?locale=uk` (default) or `?locale=en` for the separate editorial placeholder;
historical identities and source-supplied names are locale-neutral.

## Response

The envelope is `{data: [profile]}` with exactly one profile. A missing entity is
404; malformed/out-of-range IDs or unsupported/repeated `locale` are 400.
IDs accept positive PostgreSQL BIGINTs through `9223372036854775807` and remain
decimal strings, including values larger than JavaScript's safe integer range.
The existing older endpoints still have their documented 32-bit input bound.

| Profile field | Meaning |
| --- | --- |
| `id`, `name`, `entity_type` | Local canonical ID, curated display name, `driver` or `constructor` |
| `external_id`, `source_slug` | Source-qualified external identity; not interchangeable with local IDs |
| `source_url`, `attribution` | Registered source homepage and attribution |
| `observations` | Only this entity's recorded observations from matching-source releases: `release_tag`, `artifact_name`, `sha256`, `content_hash` |
| `summary` | Result-derived aggregate described below |
| `related_entity_type` | `constructor` for drivers; `driver` for constructors |
| `participation` | One row per observed season and related entity, ascending year, first round, related ID |
| `milestones` | `first_appearance`, `last_appearance`, `first_win`, `last_win`; each is `{race, results}` or null |
| `limitations` | Stable English machine codes; clients should localize explanatory copy |
| `editorial` | `{locale: "uk" or "en", introduction: null, biography: null}` until reviewed content exists |

`summary` contains `result_entries`, distinct `races`, observed `seasons`,
`first_season` and `last_season`, distinct `winning_races`,
`podium_result_entries`, `recorded_points` (decimal string or null),
`points_recorded` and `points_missing` (counts of result rows).

`participation` contains `year`, `related_id`, `related_name`,
`related_external_id`, `related_source_slug`, the same result/race/win/podium/point
fields as the summary, and `first_race` / `last_race`. It does not contain the
summary's season-count/range fields. It records observed participation, not
contract dates, contiguous employment stints or every season between endpoints.
Counts across related entities can overlap in one race and must not be summed to
reconstruct a distinct-race total.

A `race` contains string `id`, integer `year` and `round`, `name`, nullable
date-only `date` (`YYYY-MM-DD`) and nullable string `circuit_id`.
Use these canonical IDs to link to the existing race, season and circuit routes;
the API deliberately supplies no locale-specific web URLs.

Milestone `results` preserves **all** of the profiled entity's result entries in
that race, ordered by `position_display_order`. Each includes
`position_display_order`, nullable `position_number`, `position_text`, string
`driver_id` / `constructor_id`, nullable decimal-string `points`, boolean
`shared_car`, and nullable `reason_retired`. A win means at least one imported
result with `position_number = 1`. The four milestones are mechanical selections,
not editorial judgments about historical importance.

## Empty data and limitations

Existing entities without results have empty participation, zero count fields,
null season endpoints, null recorded points and four null milestones. Missing
observations stay empty even if the source has registered releases. Existing
entities with no winning result have null win milestones. No summary or prose is
inferred from names, proposed lineage or unimported upstream fields.

| Limitation code | Client explanation |
| --- | --- |
| `imported_race_results_only` | The career covers imported main-race results, not every activity or future scheduled race |
| `appearances_not_official_starts` | DNS/DNQ/retirement entries and repeated driver/race entries are preserved; counts are not official starts |
| `season_round_order_not_date_order` | First/last uses season and round, including when dates are absent or inconsistent |
| `missing_points_are_unknown` | SUM covers recorded values only; all-null or empty points returns null, distinct from known zero |
| `race_points_not_championship_standings` | No sprint standings, dropped-score rules or official constructor championship scoring; constructor points sum driver-result points |
| `entity_observations_not_result_provenance` | Observation hashes establish entity imports only; current result rows have no individual release/observation linkage |
| `constructor_association_not_entrant_or_legal_continuity` | Related constructors are recorded constructor identities, not entrants, employers or proven legal successors |

Results in one request use a read-only repeatable-read snapshot. No editorial or
lineage records are written. Proposed/rejected lineage remains excluded from the
existing public lineage endpoints; career associations do not approve claims.

## Pinned-source audit before implementation

Inspected local `f1db-json-splitted.zip` against the published checksum list for
[F1DB v2026.17.0](https://github.com/f1db/f1db/releases/tag/v2026.17.0):
SHA-256 `0f1717eaebae646b7ced9ca96f6be3282c1c1d435d0a9d75f2c00f40feb7d2a8`.
The archive embeds split schemas with ID version `v6.5.0`.

- 917 drivers, 187 constructors, 830 entrants, 1,172 races, 27,665 result rows.
- Result keys include `raceId`, `year`, `round`, `driverId`, `constructorId`,
  position fields, `sharedCar`, `points` and `reasonRetired`; there is no entrant ID.
- 89 driver/race pairs have multiple result entries; three constructor/race pairs
  have multiple winning result entries. Distinct races cannot be counted as rows.
- 19,083 points values and 10,928 numeric finish positions are null.
- Upstream drivers/constructors expose career totals and personal fields, but the
  current import stores names/identities, races and selected result fields only.
  This endpoint does not quietly claim or import those additional fields.

This is an inspection of structure and imported coverage, not independent
verification of every historical fact. The current import has no demonstrated
need for a schema migration for these derived views. The separate
[editorial design](editorial-content.md) also remains migration-free until there
is approved content and an authoring requirement.

## Verification

`DATABASE_URL=postgresql://... pnpm test:integration` runs the existing HTTP suite
and `profiles.integration.cjs` on separate random PostgreSQL schemas. Profile
fixtures are synthetic and cover chronology, gaps, multiple result entries,
shared-car winners, constructor/entrant separation, provenance, null versus zero,
empty/no-win profiles, canonical navigation IDs, locale fallback and BIGINT input.
The suite removes only its own schema.
