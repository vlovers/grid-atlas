#!/usr/bin/env python3
"""Validate current editorial coverage against all three evidence datasets."""
import json
from pathlib import Path
D=Path(__file__).resolve().parents[1]/"docs/editorial/releases/v2"
def read(name):return json.loads((D/name).read_text(encoding="utf-8"))
def validate(coverage,pilots,season1,season2):
    errors=[]
    records={}
    for item in pilots["items"]:
        records[item["subject_id"]]=(len(item["claims"]),"chapter_draft")
    for dataset,key in ((season1,"claim_records"),(season2,"claims")):
        for item in dataset["items"]:
            sid=item["subject_id"]
            if sid in records:errors.append(f"duplicate subject {sid}")
            records[sid]=(len(item[key]),"sourced_research")
    subjects=coverage["subjects"]
    if len(subjects)!=25 or len({s["id"] for s in subjects})!=25:errors.append("cohort identity mismatch")
    for s in subjects:
        sid=s["id"];v=records.get(sid);expected=v or (0,"framework_only")
        if s.get("research_stage")!=expected[1] or s.get("source_located_claims")!=expected[0]:errors.append(f"{sid}: stale coverage")
        if s.get("source_located_pilot")!=bool(v) or s.get("framework_only")!= (not bool(v)):errors.append(f"{sid}: incorrect research state")
        if s.get("approved") is not False or s.get("published") is not False:errors.append(f"{sid}: false approval")
    totals={"subjects":25,"source_located_subjects":len(records),"source_located_claims":sum(v[0] for v in records.values()),"chapter_draft_subjects":sum(v[1]=="chapter_draft" for v in records.values()),"framework_only":25-len(records),"approved":0,"published":0}
    if coverage.get("totals")!=totals:errors.append("stale totals")
    return errors
if __name__=="__main__":
    errors=validate(read("coverage.json"),read("pilot-research.json"),read("season-research.json"),read("season-research-batch-2.json"))
    print("Current coverage: "+("; ".join(errors) if errors else "14 researched subjects, 31 claims, 11 frameworks, 0 approved"))
    raise SystemExit(bool(errors))
