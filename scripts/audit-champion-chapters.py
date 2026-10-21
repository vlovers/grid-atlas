#!/usr/bin/env python3
"""Check chapter-to-dossier provenance. Research only, no publication side effects."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHAPTERS = ROOT / "docs/editorial/batches/nine-champions-chapters-2026-10.json"
STORIES = ROOT / "docs/editorial/batches/milestone-race-stories-2026-10.json"
DOSSIERS = ROOT / "docs/editorial/dossiers"


def safe_dossier(path, driver, locale):
    expected = f"docs/editorial/dossiers/{driver}.{locale}.json"
    return path == expected and bool(re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", driver))


def audit_chapters(document, load_dossier):
    errors = []
    if not isinstance(document, dict) or document.get("schema_version") != 1:
        return ["invalid chapter schema"]
    if document.get("status") != "research_copy_needs_human_review" or document.get("publication_allowed") is not False or document.get("reviewed_by_human") is not False:
        errors.append("chapters must remain unpublished research")
    chapters = document.get("chapters")
    if not isinstance(chapters, list) or not chapters:
        return errors + ["chapters missing"]
    seen_titles = set()
    ids = set()
    for i, chapter in enumerate(chapters):
        loc = f"chapters[{i}]"
        if not isinstance(chapter, dict):
            errors.append(f"{loc}: invalid object")
            continue
        driver = chapter.get("driver_id")
        if not isinstance(driver, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", driver):
            errors.append(f"{loc}: invalid driver slug")
            continue
        ids.add(driver)
        if chapter.get("status") != "needs_review" or chapter.get("human_editor_approved") is not False or chapter.get("media") != []:
            errors.append(f"{loc}: invalid publication/media gates")
        claims = chapter.get("based_on_claim_ids")
        if not isinstance(claims, list) or not claims or len(claims) != len(set(claims)) or not all(isinstance(c, str) and c for c in claims):
            errors.append(f"{loc}: invalid claim references")
            continue
        titles = chapter.get("editorial_title")
        bodies = chapter.get("body")
        for label, obj in [("title", titles), ("body", bodies)]:
            if not isinstance(obj, dict) or set(obj) != {"en", "uk"} or not all(isinstance(obj[k], str) and len(obj[k].strip()) >= (8 if label == "title" else 60) for k in ("en", "uk")):
                errors.append(f"{loc}: missing localized {label}")
        if isinstance(titles, dict) and "en" in titles:
            key = (driver, titles["en"])
            if key in seen_titles:
                errors.append(f"{loc}: duplicate chapter")
            seen_titles.add(key)
        paths = chapter.get("dossier_files")
        if not isinstance(paths, dict) or set(paths) != {"en", "uk"}:
            errors.append(f"{loc}: missing dossier files")
            continue
        for locale in ("en", "uk"):
            if not safe_dossier(paths[locale], driver, locale):
                errors.append(f"{loc}: unexpected dossier path {locale}")
                continue
            try:
                dossier = load_dossier(driver, locale)
            except (OSError, ValueError, KeyError) as ex:
                errors.append(f"{loc}: dossier missing: {locale}: {ex}")
                continue
            if dossier.get("driver_id") != driver or dossier.get("locale") != locale:
                errors.append(f"{loc}: dossier identity mismatch: {locale}")
            if dossier.get("publication_status") != "unpublished" or dossier.get("status") != "needs_review":
                errors.append(f"{loc}: dossier review state unexpected: {locale}")
            source_ids = {s.get("source_id") for s in dossier.get("sources", []) if isinstance(s, dict)}
            claims_by_id = {x.get("claim_id"): x for x in dossier.get("claims", []) if isinstance(x, dict)}
            for claim_id in claims:
                item = claims_by_id.get(claim_id)
                if not item:
                    errors.append(f"{loc}: unresolved claim {claim_id} in {locale}")
                    continue
                if item.get("status") != "needs_review":
                    errors.append(f"{loc}: claim status differs: {claim_id} / {locale}")
                evidence = item.get("evidence", [])
                if not isinstance(evidence, list) or not any(isinstance(e, dict) and e.get("supports") is True and e.get("source_id") in source_ids and isinstance(e.get("locator"), str) and e["locator"].strip() for e in evidence):
                    errors.append(f"{loc}: claim without located support {claim_id} / {locale}")
    if len(ids) < 9:
        errors.append("cohort smaller than expected nine champion drivers")
    return errors


def audit_race_stories(document):
    errors = []
    if not isinstance(document, dict) or document.get("publication_allowed") is not False or document.get("human_reviewed") is not False:
        return ["race stories must remain unpublished"]
    stories = document.get("stories")
    if not isinstance(stories, list) or not stories:
        return ["race stories missing"]
    seen = set()
    for i, item in enumerate(stories):
        loc = f"stories[{i}]"
        if not isinstance(item, dict):
            errors.append(f"{loc}: invalid entry")
            continue
        key = item.get("id")
        if not isinstance(key, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", key) or key in seen:
            errors.append(f"{loc}: missing or duplicate story ID")
        seen.add(key)
        if item.get("approved") is not False or item.get("media") != [] or item.get("review_status") != "needs_independent_historical_and_translation_review":
            errors.append(f"{loc}: story approval gate invalid")
        source = item.get("source")
        if not isinstance(source, str) or not re.fullmatch(r"https://www\.formula1\.com/en/results/[0-9]{4}/races/[0-9]+/[a-z0-9-]+/race-result", source):
            errors.append(f"{loc}: invalid race result URL")
        if not isinstance(item.get("locator"), str) or len(item["locator"].strip()) < 15:
            errors.append(f"{loc}: source locator missing")
        for locale in ("en", "uk"):
            copy = item.get(locale)
            if not isinstance(copy, dict) or not all(isinstance(copy.get(k), str) and len(copy[k].strip()) > (8 if k == "title" else 100) for k in ("title", "body")):
                errors.append(f"{loc}: missing {locale} research prose")
    return errors


def main():
    chapters = json.loads(CHAPTERS.read_text())
    stories = json.loads(STORIES.read_text())
    def load(driver, locale):
        return json.loads((DOSSIERS / f"{driver}.{locale}.json").read_text())
    issues = audit_chapters(chapters, load) + audit_race_stories(stories)
    print(json.dumps({"chapters": len(chapters["chapters"]), "race_stories": len(stories["stories"]),
                      "unpublished": True, "valid": not issues, "errors": issues}, indent=2))
    return bool(issues)


if __name__ == "__main__":
    sys.exit(main())
