#!/usr/bin/env python3
"""Import verified F1DB driver identities without changing curated names."""
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


def read_drivers(archive, checksums):
    # Reuse the existing pinned-release checksum verification before parsing.
    _, digest = verified_seasons(archive, checksums)
    with zipfile.ZipFile(archive) as bundle:
        matches = [x for x in bundle.infolist()
                   if Path(x.filename).name == "f1db-drivers.json" and not x.is_dir()]
        if len(matches) != 1:
            raise ValueError("Expected exactly one f1db-drivers.json")
        rows = json.loads(bundle.read(matches[0]))
    if not isinstance(rows, list) or not rows:
        raise ValueError("Driver collection must be a nonempty JSON array")
    seen = set()
    result = []
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("Invalid driver record")
        driver_id = row.get("id")
        title = row.get("fullName") or row.get("name")
        if not isinstance(driver_id, str) or not driver_id.strip():
            raise ValueError("Invalid driver ID")
        if not isinstance(title, str) or not title.strip():
            raise ValueError(f"Invalid driver name: {driver_id}")
        if driver_id in seen:
            raise ValueError(f"Duplicate driver ID: {driver_id}")
        seen.add(driver_id)
        content_hash = hashlib.sha256(json.dumps(
            row, sort_keys=True, ensure_ascii=False, separators=(",", ":")
        ).encode("utf-8")).hexdigest()
        result.append((driver_id, title, content_hash))
    return result, digest


def build_sql(drivers, digest):
    if len(digest) != 64 or any(x not in "0123456789abcdef" for x in digest):
        raise ValueError("Invalid release checksum")
    csv_data = io.StringIO(newline="")
    writer = csv.writer(csv_data, lineterminator="\n")
    writer.writerows(drivers)
    return f"""\\set ON_ERROR_STOP on
BEGIN;
SELECT pg_advisory_xact_lock(17021951);
CREATE TEMP TABLE f1db_drivers_stage(external_id TEXT, title TEXT, content_hash TEXT) ON COMMIT DROP;
COPY f1db_drivers_stage(external_id,title,content_hash) FROM STDIN WITH (FORMAT csv);
{csv_data.getvalue()}\\.
DO $guard$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM source_releases r JOIN data_sources s ON r.source_id=s.id
  WHERE s.slug='f1db' AND r.release_tag='{RELEASE}' AND r.artifact_name='{ASSET}'
    AND r.sha256='{digest}'
 ) THEN RAISE EXCEPTION 'Pinned F1DB release not registered with matching digest: import seasons first'; END IF;
END $guard$;
INSERT INTO external_identities(source_id,entity_kind,external_id)
SELECT s.id,'driver',st.external_id
FROM f1db_drivers_stage st
CROSS JOIN (SELECT id FROM data_sources WHERE slug='f1db') s
ON CONFLICT(source_id,entity_kind,external_id) DO NOTHING;
INSERT INTO historical_drivers(external_identity_id, display_name)
SELECT e.id,st.title FROM f1db_drivers_stage st
JOIN data_sources s ON s.slug='f1db'
JOIN external_identities e ON e.source_id=s.id AND e.entity_kind='driver' AND e.external_id=st.external_id
ON CONFLICT(external_identity_id) DO NOTHING;
INSERT INTO source_observations(release_id,external_identity_id,content_hash)
SELECT r.id,e.id,st.content_hash FROM f1db_drivers_stage st
JOIN data_sources s ON s.slug='f1db'
JOIN source_releases r ON r.source_id=s.id AND r.release_tag='{RELEASE}' AND r.artifact_name='{ASSET}'
JOIN external_identities e ON e.source_id=s.id AND e.entity_kind='driver' AND e.external_id=st.external_id
ON CONFLICT(release_id,external_identity_id) DO NOTHING;
COMMIT;
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True)
    parser.add_argument("--checksums", required=True)
    args = parser.parse_args()
    url = os.environ.get("DATABASE_URL")
    if not url:
        parser.error("DATABASE_URL is required")
    drivers, digest = read_drivers(args.archive, args.checksums)
    result = subprocess.run(["psql", url, "-X", "-v", "ON_ERROR_STOP=1"],
                            input=build_sql(drivers, digest), text=True)
    if result.returncode:
        raise RuntimeError(f"psql failed with exit code {result.returncode}")
    print(f"Imported/verified {len(drivers)} driver identities")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, zipfile.BadZipFile, json.JSONDecodeError) as exc:
        print(f"Import failed: {exc}", file=sys.stderr)
        sys.exit(1)
