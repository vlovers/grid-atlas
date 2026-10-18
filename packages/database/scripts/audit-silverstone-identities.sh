#!/usr/bin/env bash
# Read-only audit: resolve source identities before creating lineage claims.
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL to an existing migrated database}"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
\pset pager off
\echo 'Constructor identity candidates (not asserted lineage)'
SELECT c.id AS internal_id, x.external_id, c.display_name, s.slug AS source
FROM historical_constructors c
JOIN external_identities x ON x.id=c.external_identity_id
JOIN data_sources s ON s.id=x.source_id
WHERE c.display_name ~* '(jordan|midland|spyker|force india|racing point|aston martin)'
   OR x.external_id ~* '(jordan|midland|spyker|force.india|racing.point|aston.martin)'
ORDER BY c.display_name, s.slug, x.external_id;
\echo 'Entrant identity candidates (not asserted lineage)'
SELECT e.id AS internal_id, x.external_id, e.display_name, s.slug AS source
FROM historical_entrants e
JOIN external_identities x ON x.id=e.external_identity_id
JOIN data_sources s ON s.id=x.source_id
WHERE e.display_name ~* '(jordan|midland|spyker|force india|racing point|aston martin)'
   OR x.external_id ~* '(jordan|midland|spyker|force.india|racing.point|aston.martin)'
ORDER BY e.display_name, s.slug, x.external_id;
\echo 'Reviewed lineage counts'
SELECT 'constructor' AS entity_type, review_status, count(*) AS claims
FROM historical_lineage_claims GROUP BY review_status
UNION ALL
SELECT 'entrant', review_status, count(*)
FROM historical_entrant_lineage_claims GROUP BY review_status
ORDER BY entity_type, review_status;
SQL
