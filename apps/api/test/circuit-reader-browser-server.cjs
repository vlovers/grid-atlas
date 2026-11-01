// Actual Nest/PostgreSQL browser harness. Synthetic schemas/credentials only.
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/module');
const { securityFixture } = require('./support/circuit-security.cjs');
const { stage } = require('../scripts/stage-circuit-editorial.cjs');
let f, app;
const token = process.env.CIRCUIT_BROWSER_CONTROL_TOKEN;
if (!token || !process.env.DATABASE_URL) throw Error('disposable database and isolated fixture token required');
async function cleanup() { if (app) await app.close(); if (f) await f.cleanup(); }
async function main() {
  f = await securityFixture(process.env.DATABASE_URL, 'circuit_reader');
  const published = await f.draft();
  const ukrainian = structuredClone(published.bundle);
  ukrainian.locale = 'uk'; ukrainian.title = 'Синтетична редакційна стаття';
  ukrainian.claims[0].statement = 'Синтетичне твердження для перевірки системи.';
  ukrainian.body_markdown = '## Контекст\n\n' + ukrainian.claims[0].statement;
  let uk;
  const writer = await f.actors.writer.connect();
  try { uk = await stage(writer, ukrainian, 'synthetic-circuit-security'); } finally { writer.release(); }
  const privateDraft = await f.draft();
  await f.db.query("UPDATE external_identities SET external_id='monza' WHERE id=$1", [privateDraft.external_identity_id]);
  await f.actors.writer.query("UPDATE circuit_editorial_articles SET title='PRIVATE CIRCUIT DRAFT NEVER RENDER' WHERE id=$1", [privateDraft.article_id]);
  const outage = await f.draft(); const malformed = await f.draft(); const xss = await f.draft();
  const malicious = 'Synthetic escaped claim: <script>window.__circuitXss=true</script>';
  await f.actors.writer.query('UPDATE circuit_editorial_articles SET body_markdown=$1 WHERE id=$2', ['## Context\n\n' + malicious, xss.article_id]);
  await f.actors.writer.query('UPDATE circuit_editorial_claims SET statement=$1 WHERE id=$2', [malicious, xss.claim_id]);
  const revocable = {};
  for (const project of ['desktop', 'mobile', 'webkit']) revocable[project] = await f.draft();
  for (const article of [published, uk, xss, ...Object.values(revocable)]) {
    const receipt = await f.review(article.article_id); await f.publish(article.article_id, receipt);
  }
  // Essential circuit records are readable; draft/receipt/source base tables are not.
  const names = (await f.db.query(`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname=$1
    AND (tablename LIKE 'historical_%' OR tablename IN ('data_sources','source_releases','external_identities','source_observations','schema_migrations'))`, [f.schema])).rows;
  for (const { tablename } of names) await f.db.query(`GRANT SELECT ON ${tablename} TO ${f.roles.reader}`);
  process.env.DATABASE_URL = f.actors.reader.options.connectionString;
  process.env.CIRCUIT_EDITORIAL_READ_ENABLED = '1';
  app = await NestFactory.create(AppModule, { logger: false });
  let articleRequests = 0;
  const state = { published: published.circuit_id, private: privateDraft.circuit_id, outage: outage.circuit_id,
    malformed: malformed.circuit_id, xss: xss.circuit_id,
    revocable: Object.fromEntries(Object.entries(revocable).map(([key, value]) => [key, value.circuit_id])) };
  app.use(async (req, res, next) => {
    if (req.url === '/__fixture' && req.method === 'GET') return res.json({ ...state, articleRequests });
    if (req.url.startsWith('/__fixture/') && req.method === 'POST') {
      if (req.headers.authorization !== `Bearer ${token}`) return res.status(403).end();
      const action = req.url.slice('/__fixture/'.length);
      if (action === 'read-off' || action === 'read-on') { process.env.CIRCUIT_EDITORIAL_READ_ENABLED = action === 'read-on' ? '1' : '0'; return res.json({ ok: true }); }
      if (action.startsWith('withdraw-') && revocable[action.slice(9)]) {
        await f.actors.publisher.query('SELECT circuit_editorial_withdraw($1)', [revocable[action.slice(9)].article_id]); return res.json({ ok: true });
      }
      return res.status(404).end();
    }
    if (/^\/api\/circuits\/\d+\/article/.test(req.url)) {
      articleRequests++;
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      if (req.url.startsWith(`/api/circuits/${outage.circuit_id}/article`)) return res.status(503).json({ status: 'test_outage' });
      if (req.url.startsWith(`/api/circuits/${malformed.circuit_id}/article`)) return res.json({ data: { locale: 'wrong', title: 'PRIVATE INVALID RESPONSE' } });
    }
    next();
  });
  app.setGlobalPrefix('api'); await app.listen(3345, '127.0.0.1');
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { cleanup().then(() => process.exit(0)); });
}
main().catch(async error => { console.error(error); await cleanup(); process.exitCode = 1; });
