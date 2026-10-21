#!/usr/bin/env python3
"""Fail-closed source-localized research validator; no editorial approval."""
import json
from pathlib import Path
from urllib.parse import urlparse
FILE=Path(__file__).resolve().parents[1]/"docs/editorial/research-pack-2026-10/three-pivotal-races-1988.json"
def validate(d):
    errors=[]
    def chk(ok,msg):
        if not ok:errors.append(msg)
    chk(d.get("kind")=="three_race_narrative_evidence_pack" and d.get("season")==1988,"kind/season")
    chk(d.get("visibility")=="internal_only" and d.get("publication_allowed") is False,"publication")
    chk(d.get("status")=="needs_independent_human_review","status")
    rev=d.get("overall_review",{})
    chk(set(rev)=={"historical_human","uk","en","media","publication"} and all(v is False for v in rev.values()),"review flag")
    scenes=d.get("scenes",[])
    chk([s.get("round") for s in scenes]==[3,12,15],"unexpected pivotal race rounds")
    seen=set()
    for scene in scenes:
        chk(scene.get("claim_review")=="needs_human_review" and scene.get("translation_review")=="needs_human_review","scene approval")
        chk(scene.get("editorial_copy_status")=="source_based_draft_only","publication status")
        chk(all(bool(scene.get("title",{}).get(loc)) for loc in ("uk","en")),"missing heading")
        srcs=scene.get("sources",[])
        ids=[s.get("id") for s in srcs]
        chk(bool(srcs) and len(ids)==len(set(ids)),"source ids")
        for src in srcs:
            u=urlparse(src.get("url",""))
            chk(u.scheme=="https" and u.netloc=="www.formula1.com" and bool(src.get("locator")),"invalid source url/locator")
        for claim in scene.get("claims",[]):
            key=claim.get("id")
            chk(key not in seen and bool(key),"duplicate claim id")
            seen.add(key)
            chk(bool(claim.get("en")) and bool(claim.get("uk")),"untranslated claim")
            chk(claim.get("evidence") in ids and bool(claim.get("observed")),"missing evidence mapping")
        chk(len(scene.get("unresolved",[]))>=1,"unresolved questions missing")
    chk(len(seen)>=7,"too few claims")
    return errors
if __name__=="__main__":
    errors=validate(json.loads(FILE.read_text(encoding="utf-8")))
    if errors:raise SystemExit("\n".join(errors))
    print("Validated seven source-located observations across three races; publication blocked.")
