#!/usr/bin/env python3
"""Backfill allowlisted identity fields from the checksum-verified pinned release.

No title totals, timeless track measurements, contracts or historical nationality
changes are inferred. Existing curated names and observations remain untouched.
"""
import argparse
import csv
import datetime
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import zipfile

from import_seasons import ASSET, RELEASE, verified_seasons

FIELDS = {
    "driver": {"fullName": "full_name", "abbreviation": "abbreviation",
               "permanentNumber": "permanent_number", "dateOfBirth": "date_of_birth",
               "dateOfDeath": "date_of_death", "placeOfBirth": "place_of_birth"},
    "constructor": {"fullName": "full_name"},
    "circuit": {"fullName": "full_name", "placeName": "place_name", "type": "circuit_type"},
}


def read_details(archive, checksums):
    _, digest = verified_seasons(archive, checksums)
    def collection(bundle, filename):
        names = [n for n in bundle.namelist() if Path(n).name == filename]
        if len(names) != 1:
            raise ValueError(f"Expected exactly one {filename}")
        rows = json.loads(bundle.read(names[0]))
        if not isinstance(rows, list) or not rows:
            raise ValueError(f"Invalid collection: {filename}")
        return rows
    result = []
    with zipfile.ZipFile(archive) as bundle:
        countries = {}
        for row in collection(bundle, "f1db-countries.json"):
            if row["id"] in countries:
                raise ValueError(f"Duplicate country: {row['id']}")
            countries[row["id"]] = row["name"]
        for kind, mapping in FIELDS.items():
            filename = f"f1db-{kind}s.json"
            seen = set()
            for row in collection(bundle, filename):
                key = row.get("id")
                if not isinstance(key, str) or not key.strip() or key in seen:
                    raise ValueError(f"Invalid or duplicate {kind} ID: {key}")
                seen.add(key)
                fields = {}
                for source, target in mapping.items():
                    value = row.get(source)
                    if value is None:
                        continue
                    if target == "permanent_number":
                        if not isinstance(value, str) or not value.isascii() or not value.isdigit() or not 0 <= int(value) <= 99:
                            raise ValueError(f"Invalid {target}: {key}")
                    elif not isinstance(value, str) or not value.strip():
                        raise ValueError(f"Invalid {target}: {key}")
                    if target in ("date_of_birth", "date_of_death"):
                        if datetime.date.fromisoformat(value).isoformat() != value:
                            raise ValueError(f"Invalid date: {key}")
                    fields[target] = value
                for source, target in (("nationalityCountryId", "nationality"),
                                       ("secondNationalityCountryId", "second_nationality"),
                                       ("countryId", "country")):
                    country = row.get(source)
                    if country is not None:
                        if country not in countries:
                            raise ValueError(f"Unknown country {country}: {key}")
                        fields[target] = countries[country]
                canonical = json.dumps(row, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
                content_hash = hashlib.sha256(canonical.encode()).hexdigest()
                result.append((kind, key, content_hash, f"{filename}#id={key}",
                               json.dumps(fields, ensure_ascii=False, sort_keys=True)))
    return result, digest


def build_sql(rows, digest):
    if len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
        raise ValueError("Invalid checksum")
    stage = io.StringIO(newline="")
    csv.writer(stage, lineterminator="\n").writerows(rows)
    return f"""\\set ON_ERROR_STOP on
BEGIN;
SELECT pg_advisory_xact_lock(17021951);
CREATE TEMP TABLE identity_stage(kind TEXT, external_id TEXT, content_hash TEXT, locator TEXT, fields JSONB) ON COMMIT DROP;
COPY identity_stage FROM STDIN WITH (FORMAT csv);
{stage.getvalue()}\\.
DO $guard$ BEGIN
 IF EXISTS (SELECT 1 FROM identity_stage st WHERE NOT EXISTS (
   SELECT 1 FROM external_identities e
   JOIN data_sources s ON s.id=e.source_id AND s.slug='f1db'
   JOIN source_releases r ON r.source_id=s.id AND r.release_tag='{RELEASE}'
     AND r.artifact_name='{ASSET}' AND r.sha256='{digest}'
   JOIN source_observations o ON o.release_id=r.id AND o.external_identity_id=e.id
     AND o.content_hash=st.content_hash
   WHERE e.entity_kind=st.kind AND e.external_id=st.external_id
 )) THEN RAISE EXCEPTION 'Missing or mismatched entity observation; import identities first'; END IF;
END $guard$;
INSERT INTO historical_identity_details(external_identity_id,release_id,source_locator,fields)
SELECT e.id,r.id,st.locator,st.fields FROM identity_stage st
JOIN data_sources s ON s.slug='f1db'
JOIN external_identities e ON e.source_id=s.id AND e.entity_kind=st.kind AND e.external_id=st.external_id
JOIN source_releases r ON r.source_id=s.id AND r.release_tag='{RELEASE}' AND r.artifact_name='{ASSET}'
ON CONFLICT(external_identity_id) DO UPDATE SET release_id=EXCLUDED.release_id,
 source_locator=EXCLUDED.source_locator, fields=EXCLUDED.fields;
COMMIT;
"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", required=True)
    parser.add_argument("--checksums", required=True)
    args = parser.parse_args()
    rows, digest = read_details(args.archive, args.checksums)
    subprocess.run(["psql", os.environ["DATABASE_URL"], "-X", "-v", "ON_ERROR_STOP=1"],
                   input=build_sql(rows, digest), text=True, check=True)
    print(f"Imported/verified {len(rows)} encyclopedia identity details")


if __name__ == "__main__":
    main()
