# Lineage editorial review and publication

Historical lineage is **not** inferred from matching names, dates, sponsors, or constructors. The public network returns **verified** claims only. Importing a proposed claim does not publish it.

## Review a candidate

1. Import the pinned F1DB release into disposable PostgreSQL, then run the proposed-manifest validator and proposed importer. Use `docs/data-sources/manifests/silverstone-2021.proposed.json` as the first existing candidate; it has **not** been approved.
2. Resolve both external identities against `data_sources`, `external_identities` and the appropriate `historical_constructors` or `historical_entrants` rows. Check that they represent the intended entities, not merely the same display name.
3. Open the exact `source_url` and verify that it supports the precise `relation_type` and `effective_year`. Record disagreements, ambiguities, and whether the source describes constructor branding, entrant registration, assets, ownership or operational succession. A retrospective overview alone is not proof of legal continuity.
4. A reviewer **other than the claim's author** must record a review decision and rationale in the review PR. Keep a link to the PR in the editorial log. Do not claim an independent review occurred when it did not.
5. Only after approval, set `review_status='verified'`, `reviewer` and `reviewed_at` together in a transaction. A rejection must not be published.

## Read-only review queue

Run against the imported database (never assume that the first claim ID is 1):

```sql
SELECT 'constructor' AS entity_type, id, relation_type, effective_year,
       source_publisher, source_title, source_url, evidence_note, accessed_at
FROM historical_lineage_claims WHERE review_status='proposed'
UNION ALL
SELECT 'entrant', id, relation_type, effective_year,
       source_publisher, source_title, source_url, evidence_note, accessed_at
FROM historical_entrant_lineage_claims WHERE review_status='proposed'
ORDER BY entity_type, id;
```

## Publication transaction (manual, reviewed only)

Select the **correct table and ID** from the review queue. Replace the placeholders; do not run the example unchanged. The explicit `proposed` guard prevents silently overriding a previous decision.

```sql
BEGIN;
UPDATE historical_lineage_claims
SET review_status = 'verified',
    reviewer = '<independent reviewer identity>',
    reviewed_at = now()
WHERE id = <reviewed constructor claim id>
  AND review_status = 'proposed'
RETURNING id, relation_type, source_url, reviewer, reviewed_at;
-- Confirm exactly one returned row and that its evidence matches the approved PR.
-- ROLLBACK on any mismatch; COMMIT only after explicit confirmation.
ROLLBACK;
```

For entrant claims, use `historical_entrant_lineage_claims` instead. The example intentionally ends in `ROLLBACK` to prevent accidental publication; an authorized reviewer must explicitly change it to `COMMIT` after checking the returned row. No script or CI job should auto-promote proposed claims.

## Post-publication verification

- Confirm the verified claim appears in `/api/lineage/network` and on `/lineage`; proposed and rejected claims must remain absent.
- Confirm the published card's publisher, title and URL match the reviewed source, and both entity links resolve.
- Confirm that a 2018 Force India asset/new-entrant event was **not** misrepresented as a simple constructor rename.
- Confirm the modern Silverstone-based Aston Martin is not joined to the unrelated 1959–60 entry by name alone.

## Current status

The 2021 Racing Point → Aston Martin manifest is **proposed only**. There is no independent approval recorded here, no database promotion performed by this document, and no claim that the public graph has data yet.
