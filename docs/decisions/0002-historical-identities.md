# ADR 0002: Historical identities and provenance

Status: Proposed — requires dataset verification and review.

## Problem

A constructor, entrant, chassis, engine supplier, legal organization and public-facing team name are different concepts. A single team identifier across all eras produces misleading lineage graphs.

## Proposal

- Store imported source entities under stable namespace-scoped IDs.
- Model each historical relationship with `subject`, `predicate`, `object`, temporal validity, supporting citations and confidence/review status.
- Do not infer `successor_of` merely from a rename or shared facility.
- Distinguish at least: `renamed_to`, `acquired_by`, `entered_as`, `used_chassis`, `used_engine`, `drove_for` and `claimed_successor_of` where evidence supports them.
- Uncertain dates and contested relations must remain representable.
- Derived traversal of team history should display predicate and citation; avoid presenting a single definitive corporate family tree.

## Deferred

Exact PostgreSQL columns, data types, foreign keys and ingestion contract follow the pinned F1DB schema audit. This ADR is guidance, **not** an approved migration design.
