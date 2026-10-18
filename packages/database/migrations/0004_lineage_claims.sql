-- Source-backed, editorially reviewed lineage claims. No automatic historical inference.
BEGIN;
CREATE TABLE historical_lineage_claims (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 subject_constructor_id BIGINT NOT NULL REFERENCES historical_constructors(id) ON DELETE RESTRICT,
 object_constructor_id BIGINT NOT NULL REFERENCES historical_constructors(id) ON DELETE RESTRICT,
 relation_type TEXT NOT NULL CHECK (relation_type IN ('renamed_to','ownership_transferred_to','operations_succeeded_by')),
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
 CHECK (subject_constructor_id <> object_constructor_id),
 CHECK (review_status <> 'verified' OR (reviewer IS NOT NULL AND length(btrim(reviewer)) > 0 AND reviewed_at IS NOT NULL)),
 UNIQUE (subject_constructor_id, object_constructor_id, relation_type, source_url)
);
CREATE INDEX historical_lineage_subject_idx ON historical_lineage_claims(subject_constructor_id);
CREATE INDEX historical_lineage_object_idx ON historical_lineage_claims(object_constructor_id);
CREATE INDEX historical_lineage_verified_idx ON historical_lineage_claims(subject_constructor_id, object_constructor_id) WHERE review_status = 'verified';
COMMIT;
