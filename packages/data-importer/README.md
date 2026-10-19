# Pinned F1DB importers

Dependency-free Python / psql loaders for official **F1DB v2026.17.0** split JSON. Apply the versioned database migrations first, export `DATABASE_URL`, and run from the repository root using the same archive and checksum file for every stage:

```sh
bash scripts/import-f1db.sh /path/to/f1db-json-splitted.zip /path/to/checksums_sha256.txt
```

Import order follows foreign keys. Expected pinned counts: 77 seasons; 917 drivers; 187 constructors, 830 entrants and 78 circuits; 1,172 races; 27,665 result rows. CI downloads the official assets and imports each stage twice into disposable PostgreSQL. See [measured audit](../../docs/beta-audit.md).

Each loader verifies SHA-256 against the published checksum file, validates the fields it consumes and imports transactionally. The release tag/asset digest is registered and cannot silently change. Driver, constructor, entrant, circuit and race identities retain per-record source observations. Existing historical records, results and curated display names are not overwritten. A repeat run is insert-only/idempotent; it is not a reconciliation report or proof that existing edited rows still equal upstream.

`audit_silverstone_release.py --archive ... --checksums ...` checks the six named constructor IDs against the pinned archive. `packages/database/scripts/audit-lineage-manifest-identities.py FILE.json` resolves exact source/kind endpoints in an imported database without persistent changes. The separate proposed importer never verifies historical claims; independent editorial review remains mandatory.

Limitations: field validation is narrower than full JSON Schema / semantic verification; race-result rows lack separate per-row provenance observations; no standings, sprint imports, layouts, chronology-to-lineage inference, legal entity reconciliation or multi-release update policy. Do not change the release pin without a new audit and reviewed reconciliation plan. Checksums prove byte agreement, not historical truth.
