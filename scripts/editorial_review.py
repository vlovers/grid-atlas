#!/usr/bin/env python3
"""Offline, read-only publication preflight for an existing unpublished dossier."""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import sys
from typing import Literal, TypedDict
import zipfile

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.editorial_dossiers import (
    Dossier, iso_date, keys, load_json, nonempty, read_drivers, require, source_url, validate_dossier,
)


class Decision(TypedDict):
    actor: Literal["human"]
    reviewer: str
    reviewed_on: str
    revision_sha256: str
    note: str


class SourceDetails(TypedDict):
    kind: Literal["primary", "secondary", "community"]
    published_on: str | None
    publication_note: str


class Issue(TypedDict):
    claim_id: str | None
    kind: Literal["missing_evidence", "contradiction"]
    note: str
    resolution: Decision | None


class Media(TypedDict):
    source_page_url: str
    creator: str | None
    license_name: str | None
    license_url: str | None
    attribution: str | None
    modifications: str | None
    review: Decision | None


class Checks(TypedDict):
    identity: Decision | None
    language: Decision | None
    originality: Decision | None
    links: Decision | None
    signoff: Decision | None


class ReviewRecord(TypedDict):
    schema_version: Literal[1]
    stage: Literal["draft", "evidence_review", "approved", "published"]
    sources: dict[str, SourceDetails]
    claim_reviews: dict[str, Decision | None]
    checks: Checks
    issues: list[Issue]
    media: list[Media]
    publication: Decision | None


