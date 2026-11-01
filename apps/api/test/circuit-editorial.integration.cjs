const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/module');
const { stage } = require('../scripts/stage-circuit-editorial.cjs');
const { securityFixture } = require('./support/circuit-security.cjs');
const { operate } = require('../scripts/circuit-editorial-operation.cjs');
let f, app, base;
const originalUrl = process.env.DATABASE_URL;
const originalFlag = process.env.CIRCUIT_EDITORIAL_READ_ENABLED;
before(async () => {
  f = await securityFixture(originalUrl);
  // API uses the actual least-privilege reader login, not migration credentials.
  process.env.DATABASE_URL = f.actors.reader.options.connectionString;
  process.env.CIRCUIT_EDITORIAL_READ_ENABLED = '1';
  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api'); await app.listen(0, '127.0.0.1'); base = await app.getUrl();
});
after(async () => {
  if (app) await app.close(); if (f) await f.cleanup();
  process.env.DATABASE_URL = originalUrl;
  if (originalFlag === undefined) delete process.env.CIRCUIT_EDITORIAL_READ_ENABLED;
  else process.env.CIRCUIT_EDITORIAL_READ_ENABLED = originalFlag;
});
const read = (circuit, locale = 'en') => fetch(`${base}/api/circuits/${circuit}/article?locale=${locale}`);
const approved = async (locale = 'en') => {
  const d = await f.draft(locale); const r = await f.review(d.article_id); await f.publish(d.article_id, r); return { ...d, receipt: r };
};
const rejected = (promise, expression = /permission denied|trusted circuit|registered individual|author cannot|immutable|server assigned|cannot update view/) => assert.rejects(promise, expression);

test('real individual TCP logins, canonical authorship, default-off and locale validation', async () => {
  const d = await f.draft();
  assert.equal((await f.actors.writer.query('SELECT session_user AS actor')).rows[0].actor, f.roles.writer);
  assert.equal((await f.state(d.article_id)).author_principal, 'writer');
  assert.equal((await read(d.circuit_id)).status, 404);
  for (const locale of ['fr', 'EN', 'en&locale=uk']) assert.equal((await read(d.circuit_id, locale)).status, 400);
  for (const id of ['0', '-1', 'x', '9223372036854775808']) assert.equal((await read(id)).status, 400);
  const ready = await approved();
  for (const flag of [undefined, '0', 'true', '']) {
    if (flag === undefined) delete process.env.CIRCUIT_EDITORIAL_READ_ENABLED; else process.env.CIRCUIT_EDITORIAL_READ_ENABLED = flag;
    const response = await read(ready.circuit_id); assert.equal(response.status, 404); assert.match(response.headers.get('cache-control'), /no-store/);
  }
  process.env.CIRCUIT_EDITORIAL_READ_ENABLED = '1';
  assert.equal((await read(ready.circuit_id)).status, 200);
});

test('separate reviewer and publisher produce exact EN/UK evidence projections without private metadata', async () => {
  for (const locale of ['en', 'uk']) {
    const d = await approved(locale); const response = await read(d.circuit_id, locale);
    assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /private.*no-store/);
    const { data } = await response.json(); assert.equal(data.locale, locale);
    assert.equal(data.body_markdown, d.bundle.body_markdown);
    assert.deepEqual(data.sections, [{ heading: locale === 'uk' ? 'Контекст' : 'Context', claim_ids: [d.claim_id] }]);
    assert.equal(data.claims[0].evidence[0].locator, 'Synthetic paragraph 1');
    assert.equal(data.references[0].url, d.bundle.claims[0].evidence[0].source_url);
    for (const key of ['circuit_id', 'reviewer', 'author', 'author_principal', 'trusted_review_id', 'review_revision_sha256']) assert.equal(data[key], undefined);
    assert.equal((await read(d.circuit_id, locale === 'en' ? 'uk' : 'en')).status, 404);
  }
});

