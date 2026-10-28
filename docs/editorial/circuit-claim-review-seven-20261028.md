# Seven public circuit stories — claim-level editorial handoff (28 October 2026)

> **Research triage, not historical approval.** The 73-story [source-format inventory](circuit-short-story-evidence-audit-20261028.md) classifies URLs. This package is the next, narrower layer: **24 individually identifiable EN/UK excerpts** from seven already-public summaries, each tied to its current story revision and an outstanding reviewer question. It does **not** verify the facts, license imagery, authorize new longform publication, or confirm production deployment.

The machine-readable [review queue](circuit-claim-review-seven-20261028.json) is deliberately separate from `circuit-release.json` and human-review sidecars. Every claim has `status: unverified`, every story is `pending-independent-review`, and no reviewer identity or decision is present. Its `evidence_route` describes where to *look*, never what has been proven.

## Review queue and first-pass issues

| Circuit | Claims | High-priority check before editorial sign-off |
| --- | ---: | --- |
| Estoril | 3 | Confirm weather from a narrative source; separate Senna's first win from subjective reputation framing. |
| Marina Bay | 3 | Distinguish 2008 result, first night race and the later crash investigation chronology. |
| Adelaide | 3 | Check EN `tyre failure` versus the more specific UK `прокол шини`; championship title needs separate evidence from the race result. |
| Zolder | 3 | Verify qualifying incident and wording about Villeneuve sensitively; the results file covers the winner, not the accident. |
| Aida | 5 | Qualifying grid, start incident, winner, second-place gap and third place are different assertions; the start incident needs its own source. |
| Rouen | 4 | The story explicitly invokes the Revs Institute but the linked result file is not a locator for that archive; find the exact document and passage. |
| Montjuïc | 3 | Verify stoppage, casualties and specific safety concerns with a contemporary or carefully sourced historical account. |
| **Total** | **24** | No claim has an independent review decision. |

## Reviewer workflow

1. Open the current public story in the three `circuit-*-stories.json` files and locate the exact EN and UK excerpts from the queue. The automated test fails if either excerpt, year or primary URL drifts.
2. Open the pinned F1DB result, and the supplemental Formula 1 source listed in `circuit-context-evidence.ts`. Record **precise passage, date, author/source identity and locator** for each claim. A source lead is not a verified citation; seek another source where needed.
3. Check that the evidence actually supports each assertion (including race-versus-qualifying, winner-versus-championship, lap-count semantics and sensitive incident chronology). Do not extrapolate from a results row to weather, motive, accident circumstances or official standings.
4. Compare the English and Ukrainian meaning, especially precision and causal language. Record conflicting evidence and propose exact replacement text where the claim is overstated.
5. Submit independent human decisions through the existing authorized editorial process, with an exact revision digest. Do not change this queue to `approved`, forge signatures, set `actor: human` in automation, or edit the longform release manifest as a shortcut.

### Automated acceptance

`node --test tests/circuit-claim-review-seven.test.mjs` validates all seven story identities, 24 bilingual excerpts, exact source/year linkage, explicit evidence gaps, absence of approvals and the untouched longform publication gate. This is a **structural** test only: it cannot decide historical truth, legal rights or human review independence.

The rest of the 73 public short stories, plus five legacy stories, remain outside this first claim-level queue. Next expand the same method across the remaining short summaries and reconcile the 33 longform research dossiers **without opening their release gate**.
