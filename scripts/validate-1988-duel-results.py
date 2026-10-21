#!/usr/bin/env python3
"""Offline structural validation of Senna/Prost 1988 official race ledger."""
import json
from pathlib import Path
DIR=Path(__file__).resolve().parents[1]/"docs/editorial/research-pack-2026-10"
def validate(doc,timeline):
    errors=[]
    def check(ok,msg):
        if not ok:errors.append(msg)
    rows=doc.get("races",[])
    check(doc.get("season")==1988 and doc.get("kind")=="official_f1_driver_race_record_comparison","season/type")
    check(doc.get("publication_allowed") is False and doc.get("visibility")=="internal_only","publication")
    check(len(rows)==16 and [x.get("round") for x in rows]==list(range(1,17)),"rounds")
    check([x.get("grand_prix") for x in rows]==[x["grand_prix"] for x in timeline.get("races",[])],"race names")
    totals={"senna":0,"prost":0}
    for row in rows:
        for k in ("senna","prost"):
            d=row.get(k,{})
            pos=d.get("race_position")
            check(pos=="DNF" or (type(pos) is int and 1<=pos<=26),"position")
            points=d.get("listed_points")
            check(type(points) is int and 0<=points<=9,"points")
            if type(points) is int:totals[k]+=points
            check(d.get("source_id")==f"{k}-driver-1988","source ID")
        check(row.get("claim_status")=="needs_independent_human_review","review")
    check(totals=={"senna":94,"prost":105},"uncorrected race-point total")
    check(doc.get("official_final_standings")=={"senna":90,"prost":87},"official standings")
    check(len(doc.get("sources",[]))==3 and all(s.get("locator") and s.get("url","").startswith("https://www.formula1.com/en/results/1988/") for s in doc.get("sources",[])),"sources")
    review=doc.get("review",{})
    check(set(review)=={"historical_human","uk","en","media","publish"} and all(v is False for v in review.values()),"review gates")
    return errors
def main():
    doc=json.loads((DIR/"season-1988-duel-results.json").read_text())
    timeline=json.loads((DIR/"season-1988-winners.json").read_text())
    errors=validate(doc,timeline)
    if errors:raise SystemExit("\n".join(errors))
    print("Validated 16 official Senna/Prost round records; raw totals 94/105 differ from official 90/87. No approval.")
if __name__=="__main__":main()
