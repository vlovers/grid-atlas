#!/usr/bin/env python3
"""Fail-closed checks for research-only event measurements. No publishing or database writes."""
import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DEFAULT = ROOT / "docs/editorial/research/circuit-2021-candidates.json"
ALLOWED_RECORD = {"venue", "event", "season_year", "length_m", "scheduled_laps", "source",
                  "review", "canonical_identity", "independent_verification", "media_license", "limitations"}
ALLOWED_SOURCE = {"publisher", "title", "url", "locator", "accessed_on"}


def audit(document):
    errors = []
    if not isinstance(document, dict) or document.get("schema_version") != 1:
        return ["unsupported research document"]
    if document.get("publication") != "unpublished" or document.get("purpose") != "research_candidates_only":
        errors.append("research batch cannot be marked for publication")
    records = document.get("records")
    if not isinstance(records, list) or not records:
        return errors + ["records must be a nonempty list"]
    seen = set()
    for idx, record in enumerate(records):
        loc = f"records[{idx}]"
        if not isinstance(record, dict) or set(record) != ALLOWED_RECORD:
            errors.append(f"{loc}: unexpected or missing keys")
            continue
        if not all(isinstance(record[k], str) and record[k].strip() for k in ("venue", "event", "limitations")):
            errors.append(f"{loc}: missing human-readable description")
        key = (record["venue"], record["event"], record["season_year"])
        if key in seen:
            errors.append(f"{loc}: duplicate venue/event/year")
        seen.add(key)
        if record["season_year"] != 2021 or type(record["season_year"]) is not int:
            errors.append(f"{loc}: wrong event year")
        if type(record["length_m"]) is not int or not 1000 <= record["length_m"] <= 30000:
            errors.append(f"{loc}: invalid circuit length")
        if type(record["scheduled_laps"]) is not int or not 1 <= record["scheduled_laps"] <= 200:
            errors.append(f"{loc}: invalid scheduled laps")
        source = record["source"]
        if not isinstance(source, dict) or set(source) != ALLOWED_SOURCE:
            errors.append(f"{loc}: invalid source record")
        else:
            url = source["url"]
            u = urlparse(url) if isinstance(url, str) else urlparse("")
            if (u.scheme != "https" or u.hostname != "www.formula1.com"
                    or not re.fullmatch(r"/en/racing/2021/[a-z-]+", u.path)
                    or u.query or u.fragment or u.username or u.password):
                errors.append(f"{loc}: unexpected source URL")
            for k in ("publisher", "title", "locator"):
                if not isinstance(source[k], str) or not source[k].strip():
                    errors.append(f"{loc}: empty source {k}")
            if source["publisher"] != "Formula 1":
                errors.append(f"{loc}: unexpected publisher")
            try:
                date.fromisoformat(source["accessed_on"])
            except (ValueError, TypeError):
                errors.append(f"{loc}: invalid source date")
            locator = source["locator"]
            if isinstance(locator, str) and (f"({record['length_m']/1000:.3f}km)" not in locator
                                           or f"({record['scheduled_laps']})" not in locator):
                errors.append(f"{loc}: locator and measurements disagree")
        review = record["review"]
        if review != {"status": "needs_review", "reviewer": None, "reviewed_on": None}:
            errors.append(f"{loc}: research candidate cannot self-approve")
        if record["canonical_identity"] != {"circuit_id": None, "race_id": None, "layout_version": None}:
            errors.append(f"{loc}: unresolved IDs must never be guessed")
        if record["independent_verification"] != "pending" or record["media_license"] != "not_assessed":
            errors.append(f"{loc}: unsupported evidence or media status")
    return errors


def main(argv):
    path = Path(argv[1]) if len(argv) > 1 else DEFAULT
    document = json.loads(path.read_text(encoding="utf-8"))
    errors = audit(document)
    print(json.dumps({"records": len(document.get("records", [])), "valid": not errors,
                      "publication": "unpublished", "errors": errors}, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
