const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const { Pool } = require('pg');

test('upgrade preserves legacy drafts, revokes asserted approvals, is replayable and rolls back failed/checksum-modified migrations', async () => {
  assert.ok(process.env.DATABASE_URL, 'disposable DATABASE_URL required');
  const schema = 'circuit_upgrade_' + randomUUID().replaceAll('-', '');
  const untrustedRole = 'c396_defaults_' + randomUUID().replaceAll('-', '');
  const temp = mkdtempSync(join(tmpdir(), 'circuit-upgrade-'));
  const admin = new Pool({ connectionString: process.env.DATABASE_URL });
  const url = new URL(process.env.DATABASE_URL); url.searchParams.set('options', `-c search_path=${schema}`);
  const db = new Pool({ connectionString: url.toString() });
  const root = resolve(__dirname, '../../..');
  mkdirSync(join(temp, 'scripts')); mkdirSync(join(temp, 'migrations'));
  copyFileSync(join(root, 'packages/database/scripts/migrate.py'), join(temp, 'scripts/migrate.py'));
  const migrate = () => spawnSync('python3', [join(temp, 'scripts/migrate.py')], {
    encoding: 'utf8', env: { ...process.env, PGOPTIONS: `-c search_path=${schema}` },
  });
  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    for (const name of readdirSync(join(root, 'packages/database/migrations')).filter(n => /^00(0\d|1[0-5])_/.test(n))) {
      copyFileSync(join(root, 'packages/database/migrations', name), join(temp, 'migrations', name));
    }
    const old = migrate(); assert.equal(old.status, 0, old.stderr);
    const body = '## Legacy\n\nSynthetic preserved claim.';
    const digest = createHash('sha256').update(body).digest('hex');
    await db.query(`INSERT INTO data_sources(slug,homepage_url,attribution) VALUES('synthetic-upgrade','https://example.org','Test only');
      INSERT INTO external_identities(source_id,entity_kind,external_id) VALUES(1,'circuit','legacy-fixture');
      INSERT INTO historical_circuits(external_identity_id,display_name) VALUES(1,'Legacy fixture');
      INSERT INTO content_sources(source_url,title,publisher,accessed_on) VALUES('https://example.org/upgrade','Synthetic source','Test','2026-11-01');
      INSERT INTO circuit_editorial_claims(circuit_id,statement) VALUES(1,'Synthetic preserved claim.');
      INSERT INTO circuit_editorial_evidence(claim_id,source_id,locator,supports) VALUES(1,1,'Test paragraph',true);
      UPDATE circuit_editorial_claims SET status='verified',reviewer=session_user,reviewed_at=now();`);
    await db.query(`INSERT INTO circuit_editorial_articles(circuit_id,locale,slug,title,body_markdown,author,review_revision_sha256)
      VALUES(1,'en','legacy','Preserved legacy manuscript',$1,'Legacy writer',$2)`, [body, digest]);
    await db.query(`INSERT INTO circuit_editorial_article_claims VALUES(1,1);
      UPDATE circuit_editorial_articles SET status='published',reviewer=session_user,reviewed_at=now(),published_at=now();`);
    await admin.query(`CREATE ROLE ${untrustedRole} NOLOGIN`);
    await db.query(`GRANT USAGE ON SCHEMA ${schema} TO ${untrustedRole}`);
    await db.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT ALL ON TABLES TO ${untrustedRole}`);
    await db.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT EXECUTE ON FUNCTIONS TO ${untrustedRole}`);
    const name = '0016_circuit_trusted_publication.sql';
    const real = readFileSync(join(root, 'packages/database/migrations', name), 'utf8');
    writeFileSync(join(temp, 'migrations', name), real.replace('COMMIT;', "SELECT 1/0;\nCOMMIT;"));
    const broken = migrate(); assert.notEqual(broken.status, 0); assert.match(broken.stderr, /division by zero/);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema=$1 AND table_name='circuit_editorial_articles' AND column_name='trusted_review_id'", [schema])).rows[0].n, 0);
    assert.equal((await db.query('SELECT status FROM circuit_editorial_articles')).rows[0].status, 'published');
    writeFileSync(join(temp, 'migrations', name), real);
    await db.query(`GRANT CREATE ON SCHEMA ${schema} TO ${untrustedRole}`);
    const unsafeSchema = migrate(); assert.notEqual(unsafeSchema.status, 0);
    assert.match(unsafeSchema.stderr, /remove untrusted CREATE privileges/);
    assert.equal((await db.query('SELECT status FROM circuit_editorial_articles')).rows[0].status, 'published');
    await db.query(`REVOKE CREATE ON SCHEMA ${schema} FROM ${untrustedRole}`);
    const upgrade = migrate(); assert.equal(upgrade.status, 0, upgrade.stderr);
    const article = (await db.query('SELECT * FROM circuit_editorial_articles')).rows[0];
    assert.equal(article.body_markdown, body); assert.equal(article.title, 'Preserved legacy manuscript');
    assert.equal(article.status, 'draft'); assert.equal(article.author_principal, null); assert.equal(article.trusted_review_id, null);
    assert.equal((await db.query('SELECT supports FROM circuit_editorial_evidence')).rows[0].supports, false);
    assert.equal((await db.query('SELECT status FROM circuit_editorial_claims')).rows[0].status, 'needs_review');
    assert.equal((await db.query('SELECT count(*)::int AS n FROM circuit_editorial_public_articles')).rows[0].n, 0);
    for (const table of ['circuit_editorial_reviews', 'circuit_editorial_logins', 'circuit_editorial_principals']) {
      assert.equal((await db.query(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n, 0);
    }
    for (const table of ['circuit_editorial_principals','circuit_editorial_logins','circuit_editorial_reviews','circuit_editorial_contributors']) {
      assert.equal((await db.query("SELECT has_table_privilege($1,$2,'UPDATE') AS allowed", [untrustedRole, `${schema}.${table}`])).rows[0].allowed, false);
    }
    assert.equal((await db.query("SELECT has_function_privilege($1,$2,'EXECUTE') AS allowed", [untrustedRole, `${schema}.circuit_editorial_review(bigint,text)`])).rows[0].allowed, false);
    const replay = migrate(); assert.equal(replay.status, 0, replay.stderr);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM schema_migrations')).rows[0].n, 16);
    writeFileSync(join(temp, 'migrations', name), real + '\n-- forbidden checksum drift\n');
    const drift = migrate(); assert.notEqual(drift.status, 0); assert.match(drift.stderr, /Changed migration checksum/);
    assert.equal((await db.query('SELECT body_markdown FROM circuit_editorial_articles')).rows[0].body_markdown, body);
  } finally {
    await db.end(); await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); await admin.query(`DROP OWNED BY ${untrustedRole}`); await admin.query(`DROP ROLE IF EXISTS ${untrustedRole}`); await admin.end(); rmSync(temp, { recursive: true, force: true });
  }
});
