const {test}=require('node:test');const assert=require('node:assert/strict');const {Pool}=require('pg');const {publish,assertBundle}=require('../scripts/publish-editorial.cjs');
const digest='b'.repeat(64);
const bundle={schema_version:1,release_kind:'approved_text_only',publication_status:'not_yet_published',driver_external_id:'publication-test-driver',slug:'publication-test-driver',locale:'en',revision_sha256:digest,title:'Verified integration fixture',body_markdown:'## Career\n\nSynthetic recorded claim.',author:'Synthetic test author',reviewer:'Synthetic independent test reviewer',reviewed_on:'2026-10-21',
 claims:[{claim_id:'fixture-claim',statement:'Synthetic recorded claim.',reviewer:'Synthetic independent test reviewer',reviewed_on:'2026-10-21',evidence:[{url:'https://example.org/approved-fixture-record',title:'Synthetic fixture evidence',publisher:'Test publisher',author:null,accessed_on:'2026-10-21',locator:'Fixture line one'}]}]};
test('publication creates only exact approved locale and repeat attempt rolls back',async()=>{
 const pool=new Pool({connectionString:process.env.DATABASE_URL});
 const client=await pool.connect();
 try {
   await client.query(`INSERT INTO data_sources(slug,homepage_url,attribution) VALUES ('f1db','https://example.org/source','Synthetic test data') ON CONFLICT(slug) DO NOTHING`);
   const ext=await client.query(`INSERT INTO external_identities(source_id,entity_kind,external_id)
      SELECT id,'driver',$1 FROM data_sources WHERE slug='f1db'
      ON CONFLICT(source_id,entity_kind,external_id) DO UPDATE SET external_id=EXCLUDED.external_id RETURNING id`,[bundle.driver_external_id]);
   await client.query('INSERT INTO historical_drivers(external_identity_id,display_name) VALUES($1,$2) ON CONFLICT(external_identity_id) DO NOTHING',[ext.rows[0].id,'Synthetic editorial test driver']);
   assertBundle(bundle);
   const result=await publish(client,bundle);
   const article=await client.query('SELECT status,reviewer,locale FROM content_articles WHERE id=$1',[result.article_id]);
   assert.equal(article.rows[0].status,'published');
   assert.equal(article.rows[0].locale,'en');
   const claims=await client.query(`SELECT c.status,e.locator FROM content_claims c
      JOIN content_article_claims ac ON ac.claim_id=c.id
      JOIN content_claim_evidence e ON e.claim_id=c.id WHERE ac.article_id=$1`,[result.article_id]);
   assert.equal(claims.rows[0].status,'verified');
   assert.equal(claims.rows[0].locator,'Fixture line one');
   await assert.rejects(()=>publish(client,bundle),/existing locale article/);
   const count=await client.query('SELECT COUNT(*)::int AS n FROM content_articles WHERE subject_driver_id=$1',[result.driver_id]);
   assert.equal(count.rows[0].n,1);
   // Claim evidence revision must invalidate reviewed claim status.
   await client.query('UPDATE content_claim_evidence SET locator=$1 WHERE claim_id IN (SELECT claim_id FROM content_article_claims WHERE article_id=$2)',
       ['Updated synthetic locator',result.article_id]);
   const stale=await client.query(`SELECT count(*)::int AS n FROM content_claims c
      JOIN content_article_claims ac ON ac.claim_id=c.id
      WHERE ac.article_id=$1 AND c.status='verified'`,[result.article_id]);
   assert.equal(stale.rows[0].n,0);
 } finally {client.release();await pool.end();}
});
