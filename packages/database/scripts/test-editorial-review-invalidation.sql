-- Disposable migrated database; all fixtures rolled back.
BEGIN;
DO $$
DECLARE d bigint; a bigint; c bigint; s bigint;
BEGIN
 INSERT INTO data_sources(slug,homepage_url,attribution)
 VALUES ('editorial-review-fixture','https://example.org','Temporary fixture');
 INSERT INTO external_identities(source_id,entity_kind,external_id)
 SELECT id,'driver','review-fixture' FROM data_sources WHERE slug='editorial-review-fixture';
 INSERT INTO historical_drivers(external_identity_id,display_name)
 SELECT id,'Review Fixture' FROM external_identities WHERE external_id='review-fixture'
 RETURNING id INTO d;
 INSERT INTO content_articles(subject_driver_id,locale,slug,title,body_markdown)
 VALUES(d,'en','review-fixture','Original','Original body') RETURNING id INTO a;
 INSERT INTO content_claims(subject_driver_id,statement)
 VALUES(d,'Original claim') RETURNING id INTO c;
 INSERT INTO content_sources(source_url,title,publisher,accessed_on)
 VALUES('https://example.org/review-fixture','Source','Example',CURRENT_DATE) RETURNING id INTO s;
 INSERT INTO content_claim_evidence(claim_id,source_id,locator,supports)
 VALUES(c,s,'paragraph 1',true);
 UPDATE content_claims SET status='verified',reviewer='Editor',reviewed_at=now() WHERE id=c;
 INSERT INTO content_article_claims(article_id,claim_id) VALUES(a,c);
 UPDATE content_articles SET status='published',reviewer='Editor',reviewed_at=now(),published_at=now() WHERE id=a;
 UPDATE content_articles SET body_markdown='Changed after review' WHERE id=a;
 IF EXISTS (SELECT 1 FROM content_articles WHERE id=a AND (status <> 'draft' OR reviewer IS NOT NULL OR reviewed_at IS NOT NULL OR published_at IS NOT NULL)) THEN
  RAISE EXCEPTION 'Article edit retained publication approval';
 END IF;
 UPDATE content_articles SET status='published',reviewer='Editor',reviewed_at=now(),published_at=now() WHERE id=a;
 UPDATE content_claims SET statement='Changed claim' WHERE id=c;
 IF EXISTS (SELECT 1 FROM content_claims WHERE id=c AND (status <> 'needs_review' OR reviewer IS NOT NULL)) THEN
  RAISE EXCEPTION 'Claim edit retained verification';
 END IF;
 UPDATE content_claims SET status='verified',reviewer='Editor',reviewed_at=now() WHERE id=c;
 DELETE FROM content_claim_evidence WHERE claim_id=c;
 IF EXISTS (SELECT 1 FROM content_claims WHERE id=c AND status='verified') THEN
  RAISE EXCEPTION 'Evidence deletion retained verification';
 END IF;
 DELETE FROM content_article_claims WHERE article_id=a AND claim_id=c;
 IF EXISTS (SELECT 1 FROM content_articles WHERE id=a AND status='published') THEN
  RAISE EXCEPTION 'Claim unlink retained publication';
 END IF;
END $$;
ROLLBACK;
