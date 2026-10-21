# Approved dossier → publication pipeline (text-only, v1)

This release path **does not authorize or automatically approve historical claims**. The existing offline validator is the source of truth for structurally valid independent human review. The repository's existing `content_* ` SQL tables, revision-invalidation triggers and `/api/drivers/:id/article` endpoint are reused. No additional content schema, frontend graph, or AI-generated reviewer signature is introduced.

## Stage 1: independent review

Complete the existing `docs/editorial/pilots/senna/{en,uk}.review.json` sidecars for their exact locale-specific dossiers. Open every underlying source, inspect the precise locator and original wording, independently verify identity, translation, originality and any conflicting claims; do not set `actor: human` using automation. An editor must sign an **exact revision digest** and be different from the author. Until that happens, there are **zero approved sample bundles** in this repository.

Preflight, run independently for each locale:

```sh
python3 scripts/editorial_review.py \
  --dossier docs/editorial/pilots/senna/en.dossier.json \
  --review docs/editorial/pilots/senna/en.review.json \
  --archive /tmp/grid-atlas-f1db/f1db-json-splitted.zip \
  --checksums /tmp/grid-atlas-f1db/checksums_sha256.txt \
  --as-of 2026-10-21 --require-ready
```

No content is published by this command.

## Stage 2: export a reviewed revision

```sh
python3 scripts/export_approved_editorial.py \
  --dossier docs/editorial/pilots/senna/en.dossier.json \
  --review docs/editorial/pilots/senna/en.review.json \
  --archive /tmp/grid-atlas-f1db/f1db-json-splitted.zip \
  --checksums /tmp/grid-atlas-f1db/checksums_sha256.txt \
  --as-of 2026-10-21 \
  --output /tmp/grid-atlas-approved-senna-en.json
```

Export fails unless the existing validation report is ready and the stage is explicitly `approved`. The output is a **reviewed but not yet published** bundle with the entire content digest, exact canonical F1DB external identity, original claims, source locators and approval metadata. Text-only: any image or media is rejected. Output is never overwritten.

## Stage 3: explicit publication, PostgreSQL only

First check the export, without contacting a database:

```sh
node apps/api/scripts/publish-editorial.cjs /tmp/grid-atlas-approved-senna-en.json --dry-run
```

A human editor/operator must separately authorize the exact export revision. The importer is intended for a restricted, audited release environment, not public CI or a browser client. **Do not publish from GitHub CI automatically**.

```sh
export DATABASE_URL='postgresql://...'
export EDITORIAL_PUBLICATION_APPROVED_REVISION='<exact checked 64-character digest>'
export EDITORIAL_PUBLISH_OPERATOR_CONFIRM='PUBLISH_REVIEWED_CONTENT'
node apps/api/scripts/publish-editorial.cjs /tmp/grid-atlas-approved-senna-en.json --publish
```

The operator must inspect that the bundle actually came from the independently signed sidecar and exact repo revision. The two environment variables are operator confirmations, **not cryptographic verification of the reviewer's identity**. The script does not fetch or authenticate the review record independently. Limit access to the export and publication operation accordingly.

The importer resolves `historical_drivers` by F1DB source + external driver ID, refuses ambiguous identities, and refuses overwriting any existing EN/UK article. It inserts source-located evidence **before** marking claims verified, inserts article associations **before** final article publication, and commits atomically. Duplicate attempts fail without touching the existing article.

## Acceptance and publication checks

- CI runs source-contract tests plus a real disposable PostgreSQL publisher/invalidation test.
- After a permitted publication, inspect `GET /api/drivers/<internal-id>/article?locale=en` for the correct public article and references; confirm that the wrong locale stays 404.
- If a claim's evidence is edited, the existing database trigger invalidates its verification. The public API must then deny the article until a new review cycle is completed.
- Edits to a published article are **not** silently approved. Overwriting published revisions, explicit withdrawal operations, public operator authentication, immutable release provenance and a safe migration between existing revisions require a separate hardened release workflow. Do not use this importer to bypass that process.
- Never use a forged `approved` review sidecar or synthetic test review in production. CI fixtures are test-only.

## Operational limitation

This is the **first approved-revision publication route**, not a public CMS. The user-facing article appears only if a real editor has approved the specific dossier version and a human operator explicitly invokes the release command. It does not magically approve the dozens of research dossiers; they remain unpublished until a real review is complete.
