# Archive route recovery

The 23 October incident was a populated local database at migration 0007 running
code that required migrations 0008–0011. Catalogues worked, while season standings,
profile identity and circuit layouts failed. The eight-second SSR budget was not
the cause. The audit and database backup were captured before recovery.

## Reproduce and diagnose

Use Node 24 and the exact pnpm lockfile. The API process must receive DATABASE_URL;
the Next.js process must receive API_BASE_URL. Neither automatically loads the root
Compose .env as application configuration. Production requires an explicit HTTP(S)
API origin without credentials/path/query. Only development defaults to loopback.
When web/API run in separate containers, loopback refers to that container; configure
the private API service hostname and bind the API to 0.0.0.0. Compose currently runs
only PostgreSQL; a host API uses its published localhost port.

```sh
node scripts/doctor-archive.mjs --api-origin http://127.0.0.1:3001
```

This read-only probe checks readiness, archive/provenance presence and sampled
driver, constructor, circuit, season and race dependencies. Success is a runtime
smoke check, not exhaustive historical acceptance. `/api/health` is liveness only.
`/api/ready` now checks every required migration and checksum; it returns 503 on
drift. Missing tables/columns return 503 rather than masquerading as missing records.
API logs identify the route template and SQLSTATE without SQL, credentials or raw
request/query values. Web logs identify endpoint, reason, status and elapsed time.

## Recover an existing installation

Back up the target database first using the installation's normal backup process.
Set DATABASE_URL for the intended database, then run from the repository root:

```sh
bash scripts/import-f1db.sh /path/to/f1db-json-splitted.zip /path/to/checksums_sha256.txt
node scripts/doctor-archive.mjs --api-origin http://127.0.0.1:3001
```

The existing wrapper applies checksummed forward-only migrations, then imports the
pinned release in dependency order, including identity, standings and layouts.
Do not edit the migration ledger, drop tables or substitute empty API results.
Repeat imports preserve curated identities. Restart/rebuild application processes
after code updates; run builds with a separate GRID_ATLAS_NEXT_DIST_DIR when a dev
server uses the checkout. Recheck both direct navigation and internal links in UK/EN.

## Data boundaries

Essential archive/API failures continue to show the localized retry boundary;
canonical 404s remain not-found. An article 404 means no approved article. An article
outage, timeout or invalid publication projection is independently reported and
shown as temporarily unavailable; it cannot remove an otherwise valid driver
profile or archive story. Optional prose uses a two-second budget; required archive
requests retain eight seconds, including body parsing, with no hidden retries.

The API schema-contract JSON is packaged into the production build. When adding a
migration, update its version/SHA-256 entry; the Node regression rejects any stale
or missing entry. Extra newer ledger entries are allowed to support rolling deploys.
Schema readiness does not prove a complete archive import: use the doctor and the
existing exhaustive archive audit for that separate check.
