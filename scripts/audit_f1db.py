#!/usr/bin/env python3
"""Offline integrity and shape audit of an official F1DB split JSON ZIP.

Download the release archive AND checksums via the GitHub release page first.
This script never downloads data, performs imports, or modifies the database.
"""
import argparse
import hashlib
import json
import re
import sys
import zipfile
from collections import Counter
from pathlib import Path
try:
    from scripts.f1db_relationships import verify
except ModuleNotFoundError as exc:
    if exc.name != "scripts":
        raise
    from f1db_relationships import verify

ASSET = "f1db-json-splitted.zip"
EXPECTED_CATEGORIES = ("drivers", "constructors", "entrants", "races", "seasons")


def checksum_for(text, filename):
    for line in text.splitlines():
        match = re.fullmatch(r"([0-9a-fA-F]{64})\s+\*?(.+?)\s*", line)
        if match and Path(match.group(2)).name == filename:
            return match.group(1).lower()
    raise ValueError(f"No SHA-256 entry for {filename}")


def audit(archive, checksums, *, expect_name=ASSET):
    archive = Path(archive)
    expected = checksum_for(Path(checksums).read_text(encoding="utf-8"), expect_name)
    if archive.name != expect_name:
        raise ValueError(f"Expected official asset filename {expect_name!r}")
    sha = hashlib.file_digest(archive.open("rb"), "sha256").hexdigest()
    if sha != expected:
        raise ValueError(f"SHA-256 mismatch: expected {expected}, got {sha}")
    report = {"asset": archive.name, "sha256": sha, "collections": {}, "findings": []}
    collections = {}
    with zipfile.ZipFile(archive) as bundle:
        names = set()
        for member in bundle.infolist():
            path = Path(member.filename)
            if member.filename.startswith("/") or ".." in path.parts or "\\" in member.filename:
                raise ValueError(f"Unsafe archive path: {member.filename}")
            if member.is_dir():
                continue
            if member.filename in names:
                raise ValueError(f"Duplicate archive path: {member.filename}")
            names.add(member.filename)
            if not member.filename.lower().endswith(".json"):
                continue
            if member.file_size > 200_000_000:
                raise ValueError(f"Unexpectedly large JSON member: {member.filename}")
            data = json.loads(bundle.read(member))
            if not isinstance(data, list):
                report["findings"].append({"file": member.filename, "warning": "not a JSON array"})
                continue
            ids = [str(item["id"]) for item in data if isinstance(item, dict) and isinstance(item.get("id"), (str, int))]
            duplicates = sorted(k for k, n in Counter(ids).items() if n > 1)
            nulls = sum(1 for item in data if item is None)
            category = Path(member.filename).stem
            if category in collections:
                raise ValueError(f"Duplicate collection basename: {category}")
            collections[category] = data
            report["collections"][category] = {
                "file": member.filename, "rows": len(data),
                "ids": len(ids), "duplicate_ids": duplicates[:25],
                "duplicate_id_count": len(duplicates), "null_rows": nulls,
            }
            if duplicates:
                report["findings"].append({"file": member.filename, "error": "duplicate id values", "count": len(duplicates)})
    if not report["collections"]:
        raise ValueError("No JSON array collections found in ZIP")
    report["integrity"] = verify(collections)
    for check in report["integrity"]["checks"]:
        if check["orphan_count"]:
            report["findings"].append({"error": "orphaned reference", **check})
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--checksums", required=True, type=Path)
    parser.add_argument("--report", type=Path, help="Optional JSON output path")
    args = parser.parse_args()
    try:
        result = audit(args.archive, args.checksums)
        output = json.dumps(result, indent=2, ensure_ascii=False) + "\n"
        if args.report:
            args.report.write_text(output, encoding="utf-8")
        else:
            print(output, end="")
        if any("error" in finding for finding in result["findings"]):
            return 2
        return 0
    except (OSError, ValueError, json.JSONDecodeError, zipfile.BadZipFile) as exc:
        print(f"Audit failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
