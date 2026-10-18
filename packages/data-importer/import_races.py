#!/usr/bin/env python3
"""Import historical race identity, date, season, round and circuit from pinned F1DB."""
import argparse
import csv
from datetime import date
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import zipfile
from import_seasons import verified_seasons, ASSET, RELEASE


def read_races(archive, checksums):
    _, digest = verified_seasons(archive, checksums)
    with zipfile.ZipFile(archive) as bundle:
        matches = [m for m in bundle.infolist()
                   if Path(m.filename).name == "f1db-races.json" and not m.is_dir()]
        if len(matches) != 1:
            raise ValueError("Expected exactly one f1db-races.json")
        records = json.loads(bundle.read(matches[0]))
    if not isinstance(records, list) or not records:
        raise ValueError("Expected nonempty races array")
    seen_ids, seen_rounds, result = set(), set(), []
    for race in records:
        if not isinstance(race, dict):
            raise ValueError("Malformed race record")
        ident, year, rnd = race.get("id"), race.get("year"), race.get("round")
        circuit, name, day = race.get("circuitId"), race.get("officialName"), race.get("date")
        if type(ident) is not int or type(year) is not int or type(rnd) is not int:
            raise ValueError("Race ID, season and round must be integers")
        if ident < 1 or not 1950 <= year <= 2200 or rnd < 1:
            raise ValueError("Out-of-range race fields")
        if not isinstance(circuit, str) or not circuit.strip():
            raise ValueError("Invalid race circuit")
        if not isinstance(name, str) or not name.strip():
            raise ValueError("Invalid official race name")
        if not isinstance(day, str):
            raise ValueError("Race date must be an ISO date string")
        try:
            if date.fromisoformat(day).isoformat() != day:
                raise ValueError("Noncanonical date")
        except ValueError as exc:
            raise ValueError(f"Invalid race date: {day}") from exc
        if ident in seen_ids or (year, rnd) in seen_rounds:
            raise ValueError(f"Duplicate race ID or season round: {ident} {year}/{rnd}")
        seen_ids.add(ident)
        seen_rounds.add((year, rnd))
        fingerprint = hashlib.sha256(json.dumps(
            race, sort_keys=True, ensure_ascii=False, separators=(",", ":")
        ).encode("utf-8")).hexdigest()
        result.append((str(ident), year, rnd, circuit, day, name, fingerprint))
    return result, digest


def build_sql(records, digest):
    if len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
        raise ValueError("Invalid checksum digest")
    stream = io.StringIO(newline="")
    csv.writer(stream, lineterminator="\n").writerows(records)
    return f"""\\set ON_ERROR_STOP on
BEGIN;
SELECT pg_advisory_xact_lock(17021951);
CREATE TEMP TABLE race_stage(external_id TEXT, season_year INTEGER, round INTEGER, circuit_external_id TEXT, race_date DATE, official_name TEXT, content_hash TEXT) ON COMMIT DROP;
COPY race_stage FROM STDIN WITH (FORMAT csv);
{stream.getvalue()}\\.
DO $guard$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM source_releases r JOIN data_sources s ON s.id=r.source_id
   WHERE s.slug='f1db' AND r.release_tag='{RELEASE}'
   AND r.artifact_name='{ASSET}' AND r.sha256='{digest}'
 ) THEN RAISE EXCEPTION 'Pinned release not registered; import seasons first'; END IF;
 IF EXISTS (
   SELECT 1 FROM race_stage st LEFT JOIN historical_seasons se ON se.year=st.season_year
   WHERE se.year IS NULL
 ) THEN RAISE EXCEPTION 'Race season absent'; END IF;
 IF EXISTS (
   SELECT 1 FROM race_stage st
   LEFT JOIN external_identities e ON e.entity_kind='circuit' AND e.external_id=st.circuit_external_id
     AND e.source_id=(SELECT id FROM data_sources WHERE slug='f1db')
   LEFT JOIN historical_circuits c ON c.external_identity_id=e.id
   WHERE c.id IS NULL
 ) THEN RAISE EXCEPTION 'Referenced circuit absent'; END IF;
END $guard$;
INSERT INTO external_identities(source_id,entity_kind,external_id)
SELECT s.id,'race',r.external_id FROM race_stage r
CROSS JOIN (SELECT id FROM data_sources WHERE slug='f1db') s
ON CONFLICT(source_id,entity_kind,external_id) DO NOTHING;
INSERT INTO historical_races(external_identity_id,season_year,round,circuit_id,race_date,official_name)
SELECT re.id,r.season_year,r.round,c.id,r.race_date,r.official_name
FROM race_stage r JOIN data_sources src ON src.slug='f1db'
JOIN external_identities re ON re.source_id=src.id AND re.entity_kind='race' AND re.external_id=r.external_id
JOIN external_identities ce ON ce.source_id=src.id AND ce.entity_kind='circuit' AND ce.external_id=r.circuit_external_id
JOIN historical_circuits c ON c.external_identity_id=ce.id
ON CONFLICT(external_identity_id) DO NOTHING;
INSERT INTO source_observations(release_id,external_identity_id,content_hash)
SELECT sr.id,re.id,r.content_hash FROM race_stage r
JOIN data_sources src ON src.slug='f1db'
JOIN source_releases sr ON sr.source_id=src.id AND sr.release_tag='{RELEASE}' AND sr.artifact_name='{ASSET}'
JOIN external_identities re ON re.source_id=src.id AND re.entity_kind='race' AND re.external_id=r.external_id
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
        parser.error("DATABASE_URL required")
    records, digest = read_races(args.archive, args.checksums)
    process = subprocess.run(["psql", url, "-X", "-v", "ON_ERROR_STOP=1"],
                             input=build_sql(records, digest), text=True)
    if process.returncode:
        raise RuntimeError(f"psql exited with {process.returncode}")
    print(f"Imported/verified {len(records)} races")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, zipfile.BadZipFile, json.JSONDecodeError) as exc:
        print(f"Import failed: {exc}", file=sys.stderr)
        sys.exit(1)
