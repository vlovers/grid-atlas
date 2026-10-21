#!/usr/bin/env python3
"""Generate unapproved 1988 round-by-round championship story chart data."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FILE=ROOT/"docs/editorial/research-pack-2026-10/season-1988-duel-results.json"
def chart(doc):
    races=doc["races"]
    if len(races)!=16 or [r["round"] for r in races]!=list(range(1,17)):
        raise ValueError("expected sixteen ordered rounds")
    history={"senna":[],"prost":[]}
    result=[]
    for race in races:
        item={"round":race["round"],"grand_prix":race["grand_prix"]}
        for pilot in ("senna","prost"):
            v=race[pilot]["listed_points"]
            if type(v) is not int or not 0<=v<=9:raise ValueError("invalid points")
            history[pilot].append(v)
            item[pilot]={
                "race_points":v,
                "raw_cumulative":sum(history[pilot]),
                "best_eleven_cumulative":sum(sorted(history[pilot],reverse=True)[:11]),
                "counted_results":min(len(history[pilot]),11),
                "discarded_points_to_date":sum(history[pilot])-sum(sorted(history[pilot],reverse=True)[:11])
            }
        item["best_eleven_margin_senna_minus_prost"]=item["senna"]["best_eleven_cumulative"]-item["prost"]["best_eleven_cumulative"]
        result.append(item)
    if (result[-1]["senna"]["best_eleven_cumulative"],result[-1]["prost"]["best_eleven_cumulative"])!=(90,87):
        raise ValueError("final results diverge from official standings")
    return {"schema_version":1,"season":1988,"kind":"internal_championship_chart_research","source":"F1 official 1988 driver race rows","publication_allowed":False,"human_editor_approved":False,"chart_semantics":{"best_eleven_cumulative":"At each round, sum the eleven largest result-point values recorded so far; not an independently documented contemporaneous official standing.","raw_cumulative":"Sum all race-point values including results not counted toward final championship."},"series":result}
if __name__=="__main__":
    print(json.dumps(chart(json.loads(FILE.read_text(encoding="utf-8"))),ensure_ascii=False,indent=2))
