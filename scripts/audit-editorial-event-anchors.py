#!/usr/bin/env python3
"""Validate 11 evidence-linked constructor and circuit event anchors."""
import json
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"docs/editorial/releases/v2/subject-event-anchors.json"
def validate(d):
    errors=[]
    items=d.get("items",[])
    if len(items)!=11 or len({i.get("subject_id") for i in items})!=11:errors.append("wrong subject count")
    if d.get("status")!="source_located_event_anchors_unapproved":errors.append("invalid research state")
    for item in items:
        sid=item.get("subject_id")
        if item.get("review_state")!="pending_independent_human_review" or item.get("published") is not False:errors.append(f"{sid}: false approval")
        claims={c.get("id") for c in item.get("claims",[])}
        if len(claims)!=1:errors.append(f"{sid}: missing or duplicate evidence")
        for c in item.get("claims",[]):
            e=c.get("evidence",{})
            if not e.get("url","").startswith("https://www.formula1.com/en/results/") or not e.get("locator") or not e.get("accessed"):errors.append(f"{sid}: missing source")
            if not all(c.get("text",{}).get(l) for l in ("en","uk")):errors.append(f"{sid}: missing translation")
        for section in item.get("sections",[]):
            if not set(section.get("claim_ids",[]))<=claims:errors.append(f"{sid}: orphan claim")
            for l in ("en","uk"):
                if not section.get("title",{}).get(l) or not section.get("body",{}).get(l):errors.append(f"{sid}: missing section translation")
    return errors
if __name__=="__main__":
    errors=validate(json.loads(P.read_text(encoding="utf-8")))
    print("Event anchors: "+("; ".join(errors) if errors else "11 bilingual subjects, 11 official-result source leads, unapproved"))
    raise SystemExit(bool(errors))
