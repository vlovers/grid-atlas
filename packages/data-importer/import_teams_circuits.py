#!/usr/bin/env python3
"""Import source-attributed F1DB constructors, entrants and circuits."""
import argparse
import csv
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import zipfile

from import_seasons import ASSET, RELEASE, verified_seasons

KINDS = {
    "f1db-constructors.json": ("constructor", "historical_constructors"),
    "f1db-entrants.json": ("entrant", "historical_entrants"),
    "f1db-circuits.json": ("circuit", "historical_circuits"),
}


def read_entities(archive, checksums):
    _, digest = verified_seasons(archive, checksums)
    output = []
    with zipfile.ZipFile(archive) as bundle:
        for filename, (kind, _) in KINDS.items():
            matches = [m for m in bundle.infolist()
                       if Path(m.filename).name == filename and not m.is_dir()]
            if len(matches) != 1:
                raise ValueError(f"Expected exactly one {filename}")
            rows = json.loads(bundle.read(matches[0]))
            if not isinstance(rows, list) or not rows:
                raise ValueError(f"Invalid {filename}: expected nonempty array")
            seen = set()
            for row in rows:
                if not isinstance(row, dict):
                    raise ValueError(f"Malformed {filename} row")
                key = row.get("id")
                name = row.get("fullName") or row.get("name")
                if not isinstance(key, str) or not key.strip():
                    raise ValueError(f"Missing ID in {filename}")
                if key in seen:
                    raise ValueError(f"Duplicate ID {key} in {filename}")
                seen.add(key)
                if not isinstance(name, str) or not name.strip():
                    raise ValueError(f"Missing display name in {filename}: {key}")
                content_hash = hashlib.sha256(json.dumps(
                    row, sort_keys=True, separators=(",", ":"), ensure_ascii=False
                ).encode("utf-8")).hexdigest()
                output.append((kind, key, name, content_hash))
    return output, digest


def make_sql(entities, digest):
    if len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
        raise ValueError("Invalid release digest")
    stage = io.StringIO(newline="")
    writer = csv.writer(stage, lineterminator="\n")
    writer.writerows(entities)
    statements = [r"\set ON_ERROR_STOP on", "BEGIN;",
                  "SELECT pg_advisory_xact_lock(17021951);",
                  "CREATE TEMP TABLE f1db_stage(kind TEXT, external_id TEXT, title TEXT, content_hash TEXT) ON COMMIT DROP;",
                  "COPY f1db_stage(kind,external_id,title,content_hash) FROM STDIN WITH (FORMAT csv);",
                  stage.getvalue() + r"\.",
                  f"""DO $guard$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM source_releases r
   JOIN data_sources s ON s.id=r.source_id
   WHERE s.slug='f1db' AND r.release_tag='{RELEASE}'
     AND r.artifact_name='{ASSET}' AND r.sha256='{digest}'
 ) THEN RAISE EXCEPTION 'Pinned F1DB release must be imported first'; END IF;
END $guard$;""",
                  """INSERT INTO external_identities(source_id,entity_kind,external_id)
SELECT s.id,t.kind,t.external_id FROM f1db_stage t
JOIN data_sources s ON s.slug='f1db'
ON CONFLICT(source_id,entity_kind,external_id) DO NOTHING;"""]
    for kind, table in KINDS.values():
        statements.append(f"""INSERT INTO {table}(external_identity_id,display_name)
SELECT e.id,t.title FROM f1db_stage t
JOIN data_sources s ON s.slug='f1db'
JOIN external_identities e ON e.source_id=s.id AND e.entity_kind=t.kind AND e.external_id=t.external_id
WHERE t.kind='{kind}'
ON CONFLICT(external_identity_id) DO NOTHING;""")
    statements.append(f"""INSERT INTO source_observations(release_id,external_identity_id,content_hash)
SELECT r.id,e.id,t.content_hash FROM f1db_stage t
JOIN data_sources s ON s.slug='f1db'
JOIN source_releases r ON r.source_id=s.id AND r.release_tag='{RELEASE}' AND r.artifact_name='{ASSET}'
JOIN external_identities e ON e.source_id=s.id AND e.entity_kind=t.kind AND e.external_id=t.external_id
ON CONFLICT(release_id,external_identity_id) DO NOTHING;""")
    statements.append("COMMIT;")
    return "\n".join(statements) + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True)
    parser.add_argument("--checksums", required=True)
    args = parser.parse_args()
    url = os.environ.get("DATABASE_URL")
    if not url:
        parser.error("DATABASE_URL is required")
    entities, digest = read_entities(args.archive, args.checksums)
    result = subprocess.run(["psql", url, "-X", "-v", "ON_ERROR_STOP=1"],
                            input=make_sql(entities, digest), text=True)
    if result.returncode:
        raise RuntimeError(f"psql exited with {result.returncode}")
    print(f"Imported/verified {len(entities)} constructor, entrant and circuit identities")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, zipfile.BadZipFile, json.JSONDecodeError) as exc:
        print(f"Import failed: {exc}", file=sys.stderr)
        sys.exit(1)
