#!/usr/bin/env python3
"""Import pinned F1DB season standings verbatim, without race-points inference.

Driver/constructor standings are source-reported F1DB records, not independently
verified FIA classifications. Constructor/engine entries remain distinct.
"""
import argparse
import csv
from decimal import Decimal, InvalidOperation
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import zipfile
from import_seasons import ASSET, RELEASE, verified_seasons

FILES = {"driver": "f1db-seasons-driver-standings.json",
         "constructor": "f1db-seasons-constructor-standings.json"}


def read_standings(archive, checksums):
    years, digest = verified_seasons(archive, checksums)
    known_years = set(years)
    output = []
    with zipfile.ZipFile(archive) as bundle:
        for kind, filename in FILES.items():
            matches = [n for n in bundle.namelist() if Path(n).name == filename]
            if len(matches) != 1:
                raise ValueError(f"Expected one {filename}")
            rows = json.loads(bundle.read(matches[0]))
            if not isinstance(rows, list):
                raise ValueError(f"Expected standings array: {filename}")
            seen = set()
            for row in rows:
                if not isinstance(row, dict):
                    raise ValueError("Invalid standings row")
                year = row.get("year")
                order = row.get("positionDisplayOrder")
                external_id = row.get("driverId" if kind == "driver" else "constructorId")
                position = row.get("positionNumber")
                position_text = row.get("positionText")
                champion = row.get("championshipWon")
                engine = row.get("engineManufacturerId") if kind == "constructor" else None
                if type(year) is not int or year not in known_years:
                    raise ValueError("Unknown standings year")
                if type(order) is not int or order < 1 or (kind, year, order) in seen:
                    raise ValueError("Duplicate or invalid standings order")
                seen.add((kind, year, order))
                if not isinstance(external_id, str) or not external_id.strip():
                    raise ValueError("Missing standings identity")
                if position is not None and (type(position) is not int or position < 1):
                    raise ValueError("Invalid championship position")
                if not isinstance(position_text, str) or not re.fullmatch(r"(?:[1-9][0-9]*|DSQ|EX)", position_text):
                    raise ValueError("Invalid championship position text")
                if type(champion) is not bool:
                    raise ValueError("Invalid championship flag")
                if kind == "constructor" and (not isinstance(engine, str) or not engine.strip()):
                    raise ValueError("Missing constructor engine identity")
                try:
                    points = Decimal(str(row["points"]))
                except (KeyError, InvalidOperation, ValueError):
                    raise ValueError("Invalid championship points") from None
                if not points.is_finite() or points < 0 or points.as_tuple().exponent < -2:
                    raise ValueError("Invalid championship points precision")
                # The latest season in a mid-season pinned archive is provisional.
                if year == max(known_years) and champion:
                    raise ValueError("Pinned active season cannot claim a final championship")
                canonical = json.dumps(row, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
                content_hash = hashlib.sha256(canonical.encode()).hexdigest()
                output.append((kind, year, order, external_id, position, position_text,
                               engine, str(points), str(champion).lower(),
                               f"{filename}#year={year}&positionDisplayOrder={order}", content_hash))
    return output, digest


def build_sql(rows, digest):
    if not re.fullmatch(r"[0-9a-f]{64}", digest):
        raise ValueError("Invalid release checksum")
    stage = io.StringIO(newline="")
    csv.writer(stage, lineterminator="\n").writerows(rows)
    return f"""\\set ON_ERROR_STOP on
BEGIN;
SELECT pg_advisory_xact_lock(17021951);
CREATE TEMP TABLE standing_stage (
  kind TEXT, year INTEGER, display_order INTEGER, external_id TEXT,
  position_number INTEGER, position_text TEXT, engine_external_id TEXT,
  points NUMERIC(12,2), champion BOOLEAN, locator TEXT, content_hash TEXT
) ON COMMIT DROP;
COPY standing_stage FROM STDIN WITH (FORMAT csv);
{stage.getvalue()}\\.
DO $guard$ BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM source_releases r JOIN data_sources s ON s.id=r.source_id
   WHERE s.slug='f1db' AND r.release_tag='{RELEASE}'
     AND r.artifact_name='{ASSET}' AND r.sha256='{digest}'
 ) THEN RAISE EXCEPTION 'Missing pinned F1DB release'; END IF;
 IF EXISTS (
  SELECT 1 FROM standing_stage st
  LEFT JOIN external_identities e ON e.entity_kind=st.kind AND e.external_id=st.external_id
    AND e.source_id=(SELECT id FROM data_sources WHERE slug='f1db')
  LEFT JOIN historical_drivers d ON st.kind='driver' AND d.external_identity_id=e.id
  LEFT JOIN historical_constructors c ON st.kind='constructor' AND c.external_identity_id=e.id
  WHERE e.id IS NULL OR (st.kind='driver' AND d.id IS NULL)
    OR (st.kind='constructor' AND c.id IS NULL)
 ) THEN RAISE EXCEPTION 'Unresolved standing entity: import identities first'; END IF;
END $guard$;
INSERT INTO historical_championship_standings (
 season_year,entity_kind,position_display_order,position_number,position_text,
 driver_id,constructor_id,engine_manufacturer_external_id,points,championship_won,
 release_id,source_locator,content_hash)
SELECT st.year,st.kind,st.display_order,st.position_number,st.position_text,
 d.id,c.id,st.engine_external_id,st.points,st.champion,r.id,st.locator,st.content_hash
FROM standing_stage st
JOIN data_sources s ON s.slug='f1db'
JOIN source_releases r ON r.source_id=s.id AND r.release_tag='{RELEASE}'
  AND r.artifact_name='{ASSET}' AND r.sha256='{digest}'
JOIN external_identities e ON e.source_id=s.id AND e.entity_kind=st.kind AND e.external_id=st.external_id
LEFT JOIN historical_drivers d ON st.kind='driver' AND d.external_identity_id=e.id
LEFT JOIN historical_constructors c ON st.kind='constructor' AND c.external_identity_id=e.id
ON CONFLICT(season_year,entity_kind,position_display_order) DO UPDATE
 SET position_number=EXCLUDED.position_number,position_text=EXCLUDED.position_text,
 driver_id=EXCLUDED.driver_id,constructor_id=EXCLUDED.constructor_id,
 engine_manufacturer_external_id=EXCLUDED.engine_manufacturer_external_id,
 points=EXCLUDED.points,championship_won=EXCLUDED.championship_won,
 release_id=EXCLUDED.release_id,source_locator=EXCLUDED.source_locator,
 content_hash=EXCLUDED.content_hash;
COMMIT;
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True)
    parser.add_argument("--checksums", required=True)
    args = parser.parse_args()
    rows, digest = read_standings(args.archive, args.checksums)
    subprocess.run(["psql", os.environ["DATABASE_URL"], "-X", "-v", "ON_ERROR_STOP=1"],
                   input=build_sql(rows, digest), text=True, check=True)
    print(f"Imported {len(rows)} source-reported championship standings")


if __name__ == "__main__":
    main()