test('forged approval metadata, pre-supported evidence and protected receipts are rejected even with broad table DML', async () => {
  const d = await f.draft();
  await f.db.query(`GRANT SELECT,UPDATE ON circuit_editorial_articles,circuit_editorial_claims,circuit_editorial_evidence TO ${f.roles.writer}`);
  for (const sql of [
    `UPDATE circuit_editorial_articles SET status='published',reviewer=session_user,reviewed_at=now(),published_at=now(),review_revision_sha256=repeat('a',64) WHERE id=${d.article_id}`,
    `UPDATE circuit_editorial_claims SET status='verified',reviewer=session_user,reviewed_at=now() WHERE id=${d.claim_id}`,
    `UPDATE circuit_editorial_evidence SET supports=true WHERE claim_id=${d.claim_id}`,
  ]) await rejected(f.actors.writer.query(sql));
  await rejected(f.actors.writer.query('UPDATE circuit_editorial_reviews SET reviewer_login=session_user'));
  await rejected(f.actors.writer.query('UPDATE circuit_editorial_logins SET principal_id=$1', ['reviewer']));
  await rejected(f.actors.writer.query('UPDATE circuit_editorial_articles SET author_principal=$1 WHERE id=$2', ['reviewer', d.article_id]));
  assert.equal((await read(d.circuit_id)).status, 404);
});

test('author cannot self-review or self-publish under alternate author labels or alternate authenticated logins', async () => {
  const d = await f.draft();
  for (const actor of ['writer', 'alias']) await rejected(f.review(d.article_id, actor), /author cannot/);
  const receipt = await f.review(d.article_id);
  for (const actor of ['writer', 'alias']) await rejected(f.publish(d.article_id, receipt, actor), /author cannot/);
  assert.equal((await read(d.circuit_id)).status, 404);
});

test('missing role, missing registry, reader credentials and SET ROLE cannot authorize review', async () => {
  const d = await f.draft();
  await rejected(f.actors.reader.query('SELECT circuit_editorial_inspect($1)', [d.article_id]));
  await rejected(f.actors.publisher.query('SELECT circuit_editorial_review($1,$2)', [d.article_id, (await f.inspect(d.article_id)).revision_sha256]));
  await f.admin.query(`GRANT USAGE ON SCHEMA ${f.schema} TO ${f.roles.stranger}`);
  await f.admin.query(`GRANT EXECUTE ON FUNCTION ${f.schema}.circuit_editorial_review(BIGINT,TEXT) TO ${f.roles.stranger}`);
  await f.admin.query(`GRANT grid_circuit_reviewer TO ${f.roles.stranger}`);
  await rejected(f.actors.stranger.query('SELECT circuit_editorial_review($1,$2)', [d.article_id, (await f.inspect(d.article_id)).revision_sha256]));
  const client = await f.actors.stranger.connect();
  try { await client.query('SET ROLE grid_circuit_reviewer'); await rejected(client.query('SELECT circuit_editorial_review($1,$2)', [d.article_id, (await f.inspect(d.article_id)).revision_sha256])); }
  finally { await client.query('RESET ROLE'); client.release(); }
});

test('temporary pg_roles and hostile search_path cannot grant capability or shadow graph tables', async () => {
  const d = await f.draft();
  const client = await f.actors.stranger.connect();
  try {
    await client.query('CREATE TEMP TABLE pg_roles(rolname name,rolsuper boolean,oid oid,rolcanlogin boolean)');
    await client.query('INSERT INTO pg_temp.pg_roles VALUES(session_user,true,1,true)');
    await client.query('CREATE TEMP TABLE circuit_editorial_articles(id bigint,status text)');
    await client.query(`SET search_path TO pg_temp,${f.schema},pg_catalog`);
    await rejected(client.query(`SELECT ${f.schema}.circuit_editorial_review($1,$2)`, [d.article_id, (await f.inspect(d.article_id)).revision_sha256]));
    await rejected(client.query(`SELECT ${f.schema}.circuit_editorial_actor_allowed('grid_circuit_reviewer')`));
  } finally { client.release(true); }
  assert.equal((await read(d.circuit_id)).status, 404);
});

