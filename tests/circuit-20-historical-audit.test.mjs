import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const d=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_CHAPTER_HISTORICAL_AUDIT_20261029.json',import.meta.url),'utf8'));
test('twenty distinct circuit research audits explicitly separate verified and unverified claims',()=>{
 assert.equal(d.chapters.length,20);
 assert.equal(new Set(d.chapters.map(x=>x.circuit_id)).size,20);
 assert.equal(d.publication_allowed,false);
 assert.equal(d.human_approval,false);
 for(const c of d.chapters){
  assert.equal(c.publication_allowed,false);
  assert.equal(c.human_approval,false);
  assert.ok(c.existing_source_urls.length>0);
  assert.ok(c.editorial_actions.en.length>45);
  assert.ok(c.editorial_actions.uk.length>45);
  assert.ok(c.research_finding.length>40);
  assert.equal(c.review_status,c.independent_source_reviewed?'partial_fact_verification':'verification_required');
  if(c.independent_source_reviewed) assert.match(c.independent_source_url,/^https:\/\/www\.formula1\.com\//);
  else assert.equal(c.independent_source_url,null);
 }
 assert.equal(d.chapters.filter(c=>c.independent_source_reviewed).length,3);
});