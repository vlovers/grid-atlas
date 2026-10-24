import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {inspectResearchCard} from '../scripts/editorial-batch-model.mjs';
const root='docs/editorial/batches/drivers-30-v1/research/';
const load=id=>JSON.parse(readFileSync(root+id+'.json','utf8'));
const newlyLinked={
  'sebastian-vettel':['sebastian-vettel-context'],
  'nigel-mansell':['nigel-mansell-wins'],
  'jenson-button':['jenson-button-first-win'],
  'emerson-fittipaldi':['emerson-fittipaldi-first','emerson-fittipaldi-1970-first-win'],
  'jack-brabham':['jack-brabham-own-car','jack-brabham-cooper'],
  'damon-hill':['damon-hill-jordan','damon-hill-1996-eight-wins'],
  'lando-norris':['lando-norris-debut']
};
test('ten researched claims link two declared publisher groups without editorial approval',()=>{
  let total=0;
  for(const [id,claimIds] of Object.entries(newlyLinked)){
    const card=load(id),audit=inspectResearchCard(card,id);
    assert.deepEqual(audit.errors,[],id);
    assert.equal(card.publication_status,'unpublished');
    assert.equal(card.reviewer,null);
    assert.equal(card.reviewed_at,null);
    const sources=new Map([card.source,...(card.additional_sources??[])].map(s=>[s.url,s]));
    for(const claimId of claimIds){
      const claim=card.claims.find(c=>c.claim_id===claimId);
      assert.ok(claim,claimId);
      assert.equal(claim.review_status,'needs_review');
      const groups=new Set(claim.evidence.map(e=>sources.get(e.source_url)?.independence_group));
      assert.ok(groups.size>=2,claimId);
      assert.ok(claim.evidence.every(e=>e.locator.length>=32 && e.supports===true),claimId);
      total++;
    }
  }
  assert.equal(total,10);
});
test('review worksheet covers all claims and cannot invent approval',()=>{
  const result=spawnSync(process.execPath,['scripts/editorial-review-packet.mjs'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const report=JSON.parse(result.stdout);
  assert.equal(report.totals.claims,96);
  assert.equal(report.totals.with_independent_publisher_links,59);
  assert.equal(report.totals.awaiting_second_publisher,37);
  assert.equal(report.totals.human_approved,0);
  assert.equal(report.totals.published,0);
  assert.ok(report.claims.every(c=>c.human_fact_review==='pending' && c.en_editorial_review==='pending' && c.uk_editorial_review==='pending'));
  const filtered=spawnSync(process.execPath,['scripts/editorial-review-packet.mjs','--driver=jack-brabham'],{encoding:'utf8'});
  assert.equal(filtered.status,0,filtered.stderr);
  const jack=JSON.parse(filtered.stdout);
  assert.equal(jack.totals.claims,3);
  assert.equal(jack.totals.with_independent_publisher_links,3);
  assert.ok(jack.claims.every(x=>x.driver_id==='jack-brabham'));
});
