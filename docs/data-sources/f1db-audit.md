# F1DB source audit — initial findings

Status: Research in progress; **no production import authorized**.

## Verified upstream

- Repository: https://github.com/f1db/f1db
- Inspected release: **v2026.17.0**, published 2026-10-11 (GitHub release metadata).
- Artifacts include CSV, JSON (single/split), PostgreSQL SQL dumps, SQLite and SHA-256 checksums.
- README states coverage of championship seasons from 1950 onward, races, entrants, constructors, chassis, engines, tyres, circuits and circuit layouts.
- README documents JSON Schema version **v6.5.0** for releases >= v2026.8.2, including sprint distance/lap properties; confirm schema in the pinned artifact before integration.
- Circuit layout SVGs live in the source repository, not normal release archives.
- The repository states a **CC BY 4.0** license. Preserve attribution, version and links. This is not a blanket license for third-party photos, official logos or other material.

## Important limitations

- Dataset descriptions are **not** sufficient to infer legal or sporting lineage between similarly named constructors, entrants, chassis or teams.
- F1DB constructor records alone do not prove continuity of ownership or identity.
- Human-readable stories, team sale/rename history, engineering staff and driver relationships need independent source checks.
- Historical completeness and counts have not yet been measured from extracted artifacts.
- License and trademark review remains necessary prior to distributing media or commercializing.

## Required reproducible verification before importer PR

1. Download release **v2026.17.0** from GitHub releases and verify relevant zip against `checksums_sha256.txt`.
2. Inspect actual JSON schema, keys, nullability and data relationships; enumerate files and IDs.
3. Measure entity counts, orphaned references, duplicates, missing dates and seasonal coverage.
4. Cross-check samples including 1950, 1960s, 1970s, 1990s, 2009, 2021, 2026.
5. Separate `constructor`, `entrant`, `chassis`, `engine` and `organization`; map source IDs without folding their meaning.
6. Create evidence-backed fixture cases: Stewart/Jaguar/Red Bull and Tyrrell/BAR/Honda/Brawn/Mercedes.
7. Preserve upstream version, artifact SHA-256, import timestamp, source identifiers and attribution.
8. Document corrections and rejected records. Never let upstream sync silently replace curated facts.

## Architecture recommendation (not yet accepted)

Use PostgreSQL for source-normalized entities and typed, temporal, cited relation edges. Start with an import staging layer and source identity mapping rather than assigning team lineage from name matching. Defer table schema until upstream structure is inspected.

## References

- https://github.com/f1db/f1db
- https://github.com/f1db/f1db/releases/tag/v2026.17.0
- https://github.com/f1db/f1db/blob/main/README.md
- https://github.com/f1db/f1db/blob/main/LICENSE
