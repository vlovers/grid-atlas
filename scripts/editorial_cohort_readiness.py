#!/usr/bin/env python3
"""Read-only editorial delivery queue. Never grants approval or writes to the DB."""
import argparse
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOSSIERS = ROOT / "docs/editorial/dossiers"
CHAPTERS = ROOT / "docs/editorial/batches/nine-champions-chapters-2026-10.json"
PILOT = ROOT / "docs/editorial/pilots/senna"
FIELDS = ("championships", "early_life", "career", "key_events", "legacy")


def analyze(dossiers_dir=DOSSIERS, chapters_path=CHAPTERS, pilot_dir=PILOT):
    cohort = json.loads(Path(chapters_path).read_text(encoding="utf8"))["chapters"]
    by_driver = {}
    for chapter in cohort:
        slug = chapter["driver_id"]
        entry = by_driver.setdefault(slug, {"driver_id": slug, "chapters": 0, "locales": {}})
        entry["chapters"] += 1
        for locale in ("en", "uk"):
            loc = entry["locales"].setdefault(locale, {"claim_references": set(), "blockers": []})
            loc["claim_references"].update(chapter.get("based_on_claim_ids", []))
    for slug, entry in by_driver.items():
        for locale in ("en", "uk"):
            loc = entry["locales"].setdefault(locale, {"claim_references": set(), "blockers": []})
            path = Path(dossiers_dir) / f"{slug}.{locale}.json"
            loc["dossier_path"] = str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path)
            if not path.is_file():
                loc["blockers"].append("missing_dossier")
                dossier = None
            else:
                try:
                    dossier = json.loads(path.read_text(encoding="utf8"))
                except (ValueError, OSError):
                    dossier = None
                    loc["blockers"].append("invalid_dossier_json")
            loc["claims"] = len(dossier.get("claims", [])) if dossier else 0
            loc["sources"] = len(dossier.get("sources", [])) if dossier else 0
            loc["sections"] = len(dossier.get("sections", [])) if dossier else 0
            loc["gaps"] = len(dossier.get("gaps", [])) if dossier else 0
            if dossier:
                if dossier.get("driver_id") != slug or dossier.get("locale") != locale:
                    loc["blockers"].append("identity_or_locale_mismatch")
                if dossier.get("publication_status") != "unpublished" or dossier.get("reviewer") is not None:
                    loc["blockers"].append("unexpected_dossier_publication_state")
                ids = {claim.get("claim_id") for claim in dossier.get("claims", [])}
                missing = sorted(loc["claim_references"] - ids)
                if missing:
                    loc["blockers"].append("unresolved_chapter_claims")
                loc["unresolved_claim_ids"] = missing
                if loc["gaps"]:
                    loc["blockers"].append("open_research_gaps")
                if not loc["claims"] or not loc["sources"] or not loc["sections"]:
                    loc["blockers"].append("insufficient_dossier_structure")
            loc["blockers"].append("independent_human_review_required")
            loc["blockers"].append("publication_adapter_not_implemented")
            loc["ready_to_publish"] = False
            loc["claim_references"] = sorted(loc["claim_references"])
    pilot_status = {}
    for locale in ("en", "uk"):
        dossier = Path(pilot_dir) / f"{locale}.dossier.json"
        review = Path(pilot_dir) / f"{locale}.review.json"
        pilot_status[locale] = {"dossier_exists": dossier.is_file(), "review_exists": review.is_file(),
                                "requires_independent_review": True, "publication_authorized": False}
    counts = Counter(reason for entry in by_driver.values() for loc in entry["locales"].values() for reason in loc["blockers"])
    return {"status": "research_only", "publication_authorized": False,
            "summary": {"drivers": len(by_driver), "locales": sum(len(v["locales"]) for v in by_driver.values()),
                        "chapters": len(cohort), "ready_to_publish": 0, "blockers": dict(sorted(counts.items()))},
            "drivers": list(by_driver.values()), "senna_pilot": pilot_status}


def markdown(report):
    lines = ["# Editorial cohort readiness (UNPUBLISHED)", "",
             "This is a **read-only inventory**, not evidence of source truth, human approval, or a release.",
             "The existing SQL publication adapter is not implemented. No statuses have been advanced.", "",
             f"- Drivers: {report['summary']['drivers']}",
             f"- Bilingual locale records: {report['summary']['locales']}",
             f"- Draft story chapters: {report['summary']['chapters']}",
             "- Approved/publishable through this report: **0**", "",
             "| Driver | EN claims/sources | UK claims/sources | Unresolved gaps EN/UK | State |", "|---|---:|---:|---:|---|"]
    for entry in report["drivers"]:
        en, uk = entry["locales"]["en"], entry["locales"]["uk"]
        lines.append(f"| {entry['driver_id']} | {en['claims']}/{en['sources']} | {uk['claims']}/{uk['sources']} | {en['gaps']}/{uk['gaps']} | Human review + adapter required |")
    lines.extend(["", "## Manual next actions", "",
                  "1. Check each precise claim and its source passage for both languages; record disagreements and scope.",
                  "2. Complete the existing per-locale independent review sidecars, including identity, originality, links, editorial sign-off, and media rights.",
                  "3. Use the existing `scripts/editorial_review.py --require-ready` on the Senna pilot with pinned archive and checksums.",
                  "4. Implement and test an explicit authorization-controlled, revision-pinned PostgreSQL publication adapter; never flip status in this inventory.",
                  "5. Verify published API output for the exact locale/driver, and withdrawal behavior.", ""])
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--format", choices=("json", "markdown"), default="json")
    args = parser.parse_args()
    report = analyze()
    print(markdown(report) if args.format == "markdown" else json.dumps(report, ensure_ascii=False, indent=2))
if __name__ == "__main__":
    main()
