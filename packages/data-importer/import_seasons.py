#!/usr/bin/env python3
"""Import seasons from a checksum-verified F1DB split JSON release.

Usage: python3 packages/data-importer/import_seasons.py --archive PATH --checksums PATH
Requires DATABASE_URL, psql, and an already migrated PostgreSQL database.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import zipfile

ASSET = "f1db-json-splitted.zip"
RELEASE = "v2026.17.0"
SOURCE = "f1db"


def verified_seasons(archive, checksums):
    import re
    def checksum_for(text, filename):
        for line in text.splitlines():
            match = re.fullmatch(r"([0-9a-fA-F]{64})\\s+\\*?(.+?)\\s*", line)
            if match and Path(match.group(2)).name == filename:
                return match.group(1).lower()
        raise ValueError(f"No checksum for {filename}")
    path = Path(archive)
    if path.name != ASSET:
        raise ValueError(f"Expected {ASSET}")
    expected = checksum_for(Path(checksums).read_text(encoding="utf-8"), ASSET)
    actual = hashlib.sha256(path.read_bytes()).hexdigest()
    if actual != expected:
        raise ValueError("Release archive SHA-256 mismatch")
    with zipfile.ZipFile(path) as bundle:
        matches = [member for member in bundle.infolist()
                   if Path(member.filename).name == "f1db-seasons.json" and not member.is_dir()]
        if len(matches) != 1:
            raise ValueError("Expected exactly one f1db-seasons.json")
        seasons = json.loads(bundle.read(matches[0]))
    if not isinstance(seasons, list) or not seasons:
        raise ValueError("Seasons must be a nonempty JSON array")
    years = []
    for item in seasons:
        if not isinstance(item, dict) or type(item.get("year")) is not int:
            raise ValueError("Invalid season year")
        year = item["year"]
        if year < 1950 or year > 2200:
            raise ValueError("Out-of-range season year")
        years.append(year)
    if len(years) != len(set(years)):
        raise ValueError("Duplicate season years")
    return sorted(years), actual


def import_seasons(archive, checksums, database_url):
    years, digest = verified_seasons(archive, checksums)
    # All dynamic SQL values are strictly validated integers or SHA-256 hex.
    values = ", ".join(f"({year})" for year in years)
    query = f"""
BEGIN;
SELECT pg_advisory_xact_lock(17021951);
INSERT INTO data_sources(slug,homepage_url,attribution)
VALUES ('f1db','https://github.com/f1db/f1db','F1DB, CC BY 4.0')
ON CONFLICT (slug) DO NOTHING;
DO $guard$
BEGIN
 IF EXISTS (
  SELECT 1 FROM source_releases r JOIN data_sources s ON s.id=r.source_id
  WHERE s.slug='f1db' AND r.release_tag='v2026.17.0'
    AND r.artifact_name='f1db-json-splitted.zip' AND r.sha256 <> '${digest}'
 ) THEN
  RAISE EXCEPTION 'F1DB release checksum changed';
 END IF;
END $guard$;
INSERT INTO source_releases(source_id,release_tag,artifact_name,sha256)
SELECT id,'{RELEASE}','{ASSET}','{digest}' FROM data_sources WHERE slug='f1db'
ON CONFLICT (source_id,release_tag,artifact_name)
DO UPDATE SET sha256=EXCLUDED.sha256
WHERE source_releases.sha256=EXCLUDED.sha256;
INSERT INTO historical_seasons(year) VALUES {values}
ON CONFLICT(year) DO NOTHING;
COMMIT;
"""
    result = subprocess.run(["psql", database_url, "-X", "-v", "ON_ERROR_STOP=1"],
                            input=query, text=True, check=False)
    if result.returncode:
        raise RuntimeError(f"psql exited with {result.returncode}")
    return len(years)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True)
    parser.add_argument("--checksums", required=True)
    args = parser.parse_args()
    if not os.environ.get("DATABASE_URL"):
        parser.error("DATABASE_URL environment variable is required")
    count = import_seasons(args.archive, args.checksums, os.environ["DATABASE_URL"])
    print(f"Imported/verified {count} season years from F1DB {RELEASE}")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, zipfile.BadZipFile, json.JSONDecodeError) as exc:
        print(f"Import failed: {exc}", file=sys.stderr)
        sys.exit(1)
