BEGIN;
-- Source-reported season standings, independent of summed race-result points.
-- F1DB may represent constructor/engine combinations separately.
CREATE TABLE historical_championship_standings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  season_year INTEGER NOT NULL REFERENCES historical_seasons(year),
  entity_kind TEXT NOT NULL CHECK (entity_kind IN ('driver','constructor')),
  position_display_order INTEGER NOT NULL CHECK (position_display_order > 0),
  position_number INTEGER CHECK (position_number > 0),
  position_text TEXT NOT NULL CHECK (length(btrim(position_text)) > 0),
  driver_id BIGINT REFERENCES historical_drivers(id),
  constructor_id BIGINT REFERENCES historical_constructors(id),
  engine_manufacturer_external_id TEXT,
  points NUMERIC(12,2) NOT NULL CHECK (points >= 0),
  championship_won BOOLEAN NOT NULL,
  release_id BIGINT NOT NULL REFERENCES source_releases(id),
  source_locator TEXT NOT NULL CHECK (length(btrim(source_locator)) > 0),
  content_hash CHAR(64) NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT standing_entity_identity CHECK (
    (entity_kind = 'driver' AND driver_id IS NOT NULL AND constructor_id IS NULL AND engine_manufacturer_external_id IS NULL)
    OR (entity_kind = 'constructor' AND driver_id IS NULL AND constructor_id IS NOT NULL)),
  UNIQUE (season_year, entity_kind, position_display_order)
);
CREATE INDEX championship_driver_year ON historical_championship_standings(driver_id,season_year DESC) WHERE driver_id IS NOT NULL;
CREATE INDEX championship_constructor_year ON historical_championship_standings(constructor_id,season_year DESC) WHERE constructor_id IS NOT NULL;
COMMIT;
