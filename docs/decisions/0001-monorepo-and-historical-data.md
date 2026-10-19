# ADR 0001: Monorepo foundation and evidence-first history

Status: Proposed (2026-10-18)

## Context

The encyclopedia needs public pages, history imports, a relational model, and future interactive visualizations. We want to avoid committing to an inaccurate historical ontology before reviewing upstream dataset semantics.

## Decision

Use a Node.js 24, pnpm workspace monorepo; plan Next.js frontend, NestJS API and PostgreSQL database. In the first PR, add only repository checks, documentation, and optional local PostgreSQL. Treat historical entities and lineage as a pending ADR after source review.

## Consequences

- Simple local setup and CI without premature dependency choices.
- Application frameworks, ORM and migrations are intentionally deferred.
- No claims that a lineage relation is factual without cited evidence.
