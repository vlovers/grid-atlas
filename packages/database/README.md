# PostgreSQL historical database

Five forward-only migrations implement provenance, source-qualified external identities, drivers, constructors, entrants, seasons, circuits, races, race results and separate constructor / entrant lineage claims. Entity kinds are distinct; source identities do not imply corporate continuity.

```sh
DATABASE_URL=postgresql://... python3 packages/database/scripts/migrate.py
```

The versioned runner serializes migrations with an advisory transaction lock, tracks file checksums, safely replays completed migrations and rejects altered historical files. Add a new numbered migration rather than changing an applied file. `apply-migrations.sh` is a legacy clean-database helper used by early constraint suites; it is not the application migration command.

Source releases retain tags, asset names and SHA-256; source observations retain per-identity content hashes. Imports preserve existing historical rows and curated names. Result rows are linked to imported driver / constructor / race identities, but do not yet have independent per-row observation records or an upgrade/reconciliation policy for new release pins.

Lineage has required evidence, distinct endpoints, proposed/verified/rejected review states and review metadata required for verified rows. Independent review is a procedural publication gate; SQL cannot prove a reviewer is independent. Never automatically promote claims. See the [publication runbook](../../docs/data-sources/lineage-publication-runbook.md).

Tests require disposable PostgreSQL. Legacy suites expect **separate fresh databases**:

- `bash packages/database/scripts/test-versioned-migrations.sh`: fresh/replayed/appended migrations and checksum rejection.
- `bash packages/database/scripts/test-migrations.sh`: provenance constraints.
- `bash packages/database/scripts/test-historical-core.sh`: historical and lineage constraints.
- `bash packages/database/scripts/test-proposed-lineage-import.sh`: transactional/idempotent proposed-only imports and reviewed-claim protection.
- `python3 packages/database/scripts/test-lineage-identity-integration.py`: exact source/kind resolution and read-only failures in an owned random schema.

All use `DATABASE_URL`. The API's integration/browser suites also own random schemas. Use the [root README](../../README.md) for complete local import/startup. Production backup/restore, concurrency/load testing and deployment migration rehearsal remain release gates.
