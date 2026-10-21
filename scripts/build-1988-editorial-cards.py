#!/usr/bin/env python3
"""Create nonpublic bilingual 1988 race cards ONLY from successful F1DB parity evidence."""
import argparse
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
TIMELINE=ROOT/"docs/editorial/research-pack-2026-10/season-1988-winners.json"
DRIVERS=("ayrton-senna","alain-prost")
def build_cards(timeline,report):
    problems=[]
    if report.get("problems"):problems.append("reconciliation reported discrepancies")
    if report.get("publishable") is not False or report.get("historical_source_human_review") is not False or report.get("championship_points_reconciled") is not False:
        problems.append("parity report must retain explicit unapproved provenance flags")
    if report.get("race_records_compared") != 16:
        problems.append("parity report must cover exactly 16 imported records")
    if report.get("winner_matches") != {"ayrton-senna":8,"alain-prost":7,"gerhard-berger":1}:
        problems.append("winner reconciliation summary differs")
    if report.get("season")!=1988 or report.get("import")!="F1DB v2026.17.0":problems.append("wrong archive/season")
    rows=report.get("rows",[])
    expected=timeline.get("races",[])
    if len(rows)!=16 or len(expected)!=16:problems.append("requires exactly 16 paired rounds")
    indexed={row.get("round"):row for row in rows}
    if len(indexed)!=len(rows):problems.append("duplicate rounds")
    cards=[]
    for race in expected:
        n=race["round"]
        row=indexed.get(n)
        if row is None:
            problems.append(f"missing round {n}");continue
        if row.get("date")!=race["date"] or row.get("grand_prix")!=race["grand_prix"] or row.get("winner_match") is not True:
            problems.append(f"round {n} disagrees with source timeline")
        race_id=row.get("external_race_id")
        if race_id is None or str(race_id).strip()=="":
            problems.append(f"round {n} missing canonical race reference")
        entries=row.get("driver_results",{})
        rendered={}
        for driver in DRIVERS:
            records=entries.get(driver)
            if not isinstance(records,list) or len(records)!=1:
                problems.append(f"round {n}: expected one {driver} result row")
                continue
            record=records[0]
            if record.get("driver_external_id")!=driver:problems.append(f"round {n}: driver identity mismatch")
            rendered[driver]={
                "position_number":record.get("position"),
                "position_text":record.get("position_text"),
                "points_from_result_row":record.get("points"),
                "constructor_external_id":record.get("constructor_external_id"),
                "shared_car":record.get("shared_car"),
            }
        cards.append({
            "round":n,"grand_prix":race["grand_prix"],"date":race["date"],
            "source_race_external_id":str(race_id) if race_id is not None else None,
            "winner_external_id":race["winner_key"],"drivers":rendered,
            "headings":{"en":f"Round {n}: {race['grand_prix']}","uk":f"Етап {n}: {race['grand_prix']}"},
            "record_status":"f1db_import_matched_not_independently_historically_verified",
            "historical_narrative":None
        })
    if len(cards)!=16:problems.append("card coverage incomplete")
    ids=[c["source_race_external_id"] for c in cards]
    if len(set(ids)) != len(ids):problems.append("duplicate canonical race references")
    if problems:raise ValueError("; ".join(problems))
    return {
        "schema_version":1,"type":"nonpublic_race_card_research_bundle",
        "source":"pinned F1DB v2026.17.0 imported PostgreSQL + official 1988 winner chronology",
        "season":1988,"locales":["uk","en"],"review_status":"needs_independent_human_review",
        "publication_allowed":False,"championship_standings_derived":False,
        "canonical_numeric_url_assumed":False,"cards":cards,
        "warnings":["Result-row points do not establish official drivers' standings.","Result associations are not contracts or legal team lineage.","No contextual race narratives, quotes or media have been approved."]
    }
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--parity",type=Path,required=True,help="JSON report from reconcile-1988-f1db.py")
    ap.add_argument("--output",type=Path,required=True,help="Nonpublic JSON research file; never put in public web assets")
    args=ap.parse_args()
    timeline=json.loads(TIMELINE.read_text(encoding="utf-8"))
    parity=json.loads(args.parity.read_text(encoding="utf-8"))
    bundle=build_cards(timeline,parity)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(bundle,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Built {len(bundle['cards'])} internal-only 1988 race cards.")
if __name__=="__main__":main()
