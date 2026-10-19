#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL}"
for path in packages/database/migrations/[0-9]*.sql; do
  [ -f "$path" ] || { echo "No migrations" >&2; exit 1; }
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$path"
done
