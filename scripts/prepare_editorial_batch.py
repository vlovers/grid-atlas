#!/usr/bin/env python3
"""Create unpublished driver research packets from checksum-verified F1DB identities.

This intentionally does not generate unsupported narrative biographies.
"""
import argparse
import json
import zipfile
from collections import defaultdict
from decimal import Decimal
from pathlib import Path

from scripts.validate_editorial_batch import validate, validate_source_ids, load_verified_ids


def extract_result_observations(archive, target_ids):
    """Raw race-result observations only; no championship scoring inference."""
    with zipfile.ZipFile(archive) as bundle:
        matches = [n for n in bundle.namelist() if Path(n).name == "f1db-races-race-results.json"]
        if len(matches) != 1:
            raise ValueError("Expected exactly one race-results JSON collection")
        rows = json.loads(bundle.read(matches[0]))
    if not isinstance(rows, list):
        raise ValueError("Invalid race-results collection")
    by_driver = defaultdict(list)
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("Invalid race-result row")
        driver = row.get("driverId")
        if driver not in target_ids:
            continue
        race_id, points, position = row.get("raceId"), row.get("points"), row.get("positionNumber")
        if type(race_id) is not int or race_id < 1:
            raise ValueError("Invalid race ID")
        if points is not None and (type(points) not in (int, float) or not 0 <= points < 1000):
            raise ValueError("Invalid result points")
        if position is not None and (type(position) is not int or position < 1):
            raise ValueError("Invalid finishing position")
        by_driver[driver].append({"race_id": race_id, "position_number": position, "points": points})
    return by_driver


def build_statistics(observations):
    return {
        "race_result_rows": len(observations),
        "classified_first_rows": sum(x["position_number"] == 1 for x in observations),
        "raw_result_points_sum": str(sum((Decimal(str(x["points"])) for x in observations if x["points"] is not None), Decimal(0))),
        "points_semantics": "sum of recorded race-result points; NOT championship points or adjusted standings",
        "source_records": [{"race_id": x["race_id"], "position_number": x["position_number"], "points": x["points"]} for x in sorted(observations, key=lambda x: x["race_id"])],
    }


def build_packets(manifest, driver_rows, results_by_driver=None):
    validate(manifest)
    by_id = {driver_id: name for driver_id, name, _hash in driver_rows}
    validate_source_ids(manifest, by_id)
    results_by_driver = results_by_driver or {}
    return {
        "batch_id": manifest["batch_id"],
        "source": manifest["source"],
        "publication_status": "unpublished",
        "profiles": [
            {
                "driver_id": driver_id,
                "source_display_name": by_id[driver_id],
                "source": manifest["source"],
                "statistical_observations": build_statistics(results_by_driver.get(driver_id, [])),
                "narrative_status": "needs_review",
                "drafts": {locale: None for locale in manifest["locale_targets"]},
                "claims": [],
                "media": [],
                "editorial_tasks": [
                    "Collect precise primary or independent historical sources",
                    "Write original biography and register each factual claim",
                    "Reconcile statistics with defined metrics before citing totals",
                    "Review each locale and media rights before publication",
                ],
            }
            for driver_id in manifest["drivers"]
        ],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--checksums", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    # Reuse importer checksum verification and its exact canonical identity parser.
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "packages" / "data-importer"))
    from import_drivers import read_drivers
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    driver_rows, _digest = read_drivers(args.archive, args.checksums)
    observations = extract_result_observations(args.archive, set(manifest["drivers"]))
    packets = build_packets(manifest, driver_rows, observations)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(packets, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(packets['profiles'])} unpublished driver research packets: {args.output}")


if __name__ == "__main__":
    main()
