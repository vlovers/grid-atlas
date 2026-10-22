# Editorial Atlas — Content Batch 2 (research pack)

This batch provides **25 original bilingual editorial briefs** for the future Editorial Racing templates: **5 constructors, 10 circuits and 10 seasons**. It is a production backlog and information architecture, **not 25 approved articles**. It intentionally does not duplicate the existing five-driver UK/EN research dossiers in [Release V1](../v1/README.md).

## Deliverable

- [Machine-readable UK/EN briefs](briefs.json) with stable IDs, distinct page types, chapter outlines, per-type fact-check gates and explicit source leads.
- Subject headlines and decks are original editorial framing, **not claims of historical fact**. No unsourced results, quotes, records, sector geometry, tyre ratings, or photographs have been added.
- Drafts are kept out of the public frontend and are not imported into the publication pipeline.

## What still blocks actual publication

1. Resolve every subject to the pinned F1DB canonical external ID; for circuit pages use the exact historical layout ID for each selected event. Do not infer mappings from these human-readable labels.
2. For each chapter, write atomic claims and collect precise source passages or record locators, publisher, access date and independent corroboration where warranted. A source homepage in `sources_to_inspect` is **not evidence**.
3. Reconcile official championship scoring and results, entrants versus constructors, layout changes, time-scoped technical fields, and era-specific definitions.
4. Author original substantive EN/UK text only from verified claims, then conduct separate translation review.
5. Route through the existing independent human review, revision digest, approved export and explicit operator publication workflow in [the approved release pipeline](../../APPROVED_RELEASE_PIPELINE.md). Never fabricate reviewer identity or approval metadata.
6. Only publish media with per-file rights, creator, attribution and modification provenance. The existing attributed 160 circuit SVGs are separate from unapproved photography.

## Content sequence

First complete the five existing driver dossiers, then pilot Ferrari/McLaren and Monaco/Silverstone with independently reviewed claims, then two selected seasons (1988 and 2021) with official scoring rules and primary documents. Scale the same chapter contract to the remaining subjects after reviewing the pilot. Keep the design branch separate.

## Validation

Run `python3 scripts/audit-editorial-batch-2.py` for schema, locale, count and duplication checks. Passing this check means **structural integrity only**, not historical verification or human editorial approval.
