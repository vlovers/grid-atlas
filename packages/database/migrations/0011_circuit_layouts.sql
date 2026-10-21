BEGIN;
-- Pinned F1DB geometry-independent layout facts. NOT track map shapes or rights.
CREATE TABLE historical_circuit_layouts (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 circuit_id BIGINT NOT NULL REFERENCES historical_circuits(id) ON DELETE RESTRICT,
 external_layout_id TEXT NOT NULL UNIQUE,
 effective BOOLEAN NOT NULL,
 length_km NUMERIC(10,3) NOT NULL CHECK (length_km >= 0),
 turns INTEGER NOT NULL CHECK (turns >= 0),
 release_id BIGINT NOT NULL REFERENCES source_releases(id),
 source_locator TEXT NOT NULL,
 content_hash CHAR(64) NOT NULL CHECK (content_hash ~ '^[a-f0-9]{64}$')
);
CREATE INDEX historical_layouts_circuit ON historical_circuit_layouts(circuit_id);
CREATE TABLE historical_race_circuit_facts (
 race_id BIGINT PRIMARY KEY REFERENCES historical_races(id) ON DELETE RESTRICT,
 layout_id BIGINT REFERENCES historical_circuit_layouts(id) ON DELETE RESTRICT,
 course_length_km NUMERIC(10,3) NOT NULL CHECK (course_length_km >= 0),
 turns INTEGER NOT NULL CHECK (turns >= 0),
 laps INTEGER NOT NULL CHECK (laps >= 0),
 distance_km NUMERIC(12,3) NOT NULL CHECK (distance_km >= 0),
 scheduled_laps INTEGER NOT NULL CHECK (scheduled_laps >= 0),
 scheduled_distance_km NUMERIC(12,3) NOT NULL CHECK (scheduled_distance_km >= 0),
 direction TEXT,
 release_id BIGINT NOT NULL REFERENCES source_releases(id),
 source_locator TEXT NOT NULL,
 content_hash CHAR(64) NOT NULL CHECK (content_hash ~ '^[a-f0-9]{64}$')
);
COMMIT;
