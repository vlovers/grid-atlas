#!/usr/bin/env python3
"""Validate an unpublished editorial batch manifest; never approve or publish."""
import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path

RELEASE = "v2026.17.0"
ID = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def validate(manifest):
    if not isinstance(manifest, dict):
        raise ValueError("manifest must be an object")
    expected = {"batch_id", "source", "drivers", "locale_targets", "review_status", "created_at", "reviewer"}
    if set(manifest) != expected:
        raise ValueError(f"manifest keys must be exactly {sorted(expected)}")
    if not isinstance(manifest["batch_id"], str) or not ID.fullmatch(manifest["batch_id"]):
        raise ValueError("invalid batch_id")
    if manifest["source"] != {"name": "f1db", "release": RELEASE}:
        raise ValueError("source must match the pinned F1DB release")
    drivers = manifest["drivers"]
    if not isinstance(drivers, list) or not 1 <= len(drivers) <= 50:
        raise ValueError("drivers must contain 1–50 canonical IDs")
    if any(not isinstance(x, str) or not ID.fullmatch(x) for x in drivers):
        raise ValueError("invalid driver ID")
    if len(drivers) != len(set(drivers)):
        raise ValueError("duplicate driver ID")
    locales = manifest["locale_targets"]
    if not isinstance(locales, list) or not locales or len(locales) != len(set(locales)) or not set(locales) <= {"en", "uk"}:
        raise ValueError("locale_targets must be unique en/uk values")
    if manifest["review_status"] not in {"draft", "needs_review"} or manifest["reviewer"] is not None:
        raise ValueError("batch must remain unapproved")
    try:
        if not isinstance(manifest["created_at"], str):
            raise ValueError()
        parsed = dt.date.fromisoformat(manifest["created_at"])
        if parsed.isoformat() != manifest["created_at"]:
            raise ValueError()
    except ValueError:
        raise ValueError("created_at must be ISO YYYY-MM-DD") from None
    return len(drivers)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    args = parser.parse_args()
    try:
        count = validate(json.loads(args.manifest.read_text(encoding="utf-8")))
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        parser.exit(1, f"Invalid editorial batch: {exc}\n")
    print(f"Valid unpublished batch: {count} driver IDs (identity lookup against F1DB still required)")


if __name__ == "__main__":
    main()
