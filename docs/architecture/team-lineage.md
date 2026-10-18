# Constructor and team lineage — evidence-first design

Status: proposal, **not** a claim that F1DB already contains team succession data.

Implementation update: migrations 0004/0005 now store constructor and entrant claims separately; the proposed-only importer, exact identity preflight, verified-only public API and interactive explorer are implemented and integration tested. The design notes below retain the original proposal context. Actual relation names are constrained by those migrations; organization identity, cycle policy and append-only review history are still future work. See the [beta audit](../beta-audit.md).

## Why the existing entities are insufficient

`historical_constructors` and `historical_entrants` are separate entities with namespace-scoped external identities. Race results establish that a driver raced for a constructor, but **do not establish** that one organization succeeded another. Rebranding, chassis constructor naming, entrant naming, ownership transfer, and factory/team continuity must remain distinct.

## Relationship model (proposed)

A directed relationship between two historical entities includes:

- `subject_type` / `subject_id`, `object_type` / `object_id`: typed endpoints; start with constructors and entrants only.
- `relation_type`: one of `renamed_to`, `ownership_transferred_to`, `operations_succeeded_by`, `entrant_operated_as`. Do not collapse them into a single `successor` edge.
- `effective_from` / `effective_to`: optional bounded dates with explicit precision, not invented exact dates.
- `source_url`, `source_title`, `source_publisher`, `accessed_at`, `evidence_note`: required provenance before publication.
- `review_status`: `proposed`, `verified`, `rejected`; only verified edges are exposed in public graph API.
- `created_at`, `reviewed_at`, `reviewer`: auditability.

## Rules before implementation

1. Never infer corporate continuity from matching driver rosters, engine suppliers, sponsor names, sequential years, or similar names.
2. Source each edge independently; a source that says “renamed” does not automatically prove ownership continuity.
3. Do not create transitive inferred edges. A → B and B → C are two source-backed edges, not a third assertion A → C.
4. Permit disputed or competing claims in editorial staging; do not silently resolve conflicts.
5. Require manual review and a citation for every published edge. Preserve source and review history.
6. Store entities and edges separately; a graph is a **view** over historical claims, not a replacement for race results.
7. Build migration and rollback strategy using the existing versioned migration process; add tests for invalid endpoints, cycles in strictly temporal relations, duplicate claims, and provenance requirements.
8. Initial graph UI must support accessible text equivalents, keyboard navigation, mobile layout, and clear uncertainty labels.

## First delivery milestone

- Research and cite a small set of team-history relationships from primary/official sources.
- Validate entity IDs against imported F1DB identities; do not assume a constructor and an entrant are identical.
- Add an append-only, source-backed relationship schema and tests.
- Implement a read-only API for verified edges and an accessible visual explorer with a plain-text relationship list.
- Only then publish the first reviewed relationships.

## Current limits

The existing historical read model explicitly defers team succession, and the current source import has not been shown to contain independently verified succession edges. This document is a design and review checklist, not populated historical truth.
