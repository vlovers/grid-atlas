# Explicit Commons original batch ingestion (research-only)

This command groups **already pinned** Wikimedia Commons originals into one sequential, auditable run. It does not discover new candidates, approve rights, write the public media registry, generate derivative files, or deploy anything.

## Prerequisites

- Use Node 24+ and a **new existing owner-only directory outside the repository** (mode `0700`), with sufficient disk space. The CLI now rejects repository-contained paths (including `apps/web/public/media` and paths reached through symlinked parents), direct directory symlinks, and group/world-readable directories. It resolves the canonical destination before writing.
- Review `docs/media/commons-original-evidence.json` and `docs/media/cross-era-staging.json` before running. All five staged research IDs now have **observed Commons original** SHA-1, exact byte count, dimensions and description-page revision recorded. This is source metadata, not a local binary verification or rights approval. Run `node scripts/audit-commons-evidence.mjs` to check the offline evidence coverage before attempting any network download. **Every staged candidate must have exactly one pinned source evidence entry**: missing evidence is a nonzero audit failure, even though the report still lists the missing IDs for investigation. This is a research integrity gate, not a rights clearance.
- Network access to the official Commons API and original file host is required. This is a live operation; upstream files may change. Respect API errors and retry later rather than bypassing the checks.

## Run

```sh
mkdir -p /tmp/grid-atlas-private-originals
chmod 700 /tmp/grid-atlas-private-originals
node scripts/ingest-commons-batch.mjs \
  --ids research-schumacher-portrait-2007,research-alonso-2024,research-mclaren-mp44-2007,research-ferrari-f2004-2004,research-silverstone-2019 \
  --output-dir /tmp/grid-atlas-private-originals
```

The tool checks research-only staging integrity, duplicate IDs, source evidence and output-directory safety before downloading. Single-original ingestion also rejects unsupported manifest schema versions and observed creator/license drift **before making a network request**; a successful source metadata lookup never overrides a conflicting local pin. Each candidate then uses `ingest-commons-original.mjs`: the official Commons API supplies the original URL; expected byte count, dimensions **and current API SHA-1** are checked before the binary request; downloaded bytes must also match the pinned Commons SHA-1. A local SHA-256 is calculated and reported. Commons API metadata is streamed with a **1 MiB hard response limit** (including when Content-Length is absent or misleading) and must decode as UTF-8 JSON before the original binary is requested. Writes use a temporary file and no-clobber publication into the **private originals directory**.

Both single-original and batch CLIs now load the research-only `verified-original-observations.json` register before network access. For Schumacher and Alonso, the original bytes must match **both** pinned Commons SHA-1 and the independently observed SHA-256. The original is rejected before being retained if its SHA-256 differs; batch handoff also checks the reported SHA-256 so a substituted inspection cannot silently pass. The three remaining originals have no SHA-256 observation and continue to require real original-byte research. A missing observation does **not** imply approval. Programmatic callers may omit the optional observation register for isolated tests, but the production CLIs always load it. This guard validates the observation register and source correspondence; it does not establish that the Commons creator owns rights or that a pictured subject is correctly identified.

The batch runner independently cross-checks each returned inspection against its pinned research ID, Commons file page, original SHA-1, byte count, MIME, width and height **before** marking that candidate as ingested. This keeps a partial or mismatched inspection from becoming a valid research receipt. The report preserves these fields for the strict five-candidate receipt builder. A complete mock-backed batch-to-receipt contract test protects this handoff; no network requests are needed to run it.\n\nThe report includes `ingested`, `blocked`, per-candidate SHA-256 and the observed Commons API source. If any item is blocked, the command exits nonzero while retaining independently verified originals from earlier items. An existing original is never overwritten. Re-running the same command will report the existing file as blocked; use the offline inspector to recheck it instead:

```sh
node scripts/inspect-media-original.mjs \
  --id research-schumacher-portrait-2007 \
  --file /tmp/grid-atlas-private-originals/research-schumacher-portrait-2007.jpg
```

The original Commons description-page revision is **not** a cryptographic pin for binary bytes. Matching the published SHA-1 and local SHA-256 improves reproducibility but does not prove authorship, historical context or permission to publish. JPEG/PNG structural checks are not full decoding or malware scanning. Do not commit downloaded files or report them as approved.

## Ephemeral GitHub Actions SHA-256 research

The opt-in [Commons originals SHA-256 research workflow](../../.github/workflows/commons-original-sha256-research.yml) is **manual-only** (`workflow_dispatch`): upstream Wikimedia Commons returned HTTP 429 when repeated PR builds attempted five downloads. Do not rerun until the service's throttling window has cleared; never bypass rate limits or remove source checks. Its **mclaren-only**, **ferrari-only**, and **silverstone-only** scopes allow one explicitly selected pending original per manual run, reducing burst requests after Commons HTTP 429 responses. Run these only when the throttling window has cleared, and stop on renewed 429 rather than repeatedly retrying. A single-file successful run produces an incremental receipt, **not** a complete five-original receipt. Its default **pending-three** selection attempts only the three originals without a pinned binary SHA-256 (McLaren MP4/4, Ferrari F2004, Silverstone); an explicit **all-five** choice rechecks all five from Wikimedia Commons in a temporary, owner-private directory on a GitHub-hosted runner. It runs the same byte-count, SHA-1, image structure and SHA-256 checks as the local CLI, then deletes the downloaded binaries on step exit. **No image file is committed, uploaded as an artifact, or published.** The workflow has read-only repository permissions and uses no publication credentials.

