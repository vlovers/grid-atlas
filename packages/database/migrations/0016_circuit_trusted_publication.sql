-- Forward-only trusted circuit workflow. No memberships, actors or approvals seeded.
BEGIN;

DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname=current_schema() AND c.relname IN ('circuit_editorial_articles','circuit_editorial_claims',
      'circuit_editorial_evidence','circuit_editorial_article_claims')
      AND c.relowner<>(SELECT oid FROM pg_catalog.pg_roles WHERE rolname=current_user)) THEN
    RAISE EXCEPTION 'run trusted circuit migration as the existing table owner';
  END IF;
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n,LATERAL pg_catalog.aclexplode(n.nspacl) acl
    WHERE n.nspname=current_schema() AND acl.privilege_type='CREATE' AND acl.grantee<>0
      AND acl.grantee NOT IN (n.nspowner,(SELECT oid FROM pg_catalog.pg_roles WHERE rolname=current_user),
        (SELECT datdba FROM pg_catalog.pg_database WHERE datname=current_database()))) THEN
    RAISE EXCEPTION 'remove untrusted CREATE privileges from circuit installation schema first';
  END IF;
END $$;

CREATE TABLE circuit_editorial_principals (
  principal_id TEXT PRIMARY KEY CHECK (principal_id ~ '^[a-z0-9][a-z0-9._-]{0,127}$'),
  display_name TEXT NOT NULL CHECK (length(btrim(display_name)) > 0),
  active BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE circuit_editorial_logins (
  role_oid OID PRIMARY KEY,
  role_name NAME NOT NULL UNIQUE,
  principal_id TEXT NOT NULL REFERENCES circuit_editorial_principals ON DELETE RESTRICT,
  active BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE circuit_editorial_articles
  ADD COLUMN author_principal TEXT REFERENCES circuit_editorial_principals ON DELETE RESTRICT,
  ADD COLUMN review_generation BIGINT NOT NULL DEFAULT 0 CHECK (review_generation >= 0),
  ADD COLUMN trusted_review_id BIGINT;
ALTER TABLE circuit_editorial_claims
  ADD COLUMN author_principal TEXT REFERENCES circuit_editorial_principals ON DELETE RESTRICT;
CREATE TABLE circuit_editorial_contributors (
  entity_kind TEXT NOT NULL CHECK (entity_kind IN ('article','claim','source')),
  entity_id BIGINT NOT NULL,
  principal_id TEXT NOT NULL REFERENCES circuit_editorial_principals ON DELETE RESTRICT,
  PRIMARY KEY(entity_kind,entity_id,principal_id)
);
CREATE TABLE circuit_editorial_reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  article_id BIGINT NOT NULL REFERENCES circuit_editorial_articles ON DELETE CASCADE,
  generation BIGINT NOT NULL,
  revision_sha256 TEXT NOT NULL CHECK (revision_sha256 ~ '^[a-f0-9]{64}$'),
  body_sha256 TEXT NOT NULL CHECK (body_sha256 ~ '^[a-f0-9]{64}$'),
  reviewer_principal TEXT NOT NULL REFERENCES circuit_editorial_principals ON DELETE RESTRICT,
  reviewer_oid OID NOT NULL,
  reviewer_login NAME NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  publisher_principal TEXT REFERENCES circuit_editorial_principals ON DELETE RESTRICT,
  publisher_oid OID,
  publisher_login NAME,
  published_at TIMESTAMPTZ,
  CHECK ((publisher_principal IS NULL AND publisher_oid IS NULL AND publisher_login IS NULL AND published_at IS NULL)
    OR (publisher_principal IS NOT NULL AND publisher_oid IS NOT NULL AND publisher_login IS NOT NULL AND published_at IS NOT NULL))
);
ALTER TABLE circuit_editorial_articles ADD CONSTRAINT circuit_trusted_review_fk
  FOREIGN KEY (trusted_review_id) REFERENCES circuit_editorial_reviews ON DELETE RESTRICT;

DROP TRIGGER circuit_article_05_authorize ON circuit_editorial_articles;
DROP TRIGGER circuit_article_10_invalidate ON circuit_editorial_articles;
DROP TRIGGER circuit_article_20_gate ON circuit_editorial_articles;
DROP TRIGGER circuit_claim_05_authorize ON circuit_editorial_claims;
DROP TRIGGER circuit_claim_invalidate ON circuit_editorial_claims;
DROP TRIGGER circuit_evidence_05_authorize ON circuit_editorial_evidence;
DROP TRIGGER circuit_evidence_invalidate ON circuit_editorial_evidence;
DROP TRIGGER circuit_link_guard ON circuit_editorial_article_claims;
DROP TRIGGER circuit_links_invalidate ON circuit_editorial_article_claims;
DROP TRIGGER circuit_source_invalidate ON content_sources;

-- Legacy asserted metadata is not a trusted receipt. Preserve every manuscript.
UPDATE circuit_editorial_articles SET status=CASE WHEN status='published' THEN 'draft' ELSE status END,
  reviewer=NULL,reviewed_at=NULL,published_at=NULL,review_revision_sha256=NULL;
UPDATE circuit_editorial_claims SET status=CASE WHEN status='verified' THEN 'needs_review' ELSE status END,
  reviewer=NULL,reviewed_at=NULL;
UPDATE circuit_editorial_evidence SET supports=false;

CREATE FUNCTION circuit_editorial_write_lock() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(396, 1);
  IF TG_TABLE_NAME IN ('circuit_editorial_articles','circuit_editorial_claims','circuit_editorial_evidence','circuit_editorial_article_claims') THEN
    IF NOT circuit_editorial_in_trusted_operation() THEN
      PERFORM circuit_editorial_actor('grid_circuit_stager');
    END IF;
  END IF;
  RETURN NULL;
END $$;

-- All review/read operations share one current trust predicate.
CREATE FUNCTION circuit_editorial_login_valid(login_oid OID, login_name NAME, principal TEXT, capability TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS(SELECT 1 FROM circuit_editorial_logins l JOIN circuit_editorial_principals p USING(principal_id)
    JOIN pg_catalog.pg_roles r ON r.oid=l.role_oid AND r.rolname=l.role_name
    JOIN pg_catalog.pg_roles g ON g.rolname=capability
    JOIN pg_catalog.pg_class protected ON protected.oid='circuit_editorial_articles'::regclass
    JOIN pg_catalog.pg_namespace ns ON ns.oid=protected.relnamespace
    JOIN pg_catalog.pg_database db ON db.datname=current_database()
    WHERE l.role_oid=login_oid AND l.role_name=login_name AND l.principal_id=principal
      AND l.active AND p.active AND r.rolcanlogin AND NOT r.rolsuper AND NOT r.rolcreaterole
      AND NOT r.rolcreatedb AND NOT r.rolreplication AND NOT r.rolbypassrls
      AND NOT g.rolcanlogin AND NOT g.rolsuper AND NOT g.rolcreaterole AND NOT g.rolcreatedb
      AND NOT g.rolreplication AND NOT g.rolbypassrls AND pg_catalog.pg_has_role(r.oid,g.oid,'MEMBER')
      AND NOT pg_catalog.pg_has_role(r.oid,protected.relowner,'MEMBER')
      AND NOT pg_catalog.pg_has_role(r.oid,ns.nspowner,'MEMBER')
      AND NOT pg_catalog.pg_has_role(r.oid,db.datdba,'MEMBER')
      AND NOT pg_catalog.has_schema_privilege(r.oid,ns.oid,'CREATE')
      AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles dangerous WHERE dangerous.rolname IN
        ('pg_write_all_data','pg_read_server_files','pg_write_server_files','pg_execute_server_program','pg_signal_backend')
        AND pg_catalog.pg_has_role(r.oid,dangerous.oid,'MEMBER')))
$$;

-- session_user is the authenticated connection, never a request field/SET ROLE.
CREATE FUNCTION circuit_editorial_actor(required_group TEXT) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE subject TEXT;
BEGIN
  IF required_group NOT IN ('grid_circuit_stager','grid_circuit_reviewer','grid_circuit_publisher') THEN
    RAISE EXCEPTION 'invalid circuit capability' USING ERRCODE='42501';
  END IF;
  SELECT l.principal_id INTO subject FROM circuit_editorial_logins l
    WHERE l.role_name=session_user AND circuit_editorial_login_valid(l.role_oid,l.role_name,l.principal_id,required_group);
  IF subject IS NULL THEN
    RAISE EXCEPTION 'registered individual circuit actor and capability required' USING ERRCODE='42501';
  END IF;
  RETURN subject;
END $$;

-- Invoker helper: only a SECURITY DEFINER operation owned by the table owner
-- may change approval fields. Group membership alone never allows table approval.
CREATE FUNCTION circuit_editorial_in_trusted_operation() RETURNS BOOLEAN LANGUAGE sql AS $$
  SELECT current_user = pg_catalog.pg_get_userbyid(c.relowner)
  FROM pg_catalog.pg_class c WHERE c.oid='circuit_editorial_articles'::regclass
$$;

CREATE FUNCTION circuit_editorial_guard_approval() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT circuit_editorial_in_trusted_operation() THEN
    IF TG_TABLE_NAME='circuit_editorial_articles' THEN
      IF (NEW.status='published' AND (TG_OP='INSERT' OR OLD.status<>'published'))
        OR (TG_OP='INSERT' AND NEW.trusted_review_id IS NOT NULL)
        OR (TG_OP='INSERT' AND (NEW.reviewer IS NOT NULL OR NEW.reviewed_at IS NOT NULL
          OR NEW.published_at IS NOT NULL OR NEW.review_revision_sha256 IS NOT NULL))
        OR (TG_OP='UPDATE' AND (NEW.trusted_review_id,NEW.review_revision_sha256)
          IS DISTINCT FROM (OLD.trusted_review_id,OLD.review_revision_sha256)) THEN
        RAISE EXCEPTION 'use trusted circuit review/publish operations' USING ERRCODE='42501';
      END IF;
    ELSIF TG_TABLE_NAME='circuit_editorial_claims' THEN
      IF (TG_OP='INSERT' AND (NEW.reviewer IS NOT NULL OR NEW.reviewed_at IS NOT NULL))
        OR (TG_OP='UPDATE' AND (NEW.reviewer,NEW.reviewed_at) IS DISTINCT FROM (OLD.reviewer,OLD.reviewed_at)) THEN
        RAISE EXCEPTION 'claim review metadata is server assigned' USING ERRCODE='42501';
      END IF;
      IF NEW.status='verified' AND (TG_OP='INSERT' OR
        (NEW.status,NEW.reviewer,NEW.reviewed_at) IS DISTINCT FROM (OLD.status,OLD.reviewer,OLD.reviewed_at)) THEN
        RAISE EXCEPTION 'use trusted circuit review operation' USING ERRCODE='42501';
      END IF;
    ELSIF NEW.supports AND (TG_OP='INSERT' OR NEW.supports IS DISTINCT FROM OLD.supports) THEN
      RAISE EXCEPTION 'use trusted circuit evidence review operation' USING ERRCODE='42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE FUNCTION circuit_editorial_bind_author() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE owner_name NAME;
BEGIN
  SELECT pg_catalog.pg_get_userbyid(c.relowner) INTO owner_name
    FROM pg_catalog.pg_class c WHERE c.oid='circuit_editorial_articles'::regclass;
  IF TG_OP='INSERT' THEN
    IF session_user <> owner_name THEN
      IF NEW.author_principal IS NOT NULL THEN RAISE EXCEPTION 'author subject is server assigned'; END IF;
      NEW.author_principal := circuit_editorial_actor('grid_circuit_stager');
    ELSIF NEW.author_principal IS NOT NULL THEN
      RAISE EXCEPTION 'legacy DBA drafts cannot assert authenticated authorship on insert';
    END IF;
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id THEN RAISE EXCEPTION 'circuit editorial primary identity is immutable'; END IF;
    IF NEW.circuit_id IS DISTINCT FROM OLD.circuit_id THEN RAISE EXCEPTION 'circuit identity is immutable'; END IF;
    IF NEW.author_principal IS DISTINCT FROM OLD.author_principal AND
      NOT (OLD.author_principal IS NULL AND session_user=owner_name) THEN
      RAISE EXCEPTION 'authenticated author is immutable';
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE FUNCTION circuit_editorial_revoke(article BIGINT) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE circuit_editorial_articles SET status='draft',trusted_review_id=NULL,
    review_revision_sha256=NULL,reviewer=NULL,reviewed_at=NULL,published_at=NULL,
    review_generation=review_generation+1,updated_at=clock_timestamp() WHERE id=article;
END $$;

CREATE FUNCTION circuit_editorial_article_changed() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.locale,NEW.slug,NEW.title,NEW.body_markdown,NEW.author,NEW.author_principal,NEW.review_method)
     IS DISTINCT FROM
     (OLD.locale,OLD.slug,OLD.title,OLD.body_markdown,OLD.author,OLD.author_principal,OLD.review_method)
     OR (NOT circuit_editorial_in_trusted_operation() AND
       (NEW.status,NEW.reviewer,NEW.reviewed_at,NEW.published_at)
       IS DISTINCT FROM (OLD.status,OLD.reviewer,OLD.reviewed_at,OLD.published_at)) THEN
    NEW.status := CASE WHEN NEW.status='withdrawn' THEN 'withdrawn' ELSE 'draft' END;
    NEW.trusted_review_id:=NULL; NEW.review_revision_sha256:=NULL;
    NEW.reviewer:=NULL; NEW.reviewed_at:=NULL; NEW.published_at:=NULL;
    NEW.review_generation:=OLD.review_generation+1;
  ELSIF NOT circuit_editorial_in_trusted_operation() THEN
    NEW.review_generation:=OLD.review_generation;
  END IF;
  NEW.updated_at:=clock_timestamp();
  RETURN NEW;
