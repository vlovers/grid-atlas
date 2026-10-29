-- Circuit editorial content is deliberately separate from driver biographies.
-- Research drafts are not imported here. No migration grants editorial approval.
BEGIN;

CREATE TABLE circuit_editorial_articles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  circuit_id BIGINT NOT NULL REFERENCES historical_circuits(id) ON DELETE RESTRICT,
  locale TEXT NOT NULL CHECK (locale IN ('uk', 'en')),
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  body_markdown TEXT NOT NULL DEFAULT '',
  author TEXT,
  reviewer TEXT,
  review_method TEXT NOT NULL DEFAULT 'human' CHECK (review_method IN ('human', 'ai')),
  review_revision_sha256 TEXT CHECK (review_revision_sha256 IS NULL OR review_revision_sha256 ~ '^[a-f0-9]{64}$'),
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'published', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (circuit_id, locale),
  UNIQUE (locale, slug),
  CHECK (status <> 'published' OR (
    review_method = 'human' AND review_revision_sha256 IS NOT NULL
    AND length(btrim(body_markdown)) > 0
    AND author IS NOT NULL AND length(btrim(author)) > 0
    AND reviewer IS NOT NULL AND length(btrim(reviewer)) > 0
    AND lower(btrim(author)) <> lower(btrim(reviewer))
    AND reviewed_at IS NOT NULL AND published_at IS NOT NULL
  ))
);

CREATE TABLE circuit_editorial_claims (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  circuit_id BIGINT NOT NULL REFERENCES historical_circuits(id) ON DELETE RESTRICT,
  statement TEXT NOT NULL CHECK (length(btrim(statement)) > 0),
  status TEXT NOT NULL DEFAULT 'needs_review' CHECK (status IN ('draft', 'needs_review', 'verified', 'disputed', 'rejected')),
  review_method TEXT NOT NULL DEFAULT 'human' CHECK (review_method IN ('human', 'ai')),
  reviewer TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status <> 'verified' OR (
    review_method = 'human' AND reviewer IS NOT NULL
    AND length(btrim(reviewer)) > 0 AND reviewed_at IS NOT NULL
  ))
);
CREATE INDEX circuit_editorial_claims_circuit_idx ON circuit_editorial_claims(circuit_id, status);

CREATE TABLE circuit_editorial_evidence (
  claim_id BIGINT NOT NULL REFERENCES circuit_editorial_claims(id) ON DELETE CASCADE,
  source_id BIGINT NOT NULL REFERENCES content_sources(id) ON DELETE RESTRICT,
  locator TEXT NOT NULL CHECK (length(btrim(locator)) > 0),
  supports BOOLEAN NOT NULL,
  PRIMARY KEY (claim_id, source_id, locator)
);

CREATE TABLE circuit_editorial_article_claims (
  article_id BIGINT NOT NULL REFERENCES circuit_editorial_articles(id) ON DELETE CASCADE,
  claim_id BIGINT NOT NULL REFERENCES circuit_editorial_claims(id) ON DELETE RESTRICT,
  PRIMARY KEY (article_id, claim_id)
);

CREATE FUNCTION circuit_editorial_invalidate_article() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.circuit_id IS DISTINCT FROM OLD.circuit_id THEN
    RAISE EXCEPTION 'circuit article identity is immutable';
  END IF;
  IF (NEW.locale, NEW.slug, NEW.title, NEW.body_markdown, NEW.author,
      NEW.review_method, NEW.review_revision_sha256)
     IS DISTINCT FROM
     (OLD.locale, OLD.slug, OLD.title, OLD.body_markdown, OLD.author,
      OLD.review_method, OLD.review_revision_sha256) THEN
    NEW.status := 'draft';
    NEW.reviewer := NULL;
    NEW.reviewed_at := NULL;
    NEW.published_at := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER circuit_article_10_invalidate
  BEFORE UPDATE ON circuit_editorial_articles
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_invalidate_article();

