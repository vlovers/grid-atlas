#!/usr/bin/env python3
"""Read-only F1DB event-lead reconciliation, with candidate-level source identities.

Never auto-verifies a claim or changes publication state.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
import zipfile

ROOT=Path(__file__).resolve().parents[1]
LEADS=ROOT/"docs/editorial/releases/v2/subject-event-anchors.json"
EXPECTED_SHA256="0f1717eaebae646b7ced9ca96f6be3282c1c1d435d0a9d75f2c00f40feb7d2a8"

def rows(bundle,name):
    matches=[n for n in bundle.namelist() if Path(n).name==name]
    if len(matches)!=1:raise ValueError(f"Expected exactly one {name}")
    data=json.loads(bundle.read(matches[0]))
    if not isinstance(data,list):raise ValueError(f"Expected array: {name}")
    return data

def reconcile(leads,races,results):
    """Enumerate *all* races in lead year; never infer circuit or constructor from title."""
    by_race={}
    for result in results:
        by_race.setdefault(result["raceId"],[]).append(result)
    by_year={}
    for race in races:by_year.setdefault(race["year"],[]).append(race)
    output=[]
    seen=set()
    for item in leads["items"]:
        subject=item["subject_id"]
        if subject in seen:raise ValueError(f"Duplicate lead subject: {subject}")
        seen.add(subject)
        claim=item["claims"][0]
        match=re.search(r"-(19\d{2}|20\d{2})-winner$",claim["id"])
        if not match:raise ValueError(f"Lead ID has no unambiguous year: {claim['id']}")
        year=int(match.group(1))
        candidates=[]
        for race in sorted(by_year.get(year,[]),key=lambda r:(r["round"],r["id"])):
            winner_rows=[x for x in by_race.get(race["id"],[]) if x.get("positionNumber")==1]
            candidates.append({"race_id":race["id"],"year":year,"round":race["round"],"date":race["date"],"official_name":race["officialName"],"circuit_external_id":race["circuitId"],"winning_results":[{"driver_external_id":x["driverId"],"constructor_external_id":x["constructorId"],"position_display_order":x["positionDisplayOrder"]} for x in winner_rows]})
        output.append({"subject_id":subject,"lead_id":claim["id"],"status":"candidate_races_only","year":year,"candidate_count":len(candidates),"candidate_races":candidates,"editorial_review_required":True})
    return output

def verify_manifest(manifest,digest):
    for line in manifest.splitlines():
        parts=line.strip().split()
        if len(parts)==2 and parts[0].lower()==digest and parts[1].lstrip("*").removeprefix("./")=="f1db-json-splitted.zip":
            return
    raise ValueError("Official checksum manifest has no matching asset/digest line")

def report(archive,manifest,leads):
    hasher=hashlib.sha256()
    with open(archive,"rb") as stream:
        for chunk in iter(lambda:stream.read(1024*1024),b""):hasher.update(chunk)
    digest=hasher.hexdigest()
    if digest!=EXPECTED_SHA256:raise ValueError("Pinned ZIP SHA-256 mismatch")
    verify_manifest(Path(manifest).read_text(encoding="utf-8"),digest)
    with zipfile.ZipFile(archive) as z:
        races=rows(z,"f1db-races.json")
        results=rows(z,"f1db-races-race-results.json")
    if len(races)!=1172 or len(results)!=27665:raise ValueError("Pinned archive row count mismatch")
    return {"schema_version":1,"archive_sha256":digest,"status":"candidate_only_not_verified","method":"year-scoped enumeration of race/result external IDs; no automatic venue, constructor or layout match","items":reconcile(leads,races,results)}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--archive",required=True)
    parser.add_argument("--checksums",required=True)
    parser.add_argument("--output",required=True)
    args=parser.parse_args()
    leads=json.loads(LEADS.read_text(encoding="utf-8"))
    result=report(args.archive,args.checksums,leads)
    Path(args.output).write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Wrote {len(result['items'])} candidate lists; no claims verified or published")

if __name__=="__main__":
    try:main()
    except (ValueError,OSError,KeyError,TypeError,zipfile.BadZipFile) as exc:
        print(f"Reconciliation blocked: {exc}",file=sys.stderr)
        sys.exit(1)
