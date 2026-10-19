# Senna research batch — editorial backlog

This directory collects the earlier standalone research work from #126–#129 in one place. These documents are **not approved** and are not ingested into public content. Use the actual dossiers in `docs/editorial/pilots/senna/` as the canonical claim register.

| Research item | Status | Dossier coverage |
| --- | --- | --- |
| Monaco 1984 second place | Research only | Recorded as `ayrton-senna-monaco-1984-p2` |
| Portugal 1985 winner | Research only | Recorded as `ayrton-senna-portugal-1985-p1` |
| Monaco 1993 winner | Research only | Recorded as `ayrton-senna-monaco-1993-p1` |
| Six Monaco victories | Research only | Aggregate still needs six independently checked race results and individual claim review |
| Full chronology 1984–1994 | Research outline | Not an approved biography; split remaining events into atomic claims before ingestion |

## Faster workflow for the next batch

1. Start with 10–20 selected entities, inventory existing pinned F1DB identities/results and gather a **single batch** of source records. Never use AI recollection as evidence.
2. Add multiple *atomic*, bilingual claims into unpublished dossier JSON, with exact locators and provenance. Use the canonical driver ID, `key_events` for race milestones, and valid `ayrton-senna-...` IDs.
3. Set all claim and review decisions to `null`/ `needs_review`. The automation may propose text and find citations, but must not mark a decision `human` or publish.
4. Run the existing offline dossier/review validator once for the batch and use `--require-ready` only for publication gates (expected to fail for unreviewed drafts).
5. Make one focused batch PR with an exact summary, CI results, missing evidence and image-license gaps; reviewers work against immutable revision digests for each locale.
6. Only human-approved, separately licensed media and editorial content may advance through the existing publishing gates. The pinned F1DB import is a source of structured recorded results, not proof of contracts, full historical truth or official starts.

**Current release boundary:** content research can land in `main` while remaining unpublished. Production publication, sourcing decisions and independent human editorial approval are distinct steps.