CREATE FUNCTION circuit_editorial_gate_article() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' THEN
    IF NOT EXISTS (
      SELECT 1 FROM circuit_editorial_article_claims ac WHERE ac.article_id = NEW.id
    ) OR EXISTS (
      SELECT 1 FROM circuit_editorial_article_claims ac
      JOIN circuit_editorial_claims c ON c.id = ac.claim_id
      WHERE ac.article_id = NEW.id AND (
        c.circuit_id <> NEW.circuit_id OR c.status <> 'verified'
        OR c.review_method <> 'human' OR c.reviewer IS NULL OR c.reviewed_at IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM circuit_editorial_evidence e
          WHERE e.claim_id = c.id AND e.supports = true
        )
      )
    ) THEN
      RAISE EXCEPTION 'circuit publication requires linked, independently reviewed and supported claims';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER circuit_article_20_gate
  BEFORE INSERT OR UPDATE ON circuit_editorial_articles
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_gate_article();

CREATE FUNCTION circuit_editorial_invalidate_linked_articles(claim BIGINT) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE circuit_editorial_articles SET status = 'draft', reviewer = NULL,
    reviewed_at = NULL, published_at = NULL
  WHERE id IN (SELECT article_id FROM circuit_editorial_article_claims WHERE claim_id = claim);
END;
$$;

CREATE FUNCTION circuit_editorial_invalidate_claim() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.circuit_id IS DISTINCT FROM OLD.circuit_id THEN
    RAISE EXCEPTION 'circuit claim identity is immutable';
  END IF;
  IF (NEW.statement, NEW.status, NEW.review_method, NEW.reviewer, NEW.reviewed_at)
     IS DISTINCT FROM
     (OLD.statement, OLD.status, OLD.review_method, OLD.reviewer, OLD.reviewed_at) THEN
    IF NEW.statement IS DISTINCT FROM OLD.statement OR NEW.review_method IS DISTINCT FROM OLD.review_method THEN
      NEW.status := 'needs_review';
      NEW.reviewer := NULL;
      NEW.reviewed_at := NULL;
    END IF;
    PERFORM circuit_editorial_invalidate_linked_articles(OLD.id);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER circuit_claim_invalidate
  BEFORE UPDATE ON circuit_editorial_claims
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_invalidate_claim();

CREATE FUNCTION circuit_editorial_evidence_changed() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.claim_id <> OLD.claim_id THEN
    RAISE EXCEPTION 'move evidence with delete and insert';
  END IF;
  UPDATE circuit_editorial_claims SET status = 'needs_review',
    reviewer = NULL, reviewed_at = NULL
  WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.claim_id ELSE NEW.claim_id END;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER circuit_evidence_invalidate
  AFTER INSERT OR UPDATE OR DELETE ON circuit_editorial_evidence
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_evidence_changed();

CREATE FUNCTION circuit_editorial_link_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN RAISE EXCEPTION 'relink with delete and insert'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM circuit_editorial_articles a
    JOIN circuit_editorial_claims c ON c.circuit_id = a.circuit_id
    WHERE a.id = NEW.article_id AND c.id = NEW.claim_id
  ) THEN RAISE EXCEPTION 'cross-circuit claim link rejected'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER circuit_link_guard
  BEFORE INSERT OR UPDATE ON circuit_editorial_article_claims
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_link_guard();

CREATE FUNCTION circuit_editorial_links_changed() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE circuit_editorial_articles SET status = 'draft', reviewer = NULL,
    reviewed_at = NULL, published_at = NULL
  WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.article_id ELSE NEW.article_id END;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER circuit_links_invalidate
  AFTER INSERT OR DELETE ON circuit_editorial_article_claims
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_links_changed();

-- Source provenance edits invalidate reviews; source metadata is not immutable.
CREATE FUNCTION circuit_editorial_source_changed() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.source_url, NEW.title, NEW.publisher, NEW.author, NEW.accessed_on)
     IS DISTINCT FROM
     (OLD.source_url, OLD.title, OLD.publisher, OLD.author, OLD.accessed_on) THEN
    UPDATE circuit_editorial_claims SET status = 'needs_review',
      reviewer = NULL, reviewed_at = NULL
    WHERE id IN (SELECT claim_id FROM circuit_editorial_evidence WHERE source_id = NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER circuit_source_invalidate
  AFTER UPDATE ON content_sources
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_source_changed();

-- No research draft import, automatic approval, or photo publication in this migration.
COMMIT;
