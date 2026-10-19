-- Synthetic fixtures only. Never import these as historical facts.
  INSERT INTO data_sources(slug,homepage_url,attribution)
    VALUES ('synthetic','https://example.org','Synthetic fixtures; no historical claims');
  INSERT INTO external_identities(source_id,entity_kind,external_id)
    SELECT 1,k.kind,v.ident FROM (VALUES ('constructor'),('entrant')) k(kind)
    CROSS JOIN (VALUES ('alpha'),('beta')) v(ident);
  INSERT INTO historical_constructors(external_identity_id,display_name)
    SELECT id,external_id FROM external_identities WHERE entity_kind='constructor';
  INSERT INTO historical_entrants(external_identity_id,display_name)
    SELECT id,external_id FROM external_identities WHERE entity_kind='entrant';
  INSERT INTO external_identities(source_id,entity_kind,external_id)
    VALUES (1,'driver','driver-a'),(1,'driver','driver-b'),(1,'race','shared-car-race');
  INSERT INTO historical_drivers(external_identity_id,display_name)
    SELECT id,external_id FROM external_identities WHERE entity_kind='driver';
  INSERT INTO source_releases(source_id,release_tag,artifact_name,sha256)
    VALUES (1,'vfixture','fixture.json',repeat('a',64));
  INSERT INTO external_identities(source_id,entity_kind,external_id)
    VALUES (1,'circuit','circuit-fixture'),(1,'circuit','unused-circuit');
  INSERT INTO historical_circuits(external_identity_id,display_name)
    SELECT id,CASE WHEN external_id='circuit-fixture' THEN '100%_ Test Circuit' ELSE 'Unused Circuit' END
    FROM external_identities WHERE entity_kind='circuit' ORDER BY id;
  INSERT INTO historical_seasons(year) VALUES (1950),(1951);
  INSERT INTO historical_races(external_identity_id,season_year,round,official_name,circuit_id,race_date)
    SELECT id,1950,1,'Synthetic shared-car race',1,'1950-05-13' FROM external_identities WHERE entity_kind='race';
  INSERT INTO historical_race_results(race_id,driver_id,constructor_id,position_display_order,
    position_number,position_text,driver_number,points,shared_car)
    VALUES (1,1,1,1,1,'1','2',4,true),(1,2,1,2,1,'1','2',4,true);
INSERT INTO historical_lineage_claims(subject_constructor_id,object_constructor_id,relation_type,
  effective_year,source_url,source_title,source_publisher,evidence_note,accessed_at,review_status,reviewer,reviewed_at)
SELECT 1,2,'renamed_to',2000,'https://example.org/constructor/'||status,status||' fixture',
  'Synthetic integration fixture','No historical assertion',CURRENT_DATE,status,
  CASE WHEN status='proposed' THEN NULL ELSE 'synthetic-test-reviewer' END,
  CASE WHEN status='proposed' THEN NULL ELSE now() END
FROM (VALUES ('proposed'),('verified'),('rejected')) statuses(status);
INSERT INTO historical_entrant_lineage_claims(subject_entrant_id,object_entrant_id,relation_type,
  effective_year,source_url,source_title,source_publisher,evidence_note,accessed_at,review_status,reviewer,reviewed_at)
SELECT 1,2,'renamed_to',2000,'https://example.org/entrant/'||status,status||' fixture',
  'Synthetic integration fixture','No historical assertion',CURRENT_DATE,status,
  CASE WHEN status='proposed' THEN NULL ELSE 'synthetic-test-reviewer' END,
  CASE WHEN status='proposed' THEN NULL ELSE now() END
FROM (VALUES ('proposed'),('verified'),('rejected')) statuses(status);
