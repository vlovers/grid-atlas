#!/usr/bin/env python3
"""Content Factory Batch 01: 25 bilingual fact dossiers from checksum-pinned F1DB.

These machine-generated factual briefs are UNPUBLISHED research candidates.
No invented history, winners, photos, human approval or fabricated translations.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages/data-importer"))
from import_seasons import verified_seasons, RELEASE, ASSET

COHORT_SIZE = 25
SOURCE_PIN = ROOT / "docs/media/pilot-identities.json"


def records(bundle, filename):
    found = [entry for entry in bundle.infolist() if not entry.is_dir()
             and Path(entry.filename).name == filename]
    if len(found) != 1:
        raise ValueError(f"Expected exactly one {filename}, found {len(found)}")
    value = json.loads(bundle.read(found[0]))
    if not isinstance(value, list):
        raise ValueError(f"Expected array: {filename}")
    return value


def source_bundle(archive, checksums):
    _, digest = verified_seasons(archive, checksums)
    pin = json.loads(SOURCE_PIN.read_text(encoding="utf-8"))["source"]
    if pin != {"slug": "f1db", "release": RELEASE, "artifact": ASSET, "sha256": digest}:
        raise ValueError("Archive does not match repository's pinned F1DB identity")
    with zipfile.ZipFile(archive) as bundle:
        return (digest, records(bundle, "f1db-circuits.json"),
                records(bundle, "f1db-races.json"),
                records(bundle, "f1db-circuits-layouts.json"))


def compile_batch(digest, circuits, races, layouts):
    if len(digest) != 64:
        raise ValueError("Invalid checksum")
    identities = {}
    for circuit in circuits:
        ident = circuit["id"]
        if not isinstance(ident, str) or ident in identities:
            raise ValueError("Missing or duplicated circuit identity")
        identities[ident] = circuit
    seen_races = set()
    years_by_circuit = {ident: set() for ident in identities}
    race_ids_by_circuit = {ident: [] for ident in identities}
    layout_ids_by_circuit = {ident: set() for ident in identities}
    valid_layouts = {(item["circuitId"], item["id"]) for item in layouts}
    if len(valid_layouts) != len(layouts):
        raise ValueError("Duplicate circuit-layout association")
    for race in races:
        ident, race_id = race["circuitId"], race["id"]
        if ident not in identities or race_id in seen_races or type(race.get("year")) is not int:
            raise ValueError("Invalid race or unresolved circuit")
        seen_races.add(race_id)
        years_by_circuit[ident].add(race["year"])
        race_ids_by_circuit[ident].append(str(race_id))
        layout_id = race.get("circuitLayoutId")
        if layout_id is not None:
            if (ident, layout_id) not in valid_layouts:
                raise ValueError("Invalid historical race/layout association")
            layout_ids_by_circuit[ident].add(layout_id)
    ranked = sorted(identities, key=lambda ident: (-len(race_ids_by_circuit[ident]), ident))
    if len(ranked) < COHORT_SIZE:
        raise ValueError("Fewer than 25 canonical circuits")
    items = []
    for ident in ranked[:COHORT_SIZE]:
        years = sorted(years_by_circuit[ident])
        count = len(race_ids_by_circuit[ident])
        name = identities[ident].get("name") or identities[ident].get("officialName")
        if not isinstance(name, str) or not name.strip():
            raise ValueError(f"Missing source name: {ident}")
        # Localize neutral navigational labels; preserve names and numerical facts as source data.
        translations = {
            "en": {"heading": "Formula 1 archive", "summary":
                   f"The Formula 1 archive contains {count} race records associated with this circuit."
                   if count else "This archive has no race records associated with this circuit.",
                   "coverage_label": "Recorded seasons", "layout_label": "Historical layout references"},
            "uk": {"heading": "Архів Формули-1", "summary":
                   f"Архів Формули-1 містить {count} записів про етапи, пов’язані з цією трасою."
                   if count else "У цьому архіві немає записів про етапи, пов’язані з цією трасою.",
                   "coverage_label": "Зафіксовані сезони", "layout_label": "Посилання на історичні конфігурації"},
        }
        items.append({"circuit_external_id": ident, "source_name": name,
                      "recorded_races": count, "first_recorded_season": years[0] if years else None,
                      "last_recorded_season": years[-1] if years else None,
                      "source_race_ids": sorted(race_ids_by_circuit[ident], key=int),
                      "historical_layout_ids": sorted(layout_ids_by_circuit[ident]),
                      "locales": translations, "editorial_status": "machine_generated_unreviewed",
                      "enriched_story": None, "licensed_media": []})
    return {"schema_version": 1, "batch": "circuits-01", "source": {"slug": "f1db", "release": RELEASE,
             "artifact": ASSET, "sha256": digest}, "status": "unpublished",
             "cohort_policy": "25 highest archive race counts; ties by external ID",
             "fact_scope": "source_observations_only_not_historical_claim_approval",
             "circuits": items}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--checksums", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.resolve().is_relative_to(ROOT):
        parser.error("Research exports must remain outside repository public directories")
    digest, circuits, races, layouts = source_bundle(args.archive, args.checksums)
    report = compile_batch(digest, circuits, races, layouts)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(report['circuits'])} bilingual, unpublished circuit briefs")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, OSError, zipfile.BadZipFile, json.JSONDecodeError) as exc:
        sys.exit(f"Content factory rejected input: {exc}")
