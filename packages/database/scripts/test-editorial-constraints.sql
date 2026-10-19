-- Negative and positive integrity checks for editorial content.
-- Run against a disposable database after versioned migrations.
BEGIN;
DO $test$
DECLARE
 d BIGINT;
 a BIGINT;
 c BIGINT;
 s BIGINT;
BEGIN
 INSERT INTO data_sources(slug,homepage_url,attribution)
 VALUES('editorial-ci-fixture','https://example.org','Disposable test fixture');
 INSERT INTO external_identities(source_id,entity_kind,external_id)
 SELECT id,'driver','editorial-ci-driver' FROM data_sources WHERE slug='editorial-ci-fixture';
 INSERT INTO historical_drivers(external_identity_id,display_name)
 SELECT id,'Editorial CI Driver' FROM external_identities WHERE external_id='editorial-ci-driver'
 RETURNING id INTO d;
 INSERT INTO content_articles(subject_driver_id,locale,slug,title)
 VALUES(d,'en','editorial-constraint-test','Editorial constraint test') RETURNING id INTO a;
 BEGIN
   UPDATE content_articles SET status='published',body_markdown='Unreviewed article',published_at=now() WHERE id=a;
   RAISE EXCEPTION 'Published article without reviewer';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 INSERT INTO content_claims(subject_driver_id,statement) VALUES(d,'Unreviewed claim') RETURNING id INTO c;
 BEGIN
   UPDATE content_claims SET status='verified' WHERE id=c;
   RAISE EXCEPTION 'Verified claim without reviewer';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 BEGIN
   INSERT INTO content_media_assets(subject_driver_id,source_page_url,creator,license_name,license_url,attribution,status)
   VALUES(d,'https://example.org/editorial-media-test','Photographer','CC BY 4.0','https://creativecommons.org/licenses/by/4.0/','Photographer','approved');
   RAISE EXCEPTION 'Approved media without review';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 INSERT INTO content_sources(source_url,title,publisher,accessed_on)
 VALUES('https://example.org/editorial-source-test','Source test','Test publisher',CURRENT_DATE) RETURNING id INTO s;
 INSERT INTO content_claim_evidence(claim_id,source_id,locator,supports)
 VALUES(c,s,'Page 1',true);
 UPDATE content_claims SET status='verified',reviewer='Test reviewer',reviewed_at=now() WHERE id=c;
 UPDATE content_articles SET status='published',body_markdown='Test article',reviewer='Test reviewer',reviewed_at=now(),published_at=now() WHERE id=a;
 IF (SELECT status FROM content_articles WHERE id=a) <> 'published' THEN
   RAISE EXCEPTION 'Reviewed article could not be published';
 END IF;
END $test$;
ROLLBACK;