for (const [name, mutation] of [
  ['body/title', d => f.actors.writer.query('UPDATE circuit_editorial_articles SET title=title||$1 WHERE id=$2', [' revised', d.article_id])],
  ['claim statement', d => f.actors.writer.query('UPDATE circuit_editorial_claims SET statement=statement||$1 WHERE id=$2', [' revised', d.claim_id])],
  ['source metadata', d => f.db.query('UPDATE content_sources SET title=title||$1 WHERE id=$2', [' revised', d.source_id])],
  ['source URL', d => f.db.query('UPDATE content_sources SET source_url=source_url||$1 WHERE id=$2', ['/changed', d.source_id])],
  ['evidence locator', d => f.actors.writer.query('UPDATE circuit_editorial_evidence SET locator=$1 WHERE claim_id=$2', ['Changed paragraph', d.claim_id])],
  ['evidence deletion', d => f.actors.writer.query('DELETE FROM circuit_editorial_evidence WHERE claim_id=$1', [d.claim_id])],
  ['claim link deletion', d => f.actors.writer.query('DELETE FROM circuit_editorial_article_claims WHERE article_id=$1', [d.article_id])],
  ['claim dispute', d => f.actors.writer.query("UPDATE circuit_editorial_claims SET status='disputed' WHERE id=$1", [d.claim_id])],
  ['canonical identity', d => f.db.query('UPDATE external_identities SET external_id=external_id||$1 WHERE id=$2', ['-changed', d.external_identity_id])],
  ['circuit identity display', d => f.db.query('UPDATE historical_circuits SET display_name=display_name||$1 WHERE id=$2', [' changed', d.circuit_id])],
]) test(`${name} revokes a trusted publication and receipt replay cannot restore it`, async () => {
  const d = await approved(); await mutation(d);
  assert.equal((await read(d.circuit_id)).status, 404);
  const state = await f.state(d.article_id); assert.equal(state.trusted_review_id, null); assert.notEqual(state.status, 'published');
  await rejected(f.publish(d.article_id, d.receipt), /stale or absent/);
});

test('source deletion is restricted; deleting evidence then source revokes approval atomically', async () => {
  const d = await approved();
  await assert.rejects(f.db.query('DELETE FROM content_sources WHERE id=$1', [d.source_id]), /foreign key/);
  assert.equal((await read(d.circuit_id)).status, 200);
  const c = await f.db.connect();
  try { await c.query('BEGIN'); await c.query('DELETE FROM circuit_editorial_evidence WHERE claim_id=$1', [d.claim_id]);
    await c.query('DELETE FROM content_sources WHERE id=$1', [d.source_id]); await c.query('COMMIT'); }
  finally { c.release(); }
  assert.equal((await read(d.circuit_id)).status, 404);
});

test('withdrawal, actor disable/rebind and restored source bytes require a new independent review', async () => {
  const d = await approved();
  await f.actors.publisher.query('SELECT circuit_editorial_withdraw($1)', [d.article_id]);
  assert.equal((await f.state(d.article_id)).status, 'withdrawn');
  await rejected(f.publish(d.article_id, d.receipt), /stale or absent/);
  const receipt = await f.review(d.article_id); await f.publish(d.article_id, receipt);
  await f.db.query("UPDATE circuit_editorial_logins SET active=false WHERE role_name=$1", [f.roles.reviewer]);
  assert.equal((await read(d.circuit_id)).status, 404);
  await f.db.query("UPDATE circuit_editorial_logins SET active=true WHERE role_name=$1", [f.roles.reviewer]);
  assert.equal((await read(d.circuit_id)).status, 404);
  const r = await f.review(d.article_id); await f.publish(d.article_id, r);
  await f.db.query("UPDATE content_sources SET title='Changed' WHERE id=$1", [d.source_id]);
  await f.db.query("UPDATE content_sources SET title='Synthetic evidence' WHERE id=$1", [d.source_id]);
  assert.equal((await read(d.circuit_id)).status, 404);
  await rejected(f.publish(d.article_id, r), /stale or absent/);
});

