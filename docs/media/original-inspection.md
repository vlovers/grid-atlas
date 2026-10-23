# Local original inspection

Use `node scripts/inspect-media-original.mjs --id research-schumacher-portrait-2007 --file /path/to/original.jpg` after independently retrieving the exact Commons original. The tool reads local JPEG/PNG bytes, computes SHA-256 and extracts dimensions. It does not fetch URLs, assert Commons revision provenance, approve rights, update the media registry or publish images. The optional `--expected-sha256` argument verifies an independently obtained checksum. An exact source revision and independent human review remain mandatory before publication.
