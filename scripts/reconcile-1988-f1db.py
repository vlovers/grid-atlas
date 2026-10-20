#!/usr/bin/env python3
"""Read-only 1988 F1DB PostgreSQL reconciliation; never alters review status."""
import argparse
import json
import os
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"docs/editorial/research-pack-2026-10/season-1988-winners.json"
SQL="""
BEGIN READ ONLY;
SELECT json_build_object(
 'source_release', (SELECT count(*) FROM source_releases sr JOIN data_sources ds ON ds.id=sr.source_id WHERE ds.slug='f1db' AND sr.release_tag='v2026.17.0'),
 'races', COALESCE((
  SELECT json_agg(json_build_object(
   'round',r.round,'date',r.race_date,'race_name',r.official_name,
   'external_race_id', rei.external_id,
   'results',COALESCE((
    SELECT json_agg(json_build_object(
     'driver_external_id',dei.external_id,
     'driver_name',d.display_name,
     'constructor_external_id',cei.external_id,
     'position',rr.position_number,'position_text',rr.position_text,
     'points',rr.points,'shared_car',rr.shared_car
    ) ORDER BY rr.position_display_order)
    FROM historical_race_results rr
    JOIN historical_drivers d ON d.id=rr.driver_id
    JOIN external_identities dei ON dei.id=d.external_identity_id
    JOIN historical_constructors c ON c.id=rr.constructor_id
    JOIN external_identities cei ON cei.id=c.external_identity_id
    WHERE rr.race_id=r.id AND dei.external_id IN ('ayrton-senna','alain-prost','gerhard-berger')
   ),'[]'::json)) ORDER BY r.round)
  FROM historical_races r
  JOIN external_identities rei ON rei.id=r.external_identity_id
  WHERE r.season_year=1988
 ),'[]'::json)
);
ROLLBACK;
"""

def verify(source, payload):
    problems=[]
    def check(ok,msg):
        if not ok:problems.append(msg)
    races=payload.get("races") or []
    expected=source["races"]
    check(payload.get("source_release",0)>=1,"missing pinned F1DB source-release registration")
    check(len(races)==16,"imported season does not have exactly 16 races")
    by_round={r.get("round"):r for r in races}
    check(len(by_round)==len(races),"duplicate imported rounds")
    summary=[]
    winner_counts={"ayrton-senna":0,"alain-prost":0,"gerhard-berger":0}
    for e in expected:
        n=e["round"]
        actual=by_round.get(n)
        if not actual:
            problems.append(f"missing round {n}");continue
        date=str(actual.get("date"))
        check(date==e["date"],f"round {n}: date differs ({date})")
        results=actual.get("results") or []
        winners=[row for row in results if row.get("position")==1]
        # Imported observations do not always identify a unique official winner.
        observed={row.get("driver_external_id") for row in winners}
        expected_key=e["winner_key"]
        check(expected_key in observed,f"round {n}: expected winner absent from result position 1: {sorted(str(s) for s in observed)}")
        # Check exact row availability for both drivers; missing is an explicit gap.
        driver_rows={key:[row for row in results if row.get("driver_external_id")==key] for key in ("ayrton-senna","alain-prost")}
        for key,rows in driver_rows.items():
            check(bool(rows),f"round {n}: missing imported result for {key}")
        if expected_key in observed:winner_counts[expected_key]+=1
        summary.append({"round":n,"grand_prix":e["grand_prix"],"date":date,"external_race_id":actual.get("external_race_id"),"driver_results":driver_rows,"winner_match":expected_key in observed})
    check(winner_counts=={"ayrton-senna":8,"alain-prost":7,"gerhard-berger":1},f"winner distribution parity failed: {winner_counts}")
    return {"season":1988,"import":"F1DB v2026.17.0","race_records_compared":len(summary),"winner_matches":winner_counts,"rows":summary,"problems":problems,"historical_source_human_review":False,"championship_points_reconciled":False,"publishable":False}

def query(database_url):
    # psql's ON_ERROR_STOP and read-only transaction prevent accidental mutations.
    proc=subprocess.run(["psql",database_url,"-X","-A","-t","-v","ON_ERROR_STOP=1","-c",SQL],capture_output=True,text=True,check=True)
    lines=[s for s in proc.stdout.splitlines() if s.startswith("{")]
    if len(lines)!=1:raise RuntimeError("expected exactly one JSON payload from psql")
    return json.loads(lines[0])

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--database-url",default=os.environ.get("DATABASE_URL"))
    ap.add_argument("--output",help="optional JSON diagnostics report")
    args=ap.parse_args()
    if not args.database_url:ap.error("DATABASE_URL or --database-url required")
    source=json.loads(SOURCE.read_text(encoding="utf-8"))
    report=verify(source,query(args.database_url))
    text=json.dumps(report,indent=2,ensure_ascii=False)+"\n"
    if args.output:Path(args.output).write_text(text,encoding="utf-8")
    print(text)
    if report["problems"]:raise SystemExit(1)
if __name__=="__main__":main()
