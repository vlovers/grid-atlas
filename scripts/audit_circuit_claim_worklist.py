#!/usr/bin/env python3
"""Audit pending circuit claims without granting editorial approval."""
import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
WORKLIST = ROOT / "docs/editorial/batches/circuits-5-claim-review-worklist-20261025.json"
EXPECTED_CIRCUITS = ("silverstone", "monaco", "spa-francorchamps", "monza", "suzuka")
KEYS = {"schema_version", "kind", "stage", "publication_status", "revision_approval", "policy", "circuits"}
IDENTIFIER = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*\Z")


def audit(document):
    if set(document) != KEYS or document["schema_version"] != 1 or document["kind"] != "circuit_editorial_claim_review":
        raise ValueError("Unexpected review schema")
    if document["stage"] != "evidence_review" or document["publication_status"] != "unpublished" or document["revision_approval"] is not None:
        raise ValueError("This worklist must remain pending and unpublished")
    if not document["policy"].strip() or len(document["circuits"]) != len(EXPECTED_CIRCUITS):
        raise ValueError("Circuit cohort/policy incomplete")
    if tuple(circuit["id"] for circuit in document["circuits"]) != EXPECTED_CIRCUITS:
        raise ValueError("Unexpected circuit cohort/order")
    claims = 0
    urls = set()
    for circuit in document["circuits"]:
        if set(circuit) != {"id", "claims"} or len(circuit["claims"]) < 3:
            raise ValueError("Circuit claim coverage incomplete")
        claim_ids = set()
        for claim in circuit["claims"]:
            if set(claim) != {"id", "statement", "sources", "status"}:
                raise ValueError("Unexpected claim fields")
            claim_id = claim["id"]
            if not IDENTIFIER.fullmatch(claim_id) or claim_id in claim_ids:
                raise ValueError("Malformed/duplicate claim")
            claim_ids.add(claim_id)
            if claim["status"] != "pending":
                raise ValueError("Automated claim approval is prohibited")
            if not claim["statement"].strip() or not claim["sources"]:
                raise ValueError("Missing statement/source")
            seen = set()
            for source in claim["sources"]:
                if set(source) != {"url", "locator"}:
                    raise ValueError("Unexpected source fields")
                parsed = urlparse(source["url"])
                if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password or not parsed.path.strip("/"):
                    raise ValueError("Source must be an HTTPS document")
                if not source["locator"].strip() or (source["url"], source["locator"]) in seen:
                    raise ValueError("Missing/duplicate source locator")
                seen.add((source["url"], source["locator"]))
                urls.add(source["url"])
            claims += 1
    return {"circuits": len(document["circuits"]), "claims_pending": claims,
            "distinct_source_urls": len(urls), "approved_claims": 0, "publishable": False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--worklist", type=Path, default=WORKLIST)
    args = parser.parse_args()
    print(json.dumps(audit(json.loads(args.worklist.read_text(encoding="utf-8"))), indent=2))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, TypeError, OSError, json.JSONDecodeError) as error:
        raise SystemExit(f"Blocked circuit claim worklist: {error}") from error
