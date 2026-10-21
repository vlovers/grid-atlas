#!/usr/bin/env python3
"""Check official-result research observations against seven distinct draft claims."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/"docs/editorial/research-pack-2026-10"
def validate(spot,stories):
    errors=[]
    def require(ok,msg):
        if not ok:errors.append(msg)
    claims={c["id"]:c for scene in stories.get("scenes",[]) for c in scene.get("claims",[])}
    observed=spot.get("observations",[])
    ids=[x.get("id") for x in observed]
    require(set(ids)==set(claims) and len(ids)==len(set(ids))==7,"source spotchecks must match all seven scene claims")
    require(spot.get("publication_allowed") is False and spot.get("human_editor_approved") is False,"research cannot grant approval")
    require(spot.get("release_status")=="blocked","release status")
    for obs in observed:
        claim=claims.get(obs.get("id"),{})
        require(obs.get("assessment")=="supports_narrow_claim","unsupported source assessment")
        require(bool(obs.get("locator")) and obs.get("url","").startswith("https://www.formula1.com/en/results/1988/"),"invalid provenance")
        require(bool(obs.get("source_fields")),"missing inspected field values")
        require(any(s.get("url")==obs.get("url") and s.get("id")==claim.get("evidence") for scene in stories.get("scenes",[]) for s in scene.get("sources",[]) if claim in scene.get("claims",[])),"source not part of claim evidence")
    return errors
if __name__=="__main__":
    a=json.loads((ROOT/"official-result-spotcheck-1988.json").read_text())
    b=json.loads((ROOT/"three-pivotal-races-1988.json").read_text())
    e=validate(a,b)
    if e:raise SystemExit("\n".join(e))
    print("Seven Formula 1 source rows located; independent editorial approval still blocked.")
