#!/usr/bin/env python3
"""Audit consolidated chapter coverage; never conflate a draft with approval."""
import json
from pathlib import Path
D=Path(__file__).resolve().parents[1]/"docs/editorial/releases/v2"
def load(name):return json.loads((D/name).read_text(encoding="utf-8"))
def validate(coverage,first,second,pilot):
    errors=[]
    by_id={s["id"]:s for s in coverage["subjects"]}
    season_items=first["items"]+second["items"]
    season_ids=[s["subject_id"] for s in season_items]
    if len(season_ids)!=10 or len(set(season_ids))!=10:errors.append("ten unique seasons required")
    section_count=0
    for item in season_items:
        sid=item["subject_id"];section_count+=len(item.get("sections",[]))
        s=by_id.get(sid,{})
        if not s.get("subject_specific_chapter_draft"):errors.append(f"{sid}: missing chapter coverage")
        if s.get("approved") is not False or s.get("published") is not False or item.get("publication") is not False:errors.append(f"{sid}: approval gate")
        if len(item.get("sections",[]))!=3:errors.append(f"{sid}: incomplete chapters")
    pilot_ids={x["subject_id"] for x in pilot["articles"]}
    if len(pilot_ids)!=5:errors.append("pilot chapter count")
    for sid in pilot_ids:
        if not by_id.get(sid,{}).get("subject_specific_chapter_draft"):errors.append(f"{sid}: pilot coverage")
    actual={sid for sid,s in by_id.items() if s.get("subject_specific_chapter_draft")}
    if actual!=set(season_ids)|pilot_ids:errors.append("stale chapter coverage")
    if coverage["totals"].get("expanded_season_draft_subjects")!=10 or coverage["totals"].get("expanded_season_sections")!=section_count or section_count!=30:errors.append("stale season totals")
    return errors
if __name__=="__main__":
    e=validate(load("coverage.json"),load("expanded-season-chapters.json"),load("expanded-season-chapters-batch-2.json"),load("chapter-drafts.json"))
    print("Chapter coverage: "+("; ".join(e) if e else "15 subjects with draft chapters, 30 expanded season sections, 0 approved"))
    raise SystemExit(bool(e))
