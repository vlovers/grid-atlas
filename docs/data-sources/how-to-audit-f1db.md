# Reproducible offline F1DB release audit

This procedure does **not** install or ingest external data into PostgreSQL.

1. Open [F1DB v2026.17.0](https://github.com/f1db/f1db/releases/tag/v2026.17.0).
2. Download the two official assets into a disposable directory:
   - `f1db-json-splitted.zip`
   - `checksums_sha256.txt`
3. Run from this repository root:

```sh
python3 scripts/audit_f1db.py --archive /path/to/f1db-json-splitted.zip \
  --checksums /path/to/checksums_sha256.txt --report /tmp/f1db-audit.json
python3 -m unittest discover -s tests -p 'test_f1db_audit.py' -v
```

Do not commit the zip or entire upstream dataset. Save a reproducible summary with release tag, SHA-256 and counts. A verified checksum only proves downloaded bytes match the published checksum file; it does not guarantee data accuracy or licensing rights.

**Current coverage:** SHA-256, archive safety, collection counts, ID duplicate checks, null rows, non-array warnings, eight configured cross-collection reference checks and season-year coverage. **Not yet included:** full JSON Schema validation, every reference/composite-key check, complete field nullability statistics, semantic lineage validation or rights review. A report with no findings is not certification of F1DB historical accuracy.

The pinned upstream archive has been audited and imported twice into disposable PostgreSQL. See [measured release results](f1db-v2026.17.0-results.md) and the [current beta audit](../beta-audit.md).
