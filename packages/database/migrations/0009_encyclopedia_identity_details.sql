BEGIN;
-- Source-reported identity attributes, separate from reviewed historical facts.
-- A release observation binds the fields to the exact imported entity row.
CREATE TABLE historical_identity_details (
 external_identity_id BIGINT PRIMARY KEY REFERENCES external_identities(id) ON DELETE RESTRICT,
 release_id BIGINT NOT NULL,
 source_locator TEXT NOT NULL CHECK (length(btrim(source_locator)) > 0),
 fields JSONB NOT NULL CHECK (jsonb_typeof(fields) = 'object'),
 FOREIGN KEY (release_id, external_identity_id)
   REFERENCES source_observations(release_id, external_identity_id) ON DELETE RESTRICT
);
COMMIT;
