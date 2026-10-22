#!/usr/bin/env python3
"""Validate event-specific EN/UK narratives against the underlying result evidence."""
import json
from pathlib import Path
D=Path(__file__).resolve().parents[1]/"docs/editorial/releases/v2"
def read(n):return json.loads((D/n).read_text(encoding="utf-8"))
def validate(drafts,crosschecks):
    errors=[];sources={x["subject_id"]:x for x in crosschecks["items"]}
    items=drafts.get("items",[])
    if len(items)!=11 or {x.get("subject_id") for x in items}!=set(sources):errors.append("story cohort mismatch")
    for item in items:
        sid=item.get("subject_id");source=sources.get(sid)
        if not source:continue
        if item.get("approved") is not False or item.get("published") is not False or item.get("review_state")!="pending_independent_human_review" or item.get("historical_layout_id") is not None:errors.append(f"{sid}: unsafe publication or layout")
        if item.get("source_url")!=source["source"]["url"] or item.get("source_locator")!=source["source"]["locator"]:errors.append(f"{sid}: source mismatch")
        if len(item.get("sections",[]))!=2:errors.append(f"{sid}: missing story scene")
        for section in item.get("sections",[]):
            if section.get("evidence_subject_id")!=sid:errors.append(f"{sid}: wrong evidence")
            for key in ("title","body"):
                value=section.get(key,{})
                if not all(isinstance(value.get(lang),str) and len(value[lang].strip())>=12 for lang in ("en","uk")):errors.append(f"{sid}: missing {key} locale")
        if item.get("kind")!=("constructor_race_story" if sid.startswith("constructor-") else "circuit_race_story"):errors.append(f"{sid}: wrong type")
    return errors
if __name__=="__main__":
    e=validate(read("event-story-drafts.json"),read("official-result-crosschecks.json"))
    print("Event stories: "+("; ".join(e) if e else "11 subjects, 22 bilingual scenes, 0 approved"))
    raise SystemExit(bool(e))
