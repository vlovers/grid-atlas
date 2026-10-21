-- Curated, source-backed technical facts. Research storage only; no public read path.
-- Separate from F1DB imports and existing reviewed editorial/media publication gates.
CREATE TABLE historical_technical_facts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_kind TEXT NOT NULL CHECK (entity_kind IN
    ('driver_season', 'constructor_season', 'circuit_layout', 'race_event')),
  entity_id BIGINT NOT NULL CHECK (entity_id > 0),
  season_year INTEGER NOT NULL CHECK (season_year BETWEEN 1950 AND 2100),
  layout_version TEXT,
  field_key TEXT NOT NULL,
  value JSONB NOT NULL,
  source_url TEXT NOT NULL CHECK (source_url ~ '^https://[^[:space:]]+$'),
  source_title TEXT NOT NULL CHECK (length(btrim(source_title)) > 0),
  source_publisher TEXT NOT NULL CHECK (length(btrim(source_publisher)) > 0),
  source_locator TEXT NOT NULL CHECK (length(btrim(source_locator)) > 0),
  source_accessed_on DATE NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft', 'reviewed', 'rejected')),
  reviewer TEXT,
  reviewed_on DATE,
  evidence_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT technical_fact_review CHECK (
    review_status <> 'reviewed' OR
    (reviewer IS NOT NULL AND length(btrim(reviewer)) > 0 AND reviewed_on IS NOT NULL)
  ),
  CONSTRAINT technical_fact_layout CHECK (
    (entity_kind = 'circuit_layout' AND layout_version IS NOT NULL AND length(btrim(layout_version)) > 0)
    OR (entity_kind <> 'circuit_layout' AND layout_version IS NULL)
  ),
  CONSTRAINT technical_fact_field CHECK (
    (entity_kind = 'driver_season' AND field_key IN ('car_number', 'team_role'))
    OR (entity_kind = 'constructor_season' AND field_key IN ('chassis', 'engine', 'team_principal', 'base'))
    OR (entity_kind = 'circuit_layout' AND field_key IN ('length_m', 'turns', 'direction', 'svg_path'))
    OR (entity_kind = 'race_event' AND field_key IN ('scheduled_laps', 'drs_zones', 'tyre_compounds'))
  ),
  CONSTRAINT technical_fact_value CHECK (
    (field_key IN ('length_m', 'turns', 'scheduled_laps', 'drs_zones')
      AND jsonb_typeof(value) = 'number'
      AND value::text ~ '^[0-9]+$'
      AND (field_key = 'drs_zones' OR value::numeric > 0))
    OR (field_key = 'tyre_compounds' AND jsonb_typeof(value) = 'array'
      AND jsonb_array_length(value) BETWEEN 1 AND 10)
    OR (field_key NOT IN ('length_m', 'turns', 'scheduled_laps', 'drs_zones', 'tyre_compounds')
      AND jsonb_typeof(value) = 'string' AND length(btrim(value #>> '{}')) BETWEEN 1 AND 50000)
  )
);
-- Multiple sources can support competing claims. Never overwrite conflicts silently.
CREATE UNIQUE INDEX historical_technical_facts_source_claim_idx
  ON historical_technical_facts (entity_kind, entity_id, season_year,
    COALESCE(layout_version, ''), field_key, source_url, source_locator);
CREATE INDEX historical_technical_facts_review_lookup_idx
  ON historical_technical_facts (entity_kind, entity_id, season_year, review_status);
COMMENT ON TABLE historical_technical_facts IS
  'Research-only sourced historical technical claims; reviewed is not equivalent to publishable.';
