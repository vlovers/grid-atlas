# Bulk driver content batch — 50 research packets

This batch **reuses** the existing checksum-verifying F1DB importer, career observation model and editorial manifest contract; it does not introduce another approval system.

## Run on the pinned archive

```sh
python3 scripts/prepare_bulk_driver_cohort.py \
  --archive /tmp/grid-atlas-f1db/f1db-json-splitted.zip \
  --checksums /tmp/grid-atlas-f1db/checksums_sha256.txt \
  --output /tmp/grid-atlas-bulk-fifty
```

Outputs (all **unpublished**, all locales pending review):

- `manifest.json`: exactly 50 canonical drivers, EN/UK targets, pending review.
- `research-profiles.json`: 50 evidence packets with race-result observations and constructor-era chronology. These are structured archive observations, **not biographies**.
- `coverage.json`: transparent selection rationale, distinct IDs, coverage counts and zero approved biographies.

Selection is deterministic by **count of race-result rows** from the pinned F1DB release, excluding drivers in existing batch manifests. This is a workload prioritization rule and **not** a ranking of sporting greatness or championship titles. No selected ID is invented: the selection is computed from the checksum-verified archive.

GitHub CI uses the already-present pinned real-archive PostgreSQL workflow, generates the batch once, runs offline tests and uploads `unpublished-driver-research-fifty` as a seven-day artifact. This avoids fifty individual PRs and fifty redundant imports.

## Editorial / licensing boundaries

The existing F1DB CC BY 4.0 attribution remains mandatory. Each statistical value must retain its definition and source; imported race points do not imply historical championship points. No original biography copy, independent source review, images, licensed logos or actual publication status are implied by this batch. EN and UK draft fields stay empty pending genuine editorial research. No public Next.js route reads the output.

**Acceptance**: real-archive CI success, 50 distinct validated identities, result evidence present and all publication flags still blocked. This is a significant step for content operations, **not** a claim of 50 finished articles.

Next content sprint: write and review **actual** bilingual biographies in sizeable cohorts using the existing claim/source review workflow. Assign editorial authors independently of frontend Codex work.
