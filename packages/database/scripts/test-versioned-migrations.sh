#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL}"
python3 packages/database/scripts/migrate.py
python3 packages/database/scripts/migrate.py
expected=$(find packages/database/migrations -maxdepth 1 -name "[0-9][0-9][0-9][0-9]_*.sql" | wc -l | tr -d "[:space:]")
actual=$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT count(*) FROM schema_migrations")
echo "Applied migrations: $actual (expected $expected)"
test "$actual" = "$expected"
actual_tables=$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('historical_drivers','historical_constructors','historical_entrants','historical_seasons','historical_races','historical_circuits')")
echo "Historical core tables: $actual_tables (expected 6)"
test "$actual_tables" = 6

# Apply an appended migration, then verify it is never duplicated.
extra="packages/database/migrations/0007_ci_temp.sql"
base="packages/database/migrations/0001_provenance.sql"
backup="$(mktemp)"
cp "$base" "$backup"
cleanup() { cp "$backup" "$base"; rm -f "$backup" "$extra"; }
trap cleanup EXIT
printf '%s\n' "BEGIN;" "CREATE TABLE migration_ci_fixture (id INTEGER PRIMARY KEY);" "COMMIT;" > "$extra"
python3 packages/database/scripts/migrate.py
python3 packages/database/scripts/migrate.py
actual=$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT count(*) FROM schema_migrations")
echo "Applied migrations with fixture: $actual (expected $((expected + 1)))"
test "$actual" -eq "$((expected + 1))"
# Altering a historical migration must fail atomically, not silently pass.
printf '\n-- deliberate test tampering\n' >> "$base"
if python3 packages/database/scripts/migrate.py; then
  echo "Migration checksum tampering was not rejected" >&2
  exit 1
fi
cp "$backup" "$base"
python3 packages/database/scripts/migrate.py
