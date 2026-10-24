import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

function report(script, args=[]) {
  const result=spawnSync(process.execPath,[script,...args],{encoding:'utf8'});
  assert.equal(result.status,0,script+': '+result.stderr+'\n'+result.stdout);
  return JSON.parse(result.stdout);
}

test('coverage, corroboration queue and human-review worksheet agree on all research claims',()=>{
  const coverage=report('scripts/editorial-content-coverage.mjs');
  const queue=report('scripts/editorial-corroboration-queue.mjs');
  const worksheet=report('scripts/editorial-review-packet.mjs');
  assert.equal(coverage.totals.candidates,30);
  assert.equal(coverage.totals.research_drafts,25);
  assert.equal(coverage.totals.research_claims_with_evidence,96);
  assert.equal(queue.totals.claims,96);
  assert.equal(worksheet.totals.claims,96);
  assert.equal(queue.totals.claims_with_independent_publisher_links,worksheet.totals.with_independent_publisher_links);
  assert.equal(queue.totals.pending_independent_publisher,worksheet.totals.awaiting_second_publisher);
  assert.equal(coverage.totals.research_claims_with_independent_corroboration,worksheet.totals.with_independent_publisher_links);
  assert.equal(coverage.totals.approved_for_publication,0);
  assert.equal(queue.totals.approved_for_publication,0);
  assert.equal(worksheet.totals.human_approved,0);
  assert.equal(worksheet.totals.published,0);
});

test('review worksheet retains unique bilingual claim identities and unpublished status',()=>{
  const worksheet=report('scripts/editorial-review-packet.mjs');
  const ids=new Set();
  for(const claim of worksheet.claims){
    const key=claim.driver_id+':'+claim.claim_id;
    assert.ok(!ids.has(key),'duplicate worksheet claim: '+key);
    ids.add(key);
    assert.ok(claim.en?.trim() && claim.uk?.trim(),key);
    assert.equal(claim.publication_status,'unpublished',key);
    assert.equal(claim.human_fact_review,'pending',key);
    assert.equal(claim.en_editorial_review,'pending',key);
    assert.equal(claim.uk_editorial_review,'pending',key);
    assert.ok(claim.evidence.length>0,key);
    assert.ok(claim.evidence.every(e=>e.semantic_review==='pending'),key);
  }
  assert.equal(ids.size,96);
});
