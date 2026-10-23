#!/usr/bin/env python3
"""Cross-file editorial coverage: research frameworks are not approved articles."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
D=ROOT/"docs/editorial/releases/v2"
def load(name):return json.loads((D/name).read_text(encoding="utf-8"))
def validate(briefs, pilots, drafts, frameworks, coverage):
    errors=[]
    expected={r["id"] for r in briefs["records"]}
    researched={x["subject_id"] for x in pilots["items"]}
    drafted={x["subject_id"] for x in drafts["articles"]}
    scaffold={x["subject_id"] for x in frameworks["articles"]}
    tracked={x["id"] for x in coverage["subjects"]}
    if len(expected)!=25 or len(tracked)!=25 or expected!=tracked:errors.append("cohort mismatch")
    if researched!=drafted or len(researched)!=5:errors.append("pilot/draft mismatch")
    if researched & scaffold or expected!=researched|scaffold:errors.append("scaffold overlap or gap")
    if frameworks.get("status")!="editorial_scaffold_unapproved":errors.append("scaffold status")
    for article in frameworks["articles"]:
        if article.get("review_state")!="pending_independent_human_review":errors.append("false approval")
        if len(article.get("chapters",[]))!=3:errors.append("missing framework chapter")
        for ch in article.get("chapters",[]):
            if ch.get("status")!="awaiting_subject_specific_evidence" or ch.get("claim_ids")!=[]:errors.append("framework masquerades as sourced")
            for lang in ("en","uk"):
                if not ch.get("title",{}).get(lang) or not ch.get("body",{}).get(lang):errors.append("missing translation")
    for row in coverage["subjects"]:
        sid=row["id"]
        if row.get("approved") is not False or row.get("published") is not False:errors.append("false publication")
        if row.get("id") not in expected:errors.append("unknown subject")
    if coverage.get("totals",{}).get("subjects")!=25:errors.append("wrong cohort size")
    return errors
if __name__=="__main__":
    errors=validate(load("briefs.json"),load("pilot-research.json"),load("chapter-drafts.json"),load("framework-chapters.json"),load("coverage.json"))
    print("Editorial coverage: "+("; ".join(errors) if errors else "25 tracked; 5 sourced pilots; 20 frameworks; 0 approved"))
    raise SystemExit(bool(errors))
