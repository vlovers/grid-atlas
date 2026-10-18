#!/usr/bin/env python3
"""Read-only preflight: resolve every manifest endpoint in the imported database."""
import base64
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys

spec = importlib.util.spec_from_file_location(
    "lineage_validator", Path(__file__).with_name("validate-lineage-manifest.py"))
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


def main(path):
    validator.validate(path)
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise ValueError("DATABASE_URL is required")
    claims = json.loads(Path(path).read_text(encoding="utf-8"))
    if not claims:
        print("No claims to check.")
        return
    identities = sorted({(claim["entity_type"], side["source_slug"], side["external_id"])
                         for claim in claims for side in (claim["subject"], claim["object"])})
    payload = base64.b64encode(json.dumps([
        {"kind": kind, "source_slug": slug, "external_id": external_id}
        for kind, slug, external_id in identities
    ]).encode()).decode()
    sql = r"""\set ON_ERROR_STOP on
BEGIN READ ONLY;
CREATE TEMP TABLE lineage_identity_preflight ON COMMIT DROP AS
SELECT kind, source_slug, external_id FROM jsonb_to_recordset(
 convert_from(decode('PAYLOAD', 'base64'), 'UTF8')::jsonb)
 AS item(kind text, source_slug text, external_id text);
SELECT st.kind, st.source_slug, st.external_id,
       COUNT(CASE WHEN st.kind='constructor' THEN c.id ELSE e.id END) AS resolved_count
FROM lineage_identity_preflight st
LEFT JOIN data_sources s ON s.slug=st.source_slug
LEFT JOIN external_identities x ON x.source_id=s.id
 AND x.entity_kind=st.kind AND x.external_id=st.external_id
LEFT JOIN historical_constructors c ON c.external_identity_id=x.id AND st.kind='constructor'
LEFT JOIN historical_entrants e ON e.external_identity_id=x.id AND st.kind='entrant'
GROUP BY st.kind, st.source_slug, st.external_id
ORDER BY st.kind, st.external_id;
DO $check$ BEGIN
 IF EXISTS (
  SELECT 1 FROM lineage_identity_preflight st
  LEFT JOIN data_sources s ON s.slug=st.source_slug
  LEFT JOIN external_identities x ON x.source_id=s.id
   AND x.entity_kind=st.kind AND x.external_id=st.external_id
  LEFT JOIN historical_constructors c ON c.external_identity_id=x.id AND st.kind='constructor'
  LEFT JOIN historical_entrants e ON e.external_identity_id=x.id AND st.kind='entrant'
  GROUP BY st.kind, st.source_slug, st.external_id
  HAVING COUNT(CASE WHEN st.kind='constructor' THEN c.id ELSE e.id END) <> 1
 ) THEN RAISE EXCEPTION 'Manifest endpoint is missing or ambiguous'; END IF;
END $check$;
ROLLBACK;
""".replace("PAYLOAD", payload)
    # TEMP TABLE creation is permitted in a read-only transaction on PostgreSQL.
    result = subprocess.run(["psql", url, "-X", "-v", "ON_ERROR_STOP=1"],
                            input=sql, text=True, check=False)
    if result.returncode:
        raise RuntimeError("Identity preflight failed; no claims changed")
    print(f"Resolved {len(identities)} distinct endpoints; no claims changed.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: audit-lineage-manifest-identities.py FILE.json")
    try:
        main(sys.argv[1])
    except (ValueError, OSError, RuntimeError, json.JSONDecodeError) as exc:
        sys.exit(str(exc))
