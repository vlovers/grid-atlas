# Cross-era media candidates — integration boundary

Five researched file pages have been staged as **candidates only** in `docs/media/candidates.json` (the existing registry). They do not appear in `apps/web/src/components/media/publication.json`.

| Candidate ID | Intended subject | Context | Missing gates |
| --- | --- | --- | --- |
| research-schumacher-portrait-2007 | driver: michael-schumacher | 2007 portrait | Exact source revision, dimensions, rights, reviewer, UK/EN captions |
| research-alonso-2024 | driver: fernando-alonso | 2024 photograph | Exact source revision, dimensions, context, rights, reviewer, UK/EN captions |
| research-mclaren-mp44-2007 | constructor: mclaren | MP4/4 at museum in 2007 | Exact model verification, source revision, rights, reviewer, UK/EN captions |
| research-ferrari-f2004-2004 | constructor: ferrari | F2004 photograph | Exact race context, source revision, rights, reviewer, UK/EN captions |
| research-silverstone-2019 | circuit: silverstone | Venue photograph, 2019 | Source revision, rights, reviewer, UK/EN captions |

This branch deliberately does **not** invent file revisions, checksums, image dimensions or human approvals. All five records have `status: candidate`, no delivery path, no checksum and no publication entry. The media parser must continue rejecting publication until complete.

**Implementation note:** these are canonical ID *hypotheses*, not F1DB-verified matches in the current pilot identity allowlist. The review pipeline must reconcile the complete pinned F1DB subject list before any of them can be considered publishable. The existing 5 candidates, including Senna, Hamilton, Fangio and Monaco SVGs, are preserved unchanged.

**Validation:** run `pnpm audit:media`, `pnpm test` and `pnpm check:docs`; this document does not assert they have passed. Do not merge if the candidate parser rejects missing dimensions or any required field; fix the schema-conformant candidate staging rather than relaxing publication gates.
