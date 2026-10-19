#!/usr/bin/env python3
"""Offline dossier quality checks and insert-only enrichment of PR #84 packets.

Never verifies claims, writes the database, changes statistics or publishes prose.
"""
import argparse
import copy
import datetime as dt
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "data-importer"))
from import_drivers import read_drivers
from import_seasons import RELEASE

TOPICS = ("identity", "full_name", "birth", "early_career", "teams_seasons",
          "championships", "key_events", "driving_style", "significance")
ID = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*\Z")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def identifier(value):
    return isinstance(value, str) and ID.fullmatch(value) is not None


def keys(value, expected, label):
    require(isinstance(value, dict) and set(value) == set(expected.split()),
            f"{label}: expected keys {expected}")


def iso_date(value):
    require(isinstance(value, str), "date must be YYYY-MM-DD")
    try:
        parsed = dt.date.fromisoformat(value)
    except ValueError:
        raise ValueError("date must be YYYY-MM-DD") from None
    require(parsed.isoformat() == value, "date must be YYYY-MM-DD")
    return parsed


def source_url(value):
    require(nonempty(value) and not any(c.isspace() or ord(c) < 32 for c in value),
            "invalid source URL")
    try:
        parsed = urlsplit(value)
        require(parsed.scheme == "https" and bool(parsed.hostname) and
                "." in parsed.hostname and not parsed.username and not parsed.password
                and parsed.port in (None, 443) and parsed.path not in ("", "/"),
                "source URL must be an HTTPS document, not a homepage")
    except ValueError:
        raise ValueError("invalid source URL: expected HTTPS document") from None


def validate_dossier(doc, canonical_ids, as_of):
    """Reject malformed/approved content; missing research is reported separately."""
    keys(doc, "schema_version driver_id locale title author status publication_status reviewer reviewed_at sources claims sections gaps media", "dossier")
    require(type(doc["schema_version"]) is int and doc["schema_version"] == 1,
            "unsupported dossier schema_version")
    require(identifier(doc["driver_id"]) and doc["driver_id"] in canonical_ids,
            "unknown canonical driver ID")
    require(doc["locale"] in ("en", "uk"), "invalid dossier locale")
    require(nonempty(doc["title"]) and nonempty(doc["author"]), "title and author required")
    require(doc["status"] in ("draft", "needs_review") and
            doc["publication_status"] == "unpublished" and
            doc["reviewer"] is None and doc["reviewed_at"] is None,
            "dossier must remain unapproved and unpublished")
    require(doc["media"] == [], "media ingestion is unsupported; rights review is separate")
    for field in ("sources", "claims", "sections", "gaps"):
        require(isinstance(doc[field], list), f"{field} must be an array")
    require(all(nonempty(gap) for gap in doc["gaps"]), "gaps must be nonempty text")
    sources, urls = {}, set()
    for source in doc["sources"]:
        keys(source, "source_id source_url title publisher author accessed_on version independence_group", "source")
        sid = source["source_id"]
        require(identifier(sid) and sid not in sources, "invalid or duplicate source ID")
        source_url(source["source_url"])
        normalized = source["source_url"].rstrip("/")
        require(normalized not in urls, "duplicate source URL")
        urls.add(normalized)
        for field in ("title", "publisher", "version", "independence_group"):
            require(nonempty(source[field]), f"source {field} required")
        require(source["author"] is None or nonempty(source["author"]), "invalid source author")
        require(iso_date(source["accessed_on"]) <= as_of, "source access date is in the future")
        sources[sid] = source
    claims, used_sources = {}, set()
    for claim in doc["claims"]:
        keys(claim, "claim_id topic statement status evidence", "claim")
        cid = claim["claim_id"]
        require(identifier(cid) and cid.startswith(doc["driver_id"] + "-") and
                cid not in claims, "invalid or duplicate claim ID")
        require(claim["topic"] in (*TOPICS, "death"), "invalid claim topic")
        require(nonempty(claim["statement"]), "claim statement required")
        require(claim["status"] in ("draft", "needs_review"), "claims must remain unapproved")
        require(isinstance(claim["evidence"], list) and bool(claim["evidence"]),
                "claim requires supporting evidence")
        seen = set()
        for evidence in claim["evidence"]:
            keys(evidence, "source_id locator supports", "evidence")
            sid = evidence["source_id"]
            require(identifier(sid) and sid in sources, "unresolved source reference")
            require(nonempty(evidence["locator"]), "evidence locator required")
            require(type(evidence["supports"]) is bool, "supports must be boolean")
            key = (sid, evidence["locator"])
            require(key not in seen, "duplicate evidence reference")
            seen.add(key)
            used_sources.add(sid)
        require(any(e["supports"] for e in claim["evidence"]), "claim has no supporting evidence")
        claims[cid] = claim
    used_claims, sections = set(), set()
    for section in doc["sections"]:
        keys(section, "section_id title claim_ids", "section")
        require(identifier(section["section_id"]) and section["section_id"] not in sections,
                "invalid or duplicate section ID")
        sections.add(section["section_id"])
        require(nonempty(section["title"]), "section title required")
        require(isinstance(section["claim_ids"], list) and bool(section["claim_ids"]),
                "section requires claim references")
        for cid in section["claim_ids"]:
            require(identifier(cid) and cid in claims, "unresolved claim reference")
            require(cid not in used_claims, "claim repeated in draft sections")
            used_claims.add(cid)
    require(used_claims == set(claims), "orphan claim outside draft sections")
    require(used_sources == set(sources), "unused source outside evidence register")


