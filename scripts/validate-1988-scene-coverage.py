#!/usr/bin/env python3
"""Cross-check all sixteen season 1988 editorial research scenes. Does not authorize publication."""
import json
from pathlib import Path
DIR=Path(__file__).resolve().parents[1]/"docs/editorial/research-pack-2026-10"
def validate(timeline,remaining,pivotal):
    errors=[]
    def check(x,msg):
        if not x:errors.append(msg)
    by_round={r["round"]:r for r in timeline["races"]}
    other=remaining.get("scenes",[])
    key=[s.get("round") for s in other]
    pivotal_rows=[s.get("round") for s in pivotal.get("scenes",[])]
    check(len(key)==13 and len(set(key))==13,"expected 13 distinct remaining scenes")
    check(pivotal_rows==[3,12,15],"expected three pivotal rounds")
    check(set(key).isdisjoint(pivotal_rows) and set(key+pivotal_rows)==set(range(1,17)),"full 16-round coverage")
    check(remaining.get("publication_allowed") is False and remaining.get("visibility")=="internal_only","must remain unpublished")
    check(remaining.get("source_status")=="official_winner_rows_context_requires_human_review","source review status")
    review=remaining.get("review",{})
    check(review.get("human_editor") is None and all(review.get(k) is False for k in ("source_recheck","uk","en","rights","publication")),"review gate")
    for scene in other:
        src=by_round.get(scene.get("round"))
        check(bool(src) and src["grand_prix"]==scene.get("grand_prix"),"race identity mismatch")
        copy=scene.get("draft_microcopy",{})
        check(all(isinstance(copy.get(loc),str) and copy.get(loc).strip() for loc in ("uk","en")),"missing translation")
        check(scene.get("review_status")=="needs_independent_human_review","human review absent")
        check(scene.get("narrative_approved") is False and scene.get("media_approved") is False,"unapproved narrative or media")
        check(scene.get("statement_scope")=="winner_sequence_only" and scene.get("no_causal_claims") is True,"unsupported causal inference")
        check(len(scene.get("context_questions",[]))>=2,"research context missing")
    return errors
if __name__=="__main__":
    a=json.loads((DIR/"season-1988-winners.json").read_text())
    x=json.loads((DIR/"remaining-1988-race-scenes.json").read_text())
    y=json.loads((DIR/"three-pivotal-races-1988.json").read_text())
    failures=validate(a,x,y)
    if failures:raise SystemExit("\n".join(failures))
    print("16/16 race scene coverage, UK/EN; no publication approvals.")
