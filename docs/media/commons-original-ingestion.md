# Pinned Commons original ingestion (research only)

The repository includes an **explicit, opt-in** downloader for the two Wikimedia Commons files that have recorded original metadata in `docs/media/commons-original-evidence.json`. It never publishes an image or updates `publication.json`.

## Run

Create a private, empty, **existing** directory outside the repository, then run:

```sh
mkdir -m 700 -p /tmp/grid-atlas-commons-originals
node scripts/ingest-commons-original.mjs --id research-schumacher-portrait-2007 --output-dir /tmp/grid-atlas-commons-originals
node scripts/ingest-commons-original.mjs --id research-silverstone-2019 --output-dir /tmp/grid-atlas-commons-originals
node --test tests/commons-original-ingestion.test.mjs
```

The tool derives the Commons file title from a research record, queries the official Commons MediaWiki API for the **current original** and rejects mismatched pinned byte counts or dimensions. It only downloads HTTPS originals from `upload.wikimedia.org/wikipedia/commons/`, refuses redirects, caps bytes, validates PNG/JPEG structure and checks the downloaded original's **SHA-1 against pinned Commons evidence**, then calculates SHA-256. Output is written with exclusive temporary creation and atomic no-clobber hard linking. If the file exists, it is not replaced.

The output includes source API timestamp, source URL, computed hashes, dimensions and **publication_allowed: false**. It is a research artifact, not a verified license, historical identity, image-safety certification or independent approval. The source-page `description_oldid` is not the original binary revision ID. An unchanged hash ties the bytes to pinned Commons evidence, but a separate rights/identity review remains mandatory.

## Security and operational limits

- No user-provided download URLs; only pinned research IDs with matching evidence.
- No remote hotlinking in the website and no changes to the publication registry.
- No automatic follow of redirects or non-Wikimedia hosts.
- A pre-existing non-symlink output directory is required. Keep it private and outside the repository.
- At most 40 MiB per original and a 30-second fetch timeout. This is not a full image decoder, malware scan or license clearance.
- Network requests occur **only** when the CLI is explicitly invoked; unit tests use mocked responses.
- If Commons changes the original, ingestion fails closed rather than silently updating pinned evidence. Update evidence only after independent source investigation.

The five staging candidates are **not all eligible**: only two have pinned original evidence. The remaining three must be independently researched before adding evidence. Review `docs/media/original-inspection.md` and `docs/media/approved-imagery-workflow.md` before any promotion.
