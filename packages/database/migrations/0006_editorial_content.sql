-- Editorial content is distinct from imported race statistics and lineage assertions.
BEGIN;
CREATE TABLE content_articles (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 subject_driver_id BIGINT NOT NULL REFERENCES historical_drivers(id) ON DELETE RESTRICT,
 locale TEXT NOT NULL CHECK (locale IN ('uk','en')),
 slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
 body_markdown TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','published','withdrawn')),
 reviewer TEXT,
 reviewed_at TIMESTAMPTZ,
 published_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE (subject_driver_id, locale),
 UNIQUE (locale, slug),
 CHECK (status <> 'published' OR (length(btrim(body_markdown)) > 0 AND reviewer IS NOT NULL AND length(btrim(reviewer)) > 0 AND reviewed_at IS NOT NULL AND published_at IS NOT NULL))
);
CREATE TABLE content_sources (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_url TEXT NOT NULL UNIQUE CHECK (source_url ~ '^https://[^[:space:]]+$'),
 title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
 publisher TEXT NOT NULL CHECK (length(btrim(publisher)) > 0),
 author TEXT,
 accessed_on DATE NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE content_claims (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 subject_driver_id BIGINT NOT NULL REFERENCES historical_drivers(id) ON DELETE RESTRICT,
 statement TEXT NOT NULL CHECK (length(btrim(statement)) > 0),
 status TEXT NOT NULL DEFAULT 'needs_review' CHECK (status IN ('draft','needs_review','verified','disputed','rejected')),
 reviewer TEXT,
 reviewed_at TIMESTAMPTZ,
 review_note TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (status <> 'verified' OR (reviewer IS NOT NULL AND length(btrim(reviewer)) > 0 AND reviewed_at IS NOT NULL))
);
CREATE INDEX content_claims_subject_idx ON content_claims(subject_driver_id, status);
CREATE TABLE content_claim_evidence (
 claim_id BIGINT NOT NULL REFERENCES content_claims(id) ON DELETE CASCADE,
 source_id BIGINT NOT NULL REFERENCES content_sources(id) ON DELETE RESTRICT,
 locator TEXT NOT NULL CHECK (length(btrim(locator)) > 0),
 supports BOOLEAN NOT NULL,
 PRIMARY KEY (claim_id, source_id, locator)
);
CREATE TABLE content_article_claims (
 article_id BIGINT NOT NULL REFERENCES content_articles(id) ON DELETE CASCADE,
 claim_id BIGINT NOT NULL REFERENCES content_claims(id) ON DELETE RESTRICT,
 PRIMARY KEY (article_id, claim_id)
);
CREATE TABLE content_media_assets (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 subject_driver_id BIGINT REFERENCES historical_drivers(id) ON DELETE RESTRICT,
 source_page_url TEXT NOT NULL UNIQUE CHECK (source_page_url ~ '^https://[^[:space:]]+$'),
 creator TEXT NOT NULL CHECK (length(btrim(creator)) > 0),
 license_name TEXT NOT NULL CHECK (length(btrim(license_name)) > 0),
 license_url TEXT NOT NULL CHECK (license_url ~ '^https://[^[:space:]]+$'),
 attribution TEXT NOT NULL CHECK (length(btrim(attribution)) > 0),
 reviewed_by TEXT,
 reviewed_at TIMESTAMPTZ,
 status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 CHECK (status <> 'approved' OR (reviewed_by IS NOT NULL AND length(btrim(reviewed_by)) > 0 AND reviewed_at IS NOT NULL))
);
-- Publication is additionally gated by the application/editorial workflow:
-- SQL alone cannot prove cited evidence supports the article's prose.
COMMIT;
