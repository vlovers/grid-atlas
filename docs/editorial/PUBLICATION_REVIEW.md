# Repository publication review

This is the next step after the existing [draft dossier workflow](DOSSIER_WORKFLOW.md),
not a CMS or database importer. The Python `TypedDict` contracts in
`scripts/editorial_dossiers.py` and `scripts/editorial_review.py` describe the existing
version-1 dossier and its new review sidecar. Their runtime validators reject unknown
fields and invalid references. No dependencies or public application changes are needed.

## One dossier and review record per language

Keep original writing in the existing dossier's `claims[].statement`; order it with
`sections[].claim_ids`. Do not maintain a separate uncited article body. Every factual
assertion, including one introduced by a translation or heading, must be represented
by a cited claim. Titles and section headings should be neutral labels. The existing
renderer emits only registered claims and their references. A human still needs to
check that each statement is precise and fully supported, rather than a compound
sentence with only partial evidence.

Use the canonical F1DB external `driver_id`, not a display name or database sequence.
Keep `locale` exactly `uk` or `en`. Each language has its own review record and digest;
English approval does not approve Ukrainian. Reuse source and claim IDs across
translations where they express the same assertion, but review each wording separately.

The new Senna files are in `pilots/senna/`, outside `dossiers/`, so the established
batch inventory and research attachment workflow remain unchanged. The broader
Markdown biography in PR #71 is research input, not a second publishable body.

## Human workflow

1. **Draft** (`draft`): author original statements, precise source locators and the
   per-locale dossier. Record unresolved research in `gaps` or review `issues`.
   Assign an accountable human author before requesting approval; assisted research
   is not an accountable editorial sign-off.
2. **Evidence Review** (`evidence_review`): a human opens each source, checks the exact
   wording, context and independence, and reviews the canonical identity, language,
   originality/copyright, and internal/external links. Fill the review's source
   classifications and publication details, retaining unknown dates as null with an
   explanation. Resolving an issue requires a human note explaining the resolution,
   not merely deleting contrary evidence. Consequential or disputed history needs
   independent corroboration and careful attribution under the existing source policy.
3. **Approved** (`approved`): record independent human decisions for every claim,
   issue, selected media asset and checklist item, followed by editorial `signoff`.
   All decisions name a reviewer distinct from the dossier author, specify the review
   date and rationale, and bind to the reported `revision_sha256`. No unresolved
   gaps, contradictions or media rights may remain. A human reviewer assesses scope
   and completeness; a two-claim pilot is not a full biography.
4. **Published** (`published`): only a separate, explicitly authorized human publication
   operation can make content public. This tool merely validates a record of that
   decision in `publication`; its note should identify the published revision and
   operation. The actual publication adapter and immutable database revision mapping
   remain future work. Do not insert these files into `content_articles` or translate
   a passing report into an automatic SQL status update.

Keep lifecycle changes in reviewed Git commits. The dossier itself remains a valid,
unpublished v1 research document; the sidecar records the additional human workflow.
The SQL article status model has no `approved` state and is not a direct mapping.
The public API's existing verified-claim gate is still required for any future importer.

## Review record fields

Start with the Senna review files, leaving every decision null. Required top-level fields:

| Field | Meaning |
| --- | --- |
| `schema_version` | Exactly `1` |
| `stage` | `draft`, `evidence_review`, `approved` or `published` |
| `sources` | Exactly one entry per dossier source ID: `kind`, `published_on`, `publication_note` |
| `claim_reviews` | Exactly one entry per claim ID, initially null |
| `checks` | `identity`, `language`, `originality`, `links`, `signoff`, initially null |
| `issues` | `claim_id` (or null for whole-dossier issue), `kind` (`missing_evidence` or `contradiction`), `note`, `resolution` (initially null) |
| `media` | Optional selected asset candidates; empty means text-only, not a missing-image error |
| `publication` | Null until an explicit human publication record is being checked |

