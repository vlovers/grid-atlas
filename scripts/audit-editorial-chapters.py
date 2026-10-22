#!/usr/bin/env python3
"""Validate chapter-to-claim references; does not verify truth or approve text."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DIR=ROOT/"docs/editorial/releases/v2"
def validate(drafts, research):
    errors=[]
    if drafts.get("status")!="editorial_draft_not_approved": errors.append("draft publication state changed")
    source={x["subject_id"]:{c["id"] for c in x["claims"]} for x in research["items"]}
    articles=drafts.get("articles",[])
    if len(articles)!=len(source) or {a.get("subject_id") for a in articles}!=set(source):
        errors.append("pilot coverage mismatch")
    for article in articles:
        sid=article.get("subject_id")
        if article.get("review_state")!="pending_independent_human_review":errors.append(f"{sid}: false review")
        seen=set()
        if len(article.get("chapters",[]))<2: errors.append(f"{sid}: too few chapters")
        for ch in article.get("chapters",[]):
            ids=ch.get("claim_ids",[])
            if not ids or not set(ids)<=source.get(sid,set()): errors.append(f"{sid}: missing or unknown claim reference")
            seen.update(ids)
            for lang in ("en","uk"):
                if not ch.get("title",{}).get(lang) or not ch.get("body",{}).get(lang):
                    errors.append(f"{sid}: missing {lang} text")
        if seen!=source.get(sid,set()):errors.append(f"{sid}: not all sourced claims are covered")
    return errors
if __name__=="__main__":
    d=json.loads((DIR/"chapter-drafts.json").read_text(encoding="utf-8"))
    r=json.loads((DIR/"pilot-research.json").read_text(encoding="utf-8"))
    errors=validate(d,r)
    print("Editorial chapter audit: "+("; ".join(errors) if errors else "5 bilingual drafts, all pilot claims mapped, unapproved"))
    raise SystemExit(bool(errors))
