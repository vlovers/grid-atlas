#!/usr/bin/env python3
"""Backfill sourced F1DB circuit layouts and event-specific technical facts.

F1DB measurements are archival source values, not independent FIA review.
Track shape, sectors, DRS, elevation, tyre scores and schedule are NOT inferred.
"""
import argparse
import csv
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import zipfile
from decimal import Decimal, InvalidOperation
from import_seasons import ASSET, RELEASE, verified_seasons

def decimal_field(row, key):
    value = row.get(key)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"Invalid {key}")
    try:
        n = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise ValueError(f"Invalid {key}") from None
    if not n.is_finite() or n < 0 or n.as_tuple().exponent < -3:
        raise ValueError(f"Invalid {key}")
    return str(n)

def count_field(row, key):
    value = row.get(key)
    if type(value) is not int or value < 0:
        raise ValueError(f"Invalid {key}")
    return value

def collection(bundle, name):
    matches = [n for n in bundle.namelist() if Path(n).name == name]
    if len(matches) != 1:
        raise ValueError(f"Expected exactly one {name}")
    rows = json.loads(bundle.read(matches[0]))
    if not isinstance(rows, list):
        raise ValueError(f"Invalid {name} collection")
    return rows

def read_circuit_facts(archive, checksums):
    _, digest = verified_seasons(archive, checksums)
    layouts, races = [], []
    with zipfile.ZipFile(archive) as bundle:
        ids = set()
        for row in collection(bundle, "f1db-circuits-layouts.json"):
            external_id, circuit = row.get("id"), row.get("circuitId")
            if not isinstance(external_id, str) or not external_id.strip() or external_id in ids:
                raise ValueError("Invalid or duplicate circuit layout")
            if not isinstance(circuit, str) or not circuit.strip():
                raise ValueError("Invalid layout circuit")
            if type(row.get("effective")) is not bool:
                raise ValueError("Invalid effective layout flag")
            ids.add(external_id)
            canonical = json.dumps(row, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
            layouts.append((external_id, circuit, str(row["effective"]).lower(),
                decimal_field(row, "length"), count_field(row, "turns"),
                hashlib.sha256(canonical.encode()).hexdigest(),
                f"f1db-circuits-layouts.json#id={external_id}"))
        race_ids = set()
        for row in collection(bundle, "f1db-races.json"):
            rid = row.get("id")
            if type(rid) is not int or rid < 1 or rid in race_ids:
                raise ValueError("Invalid or duplicate race")
            race_ids.add(rid)
            layout_id = row.get("circuitLayoutId")
            if layout_id is not None and (not isinstance(layout_id, str) or layout_id not in ids):
                raise ValueError(f"Unresolved layout for race {rid}")
            direction = row.get("direction")
            if direction is not None and (not isinstance(direction, str) or len(direction) > 50):
                raise ValueError("Invalid race direction")
            canonical = json.dumps(row, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
            races.append((rid, layout_id, decimal_field(row, "courseLength"),
                count_field(row, "turns"), count_field(row, "laps"), decimal_field(row, "distance"),
                count_field(row, "scheduledLaps"), decimal_field(row, "scheduledDistance"),
                direction, hashlib.sha256(canonical.encode()).hexdigest(),
                f"f1db-races.json#id={rid}"))
    return layouts, races, digest

def build_sql(layouts, races, digest):
    if not re.fullmatch("[a-f0-9]{64}", digest):
        raise ValueError("Invalid checksum")
    layouts_csv, races_csv = io.StringIO(newline=""), io.StringIO(newline="")
    csv.writer(layouts_csv, lineterminator="\n").writerows(layouts)
    csv.writer(races_csv, lineterminator="\n").writerows(races)
    return f"""\\set ON_ERROR_STOP on
BEGIN;
SELECT pg_advisory_xact_lock(17021951);
CREATE TEMP TABLE layout_stage(external_id TEXT, circuit_external_id TEXT, effective BOOLEAN, length_km NUMERIC(10,3), turns INTEGER, content_hash TEXT, locator TEXT) ON COMMIT DROP;
COPY layout_stage FROM STDIN WITH (FORMAT csv);
{layouts_csv.getvalue()}\\.
CREATE TEMP TABLE event_stage(external_race_id INTEGER, layout_external_id TEXT, course_length_km NUMERIC(10,3), turns INTEGER, laps INTEGER, distance_km NUMERIC(12,3), scheduled_laps INTEGER, scheduled_distance_km NUMERIC(12,3), direction TEXT, content_hash TEXT, locator TEXT) ON COMMIT DROP;
COPY event_stage FROM STDIN WITH (FORMAT csv);
{races_csv.getvalue()}\\.
DO $guard$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM source_releases r JOIN data_sources s ON s.id=r.source_id
   WHERE s.slug='f1db' AND r.release_tag='{RELEASE}' AND r.artifact_name='{ASSET}' AND r.sha256='{digest}')
 THEN RAISE EXCEPTION 'Matching pinned F1DB release missing'; END IF;
 IF EXISTS (SELECT 1 FROM layout_stage st
   LEFT JOIN external_identities e ON e.external_id=st.circuit_external_id AND e.entity_kind='circuit'
     AND e.source_id=(SELECT id FROM data_sources WHERE slug='f1db')
   LEFT JOIN historical_circuits c ON c.external_identity_id=e.id WHERE c.id IS NULL)
 THEN RAISE EXCEPTION 'Missing circuit identity'; END IF;
 IF EXISTS (SELECT 1 FROM event_stage st
   LEFT JOIN external_identities e ON e.external_id=st.external_race_id::text AND e.entity_kind='race'
     AND e.source_id=(SELECT id FROM data_sources WHERE slug='f1db')
   LEFT JOIN historical_races r ON r.external_identity_id=e.id WHERE r.id IS NULL)
 THEN RAISE EXCEPTION 'Missing race identity'; END IF;
END $guard$;
INSERT INTO historical_circuit_layouts(circuit_id,external_layout_id,effective,length_km,turns,release_id,source_locator,content_hash)
SELECT c.id,st.external_id,st.effective,st.length_km,st.turns,sr.id,st.locator,st.content_hash
FROM layout_stage st JOIN data_sources s ON s.slug='f1db'
JOIN source_releases sr ON sr.source_id=s.id AND sr.release_tag='{RELEASE}' AND sr.artifact_name='{ASSET}'
JOIN external_identities e ON e.source_id=s.id AND e.entity_kind='circuit' AND e.external_id=st.circuit_external_id
JOIN historical_circuits c ON c.external_identity_id=e.id
ON CONFLICT(external_layout_id) DO UPDATE SET circuit_id=EXCLUDED.circuit_id,effective=EXCLUDED.effective,
 length_km=EXCLUDED.length_km,turns=EXCLUDED.turns,release_id=EXCLUDED.release_id,
 source_locator=EXCLUDED.source_locator,content_hash=EXCLUDED.content_hash;
INSERT INTO historical_race_circuit_facts(race_id,layout_id,course_length_km,turns,laps,distance_km,scheduled_laps,scheduled_distance_km,direction,release_id,source_locator,content_hash)
SELECT r.id,l.id,st.course_length_km,st.turns,st.laps,st.distance_km,
 st.scheduled_laps,st.scheduled_distance_km,st.direction,sr.id,st.locator,st.content_hash
FROM event_stage st JOIN data_sources s ON s.slug='f1db'
JOIN source_releases sr ON sr.source_id=s.id AND sr.release_tag='{RELEASE}' AND sr.artifact_name='{ASSET}'
JOIN external_identities e ON e.source_id=s.id AND e.entity_kind='race' AND e.external_id=st.external_race_id::text
JOIN historical_races r ON r.external_identity_id=e.id
LEFT JOIN historical_circuit_layouts l ON l.external_layout_id=st.layout_external_id
ON CONFLICT(race_id) DO UPDATE SET layout_id=EXCLUDED.layout_id,course_length_km=EXCLUDED.course_length_km,
 turns=EXCLUDED.turns,laps=EXCLUDED.laps,distance_km=EXCLUDED.distance_km,
 scheduled_laps=EXCLUDED.scheduled_laps,scheduled_distance_km=EXCLUDED.scheduled_distance_km,
 direction=EXCLUDED.direction,release_id=EXCLUDED.release_id,
 source_locator=EXCLUDED.source_locator,content_hash=EXCLUDED.content_hash;
COMMIT;
"""

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--archive", required=True)
    p.add_argument("--checksums", required=True)
    args = p.parse_args()
    layouts, races, digest = read_circuit_facts(args.archive, args.checksums)
    subprocess.run(["psql", os.environ["DATABASE_URL"], "-X", "-v", "ON_ERROR_STOP=1"],
                   input=build_sql(layouts,races,digest), text=True, check=True)
    print(f"Verified {len(layouts)} layouts and {len(races)} race-specific circuit fact records")

if __name__ == "__main__":
    main()
