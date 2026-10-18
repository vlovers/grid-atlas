# F1DB seasons importer — phase 1

Imports only the `year` values from the checksum-verified F1DB v2026.17.0 official split JSON archive into `historical_seasons`. This is a deliberately small first slice, **not** the whole dataset.

Run the versioned migrations first, then set `DATABASE_URL` and execute:

```sh
python3 packages/data-importer/import_seasons.py --archive /path/to/f1db-json-splitted.zip --checksums /path/to/checksums_sha256.txt
```

Guarantees: rejects altered archives, non-integer/duplicate years; insert-only seasons, stable source record, release checksum match and transaction. Repeated import must produce the same count. CI downloads and imports the published release twice into disposable PostgreSQL.

Current limitations: no schema validation beyond the season shape; no full-repository importer, external copyright clearance, or user-defined curated update strategy yet. Source release identity is immutable for a given tag/asset/hash; a conflicting digest causes a DB error on insert if an existing release exists.
