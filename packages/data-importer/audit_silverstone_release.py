#!/usr/bin/env python3
"""Fail closed when Silverstone constructor IDs drift in pinned F1DB data."""
import argparse
import json
from pathlib import Path
import sys
import zipfile

from import_seasons import verified_seasons

IDS = ("jordan", "midland", "spyker", "force-india", "racing-point", "aston-martin")


def check(archive, checksums):
    verified_seasons(archive, checksums)
    with zipfile.ZipFile(archive) as bundle:
        matches = [item for item in bundle.infolist()
                   if Path(item.filename).name == "f1db-constructors.json" and not item.is_dir()]
        if len(matches) != 1:
            raise ValueError("Expected one constructors JSON file")
        rows = json.loads(bundle.read(matches[0]))
    if not isinstance(rows, list):
        raise ValueError("Expected constructor array")
    counts = {key: 0 for key in IDS}
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get("id"), str):
            raise ValueError("Invalid constructor record")
        if row["id"] in counts:
            counts[row["id"]] += 1
    bad = {key: count for key, count in counts.items() if count != 1}
    if bad:
        raise ValueError(f"Pinned F1DB identities missing or duplicated: {bad}")
    print("Pinned F1DB Silverstone constructor IDs verified: " + ", ".join(IDS))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True)
    parser.add_argument("--checksums", required=True)
    args = parser.parse_args()
    try:
        check(args.archive, args.checksums)
    except (ValueError, OSError, zipfile.BadZipFile, json.JSONDecodeError) as exc:
        sys.exit(f"Identity audit failed: {exc}")