def load_json(path):
    def unique(pairs):
        value = {}
        for key, item in pairs:
            require(key not in value, f"duplicate JSON key: {key}")
            value[key] = item
        return value
    return json.loads(Path(path).read_text(encoding="utf-8"), object_pairs_hook=unique)


def load_dossiers(paths, canonical_ids, as_of):
    dossiers = {}
    for path in sorted(paths):
        doc = load_json(path)
        validate_dossier(doc, canonical_ids, as_of)
        key = (doc["driver_id"], doc["locale"])
        require(key not in dossiers, f"duplicate driver/locale dossier: {key}")
        dossiers[key] = doc
    return dossiers


def packet_profiles(packet, canonical_ids):
    """Check only the #84 attachment boundary; its manifest/preflight remains upstream."""
    require(isinstance(packet, dict), "packet must be an object")
    require(packet.get("publication_status") == "unpublished", "packet must remain unpublished")
    require(packet.get("source") == {"name": "f1db", "release": RELEASE}, "packet release mismatch")
    require(identifier(packet.get("batch_id")), "packet batch_id required")
    profiles = packet.get("profiles")
    require(isinstance(profiles, list) and 1 <= len(profiles) <= 50, "packet requires 1–50 profiles")
    seen = set()
    for profile in profiles:
        require(isinstance(profile, dict), "invalid packet profile")
        did = profile.get("driver_id")
        require(identifier(did) and did in canonical_ids, "unknown packet driver ID")
        require(did not in seen, "duplicate packet driver ID")
        seen.add(did)
        require(profile.get("source") == packet["source"], "profile release mismatch")
        drafts = profile.get("drafts")
        require(isinstance(drafts, dict) and bool(drafts) and set(drafts) <= {"en", "uk"},
                "packet locale targets required")
        require(profile.get("narrative_status") in ("draft", "needs_review"),
                "packet narrative must remain unapproved")
    return profiles


def attach_dossiers(packet, dossiers, canonical_ids, as_of):
    profiles = packet_profiles(packet, canonical_ids)
    targets = {(p["driver_id"], locale) for p in profiles for locale in p["drafts"]}
    require(set(dossiers) <= targets, "dossier outside packet driver/locale targets")
    for key, doc in dossiers.items():
        validate_dossier(doc, canonical_ids, as_of)
        require(key == (doc["driver_id"], doc["locale"]), "dossier identity/key mismatch")
    result = copy.deepcopy(packet)
    for profile in result["profiles"]:
        incoming = {locale: doc for (did, locale), doc in dossiers.items()
                    if did == profile["driver_id"]}
        if not incoming:
            continue
        existing = profile.setdefault("editorial_dossiers", {})
        require(isinstance(existing, dict), "invalid existing editorial_dossiers")
        for locale, doc in incoming.items():
            require(locale not in existing or existing[locale] == doc,
                    f"existing dossier conflict: {profile['driver_id']}/{locale}")
            existing[locale] = copy.deepcopy(doc)
    return result


