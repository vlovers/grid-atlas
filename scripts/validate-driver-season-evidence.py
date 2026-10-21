#!/usr/bin/env python3
"""Fail-closed validation of 3 official-season evidence story briefs."""
import json
from pathlib import Path
from urllib.parse import urlparse

DIR=Path(__file__).resolve().parents[1]/"docs/editorial/research-pack-2026-10"
EXPECTED={"michael-schumacher","lewis-hamilton","max-verstappen"}
def validate(doc,slug):
    errors=[]
    def check(ok,msg):
        if not ok: errors.append(f"{slug}: {msg}")
    check(doc.get("schema_version")==1,"schema")
    check(doc.get("kind")=="driver_season_source_observation","kind")
    check(doc.get("subject",{}).get("slug")==slug,"identity")
    check(doc.get("subject",{}).get("identity_status")=="requires_f1db_join","identity review")
    check(doc.get("status")=="source_observed_needs_independent_human_review","status")
    check(doc.get("publication_allowed") is False,"publication flag")
    srcs=doc.get("sources",[])
    ids=[s.get("id") for s in srcs]
    check(len(srcs)==2 and len(set(ids))==2,"source IDs")
    for s in srcs:
        u=urlparse(s.get("url",""))
        check(u.scheme=="https" and u.netloc=="www.formula1.com","source URL")
        check(bool(s.get("locator")) and bool(s.get("publisher")),"source locator")
    claims=doc.get("claims",[])
    check(len(claims)==2,"claim count")
    for c in claims:
        check(c.get("review_status")=="needs_human_review","review status")
        check(bool(c.get("text",{}).get("uk")) and bool(c.get("text",{}).get("en")),"language")
        check(bool(c.get("source_ids")) and set(c.get("source_ids",[])) <= set(ids),"source reference")
        check(bool(c.get("observed_fields")),"observed values")
    scenes=doc.get("chapter_treatments",[])
    check(len(scenes)==4,"chapter count")
    for scene in scenes:
        check(bool(scene.get("headline",{}).get("en")) and bool(scene.get("headline",{}).get("uk")),"scene locale")
        check(scene.get("copy_status")=="research_only","narrative approval")
    check(len(doc.get("constraints",[]))>=5,"limitations")
    review=doc.get("approval",{})
    check(review.get("human_editor") is None and review.get("reviewed_at") is None,"fake human review")
    for key in ("claim_review","uk_review","en_review","media_review","publication_allowed"):
        check(review.get(key) is False,"unsafe approval "+key)
    return errors
def main():
    actual={p.name.replace("-season-evidence.json","") for p in DIR.glob("*-season-evidence.json")}
    if actual!=EXPECTED: raise SystemExit(f"unexpected subject set: {actual}")
    errors=[]
    for slug in sorted(EXPECTED):
        d=json.loads((DIR/f"{slug}-season-evidence.json").read_text(encoding="utf-8"))
        errors.extend(validate(d,slug))
    if errors: raise SystemExit("\n".join(errors))
    print("Validated three source-evidence story briefs, six claims and twelve research-only scenes.")
if __name__=="__main__": main()
