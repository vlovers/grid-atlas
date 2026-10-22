#!/usr/bin/env python3
"""Structural-only audit of unpublished Editorial Atlas research briefs."""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "docs/editorial/releases/v2/briefs.json"

def validate(data):
    errors = []
    if data.get("status") != "research_planning_not_approved":
        errors.append("research status must remain unapproved")
    records = data.get("records", [])
    counts = Counter(r.get("type") for r in records)
    if counts != {"constructor": 5, "circuit": 10, "season": 10}:
        errors.append(f"unexpected cohort: {dict(counts)}")
    ids = [r.get("id") for r in records]
    if len(ids) != len(set(ids)):
        errors.append("duplicate editorial ID")
    for record in records:
        for locale in ("en", "uk"):
            content = record.get("editorial", {}).get(locale, {})
            if not content.get("headline") or not content.get("deck"):
                errors.append(f"{record.get('id')}: missing {locale} editorial copy")
        if len(record.get("chapters", [])) < 4 or not record.get("verification"):
            errors.append(f"{record.get('id')}: incomplete outline or verification")
        if any(key in record for key in ("approved", "reviewer", "published", "claims")):
            errors.append(f"{record.get('id')}: review or claims must use the existing pipeline")
    return errors

if __name__ == "__main__":
    errors = validate(json.loads(PACK.read_text(encoding="utf-8")))
    print("Editorial Batch 2: " + ("; ".join(errors) if errors else "25 structurally valid unpublished briefs"))
    raise SystemExit(bool(errors))