END $$;

CREATE FUNCTION circuit_editorial_claim_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE linked BIGINT;
BEGIN
  IF (NEW.statement,NEW.author_principal,NEW.status,NEW.review_method,NEW.reviewer,NEW.reviewed_at)
    IS DISTINCT FROM (OLD.statement,OLD.author_principal,OLD.status,OLD.review_method,OLD.reviewer,OLD.reviewed_at) THEN
    IF (NEW.statement,NEW.author_principal,NEW.review_method) IS DISTINCT FROM
      (OLD.statement,OLD.author_principal,OLD.review_method) OR NEW.status <> 'verified' THEN
      NEW.status:=CASE WHEN NEW.status IN ('disputed','rejected') THEN NEW.status ELSE 'needs_review' END;
      NEW.reviewer:=NULL; NEW.reviewed_at:=NULL;
    END IF;
    FOR linked IN SELECT article_id FROM circuit_editorial_article_claims WHERE claim_id=OLD.id ORDER BY article_id LOOP
      PERFORM circuit_editorial_revoke(linked);
    END LOOP;
  END IF;
  NEW.updated_at:=clock_timestamp(); RETURN NEW;
END $$;

CREATE FUNCTION circuit_editorial_evidence_changed_v2() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP='UPDATE' AND (NEW.claim_id,NEW.source_id) IS DISTINCT FROM (OLD.claim_id,OLD.source_id) THEN
    RAISE EXCEPTION 'move evidence with delete and insert';
  END IF;
  UPDATE circuit_editorial_claims SET status='needs_review',reviewer=NULL,reviewed_at=NULL
    WHERE id=CASE WHEN TG_OP='DELETE' THEN OLD.claim_id ELSE NEW.claim_id END;
  -- Revoke even if the claim already was needs_review.
  PERFORM circuit_editorial_revoke(article_id) FROM circuit_editorial_article_claims
    WHERE claim_id=CASE WHEN TG_OP='DELETE' THEN OLD.claim_id ELSE NEW.claim_id END;
  RETURN NULL;
