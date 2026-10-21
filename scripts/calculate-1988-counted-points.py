#!/usr/bin/env python3
"""1988 drivers' championship best-eleven scoring research model.

Source provenance and manual historical approval are separate from arithmetic.
"""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"docs/editorial/research-pack-2026-10/season-1988-duel-results.json"
EXPECTED={"senna":{"raw":94,"counted":90},"prost":{"raw":105,"counted":87}}
def calculate(doc):
    rows=doc.get("races",[])
    if len(rows)!=16 or [r.get("round") for r in rows]!=list(range(1,17)):
        raise ValueError("16 ordered race records required")
    result={}
    for driver in ("senna","prost"):
        vals=[]
        for r in rows:
            p=r.get(driver,{}).get("listed_points")
            if type(p) is not int or p<0 or p>9:
                raise ValueError(f"invalid {driver} race points, round {r.get('round')}")
            vals.append({"round":r["round"],"points":p})
        ordered=sorted(vals,key=lambda v:(-v["points"],v["round"]))
        counted=ordered[:11]
        dropped=ordered[11:]
        result[driver]={
            "uncorrected_points":sum(v["points"] for v in vals),
            "counted_championship_points":sum(v["points"] for v in counted),
            "counted_rounds":sorted(v["round"] for v in counted),
            "discarded_rounds":sorted(v["round"] for v in dropped),
            "discarded_points":sum(v["points"] for v in dropped)
        }
        e=EXPECTED[driver]
        if result[driver]["uncorrected_points"]!=e["raw"] or result[driver]["counted_championship_points"]!=e["counted"]:
            raise ValueError("reconciliation mismatch for "+driver)
    return {
        "schema_version":1,"season":1988,"rule":"best_11_of_16_driver_race_results",
        "source_research_status":"historical_rule_requires_independent_primary_regulatory_review",
        "f1_official_final_standings_reference":"https://www.formula1.com/en/results/1988/drivers",
        "reviewed_by_human":False,"publication_allowed":False,
        "calculations":result
    }
if __name__=="__main__":
    output=calculate(json.loads(DATA.read_text(encoding="utf-8")))
    print(json.dumps(output,ensure_ascii=False,indent=2))
