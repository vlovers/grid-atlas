# Historical source review — ten editorial stories

## Publication gate

The ten moment stories are **drafts** and retain `robots.index = false`. Neither an archive link nor a plausible historical claim is equivalent to independent editorial verification.

## Fifty-claim ledger

`FACT_CHECK_LEDGER_2026-10-26.json` inventories the 50 existing EN fact-check prompts across ten story slugs. Its classification is **automated triage**, not a historian's judgment. Every entry is `needs-independent-review`; both source fields intentionally remain null.

## Review each claim

1. Locate the relevant official race classification, championship classification, sporting regulation, or contemporary primary account. Record its stable URL and the exact year, event and relevant result.
2. Locate an independently authored source for narrative details (contemporary reporting, a reputable historical archive, or a directly attributable interview). Do not treat two syndicated copies of the same article as independent.
3. Check that the English and Ukrainian wording have the **same scope**. Pay attention to race win vs title, Toro Rosso vs Red Bull Racing, points scored vs points counted, and winner vs memorable battle for second.
4. For subjective language such as “landmark”, “changed the stakes”, or “not compulsory”, separate factual premises from interpretation. Interpretive passages should not be assigned a fake numerical evidence status.
5. Check race links against the local F1DB mapping; a matching year without a verified round/driver is insufficient.
6. Record reviewer, review date, source URLs, and any uncertainty **before** changing the status or publishing. No automatic approval based on the presence of a URL.

## Photo gate

`apps/web/src/components/media/publication.json` currently contains zero approved assets. Keep `approvedEditorialPhoto` fail-closed: only a locally stored, hash-matched asset with human-reviewed rights, attribution and licensing can appear. Do not use web image URLs as production photos or invent a Creative Commons license.

## Reader experience

The articles should remain readable without repeated summary cards. Keep the manuscript and verified archive links primary; surface source-review status discreetly, and never mistake a research queue for a published bibliography.

## Definition of done

- All substantive historical claims in the selected story are reviewed and corrections are applied in **both** languages.
- The manuscript has been edited for clarity, not just checked for syntax.
- Every published image has a human-approved provenance entry and valid rights.
- EN/UK pages, archive links, accessibility, mobile layout and CI are checked.
- Only then should the team consider removing the draft/noindex publication guard.

## Reader-first production batch — 26 October 2026

The ten EN and ten UK catalogue previews have been rewritten to open with a race, decision, or result rather than internal archive terminology. A single all-ten production brief now lives at [TEN_STORY_READER_FIRST_PRODUCTION_2026-10-26.md](research/people-who-changed-f1-20261025/TEN_STORY_READER_FIRST_PRODUCTION_2026-10-26.md). It identifies scene structure, UK/EN direction, official classification starting points and unsupported inferences for every story. The Node test `tests/editorial-preview-quality.test.mjs` guards bilingual coverage, hooks and the draft/noindex/photo boundary.

**Scope limit:** this batch changes previews and research guidance, not the substantive 98 long-form chapters or review decisions. No claim was marked verified, no image was approved, and no public release gate was lifted. The next content production pass must include substantive revision and independent source review of the chapters themselves, not count this preview pass as ten finished articles.
