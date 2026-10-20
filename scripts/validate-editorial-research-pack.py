#!/usr/bin/env python3
"""Fail-closed validator for the nonpublic five-driver editorial research pack."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / "docs/editorial/research-pack-2026-10"
EXPECTED = {"ayrton-senna", "alain-prost", "michael-schumacher", "lewis-hamilton", "max-verstappen"}

def validate(data, slug):
    errors = []
    def require(ok, msg):
        if not ok:
            errors.append(f"{slug}: {msg}")
    require(data.get("schema_version") == 1, "unexpected schema version")
    require(data.get("kind") == "editorial_research_brief", "unexpected document kind")
    subject = data.get("subject", {})
    require(subject.get("type") == "driver", "subject must be driver")
    require(subject.get("canonical_lookup_slug") == slug, "identity mismatch")
    require(subject.get("identity_status") == "requires_f1db_join", "identity must not be assumed")
    require(data.get("visibility") == "internal_only", "document must be internal")
    require(data.get("editorial_status") == "research_required", "unapproved editorial status")
    require(data.get("locale_policy") == ["uk", "en"], "locales must be UK/EN")
    require(data.get("historical_assertions") == [], "no approved assertions allowed")
    chapters = data.get("chapters", [])
    require(len(chapters) >= 4, "at least four research chapters required")
    ids = []
    for ch in chapters:
        ids.append(ch.get("chapter_id"))
        require(set(ch.get("heading", {})) == {"uk", "en"}, "missing chapter locale")
        require(bool(ch.get("heading", {}).get("uk")) and bool(ch.get("heading", {}).get("en")), "empty translated heading")
        require(ch.get("claim_status") == "unverified", "claim status must be unverified")
        require(ch.get("narrative_copy") is None, "narrative prose forbidden in research-only pack")
        require(ch.get("source_locators") == [], "evidence must pass independent review separately")
        require(ch.get("human_reviewer") is None, "must not invent reviewer")
        require(len(ch.get("research_prompts", [])) >= 2, "research prompts missing")
    require(len(ids) == len(set(ids)), "duplicate chapter IDs")
    approval = data.get("approval", {})
    require(set(approval) == {"historical_review", "uk_review", "en_review", "media_rights_review", "publication_allowed"}, "approval keys mismatch")
    require(all(v is False for v in approval.values()), "no approval allowed")
    media = data.get("media", {})
    require(media.get("status") == "no_asset_approved_here" and media.get("publication_allowed") is False, "media rights gate failed")
    require(len(data.get("limitations", [])) >= 2, "limitations missing")
    return errors

def main():
    paths = sorted(DIRECTORY / f"{slug}.json" for slug in EXPECTED)
    missing = [str(p.name) for p in paths if not p.is_file()]
    if missing:
        raise SystemExit(f"missing research briefs: {missing}")
    errors = []
    for path in paths:
        errors.extend(validate(json.loads(path.read_text(encoding="utf-8")), path.stem))
    if errors:
        raise SystemExit("\n".join(errors))
    print(f"Validated {len(paths)} internal-only research briefs; no approval or publish gate changed.")

if __name__ == "__main__":
    main()
