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

# Lineage claims must have evidence, distinct endpoints and an explicit review before publication.
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
INSERT INTO data_sources(slug, homepage_url, attribution) VALUES
 ('lineage-test','https://example.org','Fixture only');
INSERT INTO external_identities(source_id,entity_kind,external_id)
SELECT id,'constructor','lineage-a' FROM data_sources WHERE slug='lineage-test';
INSERT INTO external_identities(source_id,entity_kind,external_id)
SELECT id,'constructor','lineage-b' FROM data_sources WHERE slug='lineage-test';
INSERT INTO historical_constructors(external_identity_id,display_name)
SELECT id,'Fixture Team A' FROM external_identities WHERE external_id='lineage-a';
INSERT INTO historical_constructors(external_identity_id,display_name)
SELECT id,'Fixture Team B' FROM external_identities WHERE external_id='lineage-b';
INSERT INTO historical_lineage_claims(subject_constructor_id,object_constructor_id,relation_type,effective_year,source_url,source_title,source_publisher,evidence_note,accessed_at)
SELECT a.id,b.id,'operations_succeeded_by',2000,'https://example.org/history','Fixture','Fixture publisher','Fixture evidence only',CURRENT_DATE
FROM historical_constructors a CROSS JOIN historical_constructors b
WHERE a.display_name='Fixture Team A' AND b.display_name='Fixture Team B';
DO $$
BEGIN
 IF (SELECT count(*) FROM historical_lineage_claims WHERE review_status='proposed') <> 1 THEN
   RAISE EXCEPTION 'Lineage default review status invalid';
 END IF;
 BEGIN
   UPDATE historical_lineage_claims SET review_status='verified';
   RAISE EXCEPTION 'Verified claim without reviewer should fail';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 BEGIN
   UPDATE historical_lineage_claims SET object_constructor_id=subject_constructor_id;
   RAISE EXCEPTION 'Self lineage must fail';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
END $$;
ROLLBACK;
SQL

# Entrant lineage claims are independent from constructors and require review.
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
INSERT INTO data_sources(slug,homepage_url,attribution) VALUES ('entrant-lineage-fixture','https://example.org','Test only');
INSERT INTO external_identities(source_id,entity_kind,external_id)
SELECT id,'entrant','lineage-entrant-a' FROM data_sources WHERE slug='entrant-lineage-fixture';
INSERT INTO external_identities(source_id,entity_kind,external_id)
SELECT id,'entrant','lineage-entrant-b' FROM data_sources WHERE slug='entrant-lineage-fixture';
INSERT INTO historical_entrants(external_identity_id,display_name)
SELECT id,'Lineage Entrant A' FROM external_identities WHERE external_id='lineage-entrant-a';
INSERT INTO historical_entrants(external_identity_id,display_name)
SELECT id,'Lineage Entrant B' FROM external_identities WHERE external_id='lineage-entrant-b';
INSERT INTO historical_entrant_lineage_claims(subject_entrant_id,object_entrant_id,relation_type,effective_year,source_url,source_title,source_publisher,evidence_note,accessed_at)
SELECT a.id,b.id,'assets_acquired_by',2018,'https://example.org/evidence','Fixture evidence','Fixture publisher','Test case only',CURRENT_DATE
FROM historical_entrants a CROSS JOIN historical_entrants b
WHERE a.display_name='Lineage Entrant A' AND b.display_name='Lineage Entrant B';
DO $$
BEGIN
 IF (SELECT count(*) FROM historical_entrant_lineage_claims WHERE review_status='proposed') <> 1 THEN
   RAISE EXCEPTION 'Unexpected entrant lineage status';
 END IF;
 BEGIN
   UPDATE historical_entrant_lineage_claims SET review_status='verified';
   RAISE EXCEPTION 'Unreviewed claim accepted';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 BEGIN
   UPDATE historical_entrant_lineage_claims SET object_entrant_id=subject_entrant_id;
   RAISE EXCEPTION 'Self-link accepted';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
END $$;
ROLLBACK;
SQL
