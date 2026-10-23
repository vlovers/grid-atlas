#!/usr/bin/env python3
"""Cross-reference five bilingual chapters against source-located season claims."""
import json
from pathlib import Path
D=Path(__file__).resolve().parents[1]/"docs/editorial/releases/v2"
def read(name):return json.loads((D/name).read_text(encoding="utf-8"))
def validate(chapters,research):
    errors=[]
    evidence={x["subject_id"]:{c["id"] for c in x["claims"]} for x in research["items"]}
    items=chapters.get("items",[])
    if len(items)!=5 or len({x["subject_id"] for x in items})!=5 or set(x["subject_id"] for x in items)!=set(evidence):errors.append("wrong subject cohort")
    for item in items:
        sid=item["subject_id"]
        if item.get("review_state")!="pending_independent_human_review" or item.get("publication") is not False:errors.append(f"{sid}: publication gate")
        if len(item.get("sections",[]))!=3:errors.append(f"{sid}: expected three chapters")
        for section in item.get("sections",[]):
            ids=section.get("claim_ids",[])
            if not ids or not set(ids)<=evidence.get(sid,set()):errors.append(f"{sid}: unsupported claim")
            if any(not section.get(k,{}).get(l) for k in ("title","body") for l in ("en","uk")):errors.append(f"{sid}: missing translation")
    return errors
if __name__=="__main__":
    errors=validate(read("expanded-season-chapters-batch-2.json"),read("season-research-batch-2.json"))
    print("Season chapters batch 2: "+("; ".join(errors) if errors else "5 subjects, 15 bilingual sections, unpublished"))
    raise SystemExit(bool(errors))
