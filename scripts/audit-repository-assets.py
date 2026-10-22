#!/usr/bin/env python3
"""Inventory tracked visual evidence and scripts without deleting anything.

Reference counts are textual hints, not proof of runtime use: dynamic paths,
external consumers, CI workflows and manual editorial commands may not be found.
"""
import argparse
import json
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMAGES = {".png", ".jpg", ".jpeg", ".webp"}


def tracked_files(root=ROOT):
    data = subprocess.check_output(["git", "ls-files", "-z"], cwd=root)
    return sorted(p.decode("utf-8") for p in data.split(b"\0") if p)


def inventory(root=ROOT, files=None):
    files = tracked_files(root) if files is None else files
    scripts = [p for p in files if p.startswith("scripts/") and Path(p).is_file() is False] if False else [
        p for p in files if p.startswith("scripts/") and Path(p).suffix in {".py", ".mjs", ".js", ".sh"}
    ]
    images = [p for p in files if Path(p).suffix.lower() in IMAGES]
    sizes = {p: (root / p).stat().st_size for p in images}
    # Search only likely human-readable tracked files; skip binary data and lockfiles.
    source_files = [
        p for p in files
        if Path(p).suffix.lower() in {".md", ".json", ".yaml", ".yml", ".py", ".mjs", ".js", ".ts", ".tsx", ".sh"}
        and p != "pnpm-lock.yaml"
    ]
    contents = {}
    for p in source_files:
        try:
            contents[p] = (root / p).read_text(encoding="utf-8")
        except (UnicodeError, OSError):
            continue
    references = {}
    for p in scripts + images:
        name = Path(p).name
        matches = sorted(
            source for source, content in contents.items()
            if source != p and (p in content or name in content)
        )
        references[p] = matches
    by_area = Counter()
    for p, size in sizes.items():
        by_area["/".join(p.split("/")[:3])] += size
    return {
        "tracked_files": len(files),
        "images": {"count": len(images), "bytes": sum(sizes.values()),
                   "by_area_bytes": dict(sorted(by_area.items(), key=lambda item: (-item[1], item[0])))},
        "scripts": {"count": len(scripts)},
        "reference_candidates": [
            {"path": p, "references": references[p], "bytes": sizes.get(p)}
            for p in scripts + images if not references[p]
        ],
        "limitations": "No references found does not establish unused; inspect imports, workflows, docs, dynamic and manual use before deletion."
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = inventory()
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("Tracked files:", result["tracked_files"])
        print("Images:", result["images"]["count"], "bytes:", result["images"]["bytes"])
        print("Scripts:", result["scripts"]["count"])
        print("Items needing manual reference review:", len(result["reference_candidates"]))
        for item in result["reference_candidates"]:
            print("  ", item["path"])
        print(result["limitations"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
