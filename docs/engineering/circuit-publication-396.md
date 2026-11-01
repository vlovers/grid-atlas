# Circuit publication security batch — issue #396

Acceptance: only DBA-registered individual PostgreSQL subjects may stage/review/publish;
authors (including alternate logins of the same person) cannot approve their own work;
table metadata is not an approval; full revision and source changes revoke visibility;
concurrent mutations cannot retain stale approval; UK/EN reader remains compatible and
both public flags stay off. Existing manuscripts and media remain untouched.

Implementation uses the existing PostgreSQL/Nest/Next stack and PR #358. PR #359 is
validated separately against the updated boundary. PR #395 remains an independent
editorial branch. Migration 0016 is append-only; 0013–0015 remain byte-identical.

Non-goals: human historical fact checking, general CMS/SSO, new manuscripts,
photographs, deployment and release authorization. A DBA is necessarily trusted:
database owners/superusers can replace enforcement. Application traffic must never
use those credentials. External identity verification and individual credential
provisioning are explicit production prerequisites; absent provisioning fails closed.

Verification covers forged metadata, aliases/self-review, insufficient privileges,
temporary-schema attacks, full provenance revision checks, revocation, delete/restore,
both transaction orders, rollback/retry, migration replay/failure, staging repeatability,
default-off flags, and actual API/reader flows over disposable PostgreSQL.

## Trust and write paths

PostgreSQL authentication is the trusted identity boundary, not an HTTP header,
reviewer string, JSON sidecar, environment confirmation or `SET ROLE`. The
operation CLI connects as an individually provisioned LOGIN. For remote use,
require SCRAM or client certificates over certificate-verified TLS and restrict
network access; never use `trust` authentication, shared reviewer passwords,
superuser/owner connections or pooled sessions that replace individual identities.
This repository has no human SSO provider. A DBA must externally verify each
person and map all their logins to one canonical principal. Without that setup,
review and publication fail closed. Database ownership is outside this boundary:
an owner/superuser can replace enforcement, so protect migration credentials.

| Actor | Permitted paths |
| --- | --- |
| Migration owner / DBA | Append migrations, execute role bootstrap, register verified individual subjects, maintain sources/identity data. Never acts as a reviewer. |
| Registered stager | Create draft articles/claims and candidate evidence; edit prose, candidate locators and links; no approval table/function privileges. Server assigns creator and records every material contributor, including known source creators when evidence reuses their provenance. |
| Registered reviewer | Inspect candidate graph; review exact expected revision via `circuit_editorial_review`. All claims and candidate sources must actually have been checked. No table UPDATE grants. |
| Registered publisher | Publish exact review ID+revision or withdraw through functions. Cannot publish its own contributions. No table UPDATE grants. Reviewer and publisher may be the same independent person; both must differ from every author. |
| API reader | SELECT protected public projection and execute its filtered payload function. No draft/source/registry/receipt table access. |

Aliases share the same principal. OID **and** role name must match enrollment;
unsafe login attributes, owner membership, trusted-schema CREATE, dangerous built-in
roles and unregistered/inactive subjects are rejected. Protected registry,
contributor and receipt tables strip non-owner default ACLs on installation.
Capability membership alone cannot forge an approval by SQL DML. Old circuit
functions are pinned/revoked as well as the new ones. Every function pins
`pg_catalog, <installation schema>, pg_temp`, UTC and ISO dates.

Only the review/publish SECURITY DEFINER functions may create an approval. Each
checks the authenticated subject and expected revision while holding the global
transaction advisory lock `(396,1)`. Full graph manifests include exact article
bytes/metadata, canonical circuit identity, immutable authors/contributors, all
claims, all evidence locators/support decisions and complete source records.
Core PostgreSQL SHA-256 over JSONB text is the server revision contract; body
SHA-256 separately protects the exact UTF-8 prose. No extension is required.
Inspection is read-only; a subsequent change makes its revision stale.

The same lock is acquired before every editorial graph statement and relevant
source/identity mutation. Review/publish require READ COMMITTED and take their
fresh checks **after** acquiring it. Material writes revoke the receipt link,
erase public review fields and advance the generation. Evidence/link deletion,
source provenance changes, withdrawal, author/reviewer identity maintenance and
canonical identity changes invalidate visibility. Restoring old bytes does not
restore approval. Identity maintenance conservatively revokes all circuit reviews;
no-op canonical identity updates do not. Unrelated driver sources retain their
existing editing behavior; changing a source shared with circuit evidence also
requires a registered stager and records that contribution.

The API reads one MVCC-consistent protected projection, recomputes the full graph
revision and validates body SHA/claim coverage again. Non-READ-COMMITTED public
reader transactions return no content. A query that started before revocation
may complete with its earlier snapshot; new queries after commit cannot read the
withdrawn article. Already delivered text cannot be recalled from a visitor.
Success, errors and default-off responses use `private, no-store, max-age=0`.
There is no approval HTTP endpoint, source downloader, Markdown HTML renderer or
media importer in this boundary.

## Migration and operations

1. Back up and rehearse restore. Use the same protected migration owner that owns
   the existing circuit tables. Apply `python3 packages/database/scripts/migrate.py`.
   Migration0016 preserves drafts/claims/evidence and clears all old asserted
   approvals/support decisions; legacy creator subjects remain NULL and cannot
   be reviewed. A DBA must establish real authorship from independent records
   before explicitly backfilling `author_principal`. Do not invent that mapping.
2. As DBA, in the installation schema, run
   `psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f packages/database/scripts/provision_circuit_roles.sql`.
   It is repeatable, removes previous broad group grants, rejects unsafe group
   roles, creates only NOLOGIN capability groups and enrolls nobody.
