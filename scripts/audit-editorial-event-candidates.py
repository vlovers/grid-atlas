#!/usr/bin/env python3
"""Validate read-only F1DB candidate report without treating it as historical approval."""
import json
from pathlib import Path
import sys

def validate(report):
    errors=[]
    if report.get("status")!="candidate_only_not_verified":errors.append("report falsely claims verification")
    items=report.get("items",[])
    if len(items)!=11 or len({x.get("subject_id") for x in items})!=11:errors.append("expected eleven unique research leads")
    for item in items:
        sid=item.get("subject_id","?")
        candidates=item.get("candidate_races",[])
        if item.get("status")!="candidate_races_only" or item.get("editorial_review_required") is not True:errors.append(f"{sid}: unsafe review state")
        if item.get("candidate_count")!=len(candidates) or not candidates:errors.append(f"{sid}: missing or incomplete candidates")
        rounds=set()
        for race in candidates:
            if race.get("year")!=item.get("year") or not race.get("official_name") or not race.get("circuit_external_id"):errors.append(f"{sid}: inconsistent race identity")
            if race.get("round") in rounds:errors.append(f"{sid}: duplicate round")
            rounds.add(race.get("round"))
            if race.get("race_id") is None or not isinstance(race.get("winning_results"),list):errors.append(f"{sid}: incomplete result identity")
            for win in race.get("winning_results",[]):
                if not win.get("driver_external_id") or not win.get("constructor_external_id"):errors.append(f"{sid}: winner missing identity")
    return errors

if __name__=="__main__":
    try:
        errors=validate(json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")))
        print("Candidate report: "+("; ".join(errors) if errors else "11 complete year-scoped research leads; still unverified"))
        raise SystemExit(bool(errors))
    except (IndexError,FileNotFoundError,ValueError) as exc:
        print(f"Invalid candidate report: {exc}",file=sys.stderr)
        raise SystemExit(1)
