const {test}=require('node:test');
const assert=require('node:assert/strict');
const {assertBundle,publish}=require('../scripts/publish-editorial.cjs');
const sample=()=>({schema_version:1,release_kind:'approved_text_only',publication_status:'not_yet_published',
driver_external_id:'ayrton-senna',slug:'ayrton-senna',locale:'en',revision_sha256:'a'.repeat(64),
title:'Reviewed title',body_markdown:'## Career\n\nA documented claim.',
author:'Writer',reviewer:'Independent Editor',reviewed_on:'2026-10-21',
claims:[{claim_id:'c1',statement:'A documented claim.',reviewer:'Independent Editor',reviewed_on:'2026-10-21',
evidence:[{url:'https://www.fia.com/archive',title:'FIA record',publisher:'FIA',author:null,accessed_on:'2026-10-20',locator:'page 10'}]}]});
test('only precise reviewed bundle passes structural gate',()=>assert.equal(assertBundle(sample()).claims.length,1));
test('unapproved metadata is blocked',()=>{const x=sample();x.publication_status='published';assert.throws(()=>assertBundle(x))});
test('no unverified/no evidence claims',()=>{const x=sample();x.claims[0].evidence=[];assert.throws(()=>assertBundle(x))});
test('reject untrusted source scheme',()=>{const x=sample();x.claims[0].evidence[0].url='http://example.org';assert.throws(()=>assertBundle(x))});
test('reject same author and reviewer',()=>{const x=sample();x.reviewer=x.author;assert.throws(()=>assertBundle(x))});
test('reject duplicate claim keys',()=>{const x=sample();x.claims.push({...x.claims[0]});assert.throws(()=>assertBundle(x))});
test('rollback entire transaction when identity is absent',async()=>{
 const calls=[];const client={query:async(sql)=>{calls.push(sql);if(sql.includes('SELECT d.id::text'))return {rowCount:0,rows:[]};return {rowCount:0,rows:[]}}};
 await assert.rejects(()=>publish(client,sample()),/identity missing/);
 assert.equal(calls[0],'BEGIN');assert.equal(calls.at(-1),'ROLLBACK');
});
test('safe insertion order and commit on synthetic approved fixture',async()=>{
 const calls=[];
 const client={query:async(sql)=>{calls.push(sql);if(sql.includes('SELECT d.id::text'))return {rowCount:1,rows:[{id:'77'}]};
 if(sql.includes('SELECT id FROM content_articles'))return {rowCount:0,rows:[]};
 if(sql.includes('INSERT INTO content_claims'))return {rowCount:1,rows:[{id:'12'}]};
 if(sql.includes('INSERT INTO content_sources'))return {rowCount:1,rows:[{id:'3'}]};
 if(sql.includes('INSERT INTO content_articles'))return {rowCount:1,rows:[{id:'21'}]};
 if(sql.includes("UPDATE content_articles SET status='published'"))return {rowCount:1,rows:[{id:'21'}]};
 return {rowCount:1,rows:[]};}};
 const out=await publish(client,sample());
 assert.equal(out.article_id,'21');assert.equal(calls.at(-1),'COMMIT');
 assert.ok(calls.findIndex(x=>x.includes('content_claim_evidence('))<calls.findIndex(x=>x.includes("UPDATE content_claims SET status='verified'")));
 assert.ok(calls.findIndex(x=>x.includes('INSERT INTO content_article_claims'))<calls.findIndex(x=>x.includes("UPDATE content_articles SET status='published'")));
});
test('existing article never silently overwritten',async()=>{
 const calls=[];const client={query:async(sql)=>{calls.push(sql);
 if(sql.includes('SELECT d.id::text'))return {rowCount:1,rows:[{id:'77'}]};
 if(sql.includes('SELECT id FROM content_articles'))return {rowCount:1,rows:[{id:'99'}]};
 return {rowCount:0,rows:[]};}};
 await assert.rejects(()=>publish(client,sample()),/refuse overwrite/);assert.equal(calls.at(-1),'ROLLBACK');
});
