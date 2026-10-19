#!/usr/bin/env python3
"""Verified F1DB race results import (first read-model slice)."""
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
from import_seasons import verified_seasons, ASSET, RELEASE


def read_results(archive, checksums):
    _, digest = verified_seasons(archive, checksums)
    with zipfile.ZipFile(archive) as bundle:
        matches = [m for m in bundle.infolist()
                   if Path(m.filename).name == "f1db-races-race-results.json" and not m.is_dir()]
        if len(matches) != 1:
            raise ValueError("Expected exactly one race-results collection")
        data = json.loads(bundle.read(matches[0]))
    if not isinstance(data, list) or not data:
        raise ValueError("Expected nonempty results array")
    seen, rows = set(), []
    for item in data:
        if not isinstance(item, dict):
            raise ValueError("Invalid result record")
        race_id = item.get("raceId")
        order = item.get("positionDisplayOrder")
        driver = item.get("driverId")
        constructor = item.get("constructorId")
        position = item.get("positionNumber")
        number = item.get("driverNumber")
        laps = item.get("laps")
        points = item.get("points")
        status = item.get("positionText")
        if type(race_id) is not int or race_id < 1 or type(order) is not int or order < 1:
            raise ValueError("Invalid race ID or display order")
        if (race_id, order) in seen:
            raise ValueError("Duplicate race display order")
        seen.add((race_id, order))
        if any(not isinstance(v, str) or not v.strip() for v in (driver, constructor, status)):
            raise ValueError("Invalid driver, constructor or status")
        if not isinstance(number, str) or not number.isascii() or not number.isdigit():
            raise ValueError("Invalid driver number")
        if position is not None and (type(position) is not int or position < 1):
            raise ValueError("Invalid finish position")
        if laps is not None and (type(laps) is not int or laps < 0):
            raise ValueError("Invalid lap count")
        if points is not None and (type(points) not in (int, float) or points < 0):
            raise ValueError("Invalid points")
        shared = item.get("sharedCar")
        if type(shared) is not bool:
            raise ValueError("Invalid sharedCar flag")
        rows.append((str(race_id), order, driver, constructor, position, status, number,
                     laps, points, item.get("reasonRetired"), shared))
    return rows, digest


def build_sql(rows, digest):
    if len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
        raise ValueError("Invalid release digest")
    stream = io.StringIO(newline="")
    csv.writer(stream, lineterminator="\n").writerows(rows)
    return f"""\\set ON_ERROR_STOP on
BEGIN;
SELECT pg_advisory_xact_lock(17021951);
CREATE TEMP TABLE result_stage (
 race_external_id TEXT, position_display_order INTEGER, driver_external_id TEXT,
 constructor_external_id TEXT, position_number INTEGER, position_text TEXT,
 driver_number TEXT, laps INTEGER, points NUMERIC(12,2),
 reason_retired TEXT, shared_car BOOLEAN
) ON COMMIT DROP;
COPY result_stage FROM STDIN WITH (FORMAT csv);
{stream.getvalue()}\\.
DO $guard$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM source_releases r JOIN data_sources s ON s.id=r.source_id
  WHERE s.slug='f1db' AND r.release_tag='{RELEASE}' AND r.artifact_name='{ASSET}'
    AND r.sha256='{digest}') THEN
  RAISE EXCEPTION 'Matching F1DB release not imported'; END IF;
 IF EXISTS (
  SELECT 1 FROM result_stage st
  JOIN data_sources s ON s.slug='f1db'
  LEFT JOIN external_identities er ON er.source_id=s.id AND er.entity_kind='race' AND er.external_id=st.race_external_id
  LEFT JOIN historical_races r ON r.external_identity_id=er.id
  LEFT JOIN external_identities ed ON ed.source_id=s.id AND ed.entity_kind='driver' AND ed.external_id=st.driver_external_id
  LEFT JOIN historical_drivers d ON d.external_identity_id=ed.id
  LEFT JOIN external_identities ec ON ec.source_id=s.id AND ec.entity_kind='constructor' AND ec.external_id=st.constructor_external_id
  LEFT JOIN historical_constructors c ON c.external_identity_id=ec.id
  WHERE r.id IS NULL OR d.id IS NULL OR c.id IS NULL
 ) THEN RAISE EXCEPTION 'Race result references missing records'; END IF;
END $guard$;
INSERT INTO historical_race_results(
 race_id, driver_id, constructor_id, position_display_order, position_number,
 position_text, driver_number, laps, points, reason_retired, shared_car
)
SELECT r.id,d.id,c.id,st.position_display_order,st.position_number,
 st.position_text,st.driver_number,st.laps,st.points,st.reason_retired,st.shared_car
FROM result_stage st
JOIN data_sources s ON s.slug='f1db'
JOIN external_identities er ON er.source_id=s.id AND er.entity_kind='race' AND er.external_id=st.race_external_id
JOIN historical_races r ON r.external_identity_id=er.id
JOIN external_identities ed ON ed.source_id=s.id AND ed.entity_kind='driver' AND ed.external_id=st.driver_external_id
JOIN historical_drivers d ON d.external_identity_id=ed.id
JOIN external_identities ec ON ec.source_id=s.id AND ec.entity_kind='constructor' AND ec.external_id=st.constructor_external_id
JOIN historical_constructors c ON c.external_identity_id=ec.id
ON CONFLICT (race_id, position_display_order) DO NOTHING;
COMMIT;
"""


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--archive", required=True)
    p.add_argument("--checksums", required=True)
    args = p.parse_args()
    url = os.getenv("DATABASE_URL")
    if not url:
        p.error("DATABASE_URL required")
    rows, digest = read_results(args.archive, args.checksums)
    proc = subprocess.run(["psql", url, "-X", "-v", "ON_ERROR_STOP=1"], input=build_sql(rows, digest), text=True)
    if proc.returncode:
        raise RuntimeError(f"psql exited {proc.returncode}")
    print(f"Imported/verified {len(rows)} race result rows")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError, zipfile.BadZipFile) as e:
        print(f"Import failed: {e}", file=sys.stderr)
        sys.exit(1)
