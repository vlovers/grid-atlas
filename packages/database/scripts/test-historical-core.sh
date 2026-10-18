#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL}"
bash packages/database/scripts/apply-migrations.sh
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
INSERT INTO data_sources(slug, homepage_url, attribution) VALUES
 ('f1db','https://github.com/f1db/f1db','F1DB CC BY 4.0');
INSERT INTO external_identities(source_id,entity_kind,external_id)
 VALUES (1,'driver','test-driver'),(1,'constructor','test-team'),(1,'entrant','test-entrant'),(1,'circuit','test-circuit'),(1,'race','test-race');
INSERT INTO historical_drivers(external_identity_id,display_name) VALUES (1,'Fixture Driver');
INSERT INTO historical_constructors(external_identity_id,display_name) VALUES (2,'Fixture Constructor');
INSERT INTO historical_entrants(external_identity_id,display_name) VALUES (3,'Fixture Entrant');
INSERT INTO historical_circuits(external_identity_id,display_name) VALUES (4,'Fixture Circuit');
INSERT INTO historical_seasons(year) VALUES (1950);
INSERT INTO historical_races(external_identity_id,season_year,round,circuit_id,official_name)
 VALUES (5,1950,1,1,'Fixture Grand Prix');
DO $$
BEGIN
 IF (SELECT count(*) FROM historical_races) <> 1 THEN
   RAISE EXCEPTION 'Fixture race missing';
 END IF;
END $$;
ROLLBACK;
SQL
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
DO $$
BEGIN
 BEGIN
  INSERT INTO historical_races(external_identity_id,season_year,round,official_name)
    VALUES (999,1949,1,'Invalid Race');
  RAISE EXCEPTION 'Expected FK failure';
 EXCEPTION WHEN foreign_key_violation THEN NULL;
 END;
END $$;
ROLLBACK;
SQL
