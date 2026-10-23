# Commons independent review handoff (research only)

This is an **offline, read-only reviewer preparation** step. It is not a rights opinion, a publication decision, a license clearance, or a claim that a photo depicts the named F1DB subject. It cannot promote images into the public registry.

## Generate the five-candidate handoff

From the repository root with Node 24:

```sh
node scripts/audit-commons-evidence.mjs
node scripts/build-commons-review-handoff.mjs --output /tmp/grid-atlas-commons-review-handoff.json
node scripts/build-commons-review-handoff.mjs --format markdown --output /tmp/grid-atlas-commons-review-worklist.md
node --test tests/commons-review-handoff.test.mjs tests/commons-review-markdown.test.mjs
```

The output path must not exist (exclusive creation, mode `0600`); omit `--output` to print the report. The default output remains machine-readable JSON. `--format markdown` produces a **bilingual, accessible text worklist** with separate F1DB/Commons/original-binary hashes, exact pinned Commons description-revision links, the observed license claim, candidate-specific warnings, and uncompleted human-review checkboxes. Source-derived text is Markdown/HTML-escaped, and license links are restricted to Creative Commons license pages. This is a research aid, not an approval form; checked boxes alone cannot authorize publication. No network calls, image downloads, writes to public directories, or approvals occur. Do **not** commit reviewer notes or private originals into `apps/web/public/media`.

The generator joins five **research-only** staging records, exact Commons source-description revisions, the verified-original observations and pinned F1DB v2026.17.0 subject identities. It fails closed on missing/duplicate evidence, creator/license drift, malformed hashes, unknown F1DB identities, publication fields in research records and a forged observation-run URL.

Each candidate has **three separate provenance concepts**:

| Field | What it proves | What it does not prove |
| --- | --- | --- |
| `f1db_record.record_sha256` | SHA-256 of the pinned canonical F1DB identity JSON record | That the photograph depicts this subject |
| `commons_source.original_sha1` | Original-image SHA-1 **observed in Commons metadata** | A locally downloaded, byte-verified image or rights clearance |
| `original_binary.sha256` | SHA-256 of an original binary verified in the linked ephemeral Actions run, when available | Copyright permission, authorship, historical context, or publication approval |

At the 23 October 2026 observation, **two** original binaries (Schumacher and Alonso) have pinned SHA-256; **three** (McLaren MP4/4, Ferrari F2004 and Silverstone) are pending. The report does not guess their SHA-256 values or misrepresent prior observations as a fresh download. New observations must be independently checked and pinned through a separate reviewed change.

## Independent reviewer actions

For each entry, open the pinned Commons file description revision linked in the Markdown worklist, **confirm that the revision actually belongs to the intended file**, and inspect its history. Check the photographer versus uploader, Flickr/derivative history where relevant, actual license grant, attribution, reuse obligations, personality/privacy/trademark considerations, and whether the specific intended site use is covered. Visually inspect the original binary and verify the depicted subject and the event/date context; the canonical F1DB subject ID does **not** establish photographic identity. Independently prepare accurate Ukrainian and English alt text/captions, including distinctions between a museum display, a historical racing scene and a venue photo.

The output deliberately leaves `reviewer: null`, `rights_decision: pending`, `subject_decision: pending`, both locale texts null and `publication_allowed: false`. A named independent reviewer must record an actual decision and rationale outside this generator, then follow the [approved imagery workflow](approved-imagery-workflow.md) for the exact reviewed bytes and publication fingerprint. **Do not edit the research handoff into an approval artifact.**

The five candidates are **not** a license-cleared gallery. This workflow does not change the separate 160 historical circuit SVG review lane. See [Commons batch ingestion](commons-batch-ingestion.md) and [original SHA-256 observations](commons-original-research-observations-2026-10-23.md).
