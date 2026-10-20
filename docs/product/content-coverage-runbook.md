# Content coverage census — execution guide

The initial inventory in [content-coverage-plan.md](content-coverage-plan.md) is a historical pinned-import baseline, **not** a fresh count. This script measures selected structural gaps directly on a database that has already been migrated and populated.

## Run against a disposable PostgreSQL import

```sh
# First create and import into a dedicated disposable database using the documented pinned F1DB workflow.
# Never point DATABASE_URL at production.
DATABASE_URL='postgresql://.../disposable_grid_atlas' \
  python3 scripts/content-coverage.py \
  --json /tmp/grid-atlas-coverage.json \
  --markdown /tmp/grid-atlas-coverage.md

python3 -m unittest discover -s tests -p 'test_content_coverage.py' -v
```

Requires Python 3, `psql`, a migrated schema and `DATABASE_URL`. It does not download data, run migrations, create tables, import, or change publication state. Every SQL query is run inside a PostgreSQL `READ ONLY` transaction. Do not commit database credentials or report files containing internal source metadata.

### Current metrics

The report counts imported seasons, drivers, constructors, entrants, circuits, races and result rows; blank labels; absent/wrong-kind external identities; race links to missing seasons/circuits; result links to missing race/driver/constructor; and migration/source-release row counts.

These are **structural diagnostics**, not independently checked history. Nonzero orphan counts warrant investigation; zero does not prove completeness.

### Deliberately excluded

Published UK/EN articles, licensed images, verified claim coverage, official championship standings and exhaustive HTTP route checks are explicitly listed as `not_measured`. Do not report them as zero or 100%. Future batches must add schema-aware read-only publication checks, independent source evidence and API tests before any release claims.

### Acceptance gate

Run against a fresh pinned F1DB import and save the JSON/Markdown outputs as CI artifacts after independently reviewing the measured denominators. The offline unit suite tests SQL transaction mode and report contract; it is **not** a substitute for executing the census against PostgreSQL.
