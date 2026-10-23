# Adding approved archive imagery

Current workflow, 23 October 2026. This is an engineering publication procedure, not a rights clearance or an editorial approval. The [pilot register](README.md) retains the original research and unresolved rights questions. Run `pnpm audit:media --as-of YYYY-MM-DD` to inspect the current registry without changing it.

## Choose the subject and presentation

| Material | Canonical subject / kind | Public presentation |
| --- | --- | --- |
| Driver photograph or portrait | `driver`, exact F1DB external ID / `photograph` or `portrait` | Driver hero and image archive |
| Constructor photograph | `constructor`, exact constructor external ID / `photograph` | Constructor hero and image archive |
| Car illustration | `constructor` / `car-illustration` | Constructor image archive, explicitly labeled as an illustration |
| Circuit photograph | `circuit`, exact circuit external ID / `photograph` | Circuit image archive |
| Historical circuit diagram | `circuit` / `circuit-diagram`, exact layout and supported race IDs | Existing exact-race diagram component; separate from the photo gallery |

A constructor image does not establish entrant identity or legal succession. A photograph associated with a subject is not automatically evidence for the currently selected season. Put any verified year/car context in both captions. Never relabel a generated scene as documentary photography. The current registry has no canonical car entity: identify the approved car illustration in its caption and attach it to the correct constructor; do not invent a car ID or substitute a logo.

## Prepare a reviewable change

1. Record a research candidate in `docs/media/candidates.json`. Keep unknown fields null. Candidates cannot contain delivery paths or approval. Inspect the original file page, revision history, creator, derivative chain and actual license evidence. Reusing an uploader name as a photographer credit is not sufficient.
2. Resolve the exact source identity in the checksum-verified F1DB archive. For a new subject, extend `docs/media/pilot-identities.json` with its external ID, source name and record SHA-256, rather than a local database sequence ID. The hash is SHA-256 of the original record encoded with Python `json.dumps(record, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()`. Extend exact layout/race mappings only with source records supporting them. Run the identity verifier below.
3. After a human rights decision permits the intended use, retrieve only that approved file. Decode and visually inspect it; verify its subject and historical context. Record MIME, dimensions, exact bytes SHA-256, source revision, inspection date, creator, attribution, license URL, relevant restrictions and modifications. Do not silently crop or remove notices. MIME sniffing and checksums alone do not establish image integrity or rights.
4. Write independent Ukrainian and English alt text and captions. Preserve source/file/license links and the required credit. A car illustration must remain labeled as an illustration. The public product has only `uk` and `en` locales.
5. Prepare the complete publication payload, including a local delivery path under `apps/web/public/media/`. The current policy disables remote hotlinking. Ask an independent human to review the exact bytes, identity, context, locale text and rights evidence and record their real handle, date and rationale against `mediaFingerprint` from `registry.ts`. Do not generate a reviewer or approval. Changing fingerprinted fields invalidates review.
6. Submit the reviewed record in `apps/web/src/components/media/publication.json` and its approved bytes in one PR. Keep candidate research as provenance; do not bulk-copy candidate records into publication. Run all preflights and inspect the actual public page in both languages. `MediaCollection` selects only matching, currently verified kinds; heroes exclude car illustrations for driver subjects. Each image preserves its caption, attribution and reuse details.

There is no database/JSON synchronization in this process. The separate database editorial publisher requires its own approved claim-level bundle; a media approval never approves a biography or manuscript.

## Reproduce the checks

Use Node 24 and the workspace's frozen dependencies. Substitute the inspection date and paths to the existing pinned release; these commands do not download imagery or approve anything.

```sh
pnpm audit:media --as-of 2026-10-23
node scripts/validate-media-registry.mjs --as-of 2026-10-23
python3 scripts/verify-media-identities.py \
  --archive /path/to/f1db-json-splitted.zip \
  --checksums /path/to/checksums_sha256.txt
pnpm lint
pnpm typecheck
pnpm test
GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm build
# Requires a separate migrated test PostgreSQL DATABASE_URL:
GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm exec playwright test media
```

For local UI review, the isolated preview command in the [pilot guide](README.md) also supports `?test=gallery-verified`, `gallery-car`, `gallery-withdrawn` and `gallery-stale`. These are explicitly synthetic fixtures outside production routes, not real approvals. Verify keyboard attribution disclosure, image failure without layout shift, mobile/200% text, no unexpected external requests and no image requests after withdrawal or stale review.

The read-only readiness report lists blocking metadata fields. It does not replace a human license/identity decision. The dedicated [160-layout artwork manifest](historical-circuit-svg-provenance.md) has its own attributed source and review boundaries; its existence does not approve any photographic candidate.

## Withdrawal

Set the affected record to `withdrawn`, remove its bytes from the public directory and submit the change together. Run the registry preflight: unregistered/rejected/withdrawn files left in `/media` fail it. Rebuild, deploy through the normal verified release process and invalidate deployment/CDN caches. Confirm that public pages show the fallback and make no request for the old asset. A registry update cannot recall cached or already downloaded files; deployment cache ownership and invalidation must be established before launch. Preserve the withdrawn record and review history, and never reuse its ID for different bytes.
