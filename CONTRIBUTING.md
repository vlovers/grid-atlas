# Contributing

Create a focused issue or PR with scope, validation and any data provenance. Do not include copyrighted images or unverified historical assertions. Run `pnpm check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `python3 -m unittest discover -s tests -v` and `pnpm build`.

API and application changes need relevant PostgreSQL / browser coverage: `DATABASE_URL=postgresql://... pnpm test:integration` and `pnpm test:browser`. Use disposable PostgreSQL; schema-isolated HTTP/browser tests remove only their own fixtures. Database migrations must be append-only and pass the migration / proposed-import suites. See README for setup.

Lineage authors must cite each proposed edge and obtain a different person's editorial approval before publication. Synthetic test fixtures are not historical facts. Do not auto-verify claims, bypass CI, overwrite reviewed data or force-push shared work.
