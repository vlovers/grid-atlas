#!/usr/bin/env python3
"""Cross-reference bilingual season chapters to existing sourced claim records."""
import json
from pathlib import Path
D=Path(__file__).resolve().parents[1]/"docs/editorial/releases/v2"
def read(n):return json.loads((D/n).read_text(encoding="utf-8"))
def validate(chapters,pilot,seasons):
    errors=[]
    evidence={x["subject_id"]:{c["id"] for c in x.get("claims",[])} for x in pilot["items"]}
    evidence.update({x["subject_id"]:{c["id"] for c in x["claim_records"]} for x in seasons["items"]})
    items=chapters.get("items",[])
    if len(items)!=5 or len({x["subject_id"] for x in items})!=5:errors.append("wrong season cohort")
    for item in items:
        sid=item["subject_id"]
        if item.get("review_state")!="pending_independent_human_review" or item.get("publication") is not False:errors.append(f"{sid}: false publication")
        if len(item.get("sections",[]))!=3:errors.append(f"{sid}: missing chapters")
        for section in item.get("sections",[]):
            ids=section.get("claim_ids",[])
            if not ids or not set(ids)<=evidence.get(sid,set()):errors.append(f"{sid}: unsupported claim reference")
            if any(not section.get(field,{}).get(locale) for field in ("title","body") for locale in ("en","uk")):errors.append(f"{sid}: incomplete locale")
    return errors
if __name__=="__main__":
    errors=validate(read("expanded-season-chapters.json"),read("pilot-research.json"),read("season-research.json"))
    print("Season chapters: "+("; ".join(errors) if errors else "5 bilingual narratives, 15 sourced sections, all unapproved"))
    raise SystemExit(bool(errors))
