-- Read-only editorial queue. Run against an imported database with migrations 0004 and 0005.
-- Proposed claims remain private and are never published by this query.
SELECT 'constructor' AS entity_type, c.id AS claim_id,
       s.name AS subject_name, o.name AS object_name,
       c.relation_type, c.effective_year, c.source_publisher,
       c.source_title, c.source_url, c.evidence_note, c.accessed_at,
       c.created_at
FROM historical_lineage_claims c
JOIN historical_constructors s ON s.id = c.subject_constructor_id
JOIN historical_constructors o ON o.id = c.object_constructor_id
WHERE c.review_status = 'proposed'
UNION ALL
SELECT 'entrant' AS entity_type, c.id AS claim_id,
       s.name AS subject_name, o.name AS object_name,
       c.relation_type, c.effective_year, c.source_publisher,
       c.source_title, c.source_url, c.evidence_note, c.accessed_at,
       c.created_at
FROM historical_entrant_lineage_claims c
JOIN historical_entrants s ON s.id = c.subject_entrant_id
JOIN historical_entrants o ON o.id = c.object_entrant_id
WHERE c.review_status = 'proposed'
ORDER BY created_at, entity_type, claim_id;
