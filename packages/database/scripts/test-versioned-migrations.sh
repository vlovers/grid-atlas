#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL}"
python3 packages/database/scripts/migrate.py
python3 packages/database/scripts/migrate.py
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT count(*) FROM schema_migrations" | grep -qx 2
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('historical_drivers','historical_constructors','historical_entrants','historical_seasons','historical_races','historical_circuits')" | grep -qx 6
