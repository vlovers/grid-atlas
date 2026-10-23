# Editorial Content V1 — claim-level review queue

The five-driver bilingual release contains ten **unapproved** research dossiers. This offline command creates a reviewer work queue, not a publication artifact:

```sh
node scripts/build-editorial-review-queue.mjs --format markdown --output /tmp/grid-atlas-editorial-review.md
node scripts/build-editorial-review-queue.mjs --format json
node --test tests/editorial-review-queue.test.mjs
```

Each locale row includes claim-review counts, unresolved review issues, research gaps, and claim IDs with fewer than two supporting independent publisher groups or explicit counter-evidence. **These are triage signals, not fact-checks**: multiple groups do not prove truth, and a single primary classification may support a narrow result claim. Every claim must still be reviewed against its actual source locator. No source fetching, draft publication, reviewer fabrication, or edits to approval sidecars occur. The report explicitly marks publication as blocked.

Use the existing [independent publication review](../../PUBLICATION_REVIEW.md) for exact-revision human decisions and [approved release pipeline](../../APPROVED_RELEASE_PIPELINE.md) for a separate authorized publication operation. The queue does not supersede the full Python editorial validation, which remains the source of truth for readiness.