test('candidate compare-and-swap rejects stale source revisions, uncovered prose and unbound legacy authors', async () => {
  const d = await f.draft(); const inspected = await f.inspect(d.article_id);
  await f.db.query("UPDATE content_sources SET publisher='New publisher' WHERE id=$1", [d.source_id]);
  await rejected(f.review(d.article_id, 'reviewer', inspected.revision_sha256), /stale circuit revision/);
  await f.actors.writer.query("UPDATE circuit_editorial_articles SET body_markdown='Uncovered prose.' WHERE id=$1", [d.article_id]);
  await rejected(f.review(d.article_id), /exact prose/);
  const legacy = await f.draft();
  // Simulate a preserved pre0016 draft under DBA control; no public writer can do this.
  await f.db.query('ALTER TABLE circuit_editorial_articles DISABLE TRIGGER circuit_article_02_author');
  await f.db.query('UPDATE circuit_editorial_articles SET author_principal=NULL WHERE id=$1', [legacy.article_id]);
  await f.db.query('ALTER TABLE circuit_editorial_articles ENABLE TRIGGER circuit_article_02_author');
  await rejected(f.review(legacy.article_id), /unbound/);
});

test('strict staging is create-only, repeatable failure is atomic, and review operations roll back cleanly', async () => {
  const d = await f.draft(); const before = await f.state(d.article_id);
  const c = await f.actors.writer.connect();
  try { await assert.rejects(stage(c, d.bundle, 'synthetic-circuit-security'), /refuse overwrite/); }
  finally { c.release(); }
  assert.equal((await f.state(d.article_id)).review_generation, before.review_generation);
  const reviewer = await f.actors.reviewer.connect();
  try {
    await reviewer.query('BEGIN');
    await reviewer.query('SELECT circuit_editorial_review($1,$2)', [d.article_id, (await f.inspect(d.article_id)).revision_sha256]);
    await reviewer.query('ROLLBACK');
  } finally { reviewer.release(); }
  assert.equal((await f.state(d.article_id)).trusted_review_id, null);
  const reviewed = await f.review(d.article_id); await f.publish(d.article_id, reviewed);
  assert.equal((await read(d.circuit_id)).status, 200);
});

async function waitingForAdvisory(client) {
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    if ((await f.db.query("SELECT 1 FROM pg_catalog.pg_locks WHERE pid=$1 AND locktype='advisory' AND NOT granted", [client.processID])).rowCount) return;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  assert.fail('expected the concurrent operation to wait on the editorial advisory lock');
}

for (const order of ['mutation-first', 'publication-first']) {
  for (const target of ['article', 'evidence', 'source', 'link']) {
    test(`concurrent ${target} mutation and publication: ${order} leaves no stale public approval`, async () => {
      const d = await f.draft(); const r = await f.review(d.article_id);
      const publishing = await f.actors.publisher.connect(); const changing = await f.db.connect();
      const sql = { article: ['UPDATE circuit_editorial_articles SET title=title||$1 WHERE id=$2', [' changed', d.article_id]],
        evidence: ['DELETE FROM circuit_editorial_evidence WHERE claim_id=$1', [d.claim_id]],
        source: ['UPDATE content_sources SET title=title||$1 WHERE id=$2', [' changed', d.source_id]],
        link: ['DELETE FROM circuit_editorial_article_claims WHERE article_id=$1', [d.article_id]] }[target];
      try {
        await publishing.query('BEGIN'); await changing.query('BEGIN');
        if (order === 'mutation-first') {
          await changing.query(...sql);
          const pending = publishing.query('SELECT circuit_editorial_publish($1,$2,$3)', [d.article_id, r.review_id, r.revision_sha256]).then(() => null, e => e);
          await waitingForAdvisory(publishing); await changing.query('COMMIT');
          assert.match((await pending).message, /stale or absent/); await publishing.query('ROLLBACK');
        } else {
          await publishing.query('SELECT circuit_editorial_publish($1,$2,$3)', [d.article_id, r.review_id, r.revision_sha256]);
          const pending = changing.query(...sql);
          await waitingForAdvisory(changing); await publishing.query('COMMIT');
          await pending; await changing.query('COMMIT');
        }
        assert.equal((await read(d.circuit_id)).status, 404);
        assert.equal((await f.state(d.article_id)).trusted_review_id, null);
      } finally { await publishing.query('ROLLBACK'); await changing.query('ROLLBACK'); publishing.release(); changing.release(); }
    });
  }
}

