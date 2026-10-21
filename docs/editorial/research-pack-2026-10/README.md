# Five-driver editorial research pack — October 2026

**Status: internal research briefs, not verified biography content, not a publishing source.**

This cohort covers Ayrton Senna, Alain Prost, Michael Schumacher, Lewis Hamilton and Max Verstappen. It supplements existing editorial dossiers, particularly the reviewed-workflow Senna pilot, without replacing source evidence or changing any publication gate.

## Editorial product intent

These briefs are story-first *research maps*, not ready-written historical articles. Each driver has four localized chapter headings, prompts for record-backed visual features, source discovery entry points, and explicitly listed accuracy risks. They contain **zero approved historical assertions** and **zero imported media**.

Before turning any proposed chapter into prose, the editor must: join the identity using the canonical imported F1DB key; resolve exact dates/races; collect precise source URL + section locator and acquisition date per claim; reconcile result rows vs distinct races vs official championship standings; independently review each claim; proofread both languages; clear image rights; and obtain explicit human sign-off. All cross-links must point to canonical dynamic routes, not hard-coded numeric IDs.

## Recommended visual treatment

- Hero: typographic/data-led original illustration when no approved photograph exists.
- Main scannable section: 3–5 chapters, each tied to a precise historical race, team association or season supported by imported records.
- Optional side-by-side evidence cards: only exact supported comparisons; never imply contract, legal succession or psychological causation.
- Collapsible data: imported result summaries with explicit denominators and archive version; verified titles only after official source reconciliation.
- Accessible fallback: semantic list and source links, keyboard focus, UK/EN switch, reduced motion.

## Data and publishing invariants

- `visibility=internal_only`; `editorial_status=research_required`.
- `historical_assertions=[]` and every `claim_status=unverified`.
- No narrative copy, asset downloads, copyright assertions or generated quotations.
- Publication and review booleans false across both locales. No automatic status promotion.
- These files are **not** wired into the Next.js runtime and cannot override the existing editorial schemas/approval pipeline.

## Next evidence batch

Create independent source-specific claim bundles in the established editorial schema, prioritize Senna–Prost comparisons and race-level narrative openings, run actual record reconciliation against pinned F1DB v2026.17.0, then obtain human editorial and UK/EN approval. Evaluate image rights *per file page* through the existing media registry; do not treat Commons or a search result as a license grant.

Run `python3 scripts/validate-editorial-research-pack.py` for fail-closed structural validation. See also `docs/editorial/DOSSIER_WORKFLOW.md`, `PUBLICATION_REVIEW.md`, `docs/editorial-verification.md` and `docs/media/README.md`.
