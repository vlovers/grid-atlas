-- Review signatures are tied to the exact content that was reviewed.
-- Forward-only: never modify migration 0006 after deployment.
BEGIN;

CREATE OR REPLACE FUNCTION editorial_invalidate_article_review()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.title, NEW.body_markdown, NEW.subject_driver_id, NEW.locale, NEW.slug)
     IS DISTINCT FROM
     (OLD.title, OLD.body_markdown, OLD.subject_driver_id, OLD.locale, OLD.slug) THEN
    NEW.reviewer := NULL;
    NEW.reviewed_at := NULL;
    NEW.published_at := NULL;
    NEW.status := 'draft';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER editorial_article_review_invalidation
BEFORE UPDATE ON content_articles
FOR EACH ROW EXECUTE FUNCTION editorial_invalidate_article_review();

CREATE OR REPLACE FUNCTION editorial_invalidate_claim_review()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.statement, NEW.subject_driver_id)
     IS DISTINCT FROM (OLD.statement, OLD.subject_driver_id) THEN
    NEW.reviewer := NULL;
    NEW.reviewed_at := NULL;
    NEW.status := 'needs_review';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER editorial_claim_review_invalidation
BEFORE UPDATE ON content_claims
FOR EACH ROW EXECUTE FUNCTION editorial_invalidate_claim_review();

-- Removing or adding evidence changes the reviewed claim's basis.
CREATE OR REPLACE FUNCTION editorial_invalidate_evidence_review()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE content_claims SET status = 'needs_review',
    reviewer = NULL, reviewed_at = NULL
  WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.claim_id ELSE NEW.claim_id END;
  IF TG_OP = 'UPDATE' AND OLD.claim_id IS DISTINCT FROM NEW.claim_id THEN
    UPDATE content_claims SET status = 'needs_review',
      reviewer = NULL, reviewed_at = NULL WHERE id = OLD.claim_id;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER editorial_evidence_review_invalidation
AFTER INSERT OR UPDATE OR DELETE ON content_claim_evidence
FOR EACH ROW EXECUTE FUNCTION editorial_invalidate_evidence_review();

-- Re-associating claims with an article invalidates the article approval.
CREATE OR REPLACE FUNCTION editorial_invalidate_article_claims_review()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE content_articles SET status = 'draft', reviewer = NULL,
    reviewed_at = NULL, published_at = NULL
  WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.article_id ELSE NEW.article_id END;
  IF TG_OP = 'UPDATE' AND OLD.article_id IS DISTINCT FROM NEW.article_id THEN
    UPDATE content_articles SET status = 'draft', reviewer = NULL,
      reviewed_at = NULL, published_at = NULL WHERE id = OLD.article_id;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER editorial_article_claims_review_invalidation
AFTER INSERT OR UPDATE OR DELETE ON content_article_claims
FOR EACH ROW EXECUTE FUNCTION editorial_invalidate_article_claims_review();

COMMIT;
