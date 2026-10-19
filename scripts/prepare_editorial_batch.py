#!/usr/bin/env python3
"""Create unpublished driver research packets from checksum-verified F1DB identities.

This intentionally does not generate unsupported narrative biographies.
"""
import argparse
import json
from pathlib import Path

from scripts.validate_editorial_batch import validate, validate_source_ids, load_verified_ids


def build_packets(manifest, driver_rows):
    validate(manifest)
    by_id = {driver_id: name for driver_id, name, _hash in driver_rows}
    validate_source_ids(manifest, by_id)
    return {
        "batch_id": manifest["batch_id"],
        "source": manifest["source"],
        "publication_status": "unpublished",
        "profiles": [
            {
                "driver_id": driver_id,
                "source_display_name": by_id[driver_id],
                "source": manifest["source"],
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
    from scripts.validate_editorial_batch import load_verified_ids
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "packages" / "data-importer"))
    from import_drivers import read_drivers
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    driver_rows, _digest = read_drivers(args.archive, args.checksums)
    packets = build_packets(manifest, driver_rows)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(packets, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(packets['profiles'])} unpublished driver research packets: {args.output}")


if __name__ == "__main__":
    main()