END $$;

CREATE FUNCTION circuit_editorial_links_changed_v2() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP='UPDATE' THEN RAISE EXCEPTION 'relink with delete and insert'; END IF;
  IF TG_OP='INSERT' AND NOT EXISTS (SELECT 1 FROM circuit_editorial_articles a
    JOIN circuit_editorial_claims c ON c.circuit_id=a.circuit_id
    WHERE a.id=NEW.article_id AND c.id=NEW.claim_id) THEN RAISE EXCEPTION 'cross-circuit claim link rejected'; END IF;
  PERFORM circuit_editorial_revoke(CASE WHEN TG_OP='DELETE' THEN OLD.article_id ELSE NEW.article_id END);
  RETURN NULL;
END $$;

CREATE FUNCTION circuit_editorial_source_changed_v2() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW IS DISTINCT FROM OLD THEN
    UPDATE circuit_editorial_claims SET status='needs_review',reviewer=NULL,reviewed_at=NULL
      WHERE id IN (SELECT claim_id FROM circuit_editorial_evidence WHERE source_id=OLD.id);
    PERFORM circuit_editorial_revoke(ac.article_id) FROM circuit_editorial_article_claims ac
      JOIN circuit_editorial_evidence e ON e.claim_id=ac.claim_id WHERE e.source_id=OLD.id;
  END IF;
  RETURN NULL;
END $$;

