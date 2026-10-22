#!/usr/bin/env python3
"""Check pinned-archive event identity evidence against the original 11 research leads."""
import json,re
from pathlib import Path
D=Path(__file__).resolve().parents[1]/"docs/editorial/releases/v2"
def read(name):return json.loads((D/name).read_text(encoding="utf-8"))
def validate(evidence,leads):
    errors=[]
    expected={x["subject_id"]:x for x in leads["items"]}
    items=evidence.get("items",[])
    if len(items)!=11 or {x.get("subject_id") for x in items}!=set(expected):errors.append("event cohort mismatch")
    if evidence.get("status")!="pinned_archive_event_identity_matches_not_editorially_approved":errors.append("unsafe status")
    source=evidence.get("source",{})
    if source.get("artifact_id")!=12412077337 or source.get("workflow_run_id")!=39747904966:errors.append("missing artifact provenance")
    for item in items:
        sid=item.get("subject_id","?")
        if item.get("approved") is not False or item.get("published") is not False or item.get("editorial_status")!="requires_independent_source_review" or item.get("historical_layout_id") is not None:errors.append(f"{sid}: review or layout gate")
        if item.get("identity_status")!="matched_in_pinned_archive" or not isinstance(item.get("race_id"),int) or not isinstance(item.get("round"),int):errors.append(f"{sid}: invalid race identity")
        if not item.get("date","").startswith(str(item.get("year"))):errors.append(f"{sid}: year mismatch")
        if not item.get("official_name") or not item.get("circuit_external_id") or not item.get("winner",{}).get("driver_external_id") or not item.get("winner",{}).get("constructor_external_id"):errors.append(f"{sid}: incomplete event")
        claim=expected.get(sid,{}).get("claims",[{}])[0]
        m=re.search(r"-(19\d{2}|20\d{2})-winner$",claim.get("id",""))
        if m and int(m.group(1))!=item.get("year"):errors.append(f"{sid}: lead year mismatch")
        if sid.startswith("constructor-") and item.get("winner",{}).get("constructor_external_id") not in {"williams","mercedes","red-bull"}:errors.append(f"{sid}: constructor not associated with winner")
    return errors
if __name__=="__main__":
    e=validate(read("archive-matched-event-identities.json"),read("subject-event-anchors.json"))
    print("Pinned archive event matches: "+("; ".join(e) if e else "11 source-linked events; 0 independently approved"))
    raise SystemExit(bool(e))
