#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL}"
python3 packages/database/scripts/migrate.py
python3 packages/database/scripts/migrate.py
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT count(*) FROM schema_migrations" | grep -qx 6
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('historical_drivers','historical_constructors','historical_entrants','historical_seasons','historical_races','historical_circuits')" | grep -qx 6

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
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT count(*) FROM schema_migrations" | grep -qx 7
# Altering a historical migration must fail atomically, not silently pass.
printf '\n-- deliberate test tampering\n' >> "$base"
if python3 packages/database/scripts/migrate.py; then
  echo "Migration checksum tampering was not rejected" >&2
  exit 1
fi
cp "$backup" "$base"
python3 packages/database/scripts/migrate.py
