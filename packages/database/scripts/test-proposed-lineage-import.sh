#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL}"
python3 packages/database/scripts/migrate.py
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO data_sources(slug,homepage_url,attribution)
VALUES ('lineage-import-ci','https://example.org','Disposable integration fixture')
ON CONFLICT(slug) DO NOTHING;
INSERT INTO external_identities(source_id,entity_kind,external_id)
SELECT id,'constructor',v.external_id FROM data_sources
CROSS JOIN (VALUES ('alpha'),('beta')) AS v(external_id)
WHERE slug='lineage-import-ci'
ON CONFLICT DO NOTHING;
INSERT INTO historical_constructors(external_identity_id,display_name)
SELECT x.id,x.external_id FROM external_identities x
JOIN data_sources s ON s.id=x.source_id
WHERE s.slug='lineage-import-ci' AND x.entity_kind='constructor'
ON CONFLICT(external_identity_id) DO NOTHING;
SQL
python3 - "$tmp" <<'PY'
import json,sys,pathlib
root=pathlib.Path(sys.argv[1])
def item(target):
 return {"entity_type":"constructor",
 "subject":{"source_slug":"lineage-import-ci","external_id":"alpha"},
 "object":{"source_slug":"lineage-import-ci","external_id":target},
 "relation_type":"renamed_to","effective_year":2000,
 "source_url":"https://example.org/fixture",
 "source_title":"Fixture source","source_publisher":"Integration suite",
 "evidence_note":"Synthetic fixture only","accessed_at":"2026-10-18"}
(root/"good.json").write_text(json.dumps([item("beta")]))
(root/"bad.json").write_text(json.dumps([item("beta"),item("missing")]))
PY
if python3 packages/database/scripts/import-proposed-lineage.py "$tmp/bad.json"; then
 echo "Expected unresolved identity to fail" >&2; exit 1
fi
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM historical_lineage_claims WHERE source_url='https://example.org/fixture')
 THEN RAISE EXCEPTION 'Partial insert after rollback'; END IF;
END $$;
SQL
python3 packages/database/scripts/import-proposed-lineage.py "$tmp/good.json"
python3 packages/database/scripts/import-proposed-lineage.py "$tmp/good.json"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
 IF (SELECT count(*) FROM historical_lineage_claims WHERE source_url='https://example.org/fixture')<>1
 THEN RAISE EXCEPTION 'Repeated import was not idempotent'; END IF;
 IF EXISTS (SELECT 1 FROM historical_lineage_claims WHERE source_url='https://example.org/fixture' AND review_status<>'proposed')
 THEN RAISE EXCEPTION 'Import must be proposed'; END IF;
END $$;
UPDATE historical_lineage_claims SET review_status='verified',reviewer='integration-test',reviewed_at=now()
WHERE source_url='https://example.org/fixture';
SQL
if python3 packages/database/scripts/import-proposed-lineage.py "$tmp/good.json"; then
 echo "Expected reviewed claim protection" >&2; exit 1
fi
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
 IF (SELECT count(*) FROM historical_lineage_claims WHERE source_url='https://example.org/fixture' AND review_status='verified')<>1
 THEN RAISE EXCEPTION 'Reviewed claim changed'; END IF;
END $$;
SQL
echo "Lineage importer integration passed."
