'use strict';
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');
const { Pool } = require('pg');
const { stage } = require('../../scripts/stage-circuit-editorial.cjs');

async function securityFixture(url, prefix = 'circuit_security') {
  if (!url) throw Error('disposable DATABASE_URL required');
  const suffix = randomUUID().replaceAll('-', '');
  const schema = `${prefix}_${suffix}`;
  const admin = new Pool({ connectionString: url });
  const actorPools = {};
  const roles = {};
  await admin.query(`CREATE SCHEMA ${schema}`);
  const scoped = new URL(url);
  scoped.searchParams.set('options', `-c search_path=${schema}`);
  const db = new Pool({ connectionString: scoped.toString() });
  const run = script => execFileSync('psql', [url, '-X', '-v', 'ON_ERROR_STOP=1', '-f', script], {
    cwd: resolve(__dirname, '../../../..'), env: { ...process.env, PGOPTIONS: `-c search_path=${schema}` }, stdio: 'pipe',
  });
  const cleanup = async () => {
    await Promise.all(Object.values(actorPools).map(pool => pool.end()));
    await db.end();
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    for (const role of Object.values(roles)) {
      await admin.query(`DROP OWNED BY ${role}`);
      await admin.query(`DROP ROLE ${role}`);
    }
    await admin.end();
  };
  try {
    execFileSync('python3', ['packages/database/scripts/migrate.py'], {
      cwd: resolve(__dirname, '../../../..'), env: { ...process.env, DATABASE_URL: url, PGOPTIONS: `-c search_path=${schema}` }, stdio: 'pipe',
    });
    run('packages/database/scripts/provision_circuit_roles.sql');
    run('packages/database/scripts/provision_circuit_roles.sql'); // bootstrap must be repeatable
    for (const [name, capabilities] of Object.entries({
      writer: ['stager', 'reviewer', 'publisher'], alias: ['stager', 'reviewer', 'publisher'],
      reviewer: ['reviewer'], publisher: ['publisher'], reader: ['reader'], stranger: [],
    })) {
      const role = `c396_${name}_${suffix}`;
      roles[name] = role;
      const password = randomUUID();
      await admin.query(`CREATE ROLE ${role} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`);
      for (const capability of capabilities) await admin.query(`GRANT grid_circuit_${capability} TO ${role}`);
      // Real TCP login, not SET ROLE/metadata pretending to be an authenticated subject.
      const actorUrl = new URL(scoped);
      actorUrl.username = role; actorUrl.password = password;
      actorPools[name] = new Pool({ connectionString: actorUrl.toString() });
      if (['reader', 'stranger'].includes(name)) continue;
      const principal = name === 'alias' ? 'writer' : name;
      await db.query(`INSERT INTO circuit_editorial_principals(principal_id,display_name,active)
        VALUES($1,$2,true) ON CONFLICT DO NOTHING`, [principal, `Synthetic ${principal}`]);
      await db.query(`INSERT INTO circuit_editorial_logins(role_oid,role_name,principal_id,active)
        SELECT oid,rolname,$2,true FROM pg_catalog.pg_roles WHERE rolname=$1`, [role, principal]);
    }
    const { rows: [source] } = await db.query(`INSERT INTO data_sources(slug,homepage_url,attribution)
      VALUES('synthetic-circuit-security','https://example.org','Test fixtures only') RETURNING id`);
    let n = 0;
    const draft = async (locale = 'en', body) => {
      n++;
      const externalId = `fixture-circuit-${n}`;
      const { rows: [identity] } = await db.query(`INSERT INTO external_identities(source_id,entity_kind,external_id)
        VALUES($1,'circuit',$2) RETURNING id`, [source.id, externalId]);
      const { rows: [circuit] } = await db.query(`INSERT INTO historical_circuits(external_identity_id,display_name)
        VALUES($1,$2) RETURNING id::text`, [identity.id, `Synthetic circuit ${n}`]);
      const statement = locale === 'uk' ? 'Синтетичне твердження для перевірки системи.' : 'Synthetic circuit security claim.';
      const bundle = { schema_version: 1, release_kind: 'circuit_research_draft', publication_status: 'unreviewed',
        circuit_external_id: externalId, locale, slug: externalId, title: locale === 'uk' ? 'Синтетична редакційна стаття' : 'Synthetic editorial article',
        author: 'An arbitrary author label is not an identity', body_markdown: body ?? `## ${locale === 'uk' ? 'Контекст' : 'Context'}\n\n${statement}`,
        claims: [{ statement, evidence: [{ source_url: `https://example.org/circuit-security-${suffix}-${n}`,
          title: 'Synthetic evidence', publisher: 'Test publisher', accessed_on: '2026-11-01', locator: 'Synthetic paragraph 1' }] }] };
      const client = await actorPools.writer.connect();
      let staged;
      try { staged = await stage(client, bundle, 'synthetic-circuit-security'); }
      finally { client.release(); }
      const { rows: [record] } = await db.query(`SELECT ac.claim_id::text,e.source_id::text FROM circuit_editorial_article_claims ac
        JOIN circuit_editorial_evidence e ON e.claim_id=ac.claim_id WHERE ac.article_id=$1`, [staged.article_id]);
      return { ...staged, ...record, bundle, external_identity_id: identity.id, circuit_id: circuit.id };
    };
    const inspect = async (article, actor = 'reviewer') => (await actorPools[actor].query(
      'SELECT circuit_editorial_inspect($1) AS result', [article])).rows[0].result;
    const review = async (article, actor = 'reviewer', revision) => (await actorPools[actor].query(
      'SELECT circuit_editorial_review($1,$2) AS result', [article, revision ?? (await inspect(article, actor)).revision_sha256])).rows[0].result;
    const publish = async (article, receipt, actor = 'publisher') => (await actorPools[actor].query(
      'SELECT circuit_editorial_publish($1,$2,$3) AS result', [article, receipt.review_id, receipt.revision_sha256])).rows[0].result;
    const state = async article => (await db.query('SELECT * FROM circuit_editorial_articles WHERE id=$1', [article])).rows[0];
    return { schema, db, admin, roles, actors: actorPools, scopedUrl: scoped.toString(), draft, inspect, review, publish, state, cleanup, run };
  } catch (error) { await cleanup(); throw error; }
}
module.exports = { securityFixture };
