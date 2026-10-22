#!/usr/bin/env python3
"""Validate additional source-located season research, not historical truth."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PATH=ROOT/"docs/editorial/releases/v2/season-research.json"
def validate(data):
    errors=[]
    if data.get("status")!="source_located_season_research_unapproved":errors.append("invalid research status")
    items=data.get("items",[])
    if {x.get("subject_id") for x in items}!={"season-1976","season-2008","season-2012","season-2021"}:errors.append("unexpected season coverage")
    for item in items:
        sid=item.get("subject_id")
        if item.get("review_state")!="unapproved_research" or item.get("publication") is not False:errors.append(f"{sid}: false approval")
        claims={c.get("id") for c in item.get("claim_records",[])}
        if not claims:errors.append(f"{sid}: no claims")
        for claim in item.get("claim_records",[]):
            src=claim.get("source",{})
            if not src.get("url","").startswith("https://") or not src.get("locator") or not src.get("accessed_on"):errors.append(f"{sid}: missing source")
            if not all(claim.get("text",{}).get(lang) for lang in ("en","uk")):errors.append(f"{sid}: missing claim translation")
        for sec in item.get("editorial_sections",[]):
            if not set(sec.get("claim_ids",[]))<=claims:errors.append(f"{sid}: orphan claim reference")
            for lang in ("en","uk"):
                if not sec.get("title",{}).get(lang) or not sec.get("body",{}).get(lang):errors.append(f"{sid}: missing chapter translation")
    return errors
if __name__=="__main__":
    errors=validate(json.loads(PATH.read_text(encoding="utf-8")))
    print("Season research: "+("; ".join(errors) if errors else "4 bilingual sourced seasons, unapproved"))
    raise SystemExit(bool(errors))
