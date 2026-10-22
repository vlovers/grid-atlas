#!/usr/bin/env python3
"""Fail closed on unreconciled event/venue/constructor associations."""
import json
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"docs/editorial/releases/v2/subject-event-anchors.json"
def validate(d):
    errors=[]
    items=d.get("items",[])
    if len(items)!=11 or len({x.get("subject_id") for x in items})!=11:errors.append("wrong cohort")
    if d.get("status")!="unverified_event_result_leads_unapproved":errors.append("wrong status")
    for item in items:
        sid=item.get("subject_id","?")
        rec=item.get("identity_reconciliation",{})
        if rec.get("status")!="pending" or any(rec.get(k) is not None for k in ("race_id","circuit_id","constructor_id","layout_id")):errors.append(f"{sid}: unsupported canonical association")
        if item.get("scope")!="unverified_event_result_lead" or item.get("review_state")!="pending_independent_human_review" or item.get("published") is not False:errors.append(f"{sid}: publication gate")
        if len(item.get("claims",[]))!=1:errors.append(f"{sid}: claim count")
        for claim in item.get("claims",[]):
            e=claim.get("evidence",{})
            if e.get("kind")!="unverified_official_index_lead" or not e.get("url","").startswith("https://www.formula1.com/en/results/") or not e.get("locator"):errors.append(f"{sid}: ungrounded evidence state")
            if not all(claim.get("text",{}).get(l) for l in ("en","uk")):errors.append(f"{sid}: missing locale")
        ids={c["id"] for c in item["claims"]}
        for section in item.get("sections",[]):
            if not set(section.get("claim_ids",[]))<=ids:errors.append(f"{sid}: orphan claim")
            if not all(section.get("body",{}).get(l) and section.get("title",{}).get(l) for l in ("en","uk")):errors.append(f"{sid}: missing section locale")
    return errors
if __name__=="__main__":
    e=validate(json.loads(P.read_text(encoding="utf-8")))
    print("Event research leads: "+("; ".join(e) if e else "11 unverified leads, all blocked from publication"))
    raise SystemExit(bool(e))