A decision has `actor: "human"`, `reviewer`, `reviewed_on` (YYYY-MM-DD),
`revision_sha256` and a nonempty `note`. Null means no decision has been made.
Dates cannot precede source access or exceed the fixed audit date. Sign-off cannot
precede individual reviews, and a publication record cannot precede sign-off.

The digest uses canonical UTF-8 JSON with sorted object keys, covering the entire
dossier plus source classifications, issue descriptions and media rights metadata.
Changing writing, translation, evidence, source metadata or selected media invalidates
existing decisions. JSON indentation alone does not. Reset decisions to null after
an edit, run validation to obtain the new digest, and have humans re-review it.
Preserve superseded decisions in Git history. This is revision binding, not a digital
signature or proof of a person's identity: repository review must authenticate the
reviewer and their independence. Never populate human decisions with a generator.

## Sources, contradictions and media

- **Primary**: an original classification, regulation, archival document or direct
  testimony, classified relative to the specific claim. Official publisher branding
  alone does not make a retrospective primary evidence.
- **Secondary**: a researched retrospective, analysis or biography interpreting
  earlier records. An official F1 biography is secondary for career narrative.
- **Community**: fan-maintained or collaborative material. Useful for leads;
  community-only support blocks readiness until primary or secondary corroboration
  exists. Multiple pages from the same publisher are not independent corroboration.
- Dossier sources already store exact URLs, title, publisher, author, access date,
  version and independence group. The sidecar adds source type and publication details.
  An unknown publication date must stay null with a note; event dates and copyright
  footers are not publication dates.
- Keep contrary evidence with `supports: false`. It requires an explicit
  `contradiction` issue for that claim and a human resolution against the exact
  revision. Missing evidence stays in `gaps` or a `missing_evidence` issue. Remove or
  narrow unsupported assertions; never fabricate references to satisfy the validator.
- Each selected media candidate records `source_page_url`, `creator`, `license_name`,
  `license_url`, required `attribution`, `modifications` (explicitly "None" if unchanged)
  and a human `review`. Unknown rights can be null during research and block readiness.
  Record the original file page, not a search thumbnail or a hotlinked image. A human
  checks provenance, exact license/version, compatible reuse and attribution. Commons
  hosting or availability on Formula1.com is not reuse permission. Dossier `media`
  remains empty because ingestion/rendering is not implemented in this milestone.

## Reproducible preflight

From the repository root, use the existing pinned release files. Validation uses the
production checksum verifier and driver reader; it does not fetch sources or write data.

```sh
python3 scripts/editorial_review.py \
  --dossier docs/editorial/pilots/senna/en.dossier.json \
  --review docs/editorial/pilots/senna/en.review.json \
  --archive /tmp/grid-atlas-f1db/f1db-json-splitted.zip \
  --checksums /tmp/grid-atlas-f1db/checksums_sha256.txt \
  --as-of 2026-10-20
# Repeat with uk.dossier.json and uk.review.json for Ukrainian.
```

Exit 0 means structurally valid research. The JSON report includes a stable revision
digest, `ready_for_publication: false` for the unapproved pilots, human-readable
blockers, and `public_content_written: false`. Add `--require-ready` for a gate that
exits 1 until explicit human approval and all checks are present. Malformed records,
unresolved references, stale reviews or falsely advanced lifecycle states exit 1.
The tool never changes a stage or signs a decision, even on success.

```sh
python3 -m unittest discover -s tests -p 'test_editorial_review.py' -v
```

The existing Foundation CI discovers these tests. They cover synthetic valid approvals
and invalid inputs, both unapproved pilot locales, revision invalidation, evidence,
media rights and deterministic CLI exit behavior. Synthetic approvals are test-only.
Offline validation checks structure and recorded review decisions; humans must still
check source truth, complete prose coverage, originality and copyright. See the
[Senna audit](SENNA_PILOT_AUDIT.md) for the current manual work.
