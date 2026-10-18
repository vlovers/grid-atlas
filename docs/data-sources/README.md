# Data-source register

| Candidate | Purpose | Status |
| --- | --- | --- |
| [F1DB](https://github.com/f1db/f1db) | Structured historical championship facts | Pinned v2026.17.0; checksum audited and historical read-model imports tested in PostgreSQL; see [beta audit](../beta-audit.md) for scope and remaining gaps |
| [Wikidata](https://www.wikidata.org/) | Entity reconciliation and identifiers | Candidate; verify individual claims |
| [Wikimedia Commons](https://commons.wikimedia.org/) | Media with file-specific licenses | Candidate; per-asset checks required |
| [Jolpica-F1](https://github.com/jolpica/jolpica-f1) | Independent historical cross-checks | Candidate; review reuse restrictions |

Do not scrape official sites, embed protected logos or batch-ingest images before legal/source review. Importers must pin upstream versions and retain provenance and attribution.
