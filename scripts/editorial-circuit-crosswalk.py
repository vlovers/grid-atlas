#!/usr/bin/env python3
"""Read-only, checksum-pinned circuit/year/race/layout crosswalk for editorial review."""
import argparse
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages/data-importer"))
from import_seasons import verified_seasons

SUBJECTS = {
    "silverstone": [1950],
    "monaco": [1950, 1984, 2016],
    "spa-francorchamps": [1950, 1970, 1983],
    "monza": [1950],
    "suzuka": [1987, 1988],
}


def load_collection(bundle, filename):
    matches = [item for item in bundle.infolist()
               if not item.is_dir() and Path(item.filename).name == filename]
    if len(matches) != 1:
        raise ValueError(f"Expected exactly one {filename}; got {len(matches)}")
    value = json.loads(bundle.read(matches[0]))
    if not isinstance(value, list):
        raise ValueError(f"Not an array: {filename}")
    return value


def crosswalk(circuits, layouts, races, subjects=SUBJECTS):
    circuit_by_id = {c["id"]: c for c in circuits}
    if len(circuit_by_id) != len(circuits):
        raise ValueError("Duplicate circuit ID")
    layout_by_id = {item["id"]: item for item in layouts}
    if len(layout_by_id) != len(layouts):
        raise ValueError("Duplicate circuit layout ID")
    output = []
    for circuit_id, years in subjects.items():
        circuit = circuit_by_id.get(circuit_id)
        if circuit is None:
            raise ValueError(f"Unresolved circuit external ID: {circuit_id}")
        matches = []
        for year in years:
            events = [race for race in races if race.get("circuitId") == circuit_id and race.get("year") == year]
            for event in events:
                layout_id = event.get("circuitLayoutId")
                if layout_id is not None:
                    layout = layout_by_id.get(layout_id)
                    if layout is None or layout.get("circuitId") != circuit_id:
                        raise ValueError(f"Race {event['id']} refers to an invalid layout")
                matches.append({
                    "year": year,
                    "race_external_id": str(event["id"]),
                    "race_date": event.get("date"),
                    "race_name": event.get("officialName"),
                    "layout_external_id": layout_id,
                })
            if not events:
                matches.append({"year": year, "status": "no_matching_race_in_pinned_archive"})
        output.append({"circuit_external_id": circuit_id,
                       "source_name": circuit.get("name") or circuit.get("officialName"),
                       "events": matches})
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--checksums", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    _, digest = verified_seasons(args.archive, args.checksums)
    with zipfile.ZipFile(args.archive) as bundle:
        rows = crosswalk(
            load_collection(bundle, "f1db-circuits.json"),
            load_collection(bundle, "f1db-circuits-layouts.json"),
            load_collection(bundle, "f1db-races.json"),
        )
    report = {"source": "f1db", "release": "v2026.17.0", "archive_sha256": digest,
              "status": "source_row_observations_not_independent_historical_approval",
              "circuits": rows}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(rows)} circuit crosswalks to {args.output}")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, zipfile.BadZipFile, json.JSONDecodeError) as exc:
        sys.exit(f"Circuit crosswalk failed: {exc}")
