#!/usr/bin/env python3
"""Reconcile the 30-driver unpublished research cohort against checksum-verified F1DB IDs.

This verifies an external-ID match, not a person's identity, source truth, or editorial approval.
"""
import argparse
import json
import sys
from pathlib import Path

PINNED_RELEASE = "v2026.17.0"
BATCH_ID = "drivers-30-v1"


def reconcile(batch, release, driver_rows, archive_sha256):
    errors = []
    warnings = []
    if not isinstance(batch, dict):
        batch = {}
    if not isinstance(release, dict):
        release = {}
    candidates = batch.get("drivers")
    pilots = release.get("drivers")
    if not isinstance(candidates, list) or len(candidates) != 30:
        errors.append("expected_30_batch_candidates")
        candidates = candidates if isinstance(candidates, list) else []
    if not isinstance(pilots, list) or len(pilots) != 5:
        errors.append("expected_5_release_pilots")
        pilots = pilots if isinstance(pilots, list) else []
    if batch.get("batch_id") != BATCH_ID or batch.get("publication_status") != "unpublished":
        errors.append("batch_schema_or_publication_gate")
    if release.get("status") != "research_only":
        errors.append("release_publication_gate")
    if not isinstance(archive_sha256, str) or len(archive_sha256) != 64 or any(c not in "0123456789abcdef" for c in archive_sha256):
        errors.append("invalid_archive_digest")

    pilot_ids = [x.get("driver_id") for x in pilots if isinstance(x, dict)]
    if len(set(pilot_ids)) != len(pilot_ids) or any(not isinstance(x, str) or not x for x in pilot_ids):
        errors.append("invalid_release_pilot_ids")
    source = {}
    for row in driver_rows:
        if not isinstance(row, (tuple, list)) or len(row) != 3:
            errors.append("invalid_f1db_row")
            continue
        driver_id, name, content_hash = row
        if not isinstance(driver_id, str) or not driver_id or not isinstance(name, str) or not name.strip():
            errors.append("invalid_f1db_row")
            continue
        if driver_id in source:
            errors.append("duplicate_f1db_id:" + driver_id)
        source[driver_id] = {"display_name": name, "source_record_hash": content_hash}

    seen = set()
    cohort_pilots = set()
    results = []
    for item in candidates:
        if not isinstance(item, dict):
            errors.append("invalid_candidate")
            continue
        driver_id = item.get("driver_id")
        if not isinstance(driver_id, str) or not driver_id:
            errors.append("invalid_candidate_id")
            continue
        if driver_id in seen:
            errors.append("duplicate_candidate:" + driver_id)
        seen.add(driver_id)
        locales = item.get("required_locales")
        if not isinstance(locales, list) or set(locales) != {"en", "uk"} or len(locales) != 2:
            errors.append("invalid_locales:" + driver_id)
        is_pilot = item.get("priority") == "pilot"
        if is_pilot:
            cohort_pilots.add(driver_id)
            if item.get("status") != "existing_research_dossier":
                errors.append("invalid_pilot_status:" + driver_id)
        elif item.get("priority") != "batch_01" or item.get("status") not in {"candidate_unresearched", "research_draft"}:
            errors.append("invalid_candidate_status:" + driver_id)
        elif item.get("status") == "candidate_unresearched":
            warnings.append("stale_manifest_status:" + driver_id)
        matched = source.get(driver_id)
        if matched is None:
            errors.append("f1db_id_not_found:" + driver_id)
        results.append({
            "driver_id": driver_id,
            "cohort": "pilot" if is_pilot else "research_candidate",
            "f1db_external_id_matched": matched is not None,
            "f1db_display_name": matched["display_name"] if matched else None,
            "f1db_source_record_hash": matched["source_record_hash"] if matched else None,
            "human_identity_review": "pending",
            "editorial_approval": False,
        })
    if cohort_pilots != set(pilot_ids):
        errors.append("pilot_manifest_drift")
    if len(seen) != 30:
        errors.append("candidate_uniqueness_or_count")
    return {
        "schema_version": 1,
        "batch_id": BATCH_ID,
        "source": {"name": "f1db", "release": PINNED_RELEASE, "archive_sha256": archive_sha256},
        "publication_status": "unpublished",
        "meaning": "Checksum-verified F1DB external-ID existence only; not historical fact verification or editorial approval.",
        "totals": {"candidates": len(results), "pilots": len(cohort_pilots),
                   "matched_external_ids": sum(row["f1db_external_id_matched"] for row in results),
                   "missing_external_ids": sum(not row["f1db_external_id_matched"] for row in results),
                   "human_identity_reviews": 0, "approved_for_publication": 0},
        "errors": sorted(set(errors)), "warnings": sorted(set(warnings)), "drivers": results,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--checksums", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    try:
        batch = json.loads((root / "docs/editorial/batches/drivers-30-v1.json").read_text(encoding="utf-8"))
        release = json.loads((root / "docs/editorial/releases/v1/manifest.json").read_text(encoding="utf-8"))
        sys.path.insert(0, str(root / "packages/data-importer"))
        from import_drivers import read_drivers
        rows, digest = read_drivers(args.archive, args.checksums)
        report = reconcile(batch, release, rows, digest)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        parser.exit(1, "F1DB identity preflight failed: " + str(exc) + "\n")
    content = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(content, encoding="utf-8")
    else:
        print(content, end="")
    if report["errors"]:
        parser.exit(1, "F1DB identity preflight failed: " + ", ".join(report["errors"]) + "\n")


if __name__ == "__main__":
    main()