test('repeatable-read approval is refused; server operation uses READ COMMITTED with rollback on stale revision', async () => {
  const d = await f.draft(); const revision = (await f.inspect(d.article_id)).revision_sha256;
  const c = await f.actors.reviewer.connect();
  try {
    await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    await rejected(c.query('SELECT circuit_editorial_review($1,$2)', [d.article_id, revision]), /READ COMMITTED/); await c.query('ROLLBACK');
    await rejected(operate(c, { action: 'review', article: d.article_id, revision: 'f'.repeat(64) }), /stale/);
    const reviewed = await operate(c, { action: 'review', article: d.article_id, revision }); assert.equal(reviewed.published, false);
  } finally { c.release(); }
});

test('public reader has no direct draft-table, receipt, registry or write privileges', async () => {
  for (const relation of ['circuit_editorial_articles', 'circuit_editorial_claims', 'circuit_editorial_evidence', 'content_sources', 'circuit_editorial_reviews', 'circuit_editorial_logins']) {
    await rejected(f.actors.reader.query(`SELECT * FROM ${relation}`));
  }
  await rejected(f.actors.reader.query('UPDATE circuit_editorial_public_articles SET data=$1', [{}]));
});

test('every material contributor, including aliases editing another author, is excluded from reviewing', async () => {
  await f.admin.query(`GRANT grid_circuit_stager TO ${f.roles.reviewer}`);
  for (const kind of ['article', 'claim', 'evidence', 'source']) {
    const d = await f.draft();
    if (kind === 'article') await f.actors.reviewer.query("UPDATE circuit_editorial_articles SET title=title||' edited' WHERE id=$1", [d.article_id]);
    if (kind === 'claim') await f.actors.reviewer.query("UPDATE circuit_editorial_claims SET statement=statement||' edited' WHERE id=$1", [d.claim_id]);
    if (kind === 'evidence') await f.actors.reviewer.query("UPDATE circuit_editorial_evidence SET locator='edited locator' WHERE claim_id=$1", [d.claim_id]);
    if (kind === 'source') {
      await f.admin.query(`GRANT UPDATE ON ${f.schema}.content_sources TO ${f.roles.reviewer}`);
      await f.actors.reviewer.query("UPDATE content_sources SET title=title||' edited' WHERE id=$1", [d.source_id]);
    }
    await rejected(f.review(d.article_id), /author cannot/);
    await rejected(f.actors.reviewer.query("DELETE FROM circuit_editorial_contributors WHERE principal_id='reviewer'"));
  }
  await f.admin.query(`REVOKE grid_circuit_stager FROM ${f.roles.reviewer}`);
});

test('SQL body validation matches existing JS normalization for trailing LF, CRLF and Ukrainian whitespace', async () => {
  const claim = 'Synthetic circuit security claim.';
  for (const body of [`## Context\n\n${claim}\n`, `\r\n## Context\r\n\r\n${claim}\r\n`, `\u00a0\u202f## Context\n\n${claim}\n\u00a0`]) {
    const d = await f.draft('en', body); const receipt = await f.review(d.article_id); await f.publish(d.article_id, receipt);
    assert.equal((await read(d.circuit_id)).status, 200);
  }
  for (const body of [`## Empty\n\n## Context\n\n${claim}`, `${claim}\n\n${claim}`, `${claim}\n\nUnknown prose.`]) {
    const d = await f.draft(); await f.actors.writer.query('UPDATE circuit_editorial_articles SET body_markdown=$1 WHERE id=$2', [body, d.article_id]);
    await rejected(f.review(d.article_id), /exact prose/);
  }
});

