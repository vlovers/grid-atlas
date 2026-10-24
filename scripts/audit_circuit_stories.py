#!/usr/bin/env python3
"""Validate researched circuit stories, not a human publication approval."""
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / "docs/editorial/batches/circuits-five-story-moments-20261025.json"
EXPECTED = {"monaco", "spa-francorchamps", "suzuka", "monza", "silverstone"}

def validate(value):
    if value.get("schema_version") != 1 or value.get("stage") != "research" or value.get("publication_status") != "unpublished":
        raise ValueError("Only unpublished research is permitted")
    subjects = value.get("circuits")
    if not isinstance(subjects, list) or len(subjects) != 5 or {x.get("id") for x in subjects} != EXPECTED:
        raise ValueError("Wrong circuit selection")
    source_map = value.get("sources")
    if not isinstance(source_map, dict) or not source_map:
        raise ValueError("Missing sources")
    for key, url in source_map.items():
        parsed = urlsplit(url)
        if not re.fullmatch(r"[a-z0-9-]+", key) or parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or not parsed.path.strip("/"):
            raise ValueError("Invalid source URL")
    used = set()
    for subject in subjects:
        if not isinstance(subject.get("en"), dict) or not isinstance(subject.get("uk"), dict):
            raise ValueError("Missing languages")
        en, uk = subject["en"], subject["uk"]
        if len(en.get("moments", [])) != 3 or len(uk.get("moments", [])) != 3:
            raise ValueError("Exactly three history moments per language required")
        for lang in (en, uk):
            if not lang.get("hook") or not lang.get("character"):
                raise ValueError("Missing story hook or circuit character")
            for moment in lang["moments"]:
                if type(moment.get("year")) is not int or moment["year"] < 1900 or moment["year"] > 2026:
                    raise ValueError("Implausible event year")
                if not all(isinstance(moment.get(k), str) and len(moment[k].strip()) > 10 for k in ("title", "text")):
                    raise ValueError("Empty moment copy")
                if moment.get("source") not in source_map:
                    raise ValueError("Unresolved source")
                used.add(moment["source"])
        if [(m["year"], m["source"]) for m in en["moments"]] != [(m["year"], m["source"]) for m in uk["moments"]]:
            raise ValueError("Locale timeline mismatch")
    if used != set(source_map):
        raise ValueError("Orphan or missing source attribution")
    return {"circuits": len(subjects), "locale_stories": len(subjects) * 2, "historical_moments": len(subjects) * 3, "sources":len(used), "status":"research_only"}

if __name__ == "__main__":
    print(json.dumps(validate(json.loads(FILE.read_text(encoding="utf-8"))), indent=2))
