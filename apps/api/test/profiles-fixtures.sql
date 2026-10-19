-- Entirely synthetic. Deliberately awkward chronology and overlapping identities.
INSERT INTO data_sources(slug, homepage_url, attribution)
VALUES ('synthetic', 'https://example.org/profiles', 'Synthetic profile fixtures'),
       ('other', 'https://example.org/other', 'Unrelated source');
INSERT INTO external_identities(source_id, entity_kind, external_id)
VALUES (1,'driver','alpha'), (1,'driver','beta'), (1,'driver','empty'),
       (1,'constructor','alpha'), (1,'constructor','beta'), (1,'constructor','empty'),
       (1,'entrant','alpha'), (1,'race','later'), (1,'race','middle'), (1,'race','first'),
       (1,'driver','large');
INSERT INTO historical_drivers(external_identity_id, display_name)
SELECT id, external_id FROM external_identities WHERE entity_kind='driver' AND external_id!='large' ORDER BY id;
INSERT INTO historical_drivers(id, external_identity_id, display_name) OVERRIDING SYSTEM VALUE
SELECT 9007199254740993, id, 'Large ID' FROM external_identities WHERE entity_kind='driver' AND external_id='large';
INSERT INTO historical_constructors(external_identity_id, display_name)
SELECT id, external_id FROM external_identities WHERE entity_kind='constructor' ORDER BY id;
INSERT INTO historical_entrants(external_identity_id, display_name)
SELECT id, 'Separate entrant alpha' FROM external_identities WHERE entity_kind='entrant';
INSERT INTO historical_seasons(year) VALUES (1950),(1951),(1952);
INSERT INTO historical_races(external_identity_id, season_year, round, race_date, official_name)
VALUES (8,1952,2,NULL,'Synthetic last race'),
       (9,1950,2,'1950-01-01','Synthetic middle race'),
       (10,1950,1,'1950-12-31','Synthetic first race');
INSERT INTO historical_race_results(race_id,driver_id,constructor_id,position_display_order,
  position_number,position_text,driver_number,points,shared_car,reason_retired)
VALUES (3,1,1,1,NULL,'DNS','1',NULL,false,'Did not start'),
       (2,1,1,1,1,'1','1',4,true,NULL),
       (2,2,1,2,1,'1','1',4,true,NULL),
       (2,1,2,3,3,'3','2',NULL,true,NULL),
       (1,1,2,1,1,'1','2',0,false,NULL);
INSERT INTO source_releases(source_id,release_tag,artifact_name,sha256)
VALUES (1,'vfixture','profiles.json',repeat('a',64)),
       (1,'unobserved','not-imported.json',repeat('b',64)),
       (2,'unrelated','other.json',repeat('c',64));
INSERT INTO source_observations(release_id,external_identity_id,content_hash)
VALUES (1,1,repeat('d',64)), (1,4,repeat('e',64)), (3,1,repeat('f',64));
