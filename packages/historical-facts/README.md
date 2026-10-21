# Historical season and layout facts — validation contract (v0)

This directory is an **unpublished research contract**, not a new public API, database migration, or imported dataset. The production archive continues to use pinned F1DB v2026.17.0. No factual values are shipped here.

## Scope

One fact per `entity_kind`, `entity_id`, `year`, `field`, and (for circuit geometry) `layout_version`. Initial allowlist:

| Kind | Fields |
| --- | --- |
| driver_season | car_number, team_role |
| constructor_season | chassis, engine, team_principal, base |
| circuit_layout | length_m, turns, direction, svg_path |
| race_event | scheduled_laps, drs_zones, tyre_compounds |

A field's absence means **unknown**, never zero. Driver number, constructor technical facts, circuit dimensions and tyre choices are time-dependent. A constructor's season identity does not prove corporate lineage. Geometry must be tied to a reviewed layout version and must not be inferred from a modern map for historic years.

## Review and licensing

Each record must carry an HTTPS source URL, publisher, title, exact locator and access date. `draft`, `reviewed`, `rejected` are research states; `reviewed` requires named reviewer and review date. Validation does **not** grant publication rights. Add independent human approval, source reconciliation, conflict resolution, and an explicit media/geometry license check before integrating into public pages. Never copy BoxBox illustrations or proprietary FIA diagrams.

SVG paths are *data*, not markup: allowlisted path commands only. A future renderer must not inject unsanitized SVG/HTML. Source geometry may require ODbL attribution/share-alike, depending on derivation. Do not publish until obligations are checked.

## Run

```sh
python3 -m unittest discover -s packages/historical-facts -p 'test_*.py' -v
python3 packages/historical-facts/validate.py /path/to/research-facts.json
```

This phase deliberately does not fabricate facts, populate a database, or expose fields in Next.js. Next phase: numbered forward-only migration, API read models, source and review gates, layout-specific SVG rendering, and UK/EN presentation with null-safe tests.
