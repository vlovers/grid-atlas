# Five-circuit bilingual editorial release candidate — operator handoff

The first five circuit stories have two distinct research artefacts:

- Reader-facing original-language prose: `docs/editorial/batches/circuits-5-reader-introductions-20261025.md`.
- Ten pinned-F1DB race/date/layout observations: `docs/editorial/batches/circuits-5-verified-f1db-mappings-20261024.md`.

`scripts/prepare_circuit_editorial_candidate.py` compiles both into a single JSON **draft** candidate with 5 circuit external IDs, 10 EN/UK introductory sections, and 10 source race/layout relationships. It validates the expected exact first-five coverage and fails if a language, event, layout or heading goes missing. Existing `.github/workflows/real-archive.yml` regenerates the candidate after fetching and validating the original F1DB archive and runs six negative/positive content tests.

```sh
python3 -m unittest discover -s tests -p 'test_prepare_circuit_editorial_candidate.py' -v
python3 scripts/prepare_circuit_editorial_candidate.py --output /tmp/grid-atlas-circuit-editorial-drafts.json
```

The file is intentionally restricted to outputs **outside** the repo. CI stores it only under `unpublished-circuit-editorial-candidates` (14 days).

## Precise state boundaries

- **Verified:** 10 F1DB event/layout source relationships from previous checked real-archive workflow.
- **Authored:** 10 original EN/UK visitor-facing draft introductions.
- **Not verified:** independent word-by-word historical correctness, idiomatic native-language editing, sources for every individual prose claim, geometry beyond the upstream F1DB illustration and any image rights.
- **Not done:** human claim-review signatures, editorial approval, deployment, or publication of circuit prose to the public page/API.

The bundle is intentionally **not** compatible with the existing driver-article publisher. That pipeline verifies driver IDs and its specific review schema; adapting this draft JSON directly would bypass controls. A future PR must implement a circuit-scoped schema, claim-evidence review contract and human-authorized publication operation, plus a backend read path returning only reviewed revisions. Don't add a broad generic CMS or mutate database status by hand.

## Acceptance for first actual release

1. An independent human editor reviews and, where needed, corrects every relevant EN and UK claim against explicit source passages and resolves all disagreements.
2. A scoped circuit-specific review and publication adapter accepts **only** verified exact-revision dossiers and rejects drafts/media without clearance.
3. The rendered site provides the introductory text with linked provenance in EN/UK, and safely falls back to the existing public F1DB dossier when none is approved.
4. Run real PostgreSQL/API/SSR/browser tests of permitted, missing, wrong-locale, invalidated and withdrawn content.
5. Merge only after required CI is green; verify the published local site separately.

**No editor review is claimed by compilation or CI.**
