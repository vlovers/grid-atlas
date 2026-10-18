# Roadmap

## Foundation — PR 01

- Repository conventions, minimal Node checks and CI.
- Optional localhost-only disposable PostgreSQL container.
- Proposed architecture and source-audit scope.

## Next small PRs

1. Audit F1DB datasets, actual entities, identifiers, sample lineage cases, licensing and historical gaps. Record ADR.
2. Implement narrowly scoped relational schema with forward-only migrations and database integration tests.
3. Implement version-pinned, idempotent importer and reconciliation report.
4. Add documented public read API and automated contract tests.
5. Add lineage queries with explicitly sourced relationships.
6. Prototype explorer UI after actual data coverage is measured.

No massive one-shot code generation; merging requires green CI and review.
