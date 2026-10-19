#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL}"
bash packages/database/scripts/apply-migrations.sh
# Constraints and FK behavior; rollback means fixtures never persist.
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
INSERT INTO data_sources (slug, homepage_url, attribution)
VALUES ('f1db', 'https://github.com/f1db/f1db', 'F1DB CC BY 4.0');
INSERT INTO source_releases(source_id, release_tag, artifact_name, sha256)
VALUES (1, 'v2026.17.0', 'f1db-json-splitted.zip', repeat('a',64));
INSERT INTO external_identities(source_id, entity_kind, external_id)
VALUES (1, 'constructor', 'red-bull');
INSERT INTO source_observations(release_id, external_identity_id, content_hash)
VALUES (1, 1, repeat('b',64));
DO $$
BEGIN
 IF (SELECT count(*) FROM source_observations) <> 1 THEN
   RAISE EXCEPTION 'Unexpected observation count';
 END IF;
END $$;
ROLLBACK;
SQL
# The migration is intentionally non-idempotent; ensure it created tables.
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('data_sources','source_releases','external_identities','source_observations')" | grep -qx 4
