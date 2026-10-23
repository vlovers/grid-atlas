# Reliability and experience audit · 23 October 2026

Audit base: `c30d6571ed786bcd4c39d68678ce8ee6359fdb01` (main). PRs
#217, #218, #219 and #220 are merged. No open PRs at audit time.
README, architecture, roadmap, workflows, open issues, recent commits, media
registry, SVG provenance and independent publication gates were inspected.

## Reproduction before changes

The user's localhost:3000 Next.js development server calls localhost:3001.
The API is running from this checkout. PostgreSQL 17 is healthy on host port
5432; Compose contains only PostgreSQL, so no container DNS assumption is involved.
`/api/health`, `/api/ready`, `/api/seasons/2025`, calendars, lineups and basic
driver/constructor/circuit profiles return 200. The web season page returns 500.
Both season standings endpoints and all three profile identity endpoints return
500. Database inspection confirms all four tables introduced by migrations
0008–0011 are absent. The ledger ends at 0007; it already contains 77 seasons
and 27,665 result rows. This is an old populated database, not a missing archive.

The season page requires standings in its Promise.all; driver/constructor pages
require identity and championships; circuit pages require identity/layouts.
Consequently a healthy catalogue can link to a failing dossier. Readiness only
ran SELECT 1 and incorrectly declared the incompatible schema ready.
The eight-second frontend timeout was not reached in this reproduction.
Increasing it would not repair absent tables. No evidence of Docker routing or
bad API_BASE_URL was found in the active local setup.

## Existing work to retain

- Editorial Racing tokens, hero/statistics/tabs/source primitives, driver and
  constructor dossiers and participation views already exist.
- Circuit experience has 160 checksum-bound F1DB/Jules Roy SVGs and exact event
  mappings. Source-declared license is CC BY 4.0; independent rights review is
  still an explicit release boundary.
- The media registry already records identity, creator, source revisions, license,
  attribution, checksums, bilingual captions and independent approval. Its public
  collection is empty. Research candidates must not become published photographs.
- Story/article exports and lineage have existing independent publication gates.
  Archive summaries do not constitute researched biography or race narrative.
- Main still mixes catalogue/story headers with the newer editorial templates.
  Issues #195/#152 cover this gap; #104 covers operational release gates.

## Delivery boundaries

PR A repairs schema readiness, diagnostics, optional editorial isolation and
route regression coverage. Recovery uses the existing forward-only migrator and
checksum-verified importer after a local database backup, preserving curated data.
PR B extends existing editorial primitives across catalogues, seasons, circuits
and races; retains working driver/constructor dossiers; and improves media and
source-led discovery without manufacturing approval or historical claims.

Baseline and final verification results, screenshot paths and remaining release
gates are recorded in the delivery report alongside these changes.
