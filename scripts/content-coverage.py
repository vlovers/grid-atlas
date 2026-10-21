#!/usr/bin/env python3
"""Read-only content coverage census for a migrated Grid Atlas PostgreSQL database.

Requires DATABASE_URL and psql. Never runs migrations or writes data.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys

ENTITY_TABLES = {
    "seasons": ("historical_seasons", "year"),
    "drivers": ("historical_drivers", "display_name"),
    "constructors": ("historical_constructors", "display_name"),
    "entrants": ("historical_entrants", "display_name"),
    "circuits": ("historical_circuits", "display_name"),
    "races": ("historical_races", "official_name"),
    "results": ("historical_race_results", None),
}
IDENTITY_KINDS = {"drivers": "driver", "constructors": "constructor", "entrants": "entrant", "circuits": "circuit", "races": "race"}


def query(url, sql):
    result = subprocess.run(
        ["psql", url, "-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1"],
        input="BEGIN TRANSACTION READ ONLY;\n" + sql + "\nCOMMIT;\n",
        text=True, capture_output=True, check=True,
    )
    return [line for line in result.stdout.splitlines() if line and line not in ("BEGIN", "COMMIT")]


def scalar(url, expression):
    rows = query(url, "SELECT " + expression + ";")
    if len(rows) != 1:
        raise ValueError("Expected one SQL result row")
    return int(rows[0])


def census(url):
    report = {"format_version": 1, "entities": {}, "provenance": {}, "limitations": [
        "Archive integrity is not independent historical fact-checking.",
        "A database row does not imply an approved article, official championship standing or licensed image.",
        "Publication and media counts are not measured by this script.",
    ]}
    for kind, (table, required) in ENTITY_TABLES.items():
        counts = {"total": scalar(url, f"count(*) FROM {table}")}
        if required:
            counts["missing_required_label"] = scalar(url, f"count(*) FROM {table} WHERE {required} IS NULL OR btrim({required}::text) = ''")
        if kind in IDENTITY_KINDS:
            identity_kind = IDENTITY_KINDS[kind]
            counts["missing_external_identity"] = scalar(url, f"""count(*) FROM {table} t
                LEFT JOIN external_identities i ON i.id = t.external_identity_id
                WHERE i.id IS NULL OR i.entity_kind <> '{identity_kind}'""")
        if kind == "races":
            counts["missing_season"] = scalar(url, """count(*) FROM historical_races r
                LEFT JOIN historical_seasons s ON s.year = r.season_year WHERE s.year IS NULL""")
            counts["missing_circuit"] = scalar(url, """count(*) FROM historical_races r
                LEFT JOIN historical_circuits c ON c.id = r.circuit_id WHERE r.circuit_id IS NOT NULL AND c.id IS NULL""")
        if kind == "results":
            for relation, table_name, column in (("race", "historical_races", "race_id"), ("driver", "historical_drivers", "driver_id"), ("constructor", "historical_constructors", "constructor_id")):
                counts["missing_" + relation] = scalar(url, f"""count(*) FROM historical_race_results r
                    LEFT JOIN {table_name} e ON e.id = r.{column}
                    WHERE r.{column} IS NOT NULL AND e.id IS NULL""")
        report["entities"][kind] = counts
    report["provenance"]["migration_count"] = scalar(url, "count(*) FROM schema_migrations")
    report["provenance"]["source_release_count"] = scalar(url, "count(*) FROM source_releases")
    report["not_measured"] = ["published_articles_uk", "published_articles_en", "approved_media", "official_standings", "source_verified_claims", "http_route_coverage"]
    return report


def markdown(report):
    lines = ["# Grid Atlas content coverage — read-only census", "", "Counts from the selected database, not independently verified F1 history.", "", "| Entity | Total | Missing label | Missing identity |", "| --- | ---: | ---: | ---: |"]
    for name, counts in report["entities"].items():
        lines.append(f"| {name} | {counts['total']} | {counts.get('missing_required_label', 'n/a')} | {counts.get('missing_external_identity', 'n/a')} |")
    lines.extend(["", "## Additional integrity checks", ""])
    for name, counts in report["entities"].items():
        for key, value in counts.items():
            if key.startswith("missing_") and key not in ("missing_required_label", "missing_external_identity"):
                lines.append(f"- {name}.{key}: {value}")
    lines.extend(["", "## Not measured", "", ", ".join(report["not_measured"]), "", "No article approval, source truth, media rights or championship titles are inferred from these totals.", ""])
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", type=Path, help="Write machine-readable JSON to this file")
    parser.add_argument("--markdown", type=Path, help="Write Markdown summary to this file")
    args = parser.parse_args()
    url = os.environ.get("DATABASE_URL")
    if not url:
        parser.error("DATABASE_URL is required")
    try:
        result = census(url)
    except (OSError, subprocess.CalledProcessError, ValueError) as exc:
        print(f"Coverage audit failed: {exc}", file=sys.stderr)
        return 1
    json_text = json.dumps(result, indent=2, sort_keys=True) + "\n"
    if args.json:
        args.json.write_text(json_text, encoding="utf-8")
    else:
        print(json_text, end="")
    if args.markdown:
        args.markdown.write_text(markdown(result), encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
