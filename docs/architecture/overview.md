# Architecture overview (proposal)

## Product goal

A source-attributed interactive historical atlas of the Formula One World Championship from 1950 onward. The visual brand is not decided.

## Planned boundaries

- `apps/web`: Next.js public SEO-friendly pages and future interactive explorers.
- `apps/api`: NestJS API for reads and future curated editorial data.
- `packages/database`: PostgreSQL schema and forward-only migrations.
- `packages/data-importer`: isolated, repeatable ingestion from pinned source releases.
- Shared packages will be introduced only when consumers justify them.

These app directories are **not implemented** in PR 01.

## Historical modeling guardrails

1. Driver, constructor, race entrant/team name, chassis, engine, and legal entity are not interchangeable.
2. Team succession is a typed, evidence-backed relationship, not a single `previousTeamId`.
3. Store validity periods where known and allow unknown or disputed boundaries.
4. Preserve upstream identifiers, import release metadata and provenance.
5. Protect manually curated facts from importer overwrites.
6. Validate historical datasets and attribution/licensing before import.

## Out of scope now

Neo4j, Redis, GraphQL, auth, CMS, AI-generated biographies, live timing, and commercial use of restricted media or marks.

## Proposed implementation sequence

Foundation -> source audit and historical schema design -> PostgreSQL migrations -> pinned F1DB importer -> query API -> lineage explorer -> visual design.
