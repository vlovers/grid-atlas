# Architecture overview

Grid Atlas is a pnpm monorepo targeting Node 24. Its existing boundaries remain intact:

- `apps/web`: Next.js App Router server-rendered archive and client-side lineage explorer. It calls the API on the server through `API_BASE_URL`; API 404s render not-found pages. Fetches are uncached so editorial revocations are not retained in the frontend cache.
- `apps/api`: NestJS read-only HTTP API with parameterized PostgreSQL queries. Lists have bounded pagination and catalogue search. BIGINT IDs and numeric points are strings in JSON.
- `packages/database`: PostgreSQL provenance, external identities, historical records, results and separate constructor/entrant lineage claims. Five forward-only migrations are checksum tracked and serialized with an advisory lock.
- `packages/data-importer`: dependency-free Python/psql loaders of pinned, checksum-checked F1DB assets. Imports are transactional and preserve existing curated records.

A constructor is not an entrant or a legal organization. Lineage claims have typed endpoints, relation type, optional year, citation/evidence and review metadata. Public queries return verified claims only. A separate person's editorial approval remains a procedural requirement; a nonempty reviewer field alone is not evidence that independent review occurred.

The actual implementation and tested gaps are recorded in the [beta audit](../beta-audit.md). PostgreSQL integration and HTTP/browser tests use disposable databases or owned schemas. CI validates frozen dependencies, lint, types, builds, migration behavior, real pinned imports and key public flows.

There is no public write API, live timing, CMS, authentication, graph database or shared package introduced without a consumer need. Production hosting, backup/restore and public traffic protections remain release work.
