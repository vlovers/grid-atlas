#!/usr/bin/env python3
"""Fail-closed aggregate archive readiness assertions from measured audit."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FILE=ROOT/"docs/editorial/releases/v2/archive-readiness.json"
def validate(d):
    errors=[]
    rows=d.get("rows",[])
    fields={(r.get("entity"),r.get("field")):r for r in rows}
    if len(fields)!=len(rows):errors.append("duplicate field")
    expected={("drivers","identity"):"917/917",("drivers","race_result_evidence"):"860/917",("constructors","identity"):"187/187",("constructors","race_result_evidence"):"186/187",("circuits","identity"):"78/78",("circuits","historical_layout_artwork"):"160 SVG across archive",("seasons","archive_records"):"77",("races","archive_records"):"1172",("race_results","archive_records"):"27665"}
    for k,v in expected.items():
        if fields.get(k,{}).get("value")!=v or fields[k].get("kind")!="measured":errors.append(f"baseline drift {k}")
    for r in rows:
        if not r.get("interpretation") or r.get("kind") not in ("measured","known_gap"):errors.append("unqualified readiness row")
    for k in (("seasons","official_driver_standings"),("circuits","precise_corners_sectors_drs"),("media","portraits_logos")):
        if fields.get(k,{}).get("kind")!="known_gap":errors.append(f"missing publication gap {k}")
    state=d.get("editorial_publication",{})
    if state.get("approved_subjects")!=0 or state.get("published_subjects")!=0:errors.append("false editorial approval")
    return errors
if __name__=="__main__":
    errors=validate(json.loads(FILE.read_text(encoding="utf-8")))
    print("Archive readiness: "+("; ".join(errors) if errors else "measured baseline and editorial gates intact"))
    raise SystemExit(bool(errors))
