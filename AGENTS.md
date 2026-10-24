# AI engineering contract — grid-atlas

Read README.md and existing engineering/product policies before changes. docs/README.md, docs/product/stable-experience-roadmap.md, docs/data-sources/README.md, docs/editorial/APPROVED_RELEASE_PIPELINE.md are relevant source documents; confirm paths before treating references as authoritative.

## Product boundaries
Bilingual UK/EN source-backed historical F1 archive. Pinned F1DB, source provenance, editorial approval, licensed imagery, accurate missing-data states, append-only migrations. Never invent history, source approval, image rights or deployed acceptance.

## Agent workflow
1. Discover the current branch, code, PR/issue queue and existing tests; never assume a previously claimed implementation exists.
2. Plan a cohesive user-visible delivery with acceptance criteria, contracts, non-goals, risk and testing.
3. Implement in a dedicated branch/worktree. Parallel agents need isolated trees and clear file/API ownership. Preserve unrelated changes.
4. Execute applicable validation, record exact commands/results and never silently disable checks or replace real behavior with mocks.
5. Independent reviewer assesses original diff, acceptance criteria, correctness, regressions, safety, compatibility and test value; resolve blockers.
6. Document evidence, handoff SHA, outstanding limitations and next action. Never auto-merge or deploy/publish without approval.

## Relevant verification
- `pnpm check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `python3 -m unittest discover -s tests -v`
- `pnpm build`
- `pnpm test:integration (disposable PostgreSQL)`
- `pnpm test:browser (configured archive)`

Only use disposable databases and safe fixtures for tests that mutate state; never use production credentials. Commands are guidance, not claims of execution. Confirm scripts and environmental prerequisites.

## Project-specific acceptance
Actual imported archive, UK/EN, keyboard/mobile, source claims, graph/Time Machine limitations, image licensing and attribution, historical layout identity, no fake sector/DRS metrics, migration compatibility.

## Release boundary
Release requires editorial/media independent approval where applicable, real-origin smoke, hosting/TLS/secrets/backups/restore/observability and issue #104 gates; CI green alone is not beta approval.

See [Definition of Done](docs/engineering/DEFINITION_OF_DONE.md), [Independent review](docs/engineering/REVIEW_POLICY.md), [Release checklist](docs/engineering/RELEASE_CHECKLIST.md) and [PR template](.github/PULL_REQUEST_TEMPLATE.md).
