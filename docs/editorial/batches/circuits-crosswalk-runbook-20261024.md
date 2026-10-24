# Reproduce the first five circuit/race/layout crosswalk

The editorial batch has prose and independently sourced racing-history research; this script adds a **source-row preflight**, not a historical/rights/editorial approval.

Use the checksum-verified F1DB v2026.17.0 ZIP and publisher checksum text from the repository README:

```sh
python3 scripts/editorial-circuit-crosswalk.py \
  --archive /tmp/grid-atlas-f1db/f1db-json-splitted.zip \
  --checksums /tmp/grid-atlas-f1db/checksums_sha256.txt \
  --output /tmp/grid-atlas-circuit-crosswalk.json
python3 -m unittest tests/test_editorial_circuit_crosswalk.py -v
```

The script reads the exact `f1db-circuits.json`, `f1db-circuits-layouts.json` and `f1db-races.json` collections **after checksum validation**. It outputs exact source race ID, race date, season and layout ID for the following candidate IDs and years:

- `silverstone`: 1950
- `monaco`: 1950, 1984, 2016
- `spa-francorchamps`: 1950, 1970, 1983
- `monza`: 1950
- `suzuka`: 1987, 1988

Unknown circuit external IDs fail instead of silently inventing a mapping. Missing race records are reported explicitly; invalid race-to-layout circuit associations fail. **The hard-coded IDs are candidates pending running the script against the pinned ZIP, not verified F1DB IDs.**

This tool does not calculate winners, title points, layout geometry or biography assertions. The report is an input for the independent claim reviewer; it never publishes copy or graphics. It must be run and its results inspected before treating any event-layout association as known. Never confuse numeric F1 website URL IDs with F1DB or PostgreSQL IDs.

**Execution status for this commit:** files committed to review branch; no local archive run, unit test run or CI result confirmed yet.
