#!/usr/bin/env python3
"""Editorial review queue for 1988. Structural completeness is not publication readiness."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DIR=ROOT/"docs/editorial/research-pack-2026-10"
def load(name):return json.loads((DIR/name).read_text(encoding="utf-8"))
def build():
    timeline=load("season-1988-winners.json")
    pivotal=load("three-pivotal-races-1988.json")
    other=load("remaining-1988-race-scenes.json")
    source_claims=load("senna-prost-source-observations.json")
    race_by_round={r["round"]:r for r in timeline["races"]}
    items=[]
    for s in pivotal["scenes"]:
        for c in s["claims"]:
            items.append({"id":c["id"],"round":s["round"],"scope":"pivotal_record_claim","en":c["en"],"uk":c["uk"],"sources":[x for x in s["sources"] if x["id"]==c["evidence"]],"review_required":["historical_context","translation_uk","translation_en","source_locator"],"approved":False})
    for s in other["scenes"]:
        row=race_by_round[s["round"]]
        items.append({"id":f"1988-round-{row['round']:02}-winner-sequence","round":row["round"],"scope":"winner_sequence_caption","en":s["draft_microcopy"]["en"],"uk":s["draft_microcopy"]["uk"],"sources":[timeline["source"]],"review_required":["source_row","translation_uk","translation_en"],"approved":False})
    for c in source_claims["claims"]:
        items.append({"id":c["id"],"round":None,"scope":"season_crosscutting_claim","en":c["en"],"uk":c["uk"],"sources":[s for s in source_claims["sources"] if s["id"] in c["source_ids"]],"review_required":["historical_context","translation_uk","translation_en","archive_metric_semantics"],"approved":False})
    identifiers=[item["id"] for item in items]
    if len(identifiers)!=len(set(identifiers)):raise ValueError("duplicate claim review item IDs")
    if len(items)!=24:raise ValueError(f"expected 7 pivotal + 13 short + 4 crosscutting claims; got {len(items)}")
    if any(not i["en"] or not i["uk"] or not i["sources"] for i in items):raise ValueError("missing content or source")
    return {"schema_version":1,"season":1988,"status":"editorial_review_queue_not_approved","publication_allowed":False,"human_reviewed":False,"claim_count":len(items),"unapproved_count":len(items),"items":items,"release_blockers":["24 claim/caption source and language reviews","independent historical interpretation checks","licensed and attributed assets","approved publication workflow per locale"],"archive_note":"F1DB parity tests validate result-row agreement, not publication approval."}
def main():
    import argparse
    p=argparse.ArgumentParser()
    p.add_argument("--output",type=Path,required=True)
    args=p.parse_args()
    report=build()
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Built {report['claim_count']} unapproved review tasks.")
if __name__=="__main__":main()
