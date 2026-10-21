# How to validate and publish Grid Atlas biographies

## Reality check

The repository currently has public, archive-backed **statistics pages**, unpublished research dossiers and drafts, an **offline approval sidecar validator**, and a **PostgreSQL public read gate** (`GET /api/drivers/:id/article?locale=uk|en`).

**A gated export and PostgreSQL publisher now exist**, but they do not replace independent editorial approval. See [Approved release pipeline](APPROVED_RELEASE_PIPELINE.md). An offline validator or Git merge never publishes a biography; an editor must approve the exact locale-specific revision and an authorized operator must publish the reviewed bundle. The existing pilot still has no real sign-off.

## Fastest trustworthy path: approve one complete pilot, then batches

### 1. Understand the queue

```sh
python3 scripts/editorial_cohort_readiness.py --format markdown
python3 scripts/editorial_cohort_readiness.py --format json > /tmp/grid-atlas-content-queue.json
python3 -m unittest discover -s tests -p 'test_editorial_cohort_readiness.py' -v
```

The command inventories all existing champion research files in both supported locales, shows missing claims, research gaps and review blockers, and intentionally reports **zero approved articles**. It needs no database, network connection or F1DB archive; it is an operational queue only.

### 2. First human-reviewed exemplar: Senna, both locales

The existing pilot inputs are `docs/editorial/pilots/senna/en.dossier.json`, `en.review.json`, and their `uk` equivalents. The human owner verifies the exact source passage, author identity, quoted statistics, source independence, any contradicting records, EN/UK translation, copyright originality and media rights. Missing items remain open rather than receiving a synthetic sign-off.

```sh
python3 scripts/editorial_review.py \
  --dossier docs/editorial/pilots/senna/en.dossier.json \
  --review docs/editorial/pilots/senna/en.review.json \
  --archive /tmp/grid-atlas-f1db/f1db-json-splitted.zip \
  --checksums /tmp/grid-atlas-f1db/checksums_sha256.txt \
  --as-of 2026-10-21 --require-ready
```

Repeat with `uk.dossier.json` and `uk.review.json`. A failure from `--require-ready` means the given locale is not approved. The accountable editor must sign each **exact digest**; any change of prose/evidence invalidates previous decisions. A second independent editor should be the reviewer. Do not auto-fill `actor: human` with code.

### 3. Use the existing approval-controlled publisher

Do **not** implement a second SQL importer or approval system. After independent human review of the exact dossier revision, follow [the current release pipeline](APPROVED_RELEASE_PIPELINE.md):

1. Validate the signed EN or UK sidecar with `scripts/editorial_review.py --require-ready`.
2. Export only the approved exact revision with `scripts/export_approved_editorial.py`.
3. Validate the bundle offline with `node apps/api/scripts/publish-editorial.cjs <bundle> --dry-run`.
4. Have an authorized operator inspect the signed revision and run the restricted `--publish` operation with the documented confirmation environment variables.
5. Verify `GET /api/drivers/:id/article?locale=uk|en`; an unapproved or unpublished locale must remain inaccessible.

The release pipeline does not cryptographically authenticate a human reviewer, does not offer arbitrary overwrites or a public CMS, and must not be run as an automatic publishing CI job. Existing publication-invalidation SQL remains active. Never forge reviewer metadata or grant approval based on tests.

### 4. What can be published sooner?

Results-backed pages and explicitly labeled archive statistics already exist. Human-reviewed, source-backed short **introductory** articles can be approved faster than encyclopedic multi-chapter biographies, **but** must still satisfy the same revision, claim, translation and publication gates. Draft stories and technical research cannot be exposed as verified prose merely to accelerate coverage.

### 5. Batch to scale without 20 tiny PRs

Group the existing nine-driver, 22-chapter cohort into one editorial review milestone. Have an editor review independent source packets per claim and locale; track review completion using the queue report. The adapter already has PostgreSQL integration checks. Ship **one content PR per meaningful reviewed cohort** after actual editorial approval; never label unreviewed research as approved. Keep Codex's History Atlas files untouched.

**Never publish unlicensed photographs, third-party maps, BoxBox illustrations or historic car imagery solely because they are online.** Text-only approved articles are a valid first release.
