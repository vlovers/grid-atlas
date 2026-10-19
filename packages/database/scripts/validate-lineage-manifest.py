#!/usr/bin/env python3
"""Validate a lineage claim manifest against source-qualified identities.

Read-only by design. This command never inserts, updates or verifies claims.
Usage: python3 packages/database/scripts/validate-lineage-manifest.py path.json
"""
import json
from datetime import date
import re
import sys
from pathlib import Path

TYPES = {
    "constructor": {"renamed_to", "ownership_transferred_to", "operations_succeeded_by"},
    "entrant": {"renamed_to", "assets_acquired_by", "operations_succeeded_by"},
}
KEYS = {"entity_type", "subject", "object", "relation_type", "effective_year",
        "source_url", "source_title", "source_publisher", "evidence_note", "accessed_at"}
IDENTITY_KEYS = {"source_slug", "external_id"}


def validate(path):
    claims = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(claims, list):
        raise ValueError("Manifest must be an array")
    seen = set()
    for i, claim in enumerate(claims):
        if not isinstance(claim, dict) or set(claim) != KEYS:
            raise ValueError(f"Claim {i}: expected exactly {sorted(KEYS)}")
        kind = claim["entity_type"]
        if kind not in TYPES or claim["relation_type"] not in TYPES[kind]:
            raise ValueError(f"Claim {i}: invalid entity or relation type")
        for field in ("subject", "object"):
            ident = claim[field]
            if not isinstance(ident, dict) or set(ident) != IDENTITY_KEYS:
                raise ValueError(f"Claim {i}: {field} must contain source_slug and external_id")
            if not all(isinstance(v, str) and v.strip() for v in ident.values()):
                raise ValueError(f"Claim {i}: empty identity")
        identity = (kind, claim["subject"]["source_slug"], claim["subject"]["external_id"],
                    claim["object"]["source_slug"], claim["object"]["external_id"],
                    claim["relation_type"], claim["source_url"])
        if identity in seen:
            raise ValueError(f"Claim {i}: duplicate relationship and source")
        seen.add(identity)
        if claim["subject"] == claim["object"]:
            raise ValueError(f"Claim {i}: self edge")
        year = claim["effective_year"]
        if year is not None and (type(year) is not int or not 1950 <= year <= 2200):
            raise ValueError(f"Claim {i}: invalid year")
        if not isinstance(claim["source_url"], str) or not re.fullmatch(r"https://[^\s]+", claim["source_url"]):
            raise ValueError(f"Claim {i}: source_url must be HTTPS")
        for field in ("source_title", "source_publisher", "evidence_note"):
            if not isinstance(claim[field], str) or not claim[field].strip():
                raise ValueError(f"Claim {i}: missing {field}")
        if not isinstance(claim["accessed_at"], str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", claim["accessed_at"]):
            raise ValueError(f"Claim {i}: accessed_at must be YYYY-MM-DD")
        try:
            date.fromisoformat(claim["accessed_at"])
        except ValueError as exc:
            raise ValueError(f"Claim {i}: invalid calendar date") from exc
    print(f"Validated {len(claims)} proposed claim(s); no database changes made.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: validate-lineage-manifest.py FILE.json")
    try:
        validate(sys.argv[1])
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        sys.exit(f"Invalid lineage manifest: {exc}")
