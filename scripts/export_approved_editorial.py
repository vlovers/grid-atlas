#!/usr/bin/env python3
"""Export only independently approved, exact-revision dossiers into a publication bundle.

This script never publishes or modifies PostgreSQL. Its output is input to an
explicitly authorized publisher. No automated reviewer decisions are generated.
"""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.editorial_review import validate_review, revision_digest
from scripts.editorial_dossiers import load_json, iso_date, read_drivers

def export(dossier, review, canonical_ids, as_of):
    report = validate_review(dossier, review, canonical_ids, as_of)
    if review["stage"] != "approved" or not report["ready_for_publication"]:
        raise ValueError("independent approval of the exact revision is required")
    if dossier["media"] or review["media"]:
        raise ValueError("media publication is not supported by this text-only pipeline")
    if not review["checks"]["signoff"] or review["checks"]["signoff"]["actor"] != "human":
        raise ValueError("accountable human signoff required")
    claim_by_id = {c["claim_id"]: c for c in dossier["claims"]}
    sources = {s["source_id"]: s for s in dossier["sources"]}
    referenced = list(dict.fromkeys(cid for section in dossier["sections"] for cid in section["claim_ids"]))
    if not referenced or set(referenced) != set(claim_by_id):
        raise ValueError("publication must include every reviewed claim exactly once in article sections")
    body = "\n\n".join("## " + section["title"] + "\n\n" +
                         "\n\n".join(claim_by_id[cid]["statement"] for cid in section["claim_ids"])
                         for section in dossier["sections"])
    items = []
    for cid in referenced:
        claim = claim_by_id[cid]
        if not review["claim_reviews"].get(cid):
            raise ValueError("claim approval missing")
        evidence = []
        for e in claim["evidence"]:
            if not e["supports"]:
                continue
            src = sources[e["source_id"]]
            evidence.append({"url": src["source_url"], "title": src["title"],
                             "publisher": src["publisher"], "author": src["author"],
                             "accessed_on": src["accessed_on"], "locator": e["locator"]})
        if not evidence:
            raise ValueError("every published claim needs source-located supporting evidence")
        items.append({"claim_id": cid, "statement": claim["statement"], "evidence": evidence,
                      "reviewer": review["claim_reviews"][cid]["reviewer"],
                      "reviewed_on": review["claim_reviews"][cid]["reviewed_on"]})
    return {"schema_version": 1, "release_kind": "approved_text_only",
            "publication_status": "not_yet_published", "driver_external_id": dossier["driver_id"],
            "locale": dossier["locale"], "revision_sha256": revision_digest(dossier, review),
            "title": dossier["title"], "slug": dossier["driver_id"], "body_markdown": body,
            "author": dossier["author"], "reviewer": review["checks"]["signoff"]["reviewer"],
            "reviewed_on": review["checks"]["signoff"]["reviewed_on"],
            "claims": items}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for flag in ("dossier", "review", "archive", "checksums", "output"):
        parser.add_argument("--"+flag, type=Path, required=True)
    parser.add_argument("--as-of", required=True)
    args = parser.parse_args()
    rows, _ = read_drivers(args.archive, args.checksums)
    bundle = export(load_json(args.dossier), load_json(args.review),
                    {x[0] for x in rows}, iso_date(args.as_of))
    if args.output.exists():
        parser.error("refusing to overwrite an existing release bundle")
    args.output.write_text(json.dumps(bundle, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"bundle": str(args.output), "revision": bundle["revision_sha256"],
                      "claims": len(bundle["claims"]), "published": False}))
if __name__ == "__main__":
    main()
