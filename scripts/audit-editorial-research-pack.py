#!/usr/bin/env python3
"""Offline, fail-closed audit of all five private editorial dossiers and evidence bundles.

Never approves historical assertions. Exit nonzero when any invariant fails.
"""
import argparse
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "docs/editorial/research-pack-2026-10"
DRIVERS = ("ayrton-senna","alain-prost","michael-schumacher","lewis-hamilton","max-verstappen")
SEASON_DRIVERS = ("michael-schumacher","lewis-hamilton","max-verstappen")

def load_validator(filename, name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def audit(directory=PACK):
    research = load_validator("validate-editorial-research-pack.py","research_validator")
    dual = load_validator("validate-editorial-source-observations.py","dual_validator")
    season = load_validator("validate-driver-season-evidence.py","season_validator")
    failures, claims, sources, scenes = [], [], [], 0
    for slug in DRIVERS:
        path = directory / (slug + ".json")
        if not path.is_file():
            failures.append("missing driver research brief: " + slug)
            continue
        d = json.loads(path.read_text(encoding="utf-8"))
        failures.extend(research.validate(d, slug))
        scenes += len(d.get("chapters",[]))
    bundles = [("senna-prost", directory/"senna-prost-source-observations.json",dual.validate)]
    bundles += [(slug, directory/(slug+"-season-evidence.json"),lambda data, slug=slug: season.validate(data, slug)) for slug in SEASON_DRIVERS]
    seen_claims = set()
    for name,path,validator in bundles:
        if not path.is_file():
            failures.append("missing evidence bundle: " + name)
            continue
        d = json.loads(path.read_text(encoding="utf-8"))
        failures.extend(validator(d))
        for c in d.get("claims",[]):
            cid = c.get("id")
            if cid in seen_claims:
                failures.append("duplicate cross-bundle claim ID: " + str(cid))
            seen_claims.add(cid)
            claims.append(cid)
            if c.get("review_status") != "needs_human_review":
                failures.append("unexpected published claim: " + str(cid))
        sources += [{"bundle":name, "id":s.get("id"), "url":s.get("url")} for s in d.get("sources",[])]
        scenes += len(d.get("chapter_treatments",[]))
    # Source counts reflect references, not independent publishers.
    return {
        "schema_version":1,
        "cohort":list(DRIVERS),
        "research_briefs_expected":len(DRIVERS),
        "evidence_bundles_expected":len(bundles),
        "claim_count":len(claims),
        "source_reference_count":len(sources),
        "research_scenes_count":scenes,
        "editorial_approval":"not_granted",
        "archive_parity":"not_tested_by_this_audit",
        "source_context":"requires_human_review",
        "media_rights":"not_granted",
        "publishable":False,
        "failures":sorted(failures),
    }

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--output",help="Optional JSON audit output path")
    args=ap.parse_args()
    report=audit()
    payload=json.dumps(report,ensure_ascii=False,indent=2)+"\n"
    if args.output:
        Path(args.output).write_text(payload,encoding="utf-8")
    print(payload,end="")
    if report["failures"]:
        raise SystemExit(1)

if __name__=="__main__":
    main()
