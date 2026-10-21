# How to validate and publish Grid Atlas biographies

## Reality check

The repository currently has public, archive-backed **statistics pages**, unpublished research dossiers and drafts, an **offline approval sidecar validator**, and a **PostgreSQL public read gate** (`GET /api/drivers/:id/article?locale=uk|en`).

**There is no approved bulk publication adapter from dossier JSON to SQL.** The Python validator never publishes, and Git merge of a draft does not publish a biography. Do not claim otherwise. This is the reason source-located chapter copy is not visible as an article on the public site.

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

### 3. Publication requires a separate engineering PR

After the pilot passes, build an **authorization-controlled importer** that:
- reconciles canonical F1DB **external** driver identity with the correct internal `historical_drivers.id` in PostgreSQL;
- imports only the independently approved exact revision and source-located claims into the existing `content_sources`, `content_claims`, `content_claim_evidence`, `content_articles` and `content_article_claims` tables;
- validates constraints and applies a transaction per locale/revision, with idempotency, preview/dry-run and rollback;
- never turns a draft or a missing UK translation into a public article, and never infers approval from a successful research validator;
- checks that the API returns an approved, published article only for the specified driver and locale, with proper citations; rejects withdrawn/stale revisions;
- is covered by PostgreSQL integration tests including unauthorized import attempts, partial failures, repeated imports, edit invalidation and withdrawal.

Existing DB migration `0006_editorial_content.sql`, `0007_editorial_review_invalidation.sql`, `apps/api/src/editorial.controller.ts` and `docs/editorial/PUBLICATION_REVIEW.md` are the starting contracts. Do not build a second publication schema.

### 4. What can be published sooner?

Results-backed pages and explicitly labeled archive statistics already exist. Human-reviewed, source-backed short **introductory** articles can be approved faster than encyclopedic multi-chapter biographies, **but** must still satisfy the same revision, claim, translation and publication gates. Draft stories and technical research cannot be exposed as verified prose merely to accelerate coverage.

### 5. Batch to scale without 20 tiny PRs

Group the existing nine-driver, 22-chapter cohort into one editorial review milestone. Have an editor review independent source packets per claim and locale; track review completion using the queue report. Once the pilot importer passes real PostgreSQL integration and source checks, ship **one content PR per 10–20 approved drivers**. Keep Codex's History Atlas files untouched.

**Never publish unlicensed photographs, third-party maps, BoxBox illustrations or historic car imagery solely because they are online.** Text-only approved articles are a valid first release.
