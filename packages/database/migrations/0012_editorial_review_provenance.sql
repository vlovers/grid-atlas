-- Record review provenance separately from the legacy reviewer string.
-- Existing published articles remain on the human-review lane.
-- AI-assisted reviews must not be silently promoted into the legacy publication path.
BEGIN;

ALTER TABLE content_articles
  ADD COLUMN review_method TEXT NOT NULL DEFAULT 'human'
    CHECK (review_method IN ('human', 'ai')),
  ADD COLUMN review_revision_sha256 TEXT
    CHECK (review_revision_sha256 IS NULL OR review_revision_sha256 ~ '^[a-f0-9]{64}$');

-- No AI-reviewed article may be published until a separate, evidence-audited
-- publication workflow is implemented. Metadata alone is not authorization.
ALTER TABLE content_articles
  ADD CONSTRAINT content_ai_publication_requires_dedicated_gate
    CHECK (review_method <> 'ai' OR status <> 'published');

-- A review-method or revision change must invalidate prior approval.
CREATE OR REPLACE FUNCTION editorial_invalidate_article_review()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.title, NEW.body_markdown, NEW.subject_driver_id, NEW.locale, NEW.slug,
      NEW.review_method, NEW.review_revision_sha256)
     IS DISTINCT FROM
     (OLD.title, OLD.body_markdown, OLD.subject_driver_id, OLD.locale, OLD.slug,
      OLD.review_method, OLD.review_revision_sha256) THEN
    NEW.reviewer := NULL;
    NEW.reviewed_at := NULL;
    NEW.published_at := NULL;
    NEW.status := 'draft';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

COMMIT;
