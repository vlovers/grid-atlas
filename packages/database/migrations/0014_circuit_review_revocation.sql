-- Forward-only hardening for circuit editorial withdrawal and review transitions.
-- A revoked approval must never become publishable merely by flipping status.
-- This migration replaces functions from 0013; it does not modify historical migrations.
BEGIN;

CREATE OR REPLACE FUNCTION circuit_editorial_invalidate_article() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.circuit_id IS DISTINCT FROM OLD.circuit_id THEN
    RAISE EXCEPTION 'circuit article identity is immutable';
  END IF;

  IF (NEW.locale, NEW.slug, NEW.title, NEW.body_markdown, NEW.author,
      NEW.review_method, NEW.review_revision_sha256)
     IS DISTINCT FROM
     (OLD.locale, OLD.slug, OLD.title, OLD.body_markdown, OLD.author,
      OLD.review_method, OLD.review_revision_sha256)
     OR (OLD.status = 'published' AND
       (NEW.reviewer, NEW.reviewed_at, NEW.published_at)
       IS DISTINCT FROM (OLD.reviewer, OLD.reviewed_at, OLD.published_at)) THEN
    NEW.status := 'draft';
    NEW.reviewer := NULL;
    NEW.reviewed_at := NULL;
    NEW.published_at := NULL;
  END IF;

  -- Preserve explicit withdrawn/in_review status but erase the previous approval.
  IF OLD.status = 'published' AND NEW.status <> 'published' THEN
    NEW.reviewer := NULL;
    NEW.reviewed_at := NULL;
    NEW.published_at := NULL;
  END IF;

  -- Reject a status-only promotion from an old review, even if its digest still
  -- matches the body. A new human decision is still required outside SQL.
  IF NEW.status = 'published' AND OLD.status <> 'published'
     AND (NEW.reviewer IS NOT DISTINCT FROM OLD.reviewer
       OR NEW.reviewed_at IS NOT DISTINCT FROM OLD.reviewed_at
       OR NEW.published_at IS NOT DISTINCT FROM OLD.published_at) THEN
    RAISE EXCEPTION 'circuit publication requires a fresh review transition';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION circuit_editorial_invalidate_claim() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.circuit_id IS DISTINCT FROM OLD.circuit_id THEN
    RAISE EXCEPTION 'circuit claim identity is immutable';
  END IF;

  -- Changing the evidence-backed statement or review method revokes review.
  IF NEW.statement IS DISTINCT FROM OLD.statement
     OR NEW.review_method IS DISTINCT FROM OLD.review_method THEN
    NEW.status := 'needs_review';
    NEW.reviewer := NULL;
    NEW.reviewed_at := NULL;
  END IF;

  -- A verified claim cannot retain its approval when the reviewer or review
  -- timestamp is relabelled. Explicit dispute/rejection also clears approval.
  IF OLD.status = 'verified' AND NEW.status <> 'verified' THEN
    NEW.reviewer := NULL;
    NEW.reviewed_at := NULL;
  ELSIF OLD.status = 'verified' AND NEW.status = 'verified'
     AND (NEW.reviewer, NEW.reviewed_at)
       IS DISTINCT FROM (OLD.reviewer, OLD.reviewed_at) THEN
    NEW.status := 'needs_review';
    NEW.reviewer := NULL;
    NEW.reviewed_at := NULL;
  END IF;

  IF NEW.status = 'verified' AND OLD.status <> 'verified'
     AND (NEW.reviewer IS NOT DISTINCT FROM OLD.reviewer
       OR NEW.reviewed_at IS NOT DISTINCT FROM OLD.reviewed_at) THEN
    RAISE EXCEPTION 'circuit claim requires a fresh review transition';
  END IF;

  IF (NEW.statement, NEW.status, NEW.review_method, NEW.reviewer, NEW.reviewed_at)
     IS DISTINCT FROM
     (OLD.statement, OLD.status, OLD.review_method, OLD.reviewer, OLD.reviewed_at) THEN
    PERFORM circuit_editorial_invalidate_linked_articles(OLD.id);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- The existing BEFORE UPDATE triggers retain their names and call the replaced
-- functions. No data is approved, imported, or made public by this migration.
COMMIT;
