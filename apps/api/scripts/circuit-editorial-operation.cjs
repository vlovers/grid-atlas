'use strict';
// Server-only operator tool. No HTTP approval route and no caller-supplied reviewer.
const { articleSections } = require('./editorial-body.cjs');
const id = x => typeof x === 'string' && /^[1-9][0-9]{0,18}$/.test(x) && BigInt(x) <= 9223372036854775807n;
const sha = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
function argumentsFor(args) {
  const [action, article, revision, reviewId] = args;
  if (!['inspect', 'review', 'publish', 'withdraw'].includes(action) || !id(article) ||
    (['inspect', 'withdraw'].includes(action) && args.length !== 2) ||
    (action === 'review' && (args.length !== 3 || !sha(revision))) ||
    (action === 'publish' && (args.length !== 4 || !sha(revision) || !id(reviewId)))) {
    throw Error('Usage: circuit-editorial-operation.cjs inspect|withdraw <article-id> OR review <id> <revision-sha256> OR publish <id> <reviewed-sha256> <review-id>');
  }
  return { action, article, revision, reviewId };
}
async function operate(client, options) {
  const { action, article, revision, reviewId } = options;
  await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
  try {
    let result;
    if (action === 'inspect') {
      result = await client.query('SELECT circuit_editorial_inspect($1) AS result', [article]);
    } else if (action === 'review') {
      // This validates rendering only. The individual operator must separately
      // inspect ALL source evidence and bilingual content before confirmation.
      const inspected = await client.query('SELECT circuit_editorial_inspect($1) AS result', [article]);
      const candidate = inspected.rows[0].result;
      if (!candidate.manifest || candidate.revision_sha256 !== revision) throw Error('stale circuit revision');
      articleSections(candidate.manifest.article.body_markdown, candidate.manifest.claims);
      result = await client.query('SELECT circuit_editorial_review($1,$2) AS result', [article, revision]);
    } else if (action === 'publish') {
      result = await client.query('SELECT circuit_editorial_publish($1,$2,$3) AS result', [article, reviewId, revision]);
    } else {
      await client.query('SELECT circuit_editorial_withdraw($1)', [article]);
      result = { rows: [{ result: { withdrawn: true, article_id: article } }] };
    }
    await client.query('COMMIT');
    return result.rows[0].result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
async function main(args) {
  const options = argumentsFor(args);
  if (!process.env.DATABASE_URL) throw Error('individual authenticated DATABASE_URL required');
  if (options.action !== 'inspect' && process.env.CIRCUIT_EDITORIAL_OPERATION_CONFIRM !==
      ({ review: 'I_REVIEWED_ALL_CLAIMS_AND_EVIDENCE', publish: 'PUBLISH_EXACT_REVIEWED_REVISION', withdraw: 'WITHDRAW_CIRCUIT_ARTICLE' })[options.action]) {
    throw Error('explicit operation-specific human confirmation required');
  }
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    const client = await pool.connect();
    try { console.log(JSON.stringify(await operate(client, options), null, 2)); }
    finally { client.release(); }
  } finally { await pool.end(); }
}
if (require.main === module) main(process.argv.slice(2)).catch(error => {
  // Do not print connection strings, manuscript payloads or stack traces.
  console.error(error.message); process.exitCode = 1;
});
module.exports = { argumentsFor, operate };
