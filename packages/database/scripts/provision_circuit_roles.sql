-- DBA-only optional bootstrap, run after migration 0015 in a dedicated database.
-- Never run as the application account. This file grants NO membership to logins.
-- Verify schema name, inherited privileges and individual session_user identities.
BEGIN;
DO $$
BEGIN
  CREATE ROLE grid_circuit_stager NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE ROLE grid_circuit_reviewer NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE ROLE grid_circuit_publisher NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE ROLE grid_circuit_reader NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT USAGE ON SCHEMA public TO grid_circuit_stager,
  grid_circuit_reviewer,grid_circuit_publisher,grid_circuit_reader;

-- Read-only API credentials: no approval or mutation capability.
GRANT SELECT ON public.circuit_editorial_articles,public.circuit_editorial_claims,
  public.circuit_editorial_evidence,public.circuit_editorial_article_claims,
  public.content_sources TO grid_circuit_reader;

-- Untrusted importer: INSERT-only on new content, plus minimal UPDATE columns
-- required by existing invalidation triggers. Migration 0015 rejects attempts
-- to mark claims verified, evidence supported or articles published.
GRANT SELECT ON public.historical_circuits,public.external_identities,
  public.data_sources,public.content_sources,
  public.circuit_editorial_articles,public.circuit_editorial_claims,
  public.circuit_editorial_evidence,public.circuit_editorial_article_claims
  TO grid_circuit_stager;
GRANT INSERT ON public.content_sources,public.circuit_editorial_articles,
  public.circuit_editorial_claims,public.circuit_editorial_evidence,
  public.circuit_editorial_article_claims TO grid_circuit_stager;
GRANT UPDATE(status,reviewer,reviewed_at,published_at)
  ON public.circuit_editorial_articles TO grid_circuit_stager;
GRANT UPDATE(status,reviewer,reviewed_at)
  ON public.circuit_editorial_claims TO grid_circuit_stager;

-- A named reviewer can verify evidence and claims and set a review digest.
-- This is NOT proof of human work: membership must be granted only after
-- external identity verification and a documented review process.
GRANT SELECT ON public.circuit_editorial_articles,public.circuit_editorial_claims,
  public.circuit_editorial_evidence,public.circuit_editorial_article_claims,
  public.content_sources TO grid_circuit_reviewer,grid_circuit_publisher;
GRANT UPDATE(status,reviewer,reviewed_at)
  ON public.circuit_editorial_claims TO grid_circuit_reviewer;
GRANT UPDATE(supports)
  ON public.circuit_editorial_evidence TO grid_circuit_reviewer;
GRANT UPDATE(status,reviewer,reviewed_at,published_at,review_revision_sha256)
  ON public.circuit_editorial_articles TO grid_circuit_reviewer;
GRANT UPDATE(status,reviewer,reviewed_at,published_at)
  ON public.circuit_editorial_articles TO grid_circuit_publisher;
COMMIT;

-- Memberships are deliberately absent. A DBA must explicitly GRANT a role
-- to each unique, authenticated PostgreSQL LOGIN; NEVER grant these roles
-- to shared service accounts, PUBLIC or the import worker. Do not enable
-- CIRCUIT_EDITORIAL_READ_ENABLED without independent human review.