CREATE FUNCTION circuit_editorial_track_contributor() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE subject TEXT; target BIGINT; kind TEXT; owner_name NAME;
BEGIN
  SELECT pg_catalog.pg_get_userbyid(c.relowner) INTO owner_name FROM pg_catalog.pg_class c
    WHERE c.oid='circuit_editorial_articles'::regclass;
  -- DBA maintenance is trusted and never qualifies as an individual reviewer.
  IF session_user=owner_name THEN RETURN NULL; END IF;
  IF TG_TABLE_NAME='circuit_editorial_articles' THEN
    IF TG_OP='UPDATE' AND (NEW.title,NEW.slug,NEW.locale,NEW.body_markdown,NEW.author)
      IS NOT DISTINCT FROM (OLD.title,OLD.slug,OLD.locale,OLD.body_markdown,OLD.author) THEN RETURN NULL; END IF;
    target:=NEW.id; kind:='article';
  ELSIF TG_TABLE_NAME='circuit_editorial_claims' THEN
    IF TG_OP='UPDATE' AND NEW.statement IS NOT DISTINCT FROM OLD.statement THEN RETURN NULL; END IF;
    target:=NEW.id; kind:='claim';
  ELSIF TG_TABLE_NAME='circuit_editorial_evidence' THEN
    IF TG_OP='UPDATE' AND (NEW.claim_id,NEW.source_id,NEW.locator) IS NOT DISTINCT FROM (OLD.claim_id,OLD.source_id,OLD.locator) THEN RETURN NULL; END IF;
    target:=CASE WHEN TG_OP='DELETE' THEN OLD.claim_id ELSE NEW.claim_id END; kind:='claim';
    IF TG_OP<>'DELETE' THEN
      INSERT INTO circuit_editorial_contributors SELECT 'claim',target,principal_id FROM circuit_editorial_contributors
        WHERE entity_kind='source' AND entity_id=NEW.source_id ON CONFLICT DO NOTHING;
    END IF;
  ELSIF TG_TABLE_NAME='circuit_editorial_article_claims' THEN
    target:=CASE WHEN TG_OP='DELETE' THEN OLD.article_id ELSE NEW.article_id END; kind:='article';
  ELSE
    IF TG_OP='UPDATE' THEN
      IF NEW IS NOT DISTINCT FROM OLD THEN RETURN NULL; END IF;
    END IF;
    SELECT l.principal_id INTO subject FROM circuit_editorial_logins l JOIN circuit_editorial_principals p USING(principal_id)
      JOIN pg_catalog.pg_roles r ON r.oid=l.role_oid AND r.rolname=l.role_name
      WHERE l.role_name=session_user AND l.active AND p.active;
    IF subject IS NOT NULL THEN INSERT INTO circuit_editorial_contributors VALUES('source',NEW.id,subject) ON CONFLICT DO NOTHING; END IF;
    IF TG_OP='INSERT' THEN RETURN NULL; END IF;
    IF NOT EXISTS(SELECT 1 FROM circuit_editorial_evidence WHERE source_id=NEW.id) THEN RETURN NULL; END IF;
    subject:=circuit_editorial_actor('grid_circuit_stager');
    INSERT INTO circuit_editorial_contributors VALUES('source',NEW.id,subject) ON CONFLICT DO NOTHING;
    INSERT INTO circuit_editorial_contributors SELECT 'claim',claim_id,subject FROM circuit_editorial_evidence WHERE source_id=NEW.id ON CONFLICT DO NOTHING;
    RETURN NULL;
  END IF;
  subject:=circuit_editorial_actor('grid_circuit_stager');
  INSERT INTO circuit_editorial_contributors VALUES(kind,target,subject) ON CONFLICT DO NOTHING;
  RETURN NULL;
END $$;
CREATE TRIGGER circuit_article_contributor AFTER INSERT OR UPDATE ON circuit_editorial_articles FOR EACH ROW EXECUTE FUNCTION circuit_editorial_track_contributor();
CREATE TRIGGER circuit_claim_contributor AFTER INSERT OR UPDATE ON circuit_editorial_claims FOR EACH ROW EXECUTE FUNCTION circuit_editorial_track_contributor();
CREATE TRIGGER circuit_evidence_contributor AFTER INSERT OR UPDATE OR DELETE ON circuit_editorial_evidence FOR EACH ROW EXECUTE FUNCTION circuit_editorial_track_contributor();
CREATE TRIGGER circuit_link_contributor AFTER INSERT OR DELETE ON circuit_editorial_article_claims FOR EACH ROW EXECUTE FUNCTION circuit_editorial_track_contributor();
CREATE TRIGGER circuit_source_contributor AFTER INSERT OR UPDATE ON content_sources FOR EACH ROW EXECUTE FUNCTION circuit_editorial_track_contributor();

CREATE FUNCTION circuit_editorial_identity_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_LEVEL='ROW' THEN
    IF TG_OP='UPDATE' AND NEW IS NOT DISTINCT FROM OLD THEN RETURN NULL; END IF;
    IF TG_TABLE_NAME='external_identities' THEN
      IF OLD.entity_kind<>'circuit' THEN RETURN NULL; END IF;
    END IF;
  END IF;
  -- Rare DBA-only operation: invalidate all receipts, including drafts in review.
  PERFORM circuit_editorial_revoke(id) FROM circuit_editorial_articles;
  UPDATE circuit_editorial_claims SET status='needs_review',reviewer=NULL,reviewed_at=NULL WHERE status='verified';
  RETURN NULL;
END $$;

