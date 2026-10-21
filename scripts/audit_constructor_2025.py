#!/usr/bin/env python3
"""Fail-closed checks for unpublished constructor research claims; no publication side effects."""
import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "docs/editorial/research/constructors-2025-source-observations.json"
FIELDS = {"chassis", "team_principal", "technical_note", "driver_lineup", "power_unit", "technical_chief"}
# Not all research fields are in the historical-facts publication allowlist.
# This audit NEVER converts observations into reviewed facts.
def audit(data):
    errors = []
    if not isinstance(data, dict) or data.get("schema_version") != 1:
        return ["unsupported document"]
    if data.get("publication") != "unpublished" or data.get("review_status") != "needs_review":
        errors.append("unreviewed research must remain unpublished")
    if data.get("scope") != "point_in_time_2025":
        errors.append("invalid temporal scope")
    sources, claims = data.get("sources"), data.get("claims")
    if not isinstance(sources, dict) or not sources:
        return errors + ["source map missing"]
    for name, source in sources.items():
        if not isinstance(source, dict):
            errors.append(f"source {name}: invalid"); continue
        parsed = urlparse(source.get("url", ""))
        if parsed.scheme != "https" or parsed.hostname != "www.formula1.com" or not parsed.path.startswith("/en/latest/article/") or parsed.username or parsed.password or parsed.query or parsed.fragment:
            errors.append(f"source {name}: not an approved Formula 1 article URL")
        if source.get("publisher") != "Formula 1":
            errors.append(f"source {name}: unexpected publisher")
        try:
            date.fromisoformat(source["published_on"])
            date.fromisoformat(source["accessed_on"])
        except (ValueError, TypeError, KeyError):
            errors.append(f"source {name}: invalid date")
    if not isinstance(claims, list) or not claims:
        return errors + ["claim list missing"]
    seen = set()
    for i, claim in enumerate(claims):
        label = f"claim[{i}]"
        if not isinstance(claim, dict):
            errors.append(f"{label}: not an object"); continue
        slug = claim.get("entity_slug")
        if not isinstance(slug, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
            errors.append(f"{label}: invalid constructor slug")
        if type(claim.get("season_year")) is not int or claim["season_year"] != 2025:
            errors.append(f"{label}: invalid season")
        if claim.get("field") not in FIELDS:
            errors.append(f"{label}: unsupported research field")
        if not isinstance(claim.get("value"), str) or not 2 <= len(claim["value"].strip()) <= 300:
            errors.append(f"{label}: invalid value")
        if not isinstance(claim.get("locator"), str) or len(claim["locator"].strip()) < 15:
            errors.append(f"{label}: source locator required")
        if claim.get("source_id") not in sources:
            errors.append(f"{label}: source missing")
        key = (slug, claim.get("field"), claim.get("value"), claim.get("source_id"))
        if key in seen:
            errors.append(f"{label}: duplicate observation")
        seen.add(key)
        if (claim.get("internal_constructor_id") is not None or claim.get("human_reviewed") is not False or
            claim.get("publication_allowed") is not False or claim.get("media") != []):
            errors.append(f"{label}: premature ID, review, publication or media claim")
        if not isinstance(claim.get("limitation"), str) or not claim["limitation"].strip():
            errors.append(f"{label}: missing historical limitation")
    return errors

def main(argv):
    path = Path(argv[1]) if len(argv)>1 else PATH
    data = json.loads(path.read_text(encoding="utf-8"))
    errors = audit(data)
    print(json.dumps({"observations":len(data.get("claims", [])), "valid":not errors,
                      "unpublished":True,"errors":errors},indent=2))
    return 1 if errors else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv))
