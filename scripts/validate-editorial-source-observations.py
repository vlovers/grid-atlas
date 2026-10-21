#!/usr/bin/env python3
"""Validate unapproved, source-located F1 historical observations."""
import json
from pathlib import Path
from urllib.parse import urlparse

PATH = Path(__file__).resolve().parents[1] / "docs/editorial/research-pack-2026-10/senna-prost-source-observations.json"

def validate(d):
    errors = []
    def check(condition, reason):
        if not condition: errors.append(reason)
    check(d.get("schema_version") == 1, "schema mismatch")
    check(d.get("status") == "source_observed_needs_independent_human_review", "unsafe status")
    check(d.get("publication_allowed") is False, "publish flag must be false")
    sources = d.get("sources", [])
    ids = [s.get("id") for s in sources]
    check(len(ids) == len(set(ids)) and len(ids) >= 3, "duplicate/insufficient sources")
    for src in sources:
        check(src.get("publisher") and src.get("title") and src.get("locator"), "incomplete source")
        url = urlparse(src.get("url", ""))
        check(url.scheme == "https" and url.netloc == "www.formula1.com", "unexpected source domain")
    claims = d.get("claims", [])
    cids = [c.get("id") for c in claims]
    check(len(cids) == len(set(cids)) and len(cids) >= 4, "duplicate/insufficient claims")
    for c in claims:
        check(c.get("review_status") == "needs_human_review", "unapproved claim promoted")
        check(bool(c.get("en")) and bool(c.get("uk")), "missing localization")
        check(bool(c.get("source_ids")) and set(c.get("source_ids", [])) <= set(ids), "invalid source link")
        check(bool(c.get("observed_fields")), "missing structured observation")
    rev = d.get("review", {})
    check(rev.get("reviewer") is None and rev.get("reviewed_at") is None, "fabricated reviewer")
    check(rev.get("publication_allowed") is False, "unsafe review publication flag")
    for field in ("source_context_check", "language_uk_check", "language_en_check", "statistics_reconciled_with_pinned_import"):
        check(rev.get(field) is False, "review unexpectedly approved: " + field)
    check(len(d.get("interpretation_constraints", [])) >= 3, "missing caveats")
    winner_claim = next((c for c in claims if c.get("id") == "senna-prost-1988-winner-rows"), None)
    if winner_claim:
        obs = winner_claim.get("observed_fields", {})
        check(obs.get("listed_races") == 16 and sum(obs.get(k, 0) for k in ("senna_win_rows","prost_win_rows","berger_win_rows")) == 16, "race-winner reconciliation mismatch")
    return errors

def main():
    d=json.loads(PATH.read_text(encoding="utf-8"))
    errors=validate(d)
    if errors: raise SystemExit("\n".join(errors))
    print(f"Validated {len(d['claims'])} claims, {len(d['sources'])} sources. Human review and publication remain blocked.")

if __name__ == "__main__": main()