CREATE TRIGGER circuit_article_01_approval BEFORE INSERT OR UPDATE ON circuit_editorial_articles
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_guard_approval();
CREATE TRIGGER circuit_article_02_author BEFORE INSERT OR UPDATE ON circuit_editorial_articles
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_bind_author();
CREATE TRIGGER circuit_article_10_changed BEFORE UPDATE ON circuit_editorial_articles
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_article_changed();
CREATE TRIGGER circuit_claim_01_approval BEFORE INSERT OR UPDATE ON circuit_editorial_claims
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_guard_approval();
CREATE TRIGGER circuit_claim_02_author BEFORE INSERT OR UPDATE ON circuit_editorial_claims
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_bind_author();
CREATE TRIGGER circuit_claim_10_changed BEFORE UPDATE ON circuit_editorial_claims
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_claim_changed();
CREATE TRIGGER circuit_evidence_01_approval BEFORE INSERT OR UPDATE ON circuit_editorial_evidence
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_guard_approval();
CREATE TRIGGER circuit_evidence_changed AFTER INSERT OR UPDATE OR DELETE ON circuit_editorial_evidence
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_evidence_changed_v2();
CREATE TRIGGER circuit_links_changed AFTER INSERT OR UPDATE OR DELETE ON circuit_editorial_article_claims
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_links_changed_v2();
CREATE TRIGGER circuit_source_changed AFTER UPDATE ON content_sources
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_source_changed_v2();
CREATE TRIGGER circuit_principal_changed AFTER INSERT OR UPDATE OR DELETE ON circuit_editorial_principals
  FOR EACH STATEMENT EXECUTE FUNCTION circuit_editorial_identity_changed();
CREATE TRIGGER circuit_login_changed AFTER INSERT OR UPDATE OR DELETE ON circuit_editorial_logins
  FOR EACH STATEMENT EXECUTE FUNCTION circuit_editorial_identity_changed();

-- Full candidate graph, including candidate evidence, bound identities and generation.
-- PostgreSQL JSONB canonical text + core SHA-256 avoids an extension dependency.
CREATE FUNCTION circuit_editorial_manifest(article BIGINT) RETURNS JSONB LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object('schema_version',1,'article',jsonb_build_object(
    'id',a.id::text,'circuit_id',a.circuit_id::text,'locale',a.locale,'slug',a.slug,
    'title',a.title,'body_markdown',a.body_markdown,'author',a.author,
    'author_principal',a.author_principal,'review_method',a.review_method,'generation',a.review_generation,
    'contributors',(SELECT jsonb_agg(principal_id ORDER BY principal_id) FROM circuit_editorial_contributors WHERE entity_kind='article' AND entity_id=a.id)),
    'identity',(SELECT jsonb_build_object('circuit',to_jsonb(h),'external_identity',to_jsonb(e),'source',to_jsonb(d))
      FROM historical_circuits h JOIN external_identities e ON e.id=h.external_identity_id JOIN data_sources d ON d.id=e.source_id WHERE h.id=a.circuit_id),
    'claims',(SELECT jsonb_agg(jsonb_build_object('id',c.id::text,'circuit_id',c.circuit_id::text,
      'statement',c.statement,'author_principal',c.author_principal,'review_method',c.review_method,
      'contributors',(SELECT jsonb_agg(principal_id ORDER BY principal_id) FROM circuit_editorial_contributors WHERE entity_kind='claim' AND entity_id=c.id),
      'evidence',(SELECT jsonb_agg(jsonb_build_object('source',to_jsonb(s),'locator',e.locator,'supports',e.supports,
          'source_contributors',(SELECT jsonb_agg(principal_id ORDER BY principal_id) FROM circuit_editorial_contributors WHERE entity_kind='source' AND entity_id=s.id))
        ORDER BY e.source_id,e.locator) FROM circuit_editorial_evidence e JOIN content_sources s ON s.id=e.source_id
        WHERE e.claim_id=c.id)) ORDER BY c.id)
      FROM circuit_editorial_article_claims ac JOIN circuit_editorial_claims c ON c.id=ac.claim_id WHERE ac.article_id=a.id))
  FROM circuit_editorial_articles a WHERE a.id=article
$$;
CREATE FUNCTION circuit_editorial_revision(article BIGINT) RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT encode(sha256(convert_to(circuit_editorial_manifest(article)::text,'UTF8')),'hex')
$$;

CREATE FUNCTION circuit_editorial_body_valid(article BIGINT) RETURNS BOOLEAN LANGUAGE plpgsql STABLE AS $$
DECLARE prose TEXT; block TEXT; matched BIGINT; used BIGINT[]:=ARRAY[]::BIGINT[]; heading_pending BOOLEAN:=false;
  whitespace TEXT:=E' \t\n\r\f' || chr(11) || chr(160) || chr(5760) || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196) || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201) || chr(8202) || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288) || chr(65279);
BEGIN
  SELECT body_markdown INTO prose FROM circuit_editorial_articles WHERE id=article;
  IF prose IS NULL OR btrim(prose)='' THEN RETURN false; END IF;
  FOR block IN SELECT regexp_split_to_table(btrim(replace(prose,E'\r\n',E'\n'),whitespace),E'\n[\t ]*\n') LOOP
    IF block ~ '^## [^\n<>#\[\]`]+$' THEN
      IF heading_pending THEN RETURN false; END IF;
      heading_pending:=true;
    ELSE
      SELECT min(c.id) INTO matched FROM circuit_editorial_article_claims ac
        JOIN circuit_editorial_claims c ON c.id=ac.claim_id WHERE ac.article_id=article AND btrim(c.statement,whitespace)=block
        HAVING count(*)=1;
      IF matched IS NULL OR matched=ANY(used) THEN RETURN false; END IF;
      used:=array_append(used,matched); heading_pending:=false;
    END IF;
  END LOOP;
  RETURN NOT heading_pending AND cardinality(used)>0 AND cardinality(used)=
    (SELECT count(*) FROM circuit_editorial_article_claims WHERE article_id=article);
END $$;

