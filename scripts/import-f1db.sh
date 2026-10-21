#!/usr/bin/env bash
# Import an already downloaded, pinned official release in foreign-key order.
set -euo pipefail
if [ "$#" -ne 2 ]; then
  echo "Usage: bash scripts/import-f1db.sh ARCHIVE CHECKSUMS" >&2
  exit 1
fi
: "${DATABASE_URL:?Set DATABASE_URL}"
python3 packages/database/scripts/migrate.py
for importer in import_seasons import_drivers import_teams_circuits import_races import_race_results import_identity_details import_championship_standings import_circuit_layouts; do
  python3 "packages/data-importer/$importer.py" --archive "$1" --checksums "$2"
done
