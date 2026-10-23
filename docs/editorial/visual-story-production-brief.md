# Grid Atlas — Visual story production brief (editorial track)

**Status:** research and production specification; no biography, image or historical claim approved.  
**Scope:** Ukrainian and English historical stories, independent of the current constructor/driver UI engineering sprint.

## Editorial objective

Make an archive journey worth exploring without disguising statistical evidence as a reviewed biography. Each published story must offer a clear question, a documented answer, and a direct path to the underlying race record. Use a reusable editorial structure instead of one-off layouts.

## First release: five evidence-first story slots

These are **candidate questions**, not approved conclusions or commitments to publish:

| Slot | Reader question | Required primary archive trail | Separate editorial verification |
| --- | --- | --- | --- |
| Driver breakthrough | Which race was the driver's first *recorded winning result*? | Driver career milestone → race classification → constructor association | Distinguish shared-car and historical scoring; external source for narrative circumstances |
| Constructor evolution | Which drivers appear in consecutive recorded seasons, and who changes? | Constructor season roster for each year → exact race evidence | Do not call a roster change a contract transfer without independent evidence |
| Circuit transformation | Which pinned historical layouts are associated with this venue and when? | Circuit event → exact layout ID → pinned SVG provenance | Do not infer corner names, sectors or measured geography |
| Season contrast | How do two seasons differ in recorded participation? | Time Machine API → linked Explorer edges → race evidence | Never equate imported result counts with official starts or championship rankings |
| Race field | How are constructor result entries distributed in one race? | Race classifications → constructor IDs → individual driver rows | Shared-car entries are not unique physical cars or grid positions |

The release should favor stories with complete navigable archive evidence. Any long-form historical interpretation is blocked until independent source review.

## Standard chapter sequence

1. **Hook:** one verifiable question; no sensational unsourced claim.
2. **Orientation:** date, season, named entities and source coverage.
3. **Visual evidence:** chart, timeline, or sourced circuit outline with a plain-text alternative.
4. **Primary archive links:** exact race, season, driver, constructor or layout records.
5. **Interpretation:** only editorially approved claims, cited sentence by sentence.
6. **Limits:** distinguish imported results, official classifications, legal team identity, and missing data.
7. **Continue exploring:** two or three related evidence-backed links.

Keep the archive fact summary distinct from approved editorial prose in both languages.

## Image shot list and rights decision

For each story, prepare a shot list *before* sourcing assets:

| Role | Preferred evidence | Safe fallback |
| --- | --- | --- |
| Cover | Independently rights-cleared photograph of the exact subject and period | Typographic archival cover with sourced year/identity |
| Driver portrait | Licensed image with correct driver identity and context | Original data-led portrait card, no synthetic likeness |
| Constructor / car | Licensed period-specific car or paddock image, identity verified | Constructor roster visualization |
| Circuit | Existing pinned, attributed SVG matching the event layout | Textual circuit/layout identity and source link |
| Supporting scene | Licensed contextual image with documented caption | Original timeline or classification graphic |

Every candidate must go through the existing [media registry and human publication workflow](../media/README.md). A Commons file page or license tag alone is not clearance. Do not download, hotlink, or add any unapproved file to the public media registry.

## Per-claim evidence ledger (required)

Maintain one row per factual narrative claim:

| Field | Meaning |
| --- | --- |
| claim_id | Stable local identifier |
| locale | `uk` or `en`; translation must preserve the same factual scope |
| claim_text | Exact sentence proposed for publication |
| subject_ids | Canonical IDs for all named entities |
| archive_evidence | Exact internal API route and result/race IDs |
| independent_source | Publisher, author, title, original URL and access date, if interpretation requires it |
| source_excerpt_location | Page, timestamp, section or precise passage locator; respect quotation limits |
| confidence / conflict | Explicit ambiguity, competing accounts and resolution |
| reviewer / review_date | Actual independent human reviewer, never synthetic |
| publication_status | draft / needs-review / approved / rejected / withdrawn |

A checksum validates bytes, not historical truth. Never derive a human review from CI success.

## Acceptance criteria for the editorial pilot

- At least one complete UK/EN story has exact race-level evidence links, readable fallback visualizations and documented limits.
- All narrative claims requiring interpretation have independent sources and actual editorial review.
- All public media has independently approved licensing metadata, attribution, alt text and byte-level identity.
- UK/EN content conveys the same facts; links work with keyboard and on narrow mobile screens.
- Empty image states are intentional; no fake photographs or inferred car geometry.
- Publication is blocked when review is missing or withdrawn.

## Coordination boundary

This document is the **editorial production track**. Engineering work on constructor/driver timelines, race cards, CSS, API or Playwright belongs to the separate feature sprint. Do not change those components as part of this brief. When implementation catches up, attach reviewed claims and media through existing publication gates, rather than creating another content system.