test('review revision is stable across TimeZone, DateStyle and hostile search_path settings', async () => {
  const d = await f.draft(); const reviewer = await f.actors.reviewer.connect(); const publisher = await f.actors.publisher.connect(); const reader = await f.actors.reader.connect();
  try {
    await reviewer.query("SET TimeZone='Europe/Kyiv'"); await reviewer.query("SET DateStyle='German, DMY'");
    const inspected = (await reviewer.query('SELECT circuit_editorial_inspect($1) AS result', [d.article_id])).rows[0].result;
    const receipt = (await reviewer.query('SELECT circuit_editorial_review($1,$2) AS result', [d.article_id, inspected.revision_sha256])).rows[0].result;
    await publisher.query("SET TimeZone='America/New_York'");
    await publisher.query('SELECT circuit_editorial_publish($1,$2,$3)', [d.article_id, receipt.review_id, receipt.revision_sha256]);
    await reader.query("SET TimeZone='Pacific/Auckland'"); await reader.query("SET DateStyle='SQL, DMY'");
    assert.equal((await reader.query('SELECT data FROM circuit_editorial_public_articles')).rows.some(row => row.data.id === d.article_id), true);
  } finally {
    for (const c of [reviewer, publisher, reader]) { await c.query('RESET ALL'); c.release(); }
  }
});

test('DBA lifecycle revoke/regrant and deactivate/reactivate cannot resurrect receipts', async () => {
  const d = await approved();
  for (const enabled of [false, true]) {
    await f.db.query('SELECT circuit_editorial_configure_actor($1,$2,$3,$4,$5)', [f.roles.reviewer, 'reviewer', 'Synthetic reviewer', ['grid_circuit_reviewer'], enabled]);
    assert.equal((await read(d.circuit_id)).status, 404);
  }
  await rejected(f.publish(d.article_id, d.receipt), /stale or absent/);
  await rejected(f.db.query('SELECT circuit_editorial_configure_actor($1,$2,$3,$4,true)', [f.roles.reviewer, 'different-person', 'Invented reassignment', ['grid_circuit_reviewer']]), /cannot reassign/);
  await rejected(f.actors.writer.query('SELECT circuit_editorial_configure_actor($1,$2,$3,$4,false)', [f.roles.reviewer, 'reviewer', 'name', []]));
});

test('dangerous owner membership, schema CREATE and unsafe login attributes fail closed at runtime', async () => {
  const d = await f.draft();
  const { rows: [owner] } = await f.db.query('SELECT current_user AS name');
  const inspected = await f.inspect(d.article_id);
  await f.admin.query(`GRANT ${owner.name} TO ${f.roles.reviewer}`);
  try { await rejected(f.review(d.article_id, 'reviewer', inspected.revision_sha256)); }
  finally { await f.admin.query(`REVOKE ${owner.name} FROM ${f.roles.reviewer}`); }
  await f.admin.query(`GRANT CREATE ON SCHEMA ${f.schema} TO ${f.roles.reviewer}`);
  try { await rejected(f.review(d.article_id)); }
  finally { await f.admin.query(`REVOKE CREATE ON SCHEMA ${f.schema} FROM ${f.roles.reviewer}`); }
  const receipt = await f.review(d.article_id);
  await f.admin.query(`ALTER ROLE ${f.roles.reviewer} CREATEDB`);
  try { await rejected(f.publish(d.article_id, receipt), /reviewer no longer trusted/); }
  finally { await f.admin.query(`ALTER ROLE ${f.roles.reviewer} NOCREATEDB`); }
});