3. Separately create individual LOGIN credentials with restricted privileges and
   externally verify the person. Register/change capabilities through the
   **DBA-only** `circuit_editorial_configure_actor(login, principal, display_name,
   capabilities::text[], enabled)` function. Use canonical principal IDs for all
   aliases. It revokes old receipts before changing memberships, rejects extra
   inherited capabilities and refuses reassignment of a login to another person.
   For example capabilities are `ARRAY['grid_circuit_stager']` or
   `ARRAY['grid_circuit_reviewer']`; examples are not real human attestations.
4. Stage only explicit unreviewed bundles using the existing staging CLI with
   the individual stager connection. Exact reimports refuse overwrite atomically;
   reviewed/published records are never replaced. Candidate evidence is unsupported.
5. Under the reviewer's own credentials inspect the candidate, actually open all
   underlying sources, verify exact locators/originality/history/translation and
   resolve contradictions. Run the server tool only after that human work:

   ```sh
   node apps/api/scripts/circuit-editorial-operation.cjs inspect <article-id>
   CIRCUIT_EDITORIAL_OPERATION_CONFIRM=I_REVIEWED_ALL_CLAIMS_AND_EVIDENCE \
     node apps/api/scripts/circuit-editorial-operation.cjs review <article-id> <inspected-sha256>
   ```

   The command confirms an operator decision; the environment string does not
   authenticate them. PostgreSQL identity/registry/privileges do. The operation
   reviews **every** candidate evidence record; remove unresolved candidates in a
   new draft revision rather than marking them supported automatically.
6. An authorized independent publisher receives the returned review ID/digest,
   checks them against the reviewed revision and invokes:

   ```sh
   CIRCUIT_EDITORIAL_OPERATION_CONFIRM=PUBLISH_EXACT_REVIEWED_REVISION \
     node apps/api/scripts/circuit-editorial-operation.cjs publish <article-id> <reviewed-sha256> <review-id>
   CIRCUIT_EDITORIAL_OPERATION_CONFIRM=WITHDRAW_CIRCUIT_ARTICLE \
     node apps/api/scripts/circuit-editorial-operation.cjs withdraw <article-id>
   ```

   Both mutations are atomic. A stale revision returns a transaction error and
   rolls back; inspect and repeat actual review, never automatically retry an
   approval with a newly computed revision. A transaction failure leaves no
   partial support/claim/receipt publication. Staging likewise rolls back fully.
7. Public `CIRCUIT_EDITORIAL_READ_ENABLED` and, in dependent PR359,
   `CIRCUIT_EDITORIAL_UI_ENABLED` remain absent/off. Enabling either is a separate
   maintainer release decision after real human review and release gates. Test
   fixtures use only synthetic text in owned disposable schemas. No production
   draft, actor, review or photograph is seeded by migrations or this batch.

Use `configure_actor(..., enabled=false)` **before** retiring/renaming credentials,
changing role attributes or removing/regranting memberships. Re-enabling through
the helper cannot resurrect an old receipt. Direct DBA role DDL/grants, changing
object ownership and global superuser operations are trusted maintenance outside
this workflow; PostgreSQL has no safe row trigger on global role DDL. Do not use
out-of-band role revoke/regrant as an editorial withdrawal mechanism. A direct
membership/LOGIN removal immediately fails public checks, but later restoring it
without the lifecycle helper does not itself create a new revocation event.

Rollback is operational: keep both flags off, disable actor enrollment, stop
writers, retain migration0016 and restore a tested backup if required. Do not
remove the checksummed migration or downgrade to pre-receipt public reads. The
schema runner checks prior checksums and applies pending migrations in one locked
transaction; failing SQL/checksum drift aborts without partial schema changes.

Production blockers: verified individual enrollment/authentication and audit policy;
real independent claim-level EN/UK review (including single-source conflicts);
least-privilege API credentials and restricted DBA credentials on the target host;
final CI/independent code review; issue104 hosting/TLS/backup/restore/observability
and actual-origin smoke. Passing synthetic security tests is no human approval.

## Local verification evidence

Executed on Node24.21.0 / PostgreSQL17 (disposable container, localhost55471):

| Check | Actual result |
| --- | --- |
| `pnpm check` | PASS |
| `pnpm lint` | PASS; fixed nine pre-existing unnecessary regex escapes in five circuit tests without changing assertions |
| `pnpm typecheck` | PASS |
| `pnpm test` |512/512 PASS |
| `python3 -m unittest discover -s tests -v` |434/434 PASS |
| `pnpm test:integration` |91 PASS,1 existing skip (92 total) |
| Targeted `node --test apps/api/test/circuit-editorial*.integration.cjs` |47/47 PASS |
| `GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm build` |PASS; existing CSS compatibility warnings |
| `bash packages/database/scripts/test-versioned-migrations.sh` |PASS on a separate empty disposable database |

The migration test additionally exercises a deliberate SQL failure with complete
rollback, preserved pre0016 prose, withdrawal of asserted legacy approvals,
hostile default ACL cleanup, repeat migration and rejected checksum drift.
Concurrency tests observe the actual pending PostgreSQL advisory lock before
releasing the competing transaction; they exercise both write orders. Real TCP
LOGIN subjects are used, with aliases mapped to one canonical synthetic principal.
No production credentials or real human approvals are used. The full existing browser regression suite passed546/546 locally (desktop/mobile Chromium plus WebKit route checks). The original pinned F1DB import also passed in a separate disposable database. Final CI results are attached to the PR head; these are not deployment or human editorial approval.
