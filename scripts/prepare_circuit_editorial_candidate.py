#!/usr/bin/env python3
"""Compile five unpublished circuit introductions with pinned F1DB evidence.

Research-only: never exports approved/published editorial revisions.
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/editorial/batches/circuits-5-reader-introductions-20261025.md"
EVIDENCE = ROOT / "docs/editorial/batches/circuits-5-verified-f1db-mappings-20261024.md"
CIRCUITS = ("Silverstone", "Monaco", "Spa-Francorchamps", "Monza", "Suzuka")
EXPECTED = {
    "Silverstone": (("1950", "1", "silverstone-1"),),
    "Monaco": (("1950", "2", "monaco-1"), ("1984", "394", "monaco-4"), ("2016", "941", "monaco-6")),
    "Spa-Francorchamps": (("1950", "5", "spa-francorchamps-1"), ("1970", "188", "spa-francorchamps-1"), ("1983", "379", "spa-francorchamps-2")),
    "Monza": (("1950", "7", "monza-1"),),
    "Suzuka": (("1987", "451", "suzuka-1"), ("1988", "467", "suzuka-1")),
}


def parse_manuscript(markdown):
    chunks = re.split(r"(?m)^## (Silverstone|Monaco|Spa-Francorchamps|Monza|Suzuka)\s*$", markdown)
    if len(chunks) != 11:
        raise ValueError("Expected exactly five independent circuit sections")
    result = {}
    for i in range(1, len(chunks), 2):
        circuit, body = chunks[i], chunks[i + 1]
        if circuit in result:
            raise ValueError("Duplicate circuit")
        headings = list(re.finditer(r"(?m)^### (EN|UK) — (.+)$", body))
        if len(headings) != 2 or [m.group(1) for m in headings] != ["EN", "UK"]:
            raise ValueError(f"{circuit}: expected exactly EN and UK sections")
        languages = {}
        for j, match in enumerate(headings):
            text = body[match.end():headings[j + 1].start() if j + 1 < len(headings) else len(body)]
            text = re.split(r"(?m)^\*\*Archive moments?:", text)[0].strip()
            if len(text) < 120 or "http" in text or "F1DB" in text:
                raise ValueError(f"{circuit}: empty or technical-facing introduction")
            languages[match.group(1).lower()] = {"title": match.group(2).strip(), "paragraphs": [
                p.replace("**", "").strip() for p in re.split(r"\n\s*\n", text) if p.strip()
            ]}
            if len(languages[match.group(1).lower()]["paragraphs"]) < 2:
                raise ValueError(f"{circuit}: introduction lacks paragraphs")
        result[circuit] = languages
    if set(result) != set(CIRCUITS):
        raise ValueError("Unexpected circuit set")
    return result


def parse_mapping_evidence(markdown):
    rows = {}
    for line in markdown.splitlines():
        if not line.startswith("|"):
            continue
        fields = [part.strip().strip("`") for part in line.strip().strip("|").split("|")]
        if len(fields) != 5 or not fields[1].isdigit() or not fields[2].isdigit():
            continue
        circuit, year, race, date, layout = fields
        circuit = {"Spa-Francorchamps": "Spa-Francorchamps"}.get(circuit, circuit)
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
            raise ValueError(f"Invalid date for {circuit}")
        rows.setdefault(circuit, []).append((year, race, layout))
    for circuit, expected in EXPECTED.items():
        if tuple(rows.get(circuit, ())) != expected:
            raise ValueError(f"Evidence mappings changed or missing: {circuit}")
    if set(rows) != set(EXPECTED):
        raise ValueError("Unexpected circuit evidence records")
    return rows


def build_candidate(manuscript, evidence):
    content = parse_manuscript(manuscript)
    mappings = parse_mapping_evidence(evidence)
    return {
        "schema_version": 1,
        "stage": "draft",
        "publication_status": "unpublished",
        "reviewed_by": None,
        "approved_revision": None,
        "source_kind": "f1db-v2026.17.0-observed-records",
        "editorial_approval_required": True,
        "circuits": [
            {"external_id": name.lower().replace(" ", "-"), "name": name,
             "locales": content[name],
             "events": [{"year": int(y), "source_race_id": race, "source_layout_id": layout}
                        for y, race, layout in mappings[name]],
             "claim_status": "requires_independent_editorial_review"}
            for name in CIRCUITS
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    candidate = build_candidate(SOURCE.read_text(encoding="utf-8"), EVIDENCE.read_text(encoding="utf-8"))
    report = json.dumps(candidate, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        if args.output.resolve().is_relative_to(ROOT):
            parser.error("Draft exports must be outside the repository")
        args.output.write_text(report, encoding="utf-8")
        print(f"Wrote unpublished research candidate to {args.output}")
    else:
        print(report, end="")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError) as exc:
        sys.exit(f"Circuit draft preflight failed: {exc}")
