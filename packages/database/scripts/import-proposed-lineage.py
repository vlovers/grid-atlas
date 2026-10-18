#!/usr/bin/env python3
"""Transactional, fail-closed import of proposed lineage claims. Requires psql."""
import base64
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys

VALIDATOR = Path(__file__).with_name("validate-lineage-manifest.py")
spec = importlib.util.spec_from_file_location("lineage_validator", VALIDATOR)
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


def main(path):
    validator.validate(path)
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise ValueError("DATABASE_URL is required")
    claims = json.loads(Path(path).read_text(encoding="utf-8"))
    if not claims:
        print("No claims to import.")
        return
    payload = base64.b64encode(json.dumps(claims).encode()).decode()
    # Only the base64-encoded JSON crosses into SQL; it cannot terminate a SQL literal.
    sql = r"""\set ON_ERROR_STOP on
BEGIN;
SELECT pg_advisory_xact_lock(17021952);
CREATE TEMP TABLE lineage_stage ON COMMIT DROP AS
SELECT item.*, NULL::bigint AS subject_id, NULL::bigint AS object_id
FROM jsonb_to_recordset(convert_from(decode('PAYLOAD', 'base64'), 'UTF8')::jsonb)
AS item(entity_type text, subject jsonb, object jsonb, relation_type text,
effective_year integer, source_url text, source_title text,
source_publisher text, evidence_note text, accessed_at date);
UPDATE lineage_stage st SET subject_id = (
 SELECT CASE WHEN st.entity_type='constructor' THEN c.id ELSE e.id END
 FROM external_identities x
 JOIN data_sources s ON s.id=x.source_id
 LEFT JOIN historical_constructors c ON c.external_identity_id=x.id AND st.entity_type='constructor'
 LEFT JOIN historical_entrants e ON e.external_identity_id=x.id AND st.entity_type='entrant'
 WHERE s.slug=st.subject->>'source_slug' AND x.external_id=st.subject->>'external_id'
 AND x.entity_kind=st.entity_type
);
UPDATE lineage_stage st SET object_id = (
 SELECT CASE WHEN st.entity_type='constructor' THEN c.id ELSE e.id END
 FROM external_identities x
 JOIN data_sources s ON s.id=x.source_id
 LEFT JOIN historical_constructors c ON c.external_identity_id=x.id AND st.entity_type='constructor'
 LEFT JOIN historical_entrants e ON e.external_identity_id=x.id AND st.entity_type='entrant'
 WHERE s.slug=st.object->>'source_slug' AND x.external_id=st.object->>'external_id'
 AND x.entity_kind=st.entity_type
);
DO $guard$ BEGIN
 IF EXISTS (SELECT 1 FROM lineage_stage WHERE subject_id IS NULL OR object_id IS NULL OR subject_id=object_id)
 THEN RAISE EXCEPTION 'Missing, unresolved, or identical historical entity; no claims imported'; END IF;
 IF EXISTS (SELECT 1 FROM lineage_stage st
 JOIN historical_lineage_claims lc ON st.entity_type='constructor'
 AND lc.subject_constructor_id=st.subject_id AND lc.object_constructor_id=st.object_id
 AND lc.relation_type=st.relation_type AND lc.source_url=st.source_url
 WHERE lc.review_status <> 'proposed')
 OR EXISTS (SELECT 1 FROM lineage_stage st
 JOIN historical_entrant_lineage_claims lc ON st.entity_type='entrant'
 AND lc.subject_entrant_id=st.subject_id AND lc.object_entrant_id=st.object_id
 AND lc.relation_type=st.relation_type AND lc.source_url=st.source_url
 WHERE lc.review_status <> 'proposed')
 THEN RAISE EXCEPTION 'Cannot overwrite reviewed claim'; END IF;
END $guard$;
INSERT INTO historical_lineage_claims
(subject_constructor_id,object_constructor_id,relation_type,effective_year,
source_url,source_title,source_publisher,evidence_note,accessed_at,review_status)
SELECT subject_id,object_id,relation_type,effective_year,source_url,source_title,
source_publisher,evidence_note,accessed_at,'proposed'
FROM lineage_stage WHERE entity_type='constructor'
ON CONFLICT(subject_constructor_id,object_constructor_id,relation_type,source_url) DO NOTHING;
INSERT INTO historical_entrant_lineage_claims
(subject_entrant_id,object_entrant_id,relation_type,effective_year,
source_url,source_title,source_publisher,evidence_note,accessed_at,review_status)
SELECT subject_id,object_id,relation_type,effective_year,source_url,source_title,
source_publisher,evidence_note,accessed_at,'proposed'
FROM lineage_stage WHERE entity_type='entrant'
ON CONFLICT(subject_entrant_id,object_entrant_id,relation_type,source_url) DO NOTHING;
COMMIT;
""".replace("PAYLOAD", payload)
    completed = subprocess.run(["psql", url, "-X", "-v", "ON_ERROR_STOP=1"],
                               input=sql, text=True, check=False)
    if completed.returncode:
        raise RuntimeError("Import failed; transaction rolled back")
    print("Manifest processed. New claims are proposed only; existing claims unchanged.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: import-proposed-lineage.py FILE.json")
    try:
        main(sys.argv[1])
    except (ValueError, OSError, RuntimeError, json.JSONDecodeError) as exc:
        sys.exit(f"Lineage import error: {exc}")