test('unrelated driver source updates remain compatible with non-circuit editors', async () => {
  await f.admin.query(`GRANT SELECT,UPDATE,INSERT ON ${f.schema}.content_sources TO ${f.roles.stranger}`);
  const { rows: [source] } = await f.actors.stranger.query("INSERT INTO content_sources(source_url,title,publisher,accessed_on) VALUES($1,'Other source','Other publisher',CURRENT_DATE) RETURNING id", [`https://example.org/unrelated-${f.schema}`]);
  await f.actors.stranger.query("UPDATE content_sources SET title='Updated unrelated source' WHERE id=$1", [source.id]);
});

test('nested membership cannot silently expand the DBA lifecycle capability set', async () => {
  const nested = `nested_${f.schema}`;
  await f.admin.query(`CREATE ROLE ${nested} NOLOGIN`);
  try {
    await f.admin.query(`GRANT grid_circuit_publisher TO ${nested}`);
    await f.admin.query(`GRANT ${nested} TO ${f.roles.reviewer}`);
    await rejected(f.db.query('SELECT circuit_editorial_configure_actor($1,$2,$3,$4,true)', [f.roles.reviewer, 'reviewer', 'Synthetic reviewer', ['grid_circuit_reviewer']]), /unexpected inherited/);
  } finally {
    await f.admin.query(`REVOKE ${nested} FROM ${f.roles.reviewer}`);
    await f.admin.query(`DROP OWNED BY ${nested}`); await f.admin.query(`DROP ROLE ${nested}`);
  }
});

test('held repeatable-read reader snapshots cannot expose withdrawn material', async () => {
  const d = await approved(); const c = await f.actors.reader.connect();
  try {
    await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    assert.equal((await c.query('SELECT circuit_editorial_public_payload($1) AS data', [d.article_id])).rows[0].data, null);
    await f.actors.publisher.query('SELECT circuit_editorial_withdraw($1)', [d.article_id]);
    assert.equal((await c.query('SELECT circuit_editorial_public_payload($1) AS data', [d.article_id])).rows[0].data, null);
    await c.query('ROLLBACK');
  } finally { c.release(); }
});

for (const order of ['edit-first', 'review-first']) test(`concurrent review and evidence edit: ${order} cannot retain a stale receipt`, async () => {
  const d = await f.draft(); const revision = (await f.inspect(d.article_id)).revision_sha256;
  const reviewing = await f.actors.reviewer.connect(); const editing = await f.actors.writer.connect();
  try {
    await reviewing.query('BEGIN'); await editing.query('BEGIN');
    if (order === 'edit-first') {
      await editing.query("UPDATE circuit_editorial_evidence SET locator='new location' WHERE claim_id=$1", [d.claim_id]);
      const pending = reviewing.query('SELECT circuit_editorial_review($1,$2)', [d.article_id, revision]).then(() => null, e => e);
      await waitingForAdvisory(reviewing); await editing.query('COMMIT');
      assert.match((await pending).message, /stale circuit revision/); await reviewing.query('ROLLBACK');
    } else {
      await reviewing.query('SELECT circuit_editorial_review($1,$2)', [d.article_id, revision]);
      const pending = editing.query("UPDATE circuit_editorial_evidence SET locator='new location' WHERE claim_id=$1", [d.claim_id]);
      await waitingForAdvisory(editing); await reviewing.query('COMMIT'); await pending; await editing.query('COMMIT');
    }
    assert.equal((await f.state(d.article_id)).trusted_review_id, null);
  } finally { await reviewing.query('ROLLBACK'); await editing.query('ROLLBACK'); reviewing.release(); editing.release(); }
});

