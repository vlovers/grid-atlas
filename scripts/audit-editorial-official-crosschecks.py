#!/usr/bin/env python3
"""Validate official Formula 1 cross-check provenance against canonical archive IDs."""
import json
from pathlib import Path
D=Path(__file__).resolve().parents[1]/"docs/editorial/releases/v2"
def read(n):return json.loads((D/n).read_text(encoding="utf-8"))
def validate(claims,archive):
    errors=[]
    expected={x["subject_id"]:x for x in archive["items"]}
    items=claims.get("items",[])
    if len(items)!=11 or {x.get("subject_id") for x in items}!=set(expected):errors.append("cross-check cohort mismatch")
    for item in items:
        sid=item.get("subject_id","?")
        if item.get("published") is not False or item.get("editorial_review")!="pending_independent_human_review":errors.append(f"{sid}: unsafe publication state")
        url=item.get("source",{}).get("url","")
        if not url.startswith("https://www.formula1.com/en/results/") or not item["source"].get("locator"):errors.append(f"{sid}: missing official source")
        if not item.get("winner") or not item.get("team") or not isinstance(item.get("winning_laps"),int):errors.append(f"{sid}: missing result")
        if sid not in expected:continue
        if str(expected[sid]["year"]) not in url:errors.append(f"{sid}: wrong source year")
        if item.get("runner_up") and not item.get("third_place"):errors.append(f"{sid}: partial podium")
    return errors
if __name__=="__main__":
    e=validate(read("official-result-crosschecks.json"),read("archive-matched-event-identities.json"))
    print("Official result crosschecks: "+("; ".join(e) if e else "11 sourced comparisons; none approved for publication"))
    raise SystemExit(bool(e))
