# Circuit editorial publication boundary — 29 October 2026

This is an **engineering boundary, not publication approval**. It does not import the 165
EN/UK circuit research drafts, approve any historical claim, enable the public read
route, create media assets, or change the driver biography publisher.

## Why a separate model

The existing `content_articles`, `content_claims`, and
`apps/api/scripts/publish-editorial.cjs` are bound to `historical_drivers`.
Treating a circuit as a driver would corrupt subject identity and let circuit
drafts borrow driver-only approval assumptions. Migration
`0013_circuit_editorial_boundary.sql` introduces independent circuit article,
claim, evidence, and article–claim tables with foreign keys to
`historical_circuits`. Source provenance uses the existing `content_sources`
registry; **media has no circuit publication path**.

## Fail-closed constraints

- Each circuit has at most one article per locale. An article cannot publish
  without a nonempty body, a lowercase SHA-256 revision identifier, a named
  author and a distinct named human reviewer with review/publication timestamps.
  AI-reviewed articles cannot be published. The read API also checks SHA-256
  of the exact UTF-8 `body_markdown` against the stored review revision. A
  matching digest is not a signature or proof of human review.
- A claim cannot be marked verified without a named human reviewer and review
  timestamp. Publishing an article requires at least one linked claim, all
  claims belonging to the same circuit, and every claim verified with at least
  one supporting, source-located evidence row. A claim reviewer cannot be the
  article author.
- Changing article text, title, locale, author, revision or review method
  revokes article publication. Replacing reviewer identity or review/publication
  timestamps on an already published row also revokes publication. Changing claim text/review, evidence, source
  metadata or article–claim links invalidates the affected review.
  Cross-circuit links are rejected and subject identity is immutable.
- Forward-only migration `0014_circuit_review_revocation.sql` closes a stale-
  approval loophole: explicitly withdrawing or pausing a published article
  clears its old reviewer and timestamps while preserving the withdrawn or
  in-review status. A later promotion requires a fresh review transition;
  merely toggling status back to `published` fails. A verified claim whose
  reviewer or review timestamp is changed loses verification, and disputing
  or rejecting a verified claim clears the old review. Restoring `verified`
  likewise requires a fresh review transition. This is integrity protection,
  **not** authentication or proof that a person reviewed the material.
- The public API route `GET /api/circuits/:id/article?locale=uk|en` is
  **disabled by default**. Without
  `CIRCUIT_EDITORIAL_READ_ENABLED=1` it returns 404, including for rows
  otherwise marked published. When explicitly enabled, it still requires
  verified evidence and structurally exact coverage of every paragraph by
  reviewed claim statements. It returns no author/reviewer, review metadata,
  unapproved drafts or media.

The database cannot independently establish that a reviewer is a real human,
that a source supports a historical claim, or that a matching body digest
was independently signed by an authorized reviewer. The API's exact-claim
structural check is **not** historical verification. A separate authenticated,
independently reviewed publication workflow and human release decision are
still required. Do not use SQL to manually populate `published` rows as a
substitute. The environment switch is a deployment safety lock, **not**
permission to approve content.

## Verification

`apps/api/test/circuit-editorial.contract.test.cjs` checks the migration
checksum in the API readiness contract, independent schema and disabled-by-
default API gate. `apps/api/test/circuit-editorial.integration.cjs` creates
a disposable PostgreSQL schema, applies the checked-in migrations, and exercises
HTTP visibility, exact body digest matching, reviewer-metadata tamper revocation,
evidence-first review, withdrawn/paused article reapproval, verified claim
reviewer tampering and disputed-claim reapproval, source/evidence/link revocation, cross-circuit link
rejection, AI/self-review rejection and transactional rollback. All names
and assertions in that test are **synthetic fixtures**, not F1 history.

Run the contract tests with:

```sh
node --test apps/api/test/circuit-editorial.contract.test.cjs
```

Run the PostgreSQL tests with the repository's existing isolated integration
harness (`DATABASE_URL` pointing at a disposable database):

```sh
pnpm --filter @grid-atlas/api test:integration
```

The migrator is forward-only and the API readiness contract now requires
migrations 0013 and 0014. Do not edit either migration after deployment;
use a new forward-only version.

## Remaining release blockers

1. Independent claim-by-claim EN/UK historical verification, citations with
   exact locators, author/reviewer provenance and a signed revision manifest.
2. A separately audited, explicit circuit bundle publisher that verifies the
   exact reviewed revision, identity and claim evidence inside one transaction.
   This PR intentionally does **not** implement or enable such a writer.
3. Product acceptance, bilingual UX and accessibility checks against
   independently approved data. The public circuit page remains unchanged.
4. Independent media rights checks for any photographs or illustrations.

See the existing offline review queue and claim desk for research preparation;
they do not feed this publication schema automatically.
