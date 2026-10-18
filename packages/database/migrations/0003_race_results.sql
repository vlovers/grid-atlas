BEGIN;
CREATE TABLE historical_race_results (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  race_id BIGINT NOT NULL REFERENCES historical_races(id) ON DELETE RESTRICT,
  driver_id BIGINT NOT NULL REFERENCES historical_drivers(id) ON DELETE RESTRICT,
  constructor_id BIGINT NOT NULL REFERENCES historical_constructors(id) ON DELETE RESTRICT,
  position_display_order INTEGER NOT NULL CHECK (position_display_order >= 1),
  position_number INTEGER CHECK (position_number >= 1),
  position_text TEXT NOT NULL CHECK (length(btrim(position_text)) > 0),
  driver_number TEXT NOT NULL CHECK (driver_number ~ '^[0-9]+$'),
  laps INTEGER CHECK (laps >= 0),
  points NUMERIC(12,2) CHECK (points >= 0),
  reason_retired TEXT,
  shared_car BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (race_id, position_display_order)
);
CREATE INDEX historical_race_results_driver_idx ON historical_race_results(driver_id);
CREATE INDEX historical_race_results_constructor_idx ON historical_race_results(constructor_id);
COMMIT;
