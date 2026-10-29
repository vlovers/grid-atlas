-- Forward-only circuit editorial approval boundary. No reviewer grants or releases.
BEGIN;
CREATE FUNCTION circuit_editorial_actor_allowed(required_role TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
 SELECT EXISTS (SELECT 1 FROM pg_roles a WHERE a.rolname=session_user AND a.rolsuper)
 OR EXISTS (SELECT 1 FROM pg_roles r WHERE r.rolname=required_role
   AND pg_has_role(session_user,r.rolname,'member'));
$$;
CREATE FUNCTION circuit_editorial_authorize_article() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.status='published' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
   IF NOT circuit_editorial_actor_allowed('grid_circuit_publisher') THEN
     RAISE EXCEPTION 'trusted circuit publisher role required';
   END IF;
   IF NEW.reviewer IS DISTINCT FROM session_user THEN
     RAISE EXCEPTION 'circuit reviewer must match authenticated database session';
   END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER circuit_article_05_authorize BEFORE INSERT OR UPDATE ON circuit_editorial_articles
 FOR EACH ROW EXECUTE FUNCTION circuit_editorial_authorize_article();
CREATE FUNCTION circuit_editorial_authorize_claim() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.status='verified' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
   IF NOT circuit_editorial_actor_allowed('grid_circuit_reviewer') THEN
     RAISE EXCEPTION 'trusted circuit reviewer role required';
   END IF;
   IF NEW.reviewer IS DISTINCT FROM session_user THEN
     RAISE EXCEPTION 'claim reviewer must match authenticated database session';
   END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER circuit_claim_05_authorize BEFORE INSERT OR UPDATE ON circuit_editorial_claims
 FOR EACH ROW EXECUTE FUNCTION circuit_editorial_authorize_claim();
CREATE FUNCTION circuit_editorial_authorize_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.supports=true AND (TG_OP='INSERT' OR OLD.supports IS DISTINCT FROM NEW.supports) THEN
   IF NOT circuit_editorial_actor_allowed('grid_circuit_reviewer') THEN
     RAISE EXCEPTION 'trusted circuit reviewer role required for evidence support';
   END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER circuit_evidence_05_authorize BEFORE INSERT OR UPDATE ON circuit_editorial_evidence
 FOR EACH ROW EXECUTE FUNCTION circuit_editorial_authorize_evidence();
REVOKE ALL ON circuit_editorial_articles,circuit_editorial_claims,
 circuit_editorial_evidence,circuit_editorial_article_claims FROM PUBLIC;
-- Only a DBA may provision memberships for distinct human PostgreSQL logins.
-- Superusers can bypass database authorization; never use them for application traffic.
COMMIT;
