# Provenance DB foundation (PR 4)

Initial SQL for source attribution and stable external identities, *not* the full F1 historical ontology.

- `data_sources` stores the provider and human-readable attribution.
- `source_releases` records archive tag, asset name and SHA-256.
- `external_identities` separates source ID, entity type and original identifier; it does **not** equate entrant with constructor.
- `source_observations` records the content digest seen for an identity in a particular release.

## Design constraints

- No inferred ownership/lineage edges at this stage.
- No production importer, auto-synchronization or write access from a public API.
- Never delete source attribution or silently overwrite observations.
- Hashes prove byte identity, not correctness of external history.
- Migration SQL runs once against a fresh database. The runner is deliberately basic; migration tracking, incremental upgrades and rollback policy need a separate PR before production use.

## Testing

`DATABASE_URL=postgresql://... bash packages/database/scripts/test-migrations.sh`

CI executes this against a disposable PostgreSQL 17 instance. A clean application database is required.