def quality_report(driver_rows, dossiers, locales, digest, as_of, targets=None):
    rows = []
    for did, name, _ in sorted(driver_rows):
        for locale in sorted(locales):
            if targets is not None and (did, locale) not in targets:
                continue
            doc = dossiers.get((did, locale))
            claims = doc["claims"] if doc else []
            sources = {s["source_id"]: s for s in doc["sources"]} if doc else {}
            single_group, contrary = [], []
            for claim in claims:
                groups = {sources[e["source_id"]]["independence_group"]
                          for e in claim["evidence"] if e["supports"]}
                if len(groups) < 2:
                    single_group.append(claim["claim_id"])
                if any(not e["supports"] for e in claim["evidence"]):
                    contrary.append(claim["claim_id"])
            rows.append({
                "driver_id": did, "source_display_name": name, "locale": locale,
                "dossier_status": doc["status"] if doc else "missing",
                "missing_topics": sorted(set(TOPICS) - {c["topic"] for c in claims}),
                "claim_count": len(claims), "source_count": len(sources),
                "single_source_group_claims": sorted(single_group),
                "contradictory_evidence_claims": sorted(contrary),
                "gaps": doc["gaps"] if doc else ["No structured dossier in supplied directory"],
                "human_review_required": True, "publishable": False,
            })
    return {
        "schema_version": 1, "as_of": as_of.isoformat(),
        "source": {"name": "f1db", "release": RELEASE, "sha256": digest},
        "scope": "Supplied structured dossiers only; Markdown drafts and database articles are not counted",
        "source_check": "Offline syntax/references only; source support and independence require human review",
        "drivers_audited": len(driver_rows), "locale_slots": len(rows),
        "dossiers_present": sum(row["dossier_status"] != "missing" for row in rows),
        "profiles": rows,
    }


def render_draft(doc):
    """Render only registered claim text, with citations; never free-form uncited prose."""
    claims = {c["claim_id"]: c for c in doc["claims"]}
    lines = [f"# {doc['title']}", "", "UNPUBLISHED RESEARCH DRAFT — human review required.", ""]
    for section in doc["sections"]:
        lines.extend([f"## {section['title']}", ""])
        for cid in section["claim_ids"]:
            claim = claims[cid]
            refs = " ".join(f"[{e['source_id']}]" for e in claim["evidence"] if e["supports"])
            lines.extend([f"{claim['statement']} {refs} <!-- {cid} -->", ""])
    for source in doc["sources"]:
        lines.append(f"[{source['source_id']}]: {source['source_url']} \"{source['title']}\"")
    lines.extend(["", "## Unresolved editorial work", ""])
    lines.extend(f"- {gap}" for gap in doc["gaps"])
    return "\n".join(lines) + "\n"


def write_new_or_identical(path, content):
    """Exclusive creation: repeat identical output succeeds; existing edits never change."""
    path = Path(path)
    try:
        with path.open("x", encoding="utf-8") as output:
            output.write(content)
    except FileExistsError:
        require(path.read_text(encoding="utf-8") == content, f"output conflict (preserved): {path}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--checksums", type=Path, required=True)
    parser.add_argument("--as-of", required=True, help="Fixed YYYY-MM-DD for reproducible checks")
    parser.add_argument("--dossiers", type=Path, default=ROOT / "docs/editorial/dossiers")
    parser.add_argument("--packets", type=Path, help="Optional research output of PR #84; narrows report")
    parser.add_argument("--enriched-output", type=Path, help="New unpublished packet file; requires --packets")
    args = parser.parse_args()
    try:
        as_of = iso_date(args.as_of)
        require(args.dossiers.is_dir(), "dossier directory not found")
        require(not args.enriched_output or args.packets, "--enriched-output requires --packets")
        rows, digest = read_drivers(args.archive, args.checksums)
        canonical_ids = {row[0] for row in rows}
        dossiers = load_dossiers(args.dossiers.glob("*.json"), canonical_ids, as_of)
        locales = {"en", "uk"}
        targets = None
        if args.packets:
            packet = load_json(args.packets)
            profiles = packet_profiles(packet, canonical_ids)
            ids = {p["driver_id"] for p in profiles}
            rows = [row for row in rows if row[0] in ids]
            locales = {locale for p in profiles for locale in p["drafts"]}
            targets = {(p["driver_id"], locale) for p in profiles for locale in p["drafts"]}
            if args.enriched_output:
                require(args.enriched_output.resolve() != args.packets.resolve(),
                        "input packet must not be overwritten")
                enriched = attach_dossiers(packet, dossiers, canonical_ids, as_of)
                write_new_or_identical(args.enriched_output, json.dumps(enriched, ensure_ascii=False, indent=2) + "\n")
        print(json.dumps(quality_report(rows, dossiers, locales, digest, as_of, targets),
                         ensure_ascii=False, indent=2))
    except (OSError, ValueError, zipfile.BadZipFile) as exc:
        parser.exit(1, f"Editorial dossier check failed: {exc}\n")


if __name__ == "__main__":
    main()