On success, the short-lived `unpublished-commons-sha256-research` Actions artifact contains a metadata-only batch report and an **incremental** receipt (`commons-incremental-sha256.json`). It validates each selected original against the existing strict source checks, reconciles SHA-256 with the two pinned prior observations, and explicitly marks previously observed (not re-downloaded) and still-pending originals. Only the explicit **all-five** scope also creates the strict same-run five-candidate receipt (`commons-research-sha256.json`). The receipt records source page, original description revision, observed license/creator, original byte count and dimensions, locally computed SHA-256 and Commons SHA-1. Every receipt explicitly says `publication_allowed: false`, `rights_review: pending` and `subject_review: pending`. Incremental coverage of five SHA-256 values across separate runs is **not** a five-file same-run verification, and never grants rights or editorial approval. `scripts/build-commons-research-report.mjs` refuses partial, blocked, duplicate or mismatched batches; a failed upstream request cannot create a successful incremental or complete research receipt. The artifact expires after seven days. Trigger only when Commons throttling has cleared; do not schedule retries or commit/promote a receipt to the public registry.

This is a live network check, so Commons availability, throttling or changed source metadata can cause a **red research workflow**. On 23 October 2026, one attempted batch verified two originals, but subsequent requests were throttled (HTTP 429). See [dated research observations](commons-original-research-observations-2026-10-23.md) for the two source-matched SHA-256 values; these are not a five-image complete receipt. Investigate the precise failure rather than weakening source pins or reporting an unverified SHA-256. Even a green workflow does not resolve copyright, provenance, subject identification or human approval.

## Offline chain-of-custody verification (no Commons requests)

Two original-image SHA-256 observations from the 23 October runner are pinned in [verified-original-observations.json](verified-original-observations.json), with the source run linked there. These are **original binary** hashes, not F1DB record hashes or publication approvals. The remaining three candidates intentionally have no pinned SHA-256 yet.

For a private directory already containing one or more downloaded originals, re-inspect all present files offline:

```sh
node scripts/audit-local-commons-originals.mjs --output-dir /existing/owner-only/private-originals
node --test tests/commons-local-originals-audit.test.mjs tests/commons-research-report.test.mjs tests/commons-original-observation-guard.test.mjs
```

The auditor requires an existing owner-private directory outside the repository. It verifies original bytes against pinned Commons SHA-1, dimensions, MIME and byte count using the existing structural inspector. For the two previously verified originals it also checks the locally calculated SHA-256 against the independent runner observation. Other verified originals are reported as `inspected_new_sha256` for later human research; **they are not automatically added to the observation register**. Missing files are `pending_original`, checksum or structure mismatches are `blocked` (nonzero exit), and `complete` is true only when all five files are present and verified. No network request, image publication, license approval or image artifact is involved.

The complete-batch research receipt additionally checks inspected MIME/dimensions, pinned creator/license consistency, canonical original URL and timestamp shape. These are consistency checks on research metadata, **not** proof of copyright ownership or independent historical verification.

## Publication remains blocked

Independent review must still resolve original/derivative source chains, attribution, license obligations, relevant non-copyright rights, historical F1DB identity, context, UK/EN alt text and captions. Only then may a separately reviewed publication PR add approved bytes to `apps/web/public/media/` and an authenticated human-reviewed registry record. See [media policy](approved-imagery-workflow.md) and [original inspection](original-inspection.md).

## Tests

```sh
node --test tests/commons-evidence-audit.test.mjs tests/commons-evidence-completeness.test.mjs tests/commons-batch-ingestion.test.mjs tests/commons-original-ingestion.test.mjs tests/media-original-inspection.test.mjs tests/private-original-directory.test.mjs tests/commons-research-report.test.mjs
```

Tests mock the network and never fetch or publish third-party media. Both single and batch ingestion use the same destination guard; `tests/private-original-directory.test.mjs` covers repository paths, parent-symlink aliases, direct symlinks, and unsafe permissions.

## Manual pending-three follow-up (no repeat requests for the first two)

In GitHub Actions, open **Commons originals SHA-256 research (unpublished)**, choose **Run workflow**, leave **scope = pending-three**, and run only after HTTP 429 throttling has cleared. This downloads at most the three missing originals; it does **not** fetch Schumacher or Alonso again. Choose **all-five** only when an independent same-run five-file receipt is specifically needed and Commons permits it. Neither mode retries on 429 or changes source pins.

The incremental receipt is a separate, explicitly labeled research artifact. It reconciles the two previously verified SHA-256 observations with only the originals actually inspected during the selected run, and reports `verified_this_run`, `previously_observed_not_rechecked`, `missing_sha256`, and `complete_hash_coverage_not_rights_approval`. A partial/blocked selected batch exits nonzero and cannot produce a successful receipt. Any mismatch with a prior SHA-256 blocks the report. Original bytes remain ephemeral and unpublished. Run `node --test tests/commons-incremental-report.test.mjs` to reproduce the offline reconciliation checks.

## Independent reviewer handoff (offline)

Run `node scripts/build-commons-review-handoff.mjs --output /tmp/grid-atlas-commons-review-handoff.json` to produce a fail-closed five-candidate evidence packet without network access, image bytes, fabricated rights approvals or publication changes. It distinguishes F1DB identity-record SHA-256, Commons metadata SHA-1 and locally observed original-image SHA-256; unresolved binaries and UK/EN reviewer decisions stay explicitly pending. See [the reviewer handoff procedure](commons-independent-review-handoff.md). This packet does not replace the [approved imagery workflow](approved-imagery-workflow.md).
