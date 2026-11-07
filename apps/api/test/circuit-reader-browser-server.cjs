// Actual Nest/PostgreSQL browser harness. Synthetic schemas/credentials only.
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/module');
const { securityFixture } = require('./support/circuit-security.cjs');
const { stage } = require('../scripts/stage-circuit-editorial.cjs');
const { writeFile, mkdir, rm, rename } = require('node:fs/promises');
const { join } = require('node:path');
const { randomUUID } = require('node:crypto');
const { syntheticCircuitMedia, syntheticCircuitDiagram, svg } = require('./support/circuit-reader-media.cjs');
let f, app;
let mediaPath;
const mediaFile = process.env.CIRCUIT_MEDIA_PUBLICATION_FILE;
const token = process.env.CIRCUIT_BROWSER_CONTROL_TOKEN;
if (!token || !process.env.DATABASE_URL || !mediaFile) throw Error('disposable database and isolated fixture token/media file required');
async function cleanup() {
  if (app) await app.close(); if (f) await f.cleanup();
  if (mediaPath) await rm(mediaPath, { force: true });
  await rm(mediaFile, { force: true });
}
async function main() {
  f = await securityFixture(process.env.DATABASE_URL, 'circuit_reader');
  // Exercise the bounded production reader using synthetic identities and prose.
  // These names choose its routing contract; they are never historical approval.
  const batch = require('../../../tests/fixtures/circuit-production-cohort.json').circuits.map(row => row.circuit_id);
  const draftInBatch = async () => {
    const draft = await f.draft();
    const external = batch.shift();
    if (!external) throw Error('synthetic reader fixtures exceeded the exact twenty-circuit scope');
    await f.db.query('UPDATE external_identities SET external_id=$1 WHERE id=$2', [external, draft.external_identity_id]);
    draft.bundle.circuit_external_id = external;
    return draft;
  };
  const published = await draftInBatch();
  // Extend the test manuscript through the same least-privilege writer, before review.
  const second = 'Synthetic layout-context claim; not a historical assertion.';
  const writerChapter = await f.actors.writer.connect();
  try {
    await writerChapter.query('BEGIN');
    const added = (await writerChapter.query("INSERT INTO circuit_editorial_claims(circuit_id,statement,status) VALUES($1,$2,'needs_review') RETURNING id", [published.circuit_id, second])).rows[0];
    await writerChapter.query('INSERT INTO circuit_editorial_evidence(claim_id,source_id,locator,supports) VALUES($1,$2,$3,false)', [added.id, published.source_id, 'Synthetic paragraph 2']);
    await writerChapter.query('INSERT INTO circuit_editorial_article_claims(article_id,claim_id) VALUES($1,$2)', [published.article_id, added.id]);
    published.bundle.body_markdown += '\n\n## Layout context\n\n' + second;
    published.bundle.claims.push({ statement: second, evidence: [{ ...published.bundle.claims[0].evidence[0], locator: 'Synthetic paragraph 2' }] });
    await writerChapter.query('UPDATE circuit_editorial_articles SET body_markdown=$1 WHERE id=$2', [published.bundle.body_markdown, published.article_id]);
    await writerChapter.query('COMMIT');
  } catch (error) { await writerChapter.query('ROLLBACK'); throw error; }
  finally { writerChapter.release(); }
  const ukrainian = structuredClone(published.bundle);
  ukrainian.locale = 'uk'; ukrainian.title = 'Синтетична редакційна стаття';
  ukrainian.claims[0].statement = 'Синтетичне твердження для перевірки системи.';
  ukrainian.claims[1].statement = 'Синтетичне твердження про контекст конфігурації; не історичний факт.';
  ukrainian.body_markdown = '## Контекст\n\n' + ukrainian.claims[0].statement + '\n\n## Контекст конфігурації\n\n' + ukrainian.claims[1].statement;
  let uk;
  const writer = await f.actors.writer.connect();
  try { uk = await stage(writer, ukrainian, 'synthetic-circuit-security'); } finally { writer.release(); }
  const privateDraft = await draftInBatch();
  await f.actors.writer.query("UPDATE circuit_editorial_articles SET title='PRIVATE CIRCUIT DRAFT NEVER RENDER' WHERE id=$1", [privateDraft.article_id]);
  const outage = await draftInBatch(); const malformed = await draftInBatch(); const xss = await draftInBatch();
  const malicious = 'Synthetic escaped claim: <script>window.__circuitXss=true</script>';
  await f.actors.writer.query('UPDATE circuit_editorial_articles SET body_markdown=$1 WHERE id=$2', ['## Context\n\n' + malicious, xss.article_id]);
  await f.actors.writer.query('UPDATE circuit_editorial_claims SET statement=$1 WHERE id=$2', [malicious, xss.claim_id]);
  const revocable = {};
  const sourceRevocable = {};
  for (const project of ['desktop', 'mobile', 'webkit']) revocable[project] = await draftInBatch();
  for (const project of ['desktop', 'mobile', 'webkit']) sourceRevocable[project] = await draftInBatch();
  const media = {}, mediaAssets = [];
  const fileName = `synthetic-circuit-reader-${randomUUID()}.svg`;
  mediaPath = join(__dirname, '../../web/public/media', fileName);
  await mkdir(join(__dirname, '../../web/public/media'), { recursive: true });
  await writeFile(mediaPath, svg, { flag: 'wx' });
  for (const project of ['desktop', 'mobile', 'webkit']) {
    const draft = await draftInBatch(); media[project] = draft.circuit_id;
    const identity = (await f.db.query('SELECT external_id FROM external_identities WHERE id=$1', [draft.external_identity_id])).rows[0].external_id;
    mediaAssets.push(syntheticCircuitMedia(`synthetic-media-${project}`, identity, `/media/${fileName}`));
  }
  const diagrams = {};
  const sourceId = (await f.db.query('SELECT source_id FROM external_identities WHERE id=$1', [published.external_identity_id])).rows[0].source_id;
  const releaseId = (await f.db.query("INSERT INTO source_releases(source_id,release_tag,artifact_name,sha256) VALUES($1,'synthetic-v1','synthetic-diagram-fixture.json',repeat('a',64)) RETURNING id", [sourceId])).rows[0].id;
  await f.db.query('INSERT INTO historical_seasons(year) VALUES(1950) ON CONFLICT DO NOTHING');
  for (const [index, project] of ['desktop', 'mobile', 'webkit'].entries()) {
    const draft = await draftInBatch();
    const identity = (await f.db.query('SELECT external_id FROM external_identities WHERE id=$1', [draft.external_identity_id])).rows[0].external_id;
    const externalRaceId = `synthetic-race-${project}`;
    const raceIdentity = (await f.db.query("INSERT INTO external_identities(source_id,entity_kind,external_id) VALUES($1,'race',$2) RETURNING id", [sourceId, externalRaceId])).rows[0].id;
    const raceId = (await f.db.query("INSERT INTO historical_races(external_identity_id,season_year,round,circuit_id,official_name) VALUES($1,1950,$2,$3,'Synthetic diagram event — not history') RETURNING id::text", [raceIdentity, index + 1, draft.circuit_id])).rows[0].id;
    const layoutExternal = `synthetic-layout-${project}`;
    const layoutId = (await f.db.query("INSERT INTO historical_circuit_layouts(circuit_id,external_layout_id,effective,length_km,turns,release_id,source_locator,content_hash) VALUES($1,$2,true,1.2,2,$3,'synthetic-layout-fixture',repeat('b',64)) RETURNING id::text", [draft.circuit_id, layoutExternal, releaseId])).rows[0].id;
    await f.db.query("INSERT INTO historical_race_circuit_facts(race_id,layout_id,course_length_km,turns,laps,distance_km,release_id,source_locator,content_hash) VALUES($1,$2,1.2,2,1,1.2,$3,'synthetic-event-fixture',repeat('c',64))", [raceId, layoutId, releaseId]);
    mediaAssets.push(syntheticCircuitDiagram(`synthetic-diagram-${project}`, identity, `/media/${fileName}`, layoutExternal, externalRaceId));
    diagrams[project] = { circuit: draft.circuit_id, race: raceId, external_race: externalRaceId, layout: layoutId };
  }
  const mediaJson = () => JSON.stringify({ schema_version: 2, lane: 'publication', assets: mediaAssets });
  await writeFile(mediaFile, mediaJson(), { flag: 'wx' });
  for (const article of [published, uk, xss, ...Object.values(revocable), ...Object.values(sourceRevocable)]) {
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
    revocable: Object.fromEntries(Object.entries(revocable).map(([key, value]) => [key, value.circuit_id])),
    sourceRevocable: Object.fromEntries(Object.entries(sourceRevocable).map(([key, value]) => [key, value.circuit_id])), media, diagrams };
  app.use(async (req, res, next) => {
    if (req.url === '/__fixture' && req.method === 'GET') return res.json({ ...state, articleRequests });
    if (req.url.startsWith('/__fixture/') && req.method === 'POST') {
      if (req.headers.authorization !== `Bearer ${token}`) return res.status(403).end();
      const action = req.url.slice('/__fixture/'.length);
      if (action.startsWith('withdraw-diagram-') && diagrams[action.slice(17)]) {
        mediaAssets.find(asset => asset.id === `synthetic-diagram-${action.slice(17)}`).status = 'withdrawn';
        await writeFile(mediaFile + '.next', mediaJson()); await rename(mediaFile + '.next', mediaFile);
        return res.json({ ok: true });
      }
      if (action.startsWith('remove-evidence-') && sourceRevocable[action.slice(16)]) {
        await f.actors.writer.query('DELETE FROM circuit_editorial_evidence WHERE claim_id=$1', [sourceRevocable[action.slice(16)].claim_id]);
        return res.json({ ok: true });
      }
      if (action.startsWith('withdraw-media-') && media[action.slice(15)]) {
        mediaAssets.find(asset => asset.id === `synthetic-media-${action.slice(15)}`).status = 'withdrawn';
        await writeFile(mediaFile + '.next', mediaJson()); await rename(mediaFile + '.next', mediaFile);
        return res.json({ ok: true });
      }
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
