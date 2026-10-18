-- Grid Atlas provenance foundation. Applied exactly once by migration runner.
BEGIN;
CREATE TABLE data_sources (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  homepage_url TEXT NOT NULL,
  attribution TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9_-]*$')
);
CREATE TABLE source_releases (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES data_sources(id) ON DELETE RESTRICT,
  release_tag TEXT NOT NULL,
  artifact_name TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, release_tag, artifact_name),
  CONSTRAINT sha256_hex CHECK (sha256 ~ '^[0-9a-f]{64}$')
);
CREATE TABLE external_identities (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES data_sources(id) ON DELETE RESTRICT,
  entity_kind TEXT NOT NULL,
  external_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, entity_kind, external_id),
  CONSTRAINT entity_kind_nonempty CHECK (length(btrim(entity_kind)) > 0),
  CONSTRAINT external_id_nonempty CHECK (length(btrim(external_id)) > 0)
);
CREATE TABLE source_observations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  release_id BIGINT NOT NULL REFERENCES source_releases(id) ON DELETE RESTRICT,
  external_identity_id BIGINT NOT NULL REFERENCES external_identities(id) ON DELETE RESTRICT,
  content_hash TEXT NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (release_id, external_identity_id),
  CONSTRAINT content_hash_hex CHECK (content_hash ~ '^[0-9a-f]{64}$')
);
COMMIT;
