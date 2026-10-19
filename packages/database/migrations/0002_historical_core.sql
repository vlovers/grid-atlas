BEGIN;
CREATE TABLE historical_drivers (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 external_identity_id BIGINT NOT NULL UNIQUE REFERENCES external_identities(id) ON DELETE RESTRICT,
 display_name TEXT NOT NULL CHECK (length(btrim(display_name)) > 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE historical_constructors (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 external_identity_id BIGINT NOT NULL UNIQUE REFERENCES external_identities(id) ON DELETE RESTRICT,
 display_name TEXT NOT NULL CHECK (length(btrim(display_name)) > 0)
);
CREATE TABLE historical_entrants (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 external_identity_id BIGINT NOT NULL UNIQUE REFERENCES external_identities(id) ON DELETE RESTRICT,
 display_name TEXT NOT NULL CHECK (length(btrim(display_name)) > 0)
);
CREATE TABLE historical_seasons (
 year INTEGER PRIMARY KEY CHECK (year >= 1950 AND year <= 2200)
);
CREATE TABLE historical_circuits (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 external_identity_id BIGINT NOT NULL UNIQUE REFERENCES external_identities(id) ON DELETE RESTRICT,
 display_name TEXT NOT NULL CHECK (length(btrim(display_name)) > 0)
);
CREATE TABLE historical_races (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 external_identity_id BIGINT NOT NULL UNIQUE REFERENCES external_identities(id) ON DELETE RESTRICT,
 season_year INTEGER NOT NULL REFERENCES historical_seasons(year) ON DELETE RESTRICT,
 round INTEGER NOT NULL CHECK (round >= 1),
 circuit_id BIGINT REFERENCES historical_circuits(id) ON DELETE RESTRICT,
 race_date DATE,
 official_name TEXT NOT NULL CHECK (length(btrim(official_name)) > 0),
 UNIQUE (season_year, round)
);
CREATE INDEX historical_races_circuit_idx ON historical_races(circuit_id);
COMMIT;
