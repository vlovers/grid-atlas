# Commons photographic coverage status (offline)

Generate a read-only report for the five pinned photographic research candidates:

```sh
node scripts/build-commons-media-readiness.mjs --format markdown --output /tmp/grid-atlas-media-readiness.md
node scripts/build-commons-media-readiness.mjs --format json
node --test tests/commons-media-readiness.test.mjs
```

The report separates **source metadata coverage**, **original-image SHA-256 observations**, and **actual publication readiness**. As of the pinned 23 October 2026 observations, five source candidates are evidenced, two original binary SHA-256 values were observed, and three remain unverified. **Zero candidates have independent rights, subject and bilingual editorial approval.** A matching checksum does not grant permission to publish.

The command does not contact Wikimedia Commons, download images, write to the public media registry, invent a reviewer, or authorize image delivery. It fails on invalid source evidence, duplicate or forged SHA-256 receipts and malformed observation provenance. Output files are created exclusively (mode 0600), so an existing report cannot be silently overwritten.

To resolve the three missing binary observations, follow [the manual rate-limit-conscious research workflow](commons-batch-ingestion.md). For rights and subject decisions use [independent review](commons-independent-review-handoff.md) and the [approved publication process](approved-imagery-workflow.md). This report is an operational status snapshot, not a license clearance or a substitute for those processes.

The report also emits two explicit work queues: `verify_original_binary_sha256` for the three pending originals and `independent_rights_and_subject_review` for Schumacher and Alonso, whose original checksums are already observed. These are *next actions*, not approvals. Independent review still requires visual identity, rights, attribution and bilingual copy verification.