test('inactive staging identities cannot mutate status or submit no-op invalidations', async () => {
  const d = await approved();
  await f.db.query('UPDATE circuit_editorial_logins SET active=false WHERE role_name=$1', [f.roles.writer]);
  try {
    await rejected(f.actors.writer.query("UPDATE circuit_editorial_articles SET status='draft' WHERE id=$1", [d.article_id]));
    await rejected(f.actors.writer.query('UPDATE circuit_editorial_evidence SET locator=locator WHERE claim_id=$1', [d.claim_id]));
  } finally { await f.db.query('UPDATE circuit_editorial_logins SET active=true WHERE role_name=$1', [f.roles.writer]); }
});

test('pending claims cannot store invented human review stamps', async () => {
  const d = await f.draft();
  await rejected(f.actors.writer.query(`INSERT INTO circuit_editorial_claims(circuit_id,statement,status,reviewer,reviewed_at)
    VALUES($1,'Forged pending claim','needs_review','Invented human',now())`, [d.circuit_id]), /server assigned/);
  assert.equal((await f.db.query('SELECT count(*)::int AS n FROM circuit_editorial_claims WHERE statement=$1', ['Forged pending claim'])).rows[0].n, 0);
});

test('known source creators remain contributors when another author reuses their provenance', async () => {
  const d = await f.draft();
  await f.admin.query(`GRANT SELECT,INSERT ON ${f.schema}.content_sources TO ${f.roles.reviewer}`);
  const { rows: [source] } = await f.actors.reviewer.query(`INSERT INTO content_sources(source_url,title,publisher,accessed_on)
    VALUES($1,'Reviewer candidate provenance','Test only','2026-11-01') RETURNING id`, [`https://example.org/creator-${f.schema}`]);
  await f.actors.writer.query(`INSERT INTO circuit_editorial_evidence(claim_id,source_id,locator,supports)
    VALUES($1,$2,'Candidate created by reviewer',false)`, [d.claim_id, source.id]);
  await rejected(f.review(d.article_id), /author cannot/);
});


test('known pre-link source editors remain contributors when another author later reuses that source', async () => {
  const d = await f.draft();
  const { rows: [source] } = await f.db.query(`INSERT INTO content_sources(source_url,title,publisher,accessed_on)
    VALUES($1,'Unlinked legacy provenance','Test only','2026-11-01') RETURNING id`, [`https://example.org/prelink-${f.schema}`]);
  await f.actors.reviewer.query("UPDATE content_sources SET title='Edited before first circuit reference' WHERE id=$1", [source.id]);
  await f.actors.writer.query(`INSERT INTO circuit_editorial_evidence(claim_id,source_id,locator,supports)
    VALUES($1,$2,'Candidate edited by reviewer before reuse',false)`, [d.claim_id, source.id]);
  await rejected(f.review(d.article_id), /author cannot/);
});

test('replacement trusted boundary rejects cross-circuit claims and AI article/claim review in PostgreSQL', async () => {
  const d = await f.draft(); const other = await f.draft();
  await rejected(f.actors.writer.query('INSERT INTO circuit_editorial_article_claims(article_id,claim_id) VALUES($1,$2)',
    [d.article_id, other.claim_id]), /cross-circuit/);
  assert.equal((await f.db.query('SELECT count(*)::int AS n FROM circuit_editorial_article_claims WHERE article_id=$1', [d.article_id])).rows[0].n, 1);
  await f.db.query("UPDATE circuit_editorial_articles SET review_method='ai' WHERE id=$1", [d.article_id]);
  await rejected(f.review(d.article_id), /AI/);
  await f.db.query("UPDATE circuit_editorial_claims SET review_method='ai' WHERE id=$1", [other.claim_id]);
  await rejected(f.review(other.article_id), /every claim/);
});

test('broad business-table writers cannot move primary identities away from protected contributor history', async () => {
  const d = await f.draft();
  await rejected(f.actors.writer.query('UPDATE circuit_editorial_articles SET id=DEFAULT WHERE id=$1', [d.article_id]), /primary identity is immutable/);
  await rejected(f.actors.writer.query('UPDATE circuit_editorial_claims SET id=DEFAULT WHERE id=$1', [d.claim_id]), /primary identity is immutable/);
});
