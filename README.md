# Grid Atlas

A source-backed Formula 1 historical encyclopedia, with searchable drivers, constructors and circuits, season calendars, race results, an interactive verified-lineage network, seasonal driver–constructor History Explorer, and a bilingual Time Machine for comparing recorded associations across seasons.

The public beta is in preparation. The archive uses pinned **F1DB v2026.17.0**, covering 1950–2026 through that release, rather than live updates. The interface defaults to Ukrainian at `/uk`, with English at `/en`. Unprefixed routes redirect to Ukrainian; imported names, identifiers and historical evidence are unchanged. Lineage is independently reviewed editorial data: proposed and rejected claims are never public. The 2021 Racing Point → Aston Martin candidate remains **proposed**.

## Run locally

Requirements: Node 24, pnpm 10.18.3, Python 3.11+, PostgreSQL 17 / Docker and the `psql` client. Run commands from the repository root.

```sh
corepack enable
corepack prepare pnpm@10.18.3 --activate
pnpm install --frozen-lockfile
cp .env.example .env
docker compose up -d --wait postgres
export DATABASE_URL=postgresql://grid_atlas:grid_atlas_local@127.0.0.1:5432/grid_atlas
python3 packages/database/scripts/migrate.py
```

The Compose database binds to localhost. If port 5432 is occupied, set `POSTGRES_PORT` in `.env` and use the same port in `DATABASE_URL`. Defaults above are local development credentials.

Download the official pinned assets and import in dependency order:

```sh
mkdir -p /tmp/grid-atlas-f1db
curl -fL --retry 3 https://github.com/f1db/f1db/releases/download/v2026.17.0/checksums_sha256.txt -o /tmp/grid-atlas-f1db/checksums_sha256.txt
curl -fL --retry 3 https://github.com/f1db/f1db/releases/download/v2026.17.0/f1db-json-splitted.zip -o /tmp/grid-atlas-f1db/f1db-json-splitted.zip
bash scripts/import-f1db.sh /tmp/grid-atlas-f1db/f1db-json-splitted.zip /tmp/grid-atlas-f1db/checksums_sha256.txt
```

Each importer validates the checksum and uses transactions; repeat imports preserve existing records and curated names. Importing these assets does not import or verify lineage. See [import details](packages/data-importer/README.md).

Start the API, then the web app in another terminal:

```sh
pnpm --filter @grid-atlas/api build
DATABASE_URL=postgresql://grid_atlas:grid_atlas_local@127.0.0.1:5432/grid_atlas pnpm --filter @grid-atlas/api start
```

```sh
API_BASE_URL=http://127.0.0.1:3001 pnpm --filter @grid-atlas/web dev --port 3000
```

Open http://localhost:3000/uk (Ukrainian) or http://localhost:3000/en (English). For local production processes, run `pnpm build`, then the API start command and `API_BASE_URL=http://127.0.0.1:3001 pnpm --filter @grid-atlas/web start --hostname 127.0.0.1 --port 3000`. External hosting has not been deployed by this work.

## Checks

```sh
pnpm check
pnpm lint
pnpm typecheck
pnpm test
python3 -m unittest discover -s tests -v
pnpm build
```

Integration tests require `DATABASE_URL` pointing to disposable PostgreSQL. HTTP and browser suites create and remove their own random schemas; existing application tables are untouched. The legacy shell suites require separate fresh databases and are run in database CI.

```sh
python3 packages/database/scripts/test-audit-lineage-manifest-identities.py
python3 packages/database/scripts/test-lineage-identity-integration.py
pnpm test:integration
pnpm exec playwright install chromium
pnpm test:browser
```

Browser tests use production API / web processes on localhost ports 3339–3341, real PostgreSQL and clearly synthetic fixtures. They cover desktop and mobile navigation, search paging, circuit/race/profile links, lineage evidence and zoom, Time Machine UK/EN comparison journeys, not-found and API outage states. No synthetic facts enter the real imported archive.

## Current Explorer and Time Machine state

The merged History Explorer supports UK/EN driver and constructor focus, year
selection, exact recorded-race evidence, reciprocal links and URL-permalinks.
An accessible paginated list exposes all observed associations beyond the
initial 25-edge graph API window; the SVG intentionally renders at most 10.
The read-only Time Machine comparison API **and bilingual UI are present in `main`**
([API contract](docs/api/time-machine-comparison.md)). The UI supports UK/EN
entity search, two-season comparison, shareable links, observed-result counts,
Explorer navigation and race-evidence drilldown. Synthetic browser tests and
pinned-archive CI exist; a separate human visual walkthrough against the real
import remains outstanding ([acceptance checklist](docs/product/time-machine-real-import-journey.md)).
Do not infer contracts, official starts, championship standings or a lack of
historical participation from missing imported result associations.

The [pinned F1DB real-archive acceptance report](docs/real-archive-acceptance-2026-10.md)
records repeated imports, representative SQL parity, and real-browser tests
over UK/EN desktop/mobile. Those results establish import consistency and
sampled UI behavior, not independently verified historical claims or public
hosting readiness.

## Data and boundaries

- The measured pinned import contains 77 seasons, 917 drivers, 187 constructors, 830 entrants, 78 circuits, 1,172 races and 27,665 result rows. See [audit evidence](docs/beta-audit.md).
- Drivers, constructors and entrants are different identities. F1DB's constructor grouping is not proof of corporate continuity.
- Career and season figures summarize imported race-result rows. Driver points exclude sprint standings calculations and historical dropped-score rules. Constructor points are sums of driver-result points, not official championship totals; shared-car victories count once per constructor race.
- Circuit layouts, official championship standings and live timing are not implemented. Driver editorial/story and licensed-media foundations exist, but public biographies and photographs require separate review, approval and rights clearance; do not treat draft content or registry entries as published assets.
- The localized `/uk/sources` and `/en/sources` pages show registered releases, checksums, attribution and statistical limitations. F1DB data is [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); Grid Atlas selects fields and derives summaries. No licensed F1 logos or photos are bundled.
- Only verified, cited lineage edges appear in the network. An empty graph is an honest editorial state. [Independent review is required](docs/data-sources/lineage-publication-runbook.md).

The driver-profile code also includes section navigation, a compact career journey, a private-by-default editorial story reader and licensed-media registry/hero foundations. **These foundations do not mean draft biographies or images are publicly approved**; publication requires independent editorial and rights review. Senna Showcase and the broader visual redesign are separate ongoing work, not shipped site-wide UI. See [MVP status and gates](docs/product/stable-experience-roadmap.md).

The monorepo contains [Next.js web](apps/web/README.md), [NestJS API](apps/api/README.md), [PostgreSQL migrations](packages/database/README.md), and dependency-free Python importers. See the [architecture](docs/architecture/overview.md), [beta audit](docs/beta-audit.md) and [roadmap](docs/roadmap/README.md) for implementation status and release gates.
