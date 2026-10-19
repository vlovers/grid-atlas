# Unpublished evidence dossiers and quality reports

The next repository milestone adds a separate [publication review record](PUBLICATION_REVIEW.md)
for exact-revision human decisions and readiness checks. The v1 draft dossier,
attachment behavior and coverage inventory below remain unchanged. The isolated
[Senna pilot audit](SENNA_PILOT_AUDIT.md) records the new, unapproved UK/EN examples.

This slice complements [PR #84](https://github.com/vlovers/grid-atlas/pull/84).
It does not replace that PR's batch manifest validator, identity preflight,
statistics extraction or chronology builder. It runs on main without #84 installed.
Use #84's 1–50-driver manifest and preflight for batch selection; 20–50 is the
operational target, while the existing five-driver pilot remains appropriate.

## Dossier contract

One JSON file per canonical F1DB driver ID and locale lives in `dossiers/`.
The version-1 contract is enforced by `scripts/editorial_dossiers.py` without
additional dependencies. Unknown keys, malformed shapes, duplicate JSON keys,
duplicate driver/locale dossiers, unknown canonical IDs, duplicate claim/source
IDs, invalid references, unused evidence records and orphan claims fail closed.

- `driver_id` is the pinned F1DB external ID, never a database sequence or display
  name. All 917 canonical IDs are loaded through the production checksum verifier.
- `sources` preserve title, publisher, author (null if unknown), exact HTTPS document
  URL, retrieval date, version notes and a researcher-assigned independence group.
- `claims` have stable driver-prefixed IDs, original wording, a topic and evidence
  with a precise locator and support/contradiction flag. Each claim needs supporting
  evidence. Contradictions are preserved and highlighted, never silently resolved.
- `sections` order those claim IDs into a draft; `render_draft` renders only their
  text with references. This avoids maintaining a second, uncited prose copy.
- `gaps` records unresolved research. Missing topics are reported separately from
  invalid structure. `full_name` needs editorial evidence; F1DB's longer name is
  an identity observation, not proof of a narrative claim. Death claims are optional
  and must be researched when applicable; absence is not evidence a driver is alive.
- `status` is `draft` or `needs_review`, claims have the same restricted states,
  publication is always `unpublished`, and reviewer/timestamp must be null.
- `media` must be empty in this slice. No image or reuse-license inference is made.

A nonempty topic is a coverage signal, not proof of a comprehensive biography.
Source groups help detect repeated publishers; group labels do not prove publisher
independence. A valid URL and a retrieval date do not prove a page exists, still
contains the passage, or supports the wording. Humans must reopen each source.
This offline validator deliberately makes no network requests and no source-truth
or HTTP availability claim. Live sources may change after the recorded access date.

## Reproducible catalogue coverage

Run from the repository root with the existing official release assets:

```sh
python3 scripts/editorial_dossiers.py \
  --archive /tmp/grid-atlas-f1db/f1db-json-splitted.zip \
  --checksums /tmp/grid-atlas-f1db/checksums_sha256.txt \
  --as-of 2026-10-19 > /tmp/grid-atlas-dossier-coverage.json
python3 -m unittest discover -s tests -p 'test_editorial_dossiers.py' -v
```

The report records the source checksum, fixed audit date, missing topics/locales,
claim/source counts, single-source-group claims, contradictory evidence and gaps.
Every profile reports `human_review_required: true` and `publishable: false`.
Exit 0 means valid research structure, **not editorial completeness or approval**;
malformed content exits 1. The fixed `--as-of` rejects future retrieval dates and
makes the same inputs produce byte-identical JSON.

Scope is explicitly the supplied JSON dossiers. Existing Senna Markdown files and
live database articles are not counted as missing biographies by inference: they
are outside this report's format. The [audit](audit-2026-10-19.md) separately records
legacy draft coverage. An empty dossier directory is a legitimate zero-coverage
inventory; a nonexistent directory is an error.

## Preserve #84 research output

After #84's generator is repaired, prepare its raw research packet in one file,
then attach evidence dossiers into a **different** file:

```sh
python3 scripts/editorial_dossiers.py \
  --archive /tmp/grid-atlas-f1db/f1db-json-splitted.zip \
  --checksums /tmp/grid-atlas-f1db/checksums_sha256.txt \
  --as-of 2026-10-19 \
  --packets /tmp/priority-legends-001.raw.json \
  --enriched-output /tmp/priority-legends-001.enriched.json \
  > /tmp/priority-legends-001.quality.json
```

`--packets` narrows coverage to that packet's driver/locale targets. Attachment adds
only `profiles[].editorial_dossiers[locale]`: raw statistics, chronology, narrative
drafts, claims, media, task notes and all other existing fields remain unchanged.
Existing equal dossiers are a no-op; different dossiers are conflicts. A destination
is exclusively created or must already contain identical bytes. An existing edited
file, even with valid JSON, is never overwritten. Input and output paths cannot be
the same. There is no force/replace option or database import in this slice.
For a smaller batch, use `--dossiers DIRECTORY` containing only that batch's files;
attachment rejects dossiers outside its target driver/locale pairs.

Do not rerun #84 preparation over enriched files: its generator writes its output
path directly. Keep raw generated packets separate from editorial work.

## Human lifecycle and next integration

The intended editorial sequence is **draft → review → approved revision → published**.
Only draft/review preparation is supported here; attempts to attach approved,
verified or published dossiers are rejected. No automated actor may populate a
reviewer. A named human must approve the exact claim/evidence revision and each
locale before a separate publication operation is considered.

Existing SQL articles use `draft`, `in_review`, `published`, `withdrawn`; they do not
have an approved state or immutable revisions. Before database ingestion, add a
stable external-claim/revision mapping and review ledger, test source-change
invalidation, and enforce publication against explicit human approval of the exact
revision. Do not translate this dossier's `needs_review` into a database approval.
Import idempotency tested here concerns **file-based dossier attachment**, not a
new database importer. Existing historical F1DB importers remain unchanged.

## Research delivered

- Alain Prost: 11 English claim records; Formula 1, McLaren and Williams sources.
- Michael Schumacher: 11 English claim records; Formula 1, Mercedes and ACI sources.
- Six opened source pages, retrieval date 2026-10-19. Team/season ranges agree with
  the pinned archive. Each file lists precise locators and remaining verification
  work. No source article, photograph, full quotation or fabricated license is copied.
- Missing: Ukrainian drafts, human claim/locale sign-off, expanded Prost-name
  corroboration, balanced incident coverage and several independent cross-checks.

The content is a sporting-career research outline, not a complete approved biography.
It does not alter Senna's existing drafts or expose any prose to the public app.
