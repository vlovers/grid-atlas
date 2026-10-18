-- Entrant-to-entrant historical claims, independent of constructor/chassis identities.
BEGIN;
CREATE TABLE historical_entrant_lineage_claims (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 subject_entrant_id BIGINT NOT NULL REFERENCES historical_entrants(id) ON DELETE RESTRICT,
 object_entrant_id BIGINT NOT NULL REFERENCES historical_entrants(id) ON DELETE RESTRICT,
 relation_type TEXT NOT NULL CHECK (relation_type IN ('renamed_to','assets_acquired_by','operations_succeeded_by')),
 effective_year INTEGER CHECK (effective_year BETWEEN 1950 AND 2200),
 source_url TEXT NOT NULL CHECK (source_url ~ '^https://[^[:space:]]+$'),
 source_title TEXT NOT NULL CHECK (length(btrim(source_title)) > 0),
 source_publisher TEXT NOT NULL CHECK (length(btrim(source_publisher)) > 0),
 evidence_note TEXT NOT NULL CHECK (length(btrim(evidence_note)) > 0),
 accessed_at DATE NOT NULL,
 review_status TEXT NOT NULL DEFAULT 'proposed' CHECK (review_status IN ('proposed','verified','rejected')),
 reviewer TEXT,
 reviewed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (subject_entrant_id <> object_entrant_id),
 CHECK (review_status <> 'verified' OR (reviewer IS NOT NULL AND length(btrim(reviewer)) > 0 AND reviewed_at IS NOT NULL)),
 UNIQUE (subject_entrant_id,object_entrant_id,relation_type,source_url)
);
CREATE INDEX historical_entrant_lineage_subject_idx ON historical_entrant_lineage_claims(subject_entrant_id);
CREATE INDEX historical_entrant_lineage_object_idx ON historical_entrant_lineage_claims(object_entrant_id);
CREATE INDEX historical_entrant_lineage_verified_idx ON historical_entrant_lineage_claims(subject_entrant_id,object_entrant_id) WHERE review_status='verified';
COMMIT;