CREATE FUNCTION circuit_editorial_inspect(article BIGINT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF pg_catalog.pg_has_role(session_user,'grid_circuit_reviewer','MEMBER') THEN
    PERFORM circuit_editorial_actor('grid_circuit_reviewer');
  ELSE PERFORM circuit_editorial_actor('grid_circuit_publisher'); END IF;
  RETURN jsonb_build_object('revision_sha256',circuit_editorial_revision(article),
    'manifest',circuit_editorial_manifest(article),'review_id',(SELECT trusted_review_id::text FROM circuit_editorial_articles WHERE id=article));
END $$;

CREATE FUNCTION circuit_editorial_review(article BIGINT, expected_revision TEXT) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE subject TEXT; a circuit_editorial_articles%ROWTYPE; receipt BIGINT; revision TEXT; reviewed TIMESTAMPTZ:=clock_timestamp();
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'circuit operation requires READ COMMITTED transaction';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(396,1);
  subject:=circuit_editorial_actor('grid_circuit_reviewer');
  SELECT * INTO a FROM circuit_editorial_articles WHERE id=article FOR UPDATE;
  IF NOT FOUND OR a.author_principal IS NULL OR a.review_method <> 'human' OR a.status='published'
    OR NOT EXISTS(SELECT 1 FROM circuit_editorial_principals WHERE principal_id=a.author_principal AND active) THEN
    RAISE EXCEPTION 'unbound, inactive, AI or already published candidate';
  END IF;
  IF a.author_principal=subject OR EXISTS(SELECT 1 FROM circuit_editorial_contributors co WHERE co.principal_id=subject AND
    ((co.entity_kind='article' AND co.entity_id=article) OR (co.entity_kind='claim' AND co.entity_id IN (SELECT claim_id FROM circuit_editorial_article_claims WHERE article_id=article)))) THEN RAISE EXCEPTION 'author cannot review own article'; END IF;
  IF expected_revision IS NULL OR expected_revision IS DISTINCT FROM circuit_editorial_revision(article) THEN
    RAISE EXCEPTION 'stale circuit revision' USING ERRCODE='40001';
  END IF;
  IF NOT circuit_editorial_body_valid(article) OR EXISTS(
    SELECT 1 FROM circuit_editorial_article_claims ac JOIN circuit_editorial_claims c ON c.id=ac.claim_id
    WHERE ac.article_id=article AND (c.circuit_id<>a.circuit_id OR c.author_principal IS NULL
      OR c.author_principal=subject OR c.review_method<>'human'
      OR NOT EXISTS(SELECT 1 FROM circuit_editorial_principals p WHERE p.principal_id=c.author_principal AND p.active)
      OR NOT EXISTS(SELECT 1 FROM circuit_editorial_evidence e WHERE e.claim_id=c.id)
      OR EXISTS(SELECT 1 FROM circuit_editorial_evidence e JOIN content_sources s ON s.id=e.source_id WHERE e.claim_id=c.id
        AND (s.source_url !~ '^https://[^/@[:space:]]+([/:?#][^[:space:]]*)?$' OR s.source_url ~ '^https://[^/]*@')))) THEN
    RAISE EXCEPTION 'every claim needs independent authorship, exact prose and safe candidate evidence';
  END IF;
  UPDATE circuit_editorial_evidence e SET supports=true WHERE NOT supports AND claim_id IN
    (SELECT claim_id FROM circuit_editorial_article_claims WHERE article_id=article);
  UPDATE circuit_editorial_claims SET status='verified',reviewer=session_user,reviewed_at=reviewed
    WHERE id IN (SELECT claim_id FROM circuit_editorial_article_claims WHERE article_id=article);
  UPDATE circuit_editorial_articles SET review_revision_sha256=encode(sha256(convert_to(body_markdown,'UTF8')),'hex') WHERE id=article;
  revision:=circuit_editorial_revision(article);
  INSERT INTO circuit_editorial_reviews(article_id,generation,revision_sha256,body_sha256,reviewer_principal,reviewer_oid,reviewer_login,reviewed_at)
    SELECT id,review_generation,revision,review_revision_sha256,subject,(SELECT oid FROM pg_catalog.pg_roles WHERE rolname=session_user),session_user,reviewed
    FROM circuit_editorial_articles WHERE id=article RETURNING id INTO receipt;
  UPDATE circuit_editorial_articles SET trusted_review_id=receipt,status='in_review',reviewer=session_user,reviewed_at=reviewed,published_at=NULL WHERE id=article;
  RETURN jsonb_build_object('review_id',receipt::text,'revision_sha256',revision,'published',false);
END $$;

CREATE FUNCTION circuit_editorial_publish(article BIGINT, expected_review BIGINT, expected_revision TEXT) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE subject TEXT; a circuit_editorial_articles%ROWTYPE; r circuit_editorial_reviews%ROWTYPE; published TIMESTAMPTZ:=clock_timestamp();
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN RAISE EXCEPTION 'circuit operation requires READ COMMITTED transaction'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(396,1);
  subject:=circuit_editorial_actor('grid_circuit_publisher');
  SELECT * INTO a FROM circuit_editorial_articles WHERE id=article FOR UPDATE;
  SELECT * INTO r FROM circuit_editorial_reviews WHERE id=a.trusted_review_id AND article_id=article;
  IF a.id IS NULL OR a.status<>'in_review' OR r.id IS NULL OR r.id IS DISTINCT FROM expected_review
    OR r.revision_sha256 IS DISTINCT FROM expected_revision OR r.revision_sha256 IS DISTINCT FROM circuit_editorial_revision(article)
    OR r.generation<>a.review_generation OR r.published_at IS NOT NULL THEN RAISE EXCEPTION 'stale or absent trusted circuit review' USING ERRCODE='40001'; END IF;
  IF subject=a.author_principal OR EXISTS(SELECT 1 FROM circuit_editorial_contributors co WHERE co.principal_id=subject AND
    ((co.entity_kind='article' AND co.entity_id=article) OR (co.entity_kind='claim' AND co.entity_id IN (SELECT claim_id FROM circuit_editorial_article_claims WHERE article_id=article)))) OR EXISTS(SELECT 1 FROM circuit_editorial_article_claims ac
    JOIN circuit_editorial_claims c ON c.id=ac.claim_id WHERE ac.article_id=article AND c.author_principal=subject) THEN
    RAISE EXCEPTION 'author cannot publish own article';
  END IF;
  IF NOT circuit_editorial_login_valid(r.reviewer_oid,r.reviewer_login,r.reviewer_principal,'grid_circuit_reviewer') THEN
    RAISE EXCEPTION 'reviewer no longer trusted';
  END IF;
  UPDATE circuit_editorial_reviews SET publisher_principal=subject,
    publisher_oid=(SELECT oid FROM pg_catalog.pg_roles WHERE rolname=session_user),publisher_login=session_user,published_at=published WHERE id=r.id;
  UPDATE circuit_editorial_articles SET status='published',published_at=published WHERE id=article;
  RETURN jsonb_build_object('published',true,'review_id',r.id::text,'revision_sha256',r.revision_sha256);
END $$;

CREATE FUNCTION circuit_editorial_withdraw(article BIGINT) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(396,1);
  PERFORM circuit_editorial_actor('grid_circuit_publisher');
  PERFORM circuit_editorial_revoke(article);
  UPDATE circuit_editorial_articles SET status='withdrawn' WHERE id=article;
END $$;

-- DBA-only actor lifecycle. No credentials or human attestations are invented.
-- Every supported capability/login change first revokes receipts atomically.
CREATE FUNCTION circuit_editorial_configure_actor(login NAME, principal TEXT, display_name TEXT, capabilities TEXT[], enabled BOOLEAN)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE subject_role pg_catalog.pg_roles%ROWTYPE; capability TEXT; previous TEXT;
BEGIN
  IF NOT circuit_editorial_in_trusted_operation() THEN RAISE EXCEPTION 'DBA maintenance operation only' USING ERRCODE='42501'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(396,1);
  SELECT * INTO subject_role FROM pg_catalog.pg_roles WHERE rolname=login;
  IF NOT FOUND OR capabilities IS NULL OR enabled IS NULL OR EXISTS(SELECT 1 FROM unnest(capabilities) c WHERE c NOT IN
    ('grid_circuit_stager','grid_circuit_reviewer','grid_circuit_publisher','grid_circuit_reader')) THEN
    RAISE EXCEPTION 'invalid individual role or capabilities';
  END IF;
  SELECT principal_id INTO previous FROM circuit_editorial_logins WHERE role_oid=subject_role.oid;
  IF previous IS NOT NULL AND previous<>principal THEN RAISE EXCEPTION 'cannot reassign an existing login to a different person'; END IF;
  INSERT INTO circuit_editorial_principals(principal_id,display_name,active) VALUES(principal,display_name,true) ON CONFLICT DO NOTHING;
  INSERT INTO circuit_editorial_logins(role_oid,role_name,principal_id,active) VALUES(subject_role.oid,login,principal,false)
    ON CONFLICT(role_oid) DO UPDATE SET active=false,role_name=EXCLUDED.role_name;
  FOREACH capability IN ARRAY ARRAY['grid_circuit_stager','grid_circuit_reviewer','grid_circuit_publisher','grid_circuit_reader'] LOOP
    EXECUTE format('REVOKE %I FROM %I',capability,login);
  END LOOP;
  IF enabled THEN
    FOREACH capability IN ARRAY capabilities LOOP EXECUTE format('GRANT %I TO %I',capability,login); END LOOP;
    FOREACH capability IN ARRAY ARRAY['grid_circuit_stager','grid_circuit_reviewer','grid_circuit_publisher','grid_circuit_reader'] LOOP
      IF pg_catalog.pg_has_role(subject_role.oid,capability,'MEMBER') AND NOT capability=ANY(capabilities) THEN
        RAISE EXCEPTION 'unexpected inherited circuit capability';
      END IF;
    END LOOP;
    UPDATE circuit_editorial_logins SET active=true WHERE role_oid=subject_role.oid;
    FOREACH capability IN ARRAY capabilities LOOP
      IF NOT circuit_editorial_login_valid(subject_role.oid,login,principal,capability) THEN
        RAISE EXCEPTION 'unsafe individual role, ownership or inherited privileges';
      END IF;
    END LOOP;
  END IF;
END $$;

-- This function is the only database projection granted to the public reader.
CREATE FUNCTION circuit_editorial_public_payload(article BIGINT) RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE a circuit_editorial_articles%ROWTYPE; r circuit_editorial_reviews%ROWTYPE; payload JSONB;
BEGIN
  IF current_setting('transaction_isolation')<>'read committed' THEN RETURN NULL; END IF;
  SELECT * INTO a FROM circuit_editorial_articles WHERE id=article AND status='published';
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO r FROM circuit_editorial_reviews WHERE id=a.trusted_review_id AND article_id=a.id;
  IF NOT FOUND OR r.published_at IS NULL OR r.generation<>a.review_generation
    OR r.revision_sha256 IS DISTINCT FROM circuit_editorial_revision(article)
    OR r.body_sha256 IS DISTINCT FROM encode(sha256(convert_to(a.body_markdown,'UTF8')),'hex')
    OR a.review_revision_sha256 IS DISTINCT FROM r.body_sha256 OR a.review_method<>'human'
    OR a.author_principal IS NULL OR a.author_principal IN (r.reviewer_principal,r.publisher_principal)
    OR NOT EXISTS(SELECT 1 FROM circuit_editorial_principals WHERE principal_id=a.author_principal AND active)
    OR EXISTS(SELECT 1 FROM (VALUES(r.reviewer_oid,r.reviewer_login,r.reviewer_principal,'grid_circuit_reviewer'),
      (r.publisher_oid,r.publisher_login,r.publisher_principal,'grid_circuit_publisher')) actor(oid,name,principal,capability)
      WHERE NOT circuit_editorial_login_valid(actor.oid,actor.name,actor.principal,actor.capability))
    OR EXISTS(SELECT 1 FROM circuit_editorial_article_claims ac JOIN circuit_editorial_claims c ON c.id=ac.claim_id
      WHERE ac.article_id=article AND (c.status<>'verified' OR c.reviewer IS DISTINCT FROM r.reviewer_login::text
        OR c.author_principal IS NULL OR c.author_principal IN (r.reviewer_principal,r.publisher_principal))) THEN RETURN NULL; END IF;
  SELECT jsonb_build_object('id',a.id::text,'circuit_id',a.circuit_id::text,'locale',a.locale,'slug',a.slug,'title',a.title,
    'body_markdown',a.body_markdown,'review_revision_sha256',r.body_sha256,'published_at',r.published_at::text,
    'claims',(SELECT jsonb_agg(jsonb_build_object('id',c.id::text,'statement',c.statement,
      'evidence',(SELECT jsonb_agg(jsonb_build_object('url',s.source_url,'title',s.title,'publisher',s.publisher,
        'author',s.author,'accessed_on',s.accessed_on::text,'locator',e.locator) ORDER BY e.source_id,e.locator)
        FROM circuit_editorial_evidence e JOIN content_sources s ON s.id=e.source_id WHERE e.claim_id=c.id AND e.supports)) ORDER BY c.id)
      FROM circuit_editorial_article_claims ac JOIN circuit_editorial_claims c ON c.id=ac.claim_id WHERE ac.article_id=article),
    'references',(SELECT jsonb_agg(ref ORDER BY ref.title,ref.url,ref.publisher) FROM
      (SELECT DISTINCT s.source_url AS url,s.title,s.publisher FROM circuit_editorial_article_claims ac
        JOIN circuit_editorial_evidence e ON e.claim_id=ac.claim_id AND e.supports JOIN content_sources s ON s.id=e.source_id WHERE ac.article_id=article) ref)) INTO payload;
  RETURN payload;
END $$;
CREATE VIEW circuit_editorial_public_articles WITH (security_barrier=true) AS
  SELECT a.circuit_id,a.locale,p.data FROM circuit_editorial_articles a CROSS JOIN LATERAL
    (SELECT circuit_editorial_public_payload(a.id) AS data) p WHERE a.status='published' AND p.data IS NOT NULL;

CREATE TRIGGER circuit_canonical_changed AFTER UPDATE OR DELETE ON historical_circuits
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_identity_changed();
CREATE TRIGGER circuit_external_changed AFTER UPDATE OR DELETE ON external_identities
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_identity_changed();
CREATE TRIGGER circuit_data_source_changed AFTER UPDATE OR DELETE ON data_sources
  FOR EACH ROW EXECUTE FUNCTION circuit_editorial_identity_changed();

-- Pin every old/new circuit helper to the migration schema with pg_temp LAST.
-- No function may resolve a caller's temp pg_roles/table/function as trusted code.
DO $$
DECLARE fn RECORD; acl RECORD; tbl TEXT; trusted_schema TEXT:=current_schema();
BEGIN
  EXECUTE format('REVOKE CREATE ON SCHEMA %I FROM PUBLIC',trusted_schema);
  FOR fn IN SELECT p.oid::regprocedure AS signature FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname=trusted_schema AND p.proname LIKE 'circuit_editorial_%' LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, %I, pg_temp',fn.signature,trusted_schema);
    EXECUTE format('ALTER FUNCTION %s SET TimeZone = %L',fn.signature,'UTC');
    EXECUTE format('ALTER FUNCTION %s SET DateStyle = %L',fn.signature,'ISO, YMD');
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',fn.signature);
    FOR acl IN SELECT DISTINCT x.grantee FROM pg_catalog.pg_proc p,
      LATERAL pg_catalog.aclexplode(p.proacl) x WHERE p.oid=fn.signature::oid AND x.grantee<>p.proowner AND x.grantee<>0 LOOP
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %I',fn.signature,pg_catalog.pg_get_userbyid(acl.grantee));
    END LOOP;
  END LOOP;
  FOR fn IN SELECT c.oid,c.oid::regclass AS relation,c.relowner,c.relacl FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=trusted_schema AND c.relname IN
      ('circuit_editorial_principals','circuit_editorial_logins','circuit_editorial_reviews','circuit_editorial_contributors',
       'circuit_editorial_reviews_id_seq','circuit_editorial_public_articles') LOOP
    EXECUTE format('REVOKE ALL ON TABLE %s FROM PUBLIC',fn.relation);
    FOR acl IN SELECT DISTINCT x.grantee FROM pg_catalog.aclexplode(fn.relacl) x WHERE x.grantee<>fn.relowner AND x.grantee<>0 LOOP
      EXECUTE format('REVOKE ALL ON TABLE %s FROM %I',fn.relation,pg_catalog.pg_get_userbyid(acl.grantee));
    END LOOP;
  END LOOP;
  FOREACH tbl IN ARRAY ARRAY['circuit_editorial_articles','circuit_editorial_claims','circuit_editorial_evidence',
    'circuit_editorial_article_claims','content_sources','circuit_editorial_principals','circuit_editorial_logins',
    'historical_circuits','external_identities','data_sources'] LOOP
    EXECUTE format('CREATE TRIGGER circuit_00_write_lock BEFORE INSERT OR UPDATE OR DELETE ON %I FOR EACH STATEMENT EXECUTE FUNCTION circuit_editorial_write_lock()',tbl);
  END LOOP;
END $$;
REVOKE ALL ON circuit_editorial_principals,circuit_editorial_logins,circuit_editorial_reviews,circuit_editorial_contributors,
  circuit_editorial_public_articles FROM PUBLIC;
COMMIT;
