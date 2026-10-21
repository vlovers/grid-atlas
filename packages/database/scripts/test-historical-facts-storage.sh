#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL to a disposable PostgreSQL database}"
# Never run this against a production database. The runner applies all migrations.
python3 packages/database/scripts/migrate.py
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
INSERT INTO historical_technical_facts
(entity_kind,entity_id,season_year,field_key,value,source_url,source_title,
 source_publisher,source_locator,source_accessed_on)
VALUES ('constructor_season',1,2008,'chassis','"EXAMPLE-ONLY"',
'https://example.org/archive','Fixture','Fixture','page 1','2026-10-21');
DO $$
BEGIN
  BEGIN
    INSERT INTO historical_technical_facts
    (entity_kind,entity_id,season_year,field_key,value,source_url,source_title,
     source_publisher,source_locator,source_accessed_on,review_status)
    VALUES ('constructor_season',2,2008,'engine','"EXAMPLE-ONLY"',
      'https://example.org/archive','Fixture','Fixture','page 2','2026-10-21','reviewed');
    RAISE EXCEPTION 'Expected reviewed claim without reviewer to fail';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO historical_technical_facts
    (entity_kind,entity_id,season_year,field_key,value,source_url,source_title,
     source_publisher,source_locator,source_accessed_on)
    VALUES ('circuit_layout',3,2008,'turns','12',
      'https://example.org/archive','Fixture','Fixture','page 3','2026-10-21');
    RAISE EXCEPTION 'Expected layout version constraint to fail';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO historical_technical_facts
    (entity_kind,entity_id,season_year,field_key,value,source_url,source_title,
     source_publisher,source_locator,source_accessed_on)
    VALUES ('race_event',4,2008,'tyre_compounds','[1,2]',
      'https://example.org/archive','Fixture','Fixture','page 4','2026-10-21');
    RAISE EXCEPTION 'Expected non-string tyre compounds to fail';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO historical_technical_facts
    (entity_kind,entity_id,season_year,field_key,value,source_url,source_title,
     source_publisher,source_locator,source_accessed_on)
    VALUES ('constructor_season',1,2008,'chassis','"EXAMPLE-ONLY"',
      'https://example.org/archive','Fixture','Fixture','page 1','2026-10-21');
    RAISE EXCEPTION 'Expected duplicate source claim to fail';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
END $$;
ROLLBACK;
SQL
