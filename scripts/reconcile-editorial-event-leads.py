#!/usr/bin/env python3
"""Read-only event-lead reconciliation against a checksum-pinned F1DB archive.

Never approves an editorial claim. A GP label alone is not a circuit identity.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import zipfile

LEADS=Path(__file__).resolve().parents[1]/"docs/editorial/releases/v2/subject-event-anchors.json"
EXPECTED_SHA256="0f1717eaebae646b7ced9ca96f6be3282c1c1d435d0a9d75f2c00f40feb7d2a8"

def rows(bundle,name):
    matches=[n for n in bundle.namelist() if Path(n).name==name]
    if len(matches)!=1:raise ValueError(f"Expected one {name}, found {len(matches)}")
    data=json.loads(bundle.read(matches[0]))
    if not isinstance(data,list):raise ValueError(f"{name} must be an array")
    return data

def reconcile(leads,races,results):
    by_race={}
    for result in results:by_race.setdefault(result["raceId"],[]).append(result)
    output=[]
    for item in leads["items"]:
        claim=item["claims"][0]
        # The year is encoded in our own lead ID; it is not a source assertion.
        year=int(claim["id"].rsplit("-",2)[-2])
        candidates=[]
        for race in races:
            if race["year"]!=year:continue
            finishers=[x for x in by_race.get(race["id"],[]) if x.get("positionNumber")==1]
            candidates.append({"race_id":race["id"],"year":year,"round":race["round"],"date":race["date"],"official_name":race["officialName"],"circuit_external_id":race["circuitId"],"winning_results":[{"driver_external_id":x["driverId"],"constructor_external_id":x["constructorId"],"position_display_order":x["positionDisplayOrder"]} for x in finishers]})
        output.append({"subject_id":item["subject_id"],"lead_id":claim["id"],"status":"candidate_races_only","year":year,"candidate_races":candidates,"editorial_review_required":True})
    return output

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--archive",required=True,help="Pinned f1db-json-splitted.zip")
    p.add_argument("--checksums",required=True,help="Official checksums_sha256.txt")
    p.add_argument("--output",required=True,help="Report path; never writes research/approval records")
    a=p.parse_args()
    archive=Path(a.archive)
    actual=hashlib.sha256(archive.read_bytes()).hexdigest()
    if actual!=EXPECTED_SHA256:raise ValueError("Archive SHA-256 differs from measured pinned release")
    checksum_text=Path(a.checksums).read_text(encoding="utf-8")
    if not any(EXPECTED_SHA256 in line and "f1db-json-splitted.zip" in line for line in checksum_text.splitlines()):raise ValueError("Official checksum manifest does not name the pinned asset and digest")
    with zipfile.ZipFile(archive) as z:
        races=rows(z,"f1db-races.json")
        results=rows(z,"f1db-races-race-results.json")
    if len(races)!=1172 or len(results)!=27665:raise ValueError("Pinned race/result counts differ")
    leads=json.loads(LEADS.read_text(encoding="utf-8"))
    out={"schema_version":1,"archive_sha256":actual,"status":"candidate_only_not_verified","method":"year-scoped race/result enumeration; no GP venue or constructor association inferred","items":reconcile(leads,races,results)}
    Path(a.output).write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Wrote {len(out['items'])} year-scoped candidate lists to {a.output}; no claims approved")

if __name__=="__main__":
    try:main()
    except (ValueError,OSError,KeyError,zipfile.BadZipFile) as exc:
        print(f"Reconciliation blocked: {exc}",file=sys.stderr)
        sys.exit(1)
