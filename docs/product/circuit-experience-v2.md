# Circuit Experience V2 — structural facts, not copied Box Box graphics

The source is the pinned, checksum-verified F1DB v2026.17.0 split JSON release. The new migration 0011 and importer load the original **circuit-layout identities** and **event-specific** course length, corners, laps, race distance and direction. Archived events retain separate layout references and source row hashes. No 3D track drawings, geographic maps, speed-trap locations, corner coordinates, sector data, tyre compound allocations, tyre ratings, elevation, DRS zones or lap-record winners are inferred.

API: `/api/circuits/:id/layouts` and `/api/circuits/:id/technical-history`.
UI: UK/EN technical section on each of the existing 78 circuit profile pages, layout selector, source-located event stats, non-geographic chronological display and race links. All populated fields are from F1DB and are not independently checked against primary FIA/Pirelli event documentation. The `effective` flag describes F1DB's current/last-used layout, not a permanent claim across every year.

Do **not** use the screenshots of Box Box as source data or copy the visual track geometry. For authentic sector maps, seek licensing from the rightsholder or generate original route coordinates from a compatible, verified geometry dataset with attribution and review.

Deployment of existing installations requires migration 0011 and a checksum-checked reimport. Treat empty or unlinked layouts as unknown, not as an invented diagram. The research-only historical technical fact review gate remains unchanged. Run all CI, especially pinned real-archive import/acceptance, before merging.