def revision_digest(dossier: Dossier, review: ReviewRecord) -> str:
    """Bind decisions to all writing, evidence, classification, issues and rights.

    Exclude decisions and lifecycle stage so reviewers can sign the same revision.
    Whitespace/object-key changes in JSON do not invalidate a semantic revision.
    """
    payload = {
        "dossier": dossier,
        "sources": review["sources"],
        "issues": [{k: v for k, v in issue.items() if k != "resolution"}
                   for issue in review["issues"]],
        "media": [{k: v for k, v in asset.items() if k != "review"}
                  for asset in review["media"]],
    }
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True,
                         separators=(",", ":"), allow_nan=False).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def validate_review(dossier: Dossier, review: ReviewRecord, canonical_ids: set[str],
                    as_of: dt.date) -> dict:
    """Malformed input raises ValueError; valid research returns readiness blockers.

    No approval is created, and no content, database or publication is written.
    Decision identity/independence must be checked by humans in repository review.
    """
    validate_dossier(dossier, canonical_ids, as_of)
    keys(review, "schema_version stage sources claim_reviews checks issues media publication", "review")
    require(type(review["schema_version"]) is int and review["schema_version"] == 1,
            "review.schema_version: expected 1")
    require(review["stage"] in ("draft", "evidence_review", "approved", "published"),
            "review.stage: expected draft, evidence_review, approved or published")
    sources = {s["source_id"]: s for s in dossier["sources"]}
    claims = {c["claim_id"]: c for c in dossier["claims"]}
    require(isinstance(review["sources"], dict) and set(review["sources"]) == set(sources),
            "review.sources: must classify every dossier source exactly once")
    require(isinstance(review["claim_reviews"], dict) and set(review["claim_reviews"]) == set(claims),
            "review.claim_reviews: must cover every dossier claim exactly once")
    keys(review["checks"], "identity language originality links signoff", "review.checks")
    require(isinstance(review["issues"], list), "review.issues: expected array")
    require(isinstance(review["media"], list), "review.media: expected array")
    for sid, details in review["sources"].items():
        label = f"review.sources.{sid}"
        keys(details, "kind published_on publication_note", label)
        require(details["kind"] in ("primary", "secondary", "community"),
                f"{label}.kind: expected primary, secondary or community")
        require(nonempty(details["publication_note"]), f"{label}.publication_note: required (explain unknown dates)")
        if details["published_on"] is not None:
            require(iso_date(details["published_on"]) <= iso_date(sources[sid]["accessed_on"]),
                    f"{label}.published_on: cannot follow source access date")
    for index, issue in enumerate(review["issues"]):
        label = f"review.issues[{index}]"
        keys(issue, "claim_id kind note resolution", label)
        require(issue["claim_id"] is None or
                (isinstance(issue["claim_id"], str) and issue["claim_id"] in claims),
                f"{label}.claim_id: unknown dossier claim")
        require(issue["kind"] in ("missing_evidence", "contradiction") and nonempty(issue["note"]),
                f"{label}: kind and explanation required")
    urls = set()
    for index, asset in enumerate(review["media"]):
        label = f"review.media[{index}]"
        keys(asset, "source_page_url creator license_name license_url attribution modifications review", label)
        source_url(asset["source_page_url"])
        require(asset["source_page_url"] not in urls, f"{label}.source_page_url: duplicate asset")
        urls.add(asset["source_page_url"])
        for field in ("creator", "license_name", "license_url", "attribution", "modifications"):
            require(asset[field] is None or nonempty(asset[field]), f"{label}.{field}: text or null required")
        if asset["license_url"] is not None:
            source_url(asset["license_url"])
    digest = revision_digest(dossier, review)
    blockers = [f"dossier.gaps[{i}]: {gap}" for i, gap in enumerate(dossier["gaps"])]
    if not claims:
        blockers.append("dossier.claims: at least one sourced claim is required")
    earliest = max([iso_date(s["accessed_on"]) for s in sources.values()], default=dt.date.min)

    def decision(value, label):
        if value is None:
            blockers.append(f"{label}: independent human review missing")
            return None
        keys(value, "actor reviewer reviewed_on revision_sha256 note", label)
        require(value["actor"] == "human", f"{label}.actor: only human decisions accepted")
        require(nonempty(value["reviewer"]) and
                value["reviewer"].strip().casefold() != dossier["author"].strip().casefold(),
                f"{label}.reviewer: named reviewer distinct from dossier author required")
        require(nonempty(value["note"]), f"{label}.note: rationale required")
        date = iso_date(value["reviewed_on"])
        require(earliest <= date <= as_of, f"{label}.reviewed_on: must follow source access and not be in the future")
        require(value["revision_sha256"] == digest,
                f"{label}.revision_sha256: stale decision; re-review the changed revision {digest}")
        return date

    review_dates = []
    for cid, claim in claims.items():
        date = decision(review["claim_reviews"][cid], f"claim_reviews.{cid}")
        if date:
            review_dates.append(date)
        supporting = [e for e in claim["evidence"] if e["supports"]]
        if all(review["sources"][e["source_id"]]["kind"] == "community" for e in supporting):
            blockers.append(f"claims.{cid}: community-only evidence needs primary or secondary corroboration")
        if any(not e["supports"] for e in claim["evidence"]) and not any(
                issue["claim_id"] == cid and issue["kind"] == "contradiction"
                for issue in review["issues"]):
            blockers.append(f"claims.{cid}: contrary evidence requires an explicit contradiction issue")
    for index, issue in enumerate(review["issues"]):
        date = decision(issue["resolution"], f"issues[{index}].resolution ({issue['kind']}: {issue['note']})")
        if date:
            review_dates.append(date)
    for index, asset in enumerate(review["media"]):
        for field in ("creator", "license_name", "license_url", "attribution", "modifications"):
            if asset[field] is None:
                blockers.append(f"media[{index}].{field}: unresolved reuse metadata")
        date = decision(asset["review"], f"media[{index}].review")
        if date:
            review_dates.append(date)
    for check in ("identity", "language", "originality", "links"):
        date = decision(review["checks"][check], f"checks.{check}")
        if date:
            review_dates.append(date)
    signoff = decision(review["checks"]["signoff"], "checks.signoff")
    if signoff:
        require(not review_dates or signoff >= max(review_dates), "checks.signoff: cannot precede individual reviews")
    if review["stage"] == "published":
        published = decision(review["publication"], "publication")
        if published and signoff:
            require(published >= signoff, "publication: cannot precede sign-off")
    else:
        require(review["publication"] is None, "publication: allowed only for an explicitly published record")
    if review["stage"] in ("approved", "published"):
        require(not blockers, "review.stage: approval/publication blocked:\n- " + "\n- ".join(blockers))
    ready = not blockers and review["stage"] in ("approved", "published")
    if review["stage"] in ("draft", "evidence_review"):
        blockers.append("review.stage: explicit human approval has not been recorded")
    return {"driver_id": dossier["driver_id"], "locale": dossier["locale"],
            "stage": review["stage"], "revision_sha256": digest,
            "ready_for_publication": ready, "blockers": blockers,
            "public_content_written": False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dossier", type=Path, required=True)
    parser.add_argument("--review", type=Path, required=True)
    parser.add_argument("--archive", type=Path, required=True, help="Pinned F1DB split JSON archive")
    parser.add_argument("--checksums", type=Path, required=True)
    parser.add_argument("--as-of", required=True, help="Fixed YYYY-MM-DD; never uses the wall clock")
    parser.add_argument("--require-ready", action="store_true", help="Exit 1 for valid but blocked research")
    args = parser.parse_args()
    try:
        rows, _digest = read_drivers(args.archive, args.checksums)
        report = validate_review(load_json(args.dossier), load_json(args.review),
                                 {row[0] for row in rows}, iso_date(args.as_of))
    except (OSError, ValueError, zipfile.BadZipFile) as exc:
        parser.exit(1, f"Editorial preflight failed: {exc}\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if args.require_ready and not report["ready_for_publication"]:
        parser.exit(1, "Editorial publication blocked; resolve the reported review steps.\n")


if __name__ == "__main__":
    main()
