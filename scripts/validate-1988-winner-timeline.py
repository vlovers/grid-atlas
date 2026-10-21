#!/usr/bin/env python3
import json
from collections import Counter
from datetime import date
from pathlib import Path
from urllib.parse import urlparse
FILE=Path(__file__).resolve().parents[1]/"docs/editorial/research-pack-2026-10/season-1988-winners.json"
EXPECTED={"ayrton-senna":8,"alain-prost":7,"gerhard-berger":1}
def validate(d):
    errors=[]
    def check(value,why):
        if not value:errors.append(why)
    check(d.get("schema_version")==1 and d.get("season")==1988,"schema/season")
    check(d.get("kind")=="historical_race_winner_research_series","kind")
    check(d.get("visibility")=="internal_only" and d.get("publication_allowed") is False,"publication")
    check(d.get("source_context_status")=="machine_transcribed_pending_human_review","status")
    for key in ("source","standing_source"):
        src=d.get(key,{})
        parsed=urlparse(src.get("url",""))
        check(parsed.scheme=="https" and parsed.netloc=="www.formula1.com" and bool(src.get("locator")),"source")
    rows=d.get("races",[])
    check(len(rows)==16,"race count")
    check([x.get("round") for x in rows]==list(range(1,17)),"rounds")
    try:
        dates=[date.fromisoformat(x.get("date","")) for x in rows]
        check(dates==sorted(dates) and all(x.year==1988 for x in dates),"date order")
    except (ValueError,TypeError):errors.append("invalid date")
    check(len(set(x.get("grand_prix") for x in rows))==16,"duplicate races")
    check(dict(Counter(x.get("winner_key") for x in rows))==EXPECTED,"winner counts")
    check(all(x.get("race_article_review")=="needs_human_review" and x.get("individual_result_status")=="not_included" for x in rows),"premature article review")
    check(d.get("observed_final_standings")==[{"position":1,"driver_key":"ayrton-senna","official_points":90},{"position":2,"driver_key":"alain-prost","official_points":87}],"official standings")
    review=d.get("review",{})
    check(set(review)=={"human_review","translation_review","archive_parity","media_clearance"} and all(x is False for x in review.values()),"unapproved review")
    check(len(d.get("limitations",[]))>=3,"limitations")
    return errors
if __name__=="__main__":
    issues=validate(json.loads(FILE.read_text(encoding="utf-8")))
    if issues:raise SystemExit("\n".join(issues))
    print("Validated: 16 races, 8 Senna / 7 Prost / 1 Berger; publication blocked.")
