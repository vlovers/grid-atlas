# Production readiness, phase 1 — issue #104

Audit date: 2026-10-20. Base: `5de5b0a` (merged editorial PR #125).
This is local release-reliability evidence, not approval to launch.

## Audit: existing behavior and verified gaps

| Area | Existing implementation | Gap / decision |
| --- | --- | --- |
| Architecture | pnpm 10.18.3 monorepo; Node 24; Next.js 15 App Router; NestJS 11; PostgreSQL 17 in local Compose | No app Dockerfiles, hosting architecture, managed release process or production deployment. Keep this phase independent of a provider. |
| API health | `/api/health` returns process liveness; PostgreSQL pool already has 5s acquisition timeout and a shutdown hook | Add `/api/ready` for bounded DB connectivity; preserve liveness. |
| Startup | Missing `DATABASE_URL` rejected in the pool factory; host and port otherwise unchecked | Validate TCP PostgreSQL URL shape, host and port before binding. Do not echo environment values. |
| Shutdown / errors | Nest signal hooks and pool close already present; raw bootstrap errors logged; no idle-pool error listener | Extend the existing lifecycle with draining state and a 10s deadline; handle idle connection failures and redact unexpected errors. |
| Logging | Nest default text logs; no request latency records | Enable built-in JSON logging and safe method/route-pattern/status/duration records. No new logging dependency. |
| Database | Seven forward-only, checksum-tracked migrations, advisory-lock serialization and transactional importers | Migrations are a separate release step, not API startup. Recovery had no recorded rehearsal; perform one using only synthetic disposable databases. |
| Environments | `.env.example` and Compose are local development settings with a local default password | Add a separate template with blank DB secret and blank public origin. Compose is not a production configuration. |
| CI | Foundation, API HTTP/PostgreSQL, migration, web/browser and pinned archive checks exist with read-only tokens | Reuse them. API CI now has a 10-minute deadline, waits on DB readiness and executes the shared smoke command, retaining all existing assertions. |
| Branch rules | GitHub main endpoint reported `protected: false`; branch-protection endpoint returned “Branch not protected”; repository rulesets and effective main rules returned empty arrays | P0 release blocker. No protection settings were changed. Maintainers must configure and verify required reviews/checks. |
| API security | Read-only routes, parameterized SQL, bounded catalogues, reviewed-only public editorial/lineage reads; frontend calls API server-side, so browser CORS is unnecessary | TLS, least-privilege DB credentials, rate limits, request/connection budgets, edge headers and traffic controls remain release work. No authentication/write surface added. |
| SEO | Explicit `SITE_URL`; missing origin disables indexing; canonical/language URLs, robots and dynamic sitemap already implemented and tested; sitemap fails on API errors | Preserve existing functionality. Public HTTPS origin, robots/canonical verification and Search Console require a later approved deployment. |

The API's field validation is shape validation, not a network, credential, TLS or
schema certificate. The web server's environment validation remains a separate
gap: it still has the documented localhost API fallback. No Time Machine,
editorial content/reviews, historical records, or public UI code is changed here.

## Verification recorded for this milestone

| Check | Result |
| --- | --- |
| `pnpm check`, `pnpm lint`, `pnpm typecheck` | Passed (Node 24.21.0; API and web typechecks) |
| `pnpm test` | 29 passed, including smoke success/failure and target-redaction cases |
| `python3 -m unittest discover -s tests -v` | 78 passed; existing editorial files unchanged |
| `pnpm build` | API and Next.js passed; final API bootstrap changes also rebuilt by integration command |
| `pnpm test:integration` on disposable restored DB | 36 passed, including config rejection, occupied-port cleanup, bounded unavailable-DB readiness, idle-pool loss/reconnect, generic SQL errors, drain/deadline and SIGTERM |
| PostgreSQL recovery and migration tests | Restore 6 → forward migrate 7; repeat no-op; checksum tamper rejection, constraint/invalidation and identity tests passed |
| Built API + Next.js against restored DB | All six smoke probes passed, including UK/EN server-rendered season links; preview robots disallow and empty sitemap confirmed |
| `git diff --check` | Passed |

No hosted deployment, external TLS, production traffic/load, provider backup, full
archive restore or PITR test was run; no production environment was connected.
The full browser and pinned real-archive suites were not rerun locally for this
operational slice; the existing path-triggered web and archive CI remain intact.
No claim of production readiness follows from these local checks.

## Operational contract

- `GET /api/health`: unchanged `{ "status": "ok" }`, independent of DB outages.
- `GET /api/ready`: `Cache-Control: no-store`; 200 `{ "status": "ready" }` after
  `SELECT 1`, or 503 `{ "status": "not_ready" }` if unavailable or draining.
  Pool acquisition waits at most 5s and the query at most 2s. Give a probe more
  than 7s (the smoke command uses 8s), then select failure thresholds for the host.
  Use readiness to route traffic; do not restart healthy processes merely because
  PostgreSQL is unavailable. This probe does not check migrations or imported data.
- Invalid API URL/host/port fails startup with exit code 1 and a field-level error.
  It does not connect at startup; DB failures appear through readiness and requests.
- Run `node apps/api/dist/main.js` directly under the chosen supervisor so signals
  reach Node. SIGTERM/SIGINT starts draining, disables readiness, closes HTTP
  connections, then ends the pool. A 10s deadline exits 1 if cleanup stalls. Give
  the external supervisor a longer termination window. Successful SIGTERM keeps
  normal signal exit semantics; `shutdown_completed` records completed cleanup.
- JSON logs use Nest 11's `message` object: `api_listening`, `startup_failed`,
  `readiness_changed`, `database_pool_error`, `http_request`, `request_failed`,
  `shutdown_started`, `shutdown_completed`, `shutdown_deadline_exceeded`.
  Request records contain method, registered route pattern, status and duration_ms.
  They omit URLs, query strings, raw params, bodies, headers, credentials, SQL and
  exception messages/stacks. Unmatched routes use `unmatched`. Unexpected request
  failures remain generic 500s; existing 4xx validation responses are preserved.
  Only readiness transitions are logged, rather than an extra state log every poll.
  No metrics store, alerting, tracing, aborted-request records or log shipping is claimed.
- Idle pool errors are handled without an uncaught process crash; later requests
  may reconnect. All ordinary application queries retain their existing behavior
  and do not gain a global SQL timeout in this phase.

Lifecycle and pool behavior follow the existing installed APIs; see
[Nest lifecycle hooks](https://docs.nestjs.com/fundamentals/lifecycle-events),
[Nest JSON logging](https://docs.nestjs.com/techniques/logger) and
[node-postgres pool error handling](https://node-postgres.com/apis/pool).

## Build, environment and smoke reproduction

Use an isolated checkout so a Next.js production build does not overwrite a running
development server's `.next`. Install the frozen lockfile using Node 24.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm lint
pnpm typecheck
pnpm test
python3 -m unittest discover -s tests -v
pnpm build
# DATABASE_URL here must reference a disposable test DB, never production:
pnpm test:integration
```

Use [the production template](../../.env.production.example) as documentation for
host-injected configuration, not as a committed credentials file. It is not loaded
automatically. Choose a private service network and explicit bind addresses; a
container usually needs `HOST=0.0.0.0`, while a host-local proxy can use loopback.
The blank database setting intentionally prevents accidental startup. Use separate
migration and runtime DB roles, provider-verified TLS and a secret manager before
release; these controls are not implemented by the template. Keep `SITE_URL` blank
on previews. Never use the Compose password in a public deployment.

After migrations and data import, start the built API and Next.js processes in
separate terminals with explicitly injected `DATABASE_URL` and `API_BASE_URL`:

```sh
HOST=127.0.0.1 PORT=3359 NODE_ENV=production node apps/api/dist/main.js
API_BASE_URL=http://127.0.0.1:3359 pnpm --filter @grid-atlas/web start --hostname 127.0.0.1 --port 3361
node scripts/smoke-deployment.mjs --api-origin http://127.0.0.1:3359 --web-origin http://127.0.0.1:3361
```

Smoke checks liveness, readiness, nonempty seasons, source-release checksums and
rendered season links in UK/EN. API-only invocation omits `--web-origin`. Each
probe has an 8s timeout, rejects redirects, and exits nonzero on failure without
printing target URLs or response bodies. Targets must be credential-free HTTP(S)
origins. It is read-only and has no deployment or automatic approval action.
It proves basic availability/data shape, not data truth, TLS configuration, SEO,
capacity or complete product correctness. The API CI uses synthetic provenance.

Before a future public launch, inspect robots, sitemap and both locales' canonicals
on the approved HTTPS origin. Confirm API failure does not produce a partial sitemap.
Existing SEO unit/browser tests already exercise these behaviors; no duplicate SEO
implementation is added here.

## Disposable backup/restore rehearsal

Completed on local PostgreSQL 17.11 (17-alpine image) in a dedicated ephemeral container, without
connecting to existing archive or production databases. Synthetic input consisted
of season 1950 and an explicitly synthetic source release, with no biographies or
imported race rows. The source had migrations 0001–0006; the custom-format dump was
restored into a second empty DB, then existing migration 0007 applied successfully.
A second migration run was a no-op. Restored season/provenance rows were preserved.

Recorded dump: 65,741 bytes, SHA-256
`c5bbe1371401fe6c1e10bde91b31250f6fefcca5cd7b2a5f1206a69da5000b1d`.
Dump bytes/checksum vary across reruns; this is evidence of this run, not an expected
fixture digest. The dump itself is kept outside Git. Server-version-matched dump and
restore tools were run inside Docker. This is not a full-archive, managed-host,
encrypted-backup, point-in-time recovery, RPO or RTO certification.

To repeat from the repo root, choose unused local names/port. The trust-authenticated
container below is solely a short-lived, loopback-only test fixture. Never use it as
a production configuration or substitute an existing database URL.

```sh
umask 077
rehearsal_dir=$(mktemp -d)
docker run --detach --rm --name grid-atlas-readiness-rehearsal \
  -e POSTGRES_USER=grid_atlas -e POSTGRES_HOST_AUTH_METHOD=trust \
  -e POSTGRES_DB=grid_atlas_readiness_source -p 127.0.0.1:55445:5432 postgres:17-alpine
# Wait for pg_isready to succeed before continuing:
docker exec grid-atlas-readiness-rehearsal pg_isready -U grid_atlas -d grid_atlas_readiness_source

# Run a copy of the first six migration files, without altering repository files.
DATABASE_URL=postgresql://grid_atlas@127.0.0.1:55445/grid_atlas_readiness_source python3 - <<'PY'
import importlib.util
from pathlib import Path
import shutil
import tempfile
spec = importlib.util.spec_from_file_location('migrate', 'packages/database/scripts/migrate.py')
migrate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(migrate)
with tempfile.TemporaryDirectory() as temp:
    for file in migrate.MIGRATIONS.glob('*.sql'):
        if file.name[:4] <= '0006':
            shutil.copy2(file, Path(temp) / file.name)
    migrate.MIGRATIONS = Path(temp)
    assert migrate.run() == 0
PY
docker exec grid-atlas-readiness-rehearsal psql -U grid_atlas -d grid_atlas_readiness_source -X -v ON_ERROR_STOP=1 -c "INSERT INTO historical_seasons(year) VALUES(1950); WITH s AS (INSERT INTO data_sources(slug,homepage_url,attribution) VALUES('recovery-fixture','https://example.org','Synthetic recovery test only') RETURNING id) INSERT INTO source_releases(source_id,release_tag,artifact_name,sha256) SELECT id,'synthetic','fixture.json',repeat('b',64) FROM s;"
docker exec grid-atlas-readiness-rehearsal pg_dump -U grid_atlas -d grid_atlas_readiness_source --format=custom --no-owner --no-acl > "$rehearsal_dir/synthetic.dump"
docker exec grid-atlas-readiness-rehearsal psql -U grid_atlas -d postgres -X -v ON_ERROR_STOP=1 -c 'CREATE DATABASE grid_atlas_readiness_restored'
docker exec -i grid-atlas-readiness-rehearsal pg_restore -U grid_atlas -d grid_atlas_readiness_restored --exit-on-error --no-owner --no-acl < "$rehearsal_dir/synthetic.dump"
export DATABASE_URL=postgresql://grid_atlas@127.0.0.1:55445/grid_atlas_readiness_restored
psql "$DATABASE_URL" -X -Atc 'SELECT count(*) FROM schema_migrations' # 6
python3 packages/database/scripts/migrate.py
python3 packages/database/scripts/migrate.py
psql "$DATABASE_URL" -X -Atc 'SELECT count(*) FROM schema_migrations' # 7
psql "$DATABASE_URL" -X -Atc 'SELECT year FROM historical_seasons' # 1950
psql "$DATABASE_URL" -X -Atc 'SELECT slug FROM data_sources' # recovery-fixture
pnpm test:integration
# Start the API/web and run the smoke command above against this restored DB.
# Stop only this owned disposable container after finishing:
docker stop grid-atlas-readiness-rehearsal
```

For the migration tamper/forward tests, use another empty DB and run
`test-versioned-migrations.sh` in a temporary copy of `packages/database`: that
existing test intentionally edits its copy of a migration while checking rejection.
The existing editorial constraint/invalidation SQL and lineage identity integration
tests also passed on disposable databases; no editorial files were modified.

## Remaining release risks, in priority order

1. **P0 — main protection and release authorization.** Maintainers must enforce
   reviews and effective required checks. Existing jobs are path-filtered; choose an
   always-reported aggregate release gate or an appropriate ruleset rather than
   requiring absent job statuses. Verify settings through GitHub after configuration.
2. **P0 — hosting and security policy.** Select topology, TLS termination, private DB
   networking, least-privilege runtime/migration roles, encrypted DB connections,
   secret rotation and traffic/rate limits. App images and deployment automation
   are absent; the production environment template does not implement these controls.
3. **P0 — recoverability policy.** Define backup encryption, off-host retention,
   restore permissions, alerting, RPO/RTO and ownership. Rehearse an authorized full
   archive restore on the chosen provider, not only this synthetic local fixture.
4. **P1 — operational limits and incident response.** Add appropriate SQL/request
   budgets, readiness policy, log retention/alerting and actionable error categories.
   Validate capacity, deployment drain behavior, migration-before-traffic ordering,
   read-only DB grants and a compatible app rollback. Do not reverse checksum-tracked
   migrations; a schema change may require a forward fix or a restore with explicit
   data-loss approval. This phase has no automated rollback or incident on-call setup.
5. **P1 — web release and SEO gates.** Validate the Next.js environment at startup,
   explicit API origin, public canonical HTTPS origin, robots/sitemap, security
   headers and Search Console after an approved deployment. Keep previews noindex.

Issue #104 remains open. Passing local/CI checks does not satisfy these launch gates.
