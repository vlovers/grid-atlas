#!/usr/bin/env python3
"""Prepare 50 unpublished driver research profiles from a checksum-verified F1DB release."""
import argparse
import json
import sys
import zipfile
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from scripts.prepare_editorial_batch import build_packets,extract_result_observations
from scripts.validate_editorial_batch import validate,validate_source_ids

def existing_ids(directory):
    used=set()
    for file in sorted(directory.glob("*.json")):
        payload=json.loads(file.read_text(encoding="utf-8"))
        if isinstance(payload,dict) and isinstance(payload.get("drivers"),list):
            for driver in payload["drivers"]:
                if isinstance(driver, str):
                    used.add(driver)
                elif isinstance(driver, dict):
                    canonical_id = driver.get("driver_id") or driver.get("id")
                    if isinstance(canonical_id, str):
                        used.add(canonical_id)
                else:
                    raise ValueError(f"Unexpected driver entry in {file}")
    return used

def plan(driver_rows, results,excluded,size=50):
    known={driver_id for driver_id,_,_ in driver_rows}
    counts=Counter(x for x in results if x in known and x not in excluded)
    ranked=sorted(counts,key=lambda x:(-counts[x],x))
    if len(ranked)<size:raise ValueError("Not enough eligible drivers with race results")
    chosen=ranked[:size]
    if len(set(chosen))!=size or excluded.intersection(chosen):raise ValueError("selection uniqueness violation")
    return chosen,counts

def load_results(archive):
    with zipfile.ZipFile(archive) as z:
        names=[n for n in z.namelist() if Path(n).name=="f1db-races-race-results.json"]
        if len(names)!=1:raise ValueError("Expected exactly one race results table")
        rows=json.loads(z.read(names[0]))
    if not isinstance(rows,list):raise ValueError("Invalid result collection")
    ids=[]
    for row in rows:
        if not isinstance(row,dict) or not isinstance(row.get("driverId"),str):
            raise ValueError("Invalid race result driver")
        ids.append(row["driverId"])
    return ids

def run(archive,checksums,output):
    importer=ROOT/"packages"/"data-importer"
    sys.path.insert(0,str(importer))
    from import_drivers import read_drivers
    from import_races import read_races
    from import_teams_circuits import read_entities
    driver_rows,_=read_drivers(archive,checksums)
    excluded=existing_ids(ROOT/"docs/editorial/batches")
    chosen,counts=plan(driver_rows,load_results(archive),excluded)
    manifest={"batch_id":"bulk-fifty-drivers-2026-10","source":{"name":"f1db","release":"v2026.17.0"},"drivers":chosen,"locale_targets":["en","uk"],"review_status":"needs_review","created_at":"2026-10-21","reviewer":None}
    validate(manifest)
    validate_source_ids(manifest,{x[0] for x in driver_rows})
    observations=extract_result_observations(archive,set(chosen))
    race_rows,_=read_races(archive,checksums)
    races_by_id={int(row[0]):int(row[1]) for row in race_rows}
    entities,_=read_entities(archive,checksums)
    constructors={entity_id:name for kind,entity_id,name,_hash in entities if kind=="constructor"}
    packets=build_packets(manifest,driver_rows,observations,races_by_id,constructors)
    if len(packets["profiles"])!=50:raise ValueError("incomplete cohort")
    report={"source_release":"v2026.17.0","selection":"top 50 by count of F1DB race-result rows, excluding existing batches; ties by canonical ID","excluded_existing_driver_count":len(excluded),"research_profiles":len(packets["profiles"]),"approved_biographies":0,"publications":0,"selected":[{"driver_id":x,"result_rows":counts[x]} for x in chosen],"review_status":"needs_review","publication_allowed":False}
    output.mkdir(parents=True,exist_ok=True)
    for name,payload in (("manifest.json",manifest),("research-profiles.json",packets),("coverage.json",report)):
        (output/name).write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Prepared 50 unpublished profiles / {sum(counts[x] for x in chosen)} race-result rows; zero biographies approved")
    return report

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--archive",type=Path,required=True)
    p.add_argument("--checksums",type=Path,required=True)
    p.add_argument("--output",type=Path,required=True)
    args=p.parse_args()
    run(args.archive,args.checksums,args.output)
