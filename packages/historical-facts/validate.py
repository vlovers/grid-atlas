#!/usr/bin/env python3
"""Fail-closed validation of source-backed season/layout facts; no publication side effects."""
import json
import re
import sys
import ipaddress
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ENTITY_FIELDS = {
    "driver_season": {"car_number", "team_role"},
    "constructor_season": {"chassis", "engine", "team_principal", "base"},
    "circuit_layout": {"length_m", "turns", "direction", "svg_path"},
    "race_event": {"scheduled_laps", "drs_zones", "tyre_compounds"},
}
NUMERIC = {"length_m", "turns", "scheduled_laps", "drs_zones"}
POSITIVE = {"length_m", "turns", "scheduled_laps"}
STATUSES = {"draft", "reviewed", "rejected"}
LAYOUT_FIELDS = {"length_m", "turns", "direction", "svg_path"}
SVG_COMMANDS = re.compile(r"^[MmLlHhVvCcSsQqTtAaZz0-9.,+\-\s]+$")


def validate(record):
    errors = []
    if not isinstance(record, dict):
        return ["record must be an object"]
    kind = record.get("entity_kind")
    field = record.get("field")
    if kind not in ENTITY_FIELDS or field not in ENTITY_FIELDS.get(kind, set()):
        errors.append("unsupported entity_kind/field")
    entity_id = record.get("entity_id")
    if not isinstance(entity_id, str) or not re.fullmatch(r"[1-9][0-9]*", entity_id):
        errors.append("entity_id must be a positive decimal identifier")
    year = record.get("year")
    if type(year) is not int or not 1950 <= year <= 2100:
        errors.append("year must be an integer between 1950 and 2100")
    layout_version = record.get("layout_version")
    if kind == "circuit_layout" and (not isinstance(layout_version, str) or not layout_version.strip() or len(layout_version) > 120):
        errors.append("circuit layout requires nonempty layout_version")
    value = record.get("value")
    if field in NUMERIC:
        if type(value) is not int or value < (1 if field in POSITIVE else 0):
            errors.append("invalid numeric value")
    elif field == "svg_path":
        if not isinstance(value, str) or len(value) > 50000 or not SVG_COMMANDS.fullmatch(value):
            errors.append("svg_path must contain only SVG path commands and numbers")
    elif field == "tyre_compounds":
        if not isinstance(value, list) or not value or len(value) > 10 or not all(
            isinstance(v, str) and re.fullmatch(r"[A-Za-z0-9 -]{1,40}", v) for v in value
        ):
            errors.append("invalid tyre compounds")
    elif not isinstance(value, str) or not value.strip() or len(value) > 500:
        errors.append("invalid textual value")
    source = record.get("source")
    if not isinstance(source, dict):
        errors.append("source object required")
    else:
        parsed = urlparse(str(source.get("url", "")))
        hostname = parsed.hostname or ""
        try:
            address = ipaddress.ip_address(hostname)
            is_public_host = address.is_global
        except ValueError:
            is_public_host = bool(re.fullmatch(r"[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)+", hostname)) and hostname.lower() not in {"localhost", "localhost.localdomain"}
        if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password or not is_public_host:
            errors.append("source.url must be a public HTTPS URL")
        for key in ("title", "publisher", "locator", "accessed_on"):
            if not isinstance(source.get(key), str) or not source[key].strip():
                errors.append(f"source.{key} required")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(source.get("accessed_on", ""))):
            errors.append("source.accessed_on must be ISO date")
    if record.get("status") not in STATUSES:
        errors.append("invalid review status")
    if record.get("status") == "reviewed":
        for key in ("reviewer", "reviewed_on"):
            if not isinstance(record.get(key), str) or not record[key].strip():
                errors.append(f"{key} required for reviewed facts")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(record.get("reviewed_on", ""))):
            errors.append("reviewed_on must be ISO date")
    if field == "svg_path" and isinstance(value, str) and not re.search(r"[Mm]", value):
        errors.append("svg_path requires a move command")
    return errors


def main(paths):
    if not paths:
        raise SystemExit("usage: validate.py facts.json [facts.json ...]")
    failed = False
    for name in paths:
        data = json.loads(Path(name).read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise SystemExit(f"{name}: expected array of facts")
        for index, record in enumerate(data):
            errors = validate(record)
            if errors:
                failed = True
                print(f"{name}[{index}]: " + "; ".join(errors), file=sys.stderr)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
