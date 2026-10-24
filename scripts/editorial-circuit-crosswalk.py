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


# Independently observed in CI artifact 12575034447 from pinned F1DB v2026.17.0.
EXPECTED_EVENTS = {
    ("silverstone", 1950): ("1", "1950-05-13", "silverstone-1"),
    ("monaco", 1950): ("2", "1950-05-21", "monaco-1"),
    ("monaco", 1984): ("394", "1984-06-03", "monaco-4"),
    ("monaco", 2016): ("941", "2016-05-29", "monaco-6"),
    ("spa-francorchamps", 1950): ("5", "1950-06-18", "spa-francorchamps-1"),
    ("spa-francorchamps", 1970): ("188", "1970-06-07", "spa-francorchamps-1"),
    ("spa-francorchamps", 1983): ("379", "1983-05-22", "spa-francorchamps-2"),
    ("monza", 1950): ("7", "1950-09-03", "monza-1"),
    ("suzuka", 1987): ("451", "1987-11-01", "suzuka-1"),
    ("suzuka", 1988): ("467", "1988-10-30", "suzuka-1"),
}


def verify_expected_events(crosswalk):
    observed = {}
    for circuit in crosswalk:
        for event in circuit["events"]:
            if "race_external_id" in event:
                key = (circuit["circuit_external_id"], event["year"])
                if key in observed:
                    raise ValueError(f"Ambiguous race records for {key}: expected one")
                observed[key] = (
                    event["race_external_id"],
                    event["race_date"],
                    event["layout_external_id"],
                )
    for key, expected in EXPECTED_EVENTS.items():
        if observed.get(key) != expected:
            raise ValueError(f"Pinned F1DB event/layout changed for {key}: {observed.get(key)!r} != {expected!r}")


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
    seen_race_ids = set()
    for race in races:
        race_id = race["id"]
        if race_id in seen_race_ids:
            raise ValueError(f"Duplicate race ID: {race_id}")
        seen_race_ids.add(race_id)
    output = []
    for circuit_id, years in subjects.items():
        circuit = circuit_by_id.get(circuit_id)
        if circuit is None:
            raise ValueError(f"Unresolved circuit external ID: {circuit_id}")
        matches = []
        for year in years:
            events = [race for race in races if race.get("circuitId") == circuit_id and race.get("year") == year]
            for event in sorted(events, key=lambda race: (race.get("date") or "", str(race["id"]))):
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
                    "layout_status": "mapped" if layout_id is not None else "missing_in_source",
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
    registry_path = ROOT / "docs/media/pilot-identities.json"
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    pinned = registry["source"]
    if (pinned.get("slug"), pinned.get("release"), pinned.get("artifact"), pinned.get("sha256")) != (
        "f1db", "v2026.17.0", "f1db-json-splitted.zip", digest
    ):
        raise ValueError("Archive checksum does not match the repository-pinned F1DB release")
    with zipfile.ZipFile(args.archive) as bundle:
        rows = crosswalk(
            load_collection(bundle, "f1db-circuits.json"),
            load_collection(bundle, "f1db-circuits-layouts.json"),
            load_collection(bundle, "f1db-races.json"),
        )
    verify_expected_events(rows)
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
