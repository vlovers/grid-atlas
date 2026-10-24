#!/usr/bin/env python3
"""Read-only F1DB reconciliation for unpublished constructor research."""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages/data-importer"))
from import_seasons import verified_seasons

MANIFEST = ROOT / "docs/editorial/constructors/batch-01-founders/manifest.json"


def digest_row(row):
    return hashlib.sha256(json.dumps(
        row, ensure_ascii=False, sort_keys=True, separators=(",", ":")
    ).encode("utf-8")).hexdigest()


def reconcile(manifest, rows):
    if manifest.get("schema_version") != 1 or manifest.get("publication_status") != "research_only":
        raise ValueError("Research manifest must remain unpublished")
    subjects = manifest.get("subjects")
    if not isinstance(subjects, list) or len(subjects) != 12:
        raise ValueError("Expected exactly 12 draft subjects")
    by_id = {}
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get("id"), str):
            raise ValueError("Invalid constructor record")
        if row["id"] in by_id:
            raise ValueError("Duplicate F1DB constructor ID")
        by_id[row["id"]] = row

    results = []
    seen = set()
    for subject in subjects:
        name = subject.get("name")
        if not isinstance(name, str) or name in seen:
            raise ValueError("Missing/duplicate draft subject")
        seen.add(name)
        if (subject.get("human_review") != "pending" or
                subject.get("publication") != "blocked" or
                subject.get("independent_claim_review") != "pending"):
            raise ValueError(f"{name}: unsafe approval state")
        identifier = subject.get("f1db_external_id")
        if identifier is None:
            if subject.get("source_record_sha256") is not None:
                raise ValueError(f"{name}: unverified identity contains hash")
            # Suggestions are deliberately NOT automatically written back to the manifest.
            candidates = [
                {"id": row["id"], "source_name": row.get("name"),
                 "record_sha256": digest_row(row)}
                for row in rows
                if name.casefold() in {
                    str(row.get("name", "")).casefold(),
                    str(row.get("fullName", "")).casefold(),
                    str(row.get("officialName", "")).casefold(),
                }
            ]
            results.append({"subject": name, "status": "pending_manual_identity_review",
                            "candidates": candidates})
            continue
        row = by_id.get(identifier)
        if row is None:
            raise ValueError(f"{name}: pinned identity missing: {identifier}")
        observed = digest_row(row)
        if observed != subject.get("source_record_sha256"):
            raise ValueError(f"{name}: pinned record hash mismatch")
        results.append({"subject": name, "status": "pinned_record_verified",
                        "id": identifier, "record_sha256": observed})
    return {"source_release": manifest["source"]["release"], "research_only": True,
            "publication_allowed": False, "subjects": results,
            "verified_pins": sum(x["status"] == "pinned_record_verified" for x in results),
            "needs_manual_review": sum(x["status"] == "pending_manual_identity_review" for x in results)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--checksums", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        verified_seasons(args.archive, args.checksums)
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        if manifest["source"]["release"] != "v2026.17.0":
            raise ValueError("Unexpected F1DB release")
        with zipfile.ZipFile(args.archive) as z:
            matches = [entry for entry in z.infolist()
                       if Path(entry.filename).name == "f1db-constructors.json" and not entry.is_dir()]
            if len(matches) != 1:
                raise ValueError("Expected one constructor dataset in pinned ZIP")
            rows = json.loads(z.read(matches[0]))
        if not isinstance(rows, list):
            raise ValueError("Invalid F1DB constructor collection")
        report = reconcile(manifest, rows)
        data = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
        if args.output:
            args.output.write_text(data, encoding="utf-8")
        print(data, end="")
    except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile) as exc:
        parser.exit(1, f"Constructor identity audit failed: {exc}\n")


if __name__ == "__main__":
    main()
