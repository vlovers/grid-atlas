#!/usr/bin/env python3
"""Check five additional researched seasons; structural, not editorial approval."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FILE=ROOT/"docs/editorial/releases/v2/season-research-batch-2.json"
def validate(data):
    errors=[]
    if data.get("status")!="source_located_season_research_unapproved":errors.append("invalid status")
    items=data.get("items",[])
    if {i.get("subject_id") for i in items}!={f"season-{y}" for y in (1950,1961,1984,1994,2000)}:errors.append("cohort mismatch")
    for item in items:
        sid=item.get("subject_id")
        if item.get("review_state")!="unapproved_research" or item.get("published") is not False:errors.append(f"{sid}: false approval")
        claims={c.get("id") for c in item.get("claims",[])}
        if not claims:errors.append(f"{sid}: missing claims")
        for c in item.get("claims",[]):
            src=c.get("source",{})
            if not src.get("url","").startswith("https://") or not src.get("locator") or not src.get("accessed_on"):errors.append(f"{sid}: missing evidence")
            if not all(c.get("text",{}).get(l) for l in ("en","uk")):errors.append(f"{sid}: missing claim locale")
        for ch in item.get("chapters",[]):
            if not ch.get("claim_ids") or not set(ch["claim_ids"])<=claims:errors.append(f"{sid}: unlinked chapter")
            for l in ("en","uk"):
                if not ch.get("title",{}).get(l) or not ch.get("body",{}).get(l):errors.append(f"{sid}: missing chapter locale")
    return errors
if __name__=="__main__":
    errors=validate(json.loads(FILE.read_text(encoding="utf-8")))
    print("Five season dossiers: "+("; ".join(errors) if errors else "structurally complete; all unapproved"))
    raise SystemExit(bool(errors))
