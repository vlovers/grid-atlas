-- DBA-only, run after0016. Repeatable. Does not provision individual identities.
-- search_path selects the installation schema (public by default).
\set ON_ERROR_STOP on
SELECT current_schema() AS circuit_schema \gset
BEGIN;
DO $$
DECLARE group_name TEXT;
BEGIN
  FOREACH group_name IN ARRAY ARRAY['grid_circuit_stager','grid_circuit_reviewer','grid_circuit_publisher','grid_circuit_reader'] LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=group_name) THEN
      EXECUTE format('CREATE ROLE %I NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',group_name);
    END IF;
    IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=group_name AND
      (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls))
      OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m JOIN pg_catalog.pg_roles r ON r.oid=m.member WHERE r.rolname=group_name) THEN
      RAISE EXCEPTION 'unsafe circuit group role attributes or inherited membership: %',group_name;
    END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_roles r ON r.oid=c.relowner
    WHERE c.relnamespace=current_schema()::regnamespace AND r.rolname LIKE 'grid_circuit_%') THEN
    RAISE EXCEPTION 'circuit capability roles must not own installation objects';
  END IF;
END $$;
REVOKE CREATE ON SCHEMA :"circuit_schema" FROM PUBLIC,grid_circuit_stager,grid_circuit_reviewer,grid_circuit_publisher,grid_circuit_reader;
GRANT USAGE ON SCHEMA :"circuit_schema" TO grid_circuit_stager,grid_circuit_reviewer,grid_circuit_publisher,grid_circuit_reader;
-- Remove the old0015 broad grants, including column grants, before new grants.
REVOKE ALL ON ALL TABLES IN SCHEMA :"circuit_schema" FROM grid_circuit_stager,grid_circuit_reviewer,grid_circuit_publisher,grid_circuit_reader;
REVOKE UPDATE(status,reviewer,reviewed_at,published_at,review_revision_sha256) ON circuit_editorial_articles
  FROM grid_circuit_stager,grid_circuit_reviewer,grid_circuit_publisher;
REVOKE UPDATE(status,reviewer,reviewed_at) ON circuit_editorial_claims FROM grid_circuit_stager,grid_circuit_reviewer,grid_circuit_publisher;
REVOKE UPDATE(supports) ON circuit_editorial_evidence FROM grid_circuit_reviewer;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA :"circuit_schema" FROM grid_circuit_stager,grid_circuit_reviewer,grid_circuit_publisher,grid_circuit_reader;
GRANT SELECT ON historical_circuits,external_identities,data_sources,content_sources,
  circuit_editorial_articles,circuit_editorial_claims,circuit_editorial_evidence,circuit_editorial_article_claims TO grid_circuit_stager;
GRANT INSERT ON content_sources,circuit_editorial_articles,circuit_editorial_claims,
  circuit_editorial_evidence,circuit_editorial_article_claims TO grid_circuit_stager;
GRANT UPDATE(title,body_markdown,author,status) ON circuit_editorial_articles TO grid_circuit_stager;
GRANT UPDATE(statement,status) ON circuit_editorial_claims TO grid_circuit_stager;
GRANT UPDATE(locator) ON circuit_editorial_evidence TO grid_circuit_stager;
GRANT DELETE ON circuit_editorial_evidence,circuit_editorial_article_claims TO grid_circuit_stager;
GRANT EXECUTE ON FUNCTION circuit_editorial_actor(TEXT),circuit_editorial_in_trusted_operation() TO grid_circuit_stager;
GRANT EXECUTE ON FUNCTION circuit_editorial_inspect(BIGINT) TO grid_circuit_reviewer,grid_circuit_publisher;
GRANT EXECUTE ON FUNCTION circuit_editorial_review(BIGINT,TEXT) TO grid_circuit_reviewer;
GRANT EXECUTE ON FUNCTION circuit_editorial_publish(BIGINT,BIGINT,TEXT),circuit_editorial_withdraw(BIGINT) TO grid_circuit_publisher;
GRANT SELECT ON circuit_editorial_public_articles TO grid_circuit_reader;
GRANT EXECUTE ON FUNCTION circuit_editorial_public_payload(BIGINT) TO grid_circuit_reader;
COMMIT;
-- No GRANT membership and no human identity is asserted here. A DBA must verify
-- each person, register their individual role OID/name+canonical principal, then
-- grant only the required capability. Shared service logins never review/publish.
