# Explicit Commons original batch ingestion (research-only)

This command groups **already pinned** Wikimedia Commons originals into one sequential, auditable run. It does not discover new candidates, approve rights, write the public media registry, generate derivative files, or deploy anything.

## Prerequisites

- Use Node 24+ and a **new existing private directory outside the repository**, with sufficient disk space. Never use `apps/web/public/media` as the output directory.
- Review `docs/media/commons-original-evidence.json` and `docs/media/cross-era-staging.json` before running. At present, only the Schumacher and Silverstone research IDs have pinned original SHA-1, byte count and dimensions. The other three staged research entries remain blocked until equivalent source evidence is recorded.
- Network access to the official Commons API and original file host is required. This is a live operation; upstream files may change. Respect API errors and retry later rather than bypassing the checks.

## Run

```sh
mkdir -p /tmp/grid-atlas-private-originals
chmod 700 /tmp/grid-atlas-private-originals
node scripts/ingest-commons-batch.mjs \
  --ids research-schumacher-portrait-2007,research-silverstone-2019 \
  --output-dir /tmp/grid-atlas-private-originals
```

The tool checks research-only staging integrity, duplicate IDs, source evidence and output-directory safety before downloading. Each candidate then uses `ingest-commons-original.mjs`: the official Commons API supplies the original URL; expected byte count and dimensions are checked; downloaded bytes must match the pinned Commons SHA-1. A local SHA-256 is calculated and reported. Writes use a temporary file and no-clobber publication into the **private originals directory**.

The report includes `ingested`, `blocked`, per-candidate SHA-256 and the observed Commons API source. If any item is blocked, the command exits nonzero while retaining independently verified originals from earlier items. An existing original is never overwritten. Re-running the same command will report the existing file as blocked; use the offline inspector to recheck it instead:

```sh
node scripts/inspect-media-original.mjs \
  --id research-schumacher-portrait-2007 \
  --file /tmp/grid-atlas-private-originals/research-schumacher-portrait-2007.jpg
```

The original Commons description-page revision is **not** a cryptographic pin for binary bytes. Matching the published SHA-1 and local SHA-256 improves reproducibility but does not prove authorship, historical context or permission to publish. JPEG/PNG structural checks are not full decoding or malware scanning. Do not commit downloaded files or report them as approved.

## Publication remains blocked

Independent review must still resolve original/derivative source chains, attribution, license obligations, relevant non-copyright rights, historical F1DB identity, context, UK/EN alt text and captions. Only then may a separately reviewed publication PR add approved bytes to `apps/web/public/media/` and an authenticated human-reviewed registry record. See [media policy](approved-imagery-workflow.md) and [original inspection](original-inspection.md).

## Tests

```sh
node --test tests/commons-batch-ingestion.test.mjs tests/commons-original-ingestion.test.mjs tests/media-original-inspection.test.mjs
```

Tests mock the network and never fetch or publish third-party media.
