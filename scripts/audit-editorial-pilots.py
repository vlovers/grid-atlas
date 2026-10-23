#!/usr/bin/env python3
"""Check unpublished, source-located pilot research without approving claims."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "docs/editorial/releases/v2/pilot-research.json"

def validate(data):
    errors = []
    if data.get("status") != "source_located_research_unapproved":
        errors.append("status must be unpublished research")
    items = data.get("items", [])
    if len(items) != 5 or len({x.get("subject_id") for x in items}) != 5:
        errors.append("expected five unique research pilots")
    seen = set()
    for item in items:
        if item.get("review", {}).get("state") != "pending_independent_human_review" or item.get("review", {}).get("publication") is not False:
            errors.append(f"{item.get('subject_id')}: cannot bypass publication gate")
        for locale in ("en", "uk"):
            if not item.get("headline", {}).get(locale) or not item.get("narrative", {}).get(locale):
                errors.append(f"{item.get('subject_id')}: missing {locale} narrative")
        if len(item.get("claims", [])) < 2:
            errors.append(f"{item.get('subject_id')}: too few claims")
        for claim in item.get("claims", []):
            if claim.get("id") in seen:
                errors.append(f"duplicate claim {claim.get('id')}")
            seen.add(claim.get("id"))
            evidence = claim.get("evidence", {})
            if not evidence.get("url", "").startswith("https://") or not evidence.get("locator") or not evidence.get("accessed"):
                errors.append(f"{claim.get('id')}: missing evidence locator")
            if not all(claim.get("text", {}).get(locale) for locale in ("en", "uk")):
                errors.append(f"{claim.get('id')}: incomplete translation")
    return errors

if __name__ == "__main__":
    failures = validate(json.loads(PACK.read_text(encoding="utf-8")))
    print("Pilot research: " + ("; ".join(failures) if failures else "5 bilingual source-located unpublished pilots"))
    raise SystemExit(bool(failures))
