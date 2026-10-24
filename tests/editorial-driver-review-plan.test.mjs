import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {buildDriverReviewPlan} from '../scripts/editorial-driver-review-plan.mjs';

function run(args=[]){
  return spawnSync(process.execPath,['scripts/editorial-driver-review-plan.mjs',...args],
    {encoding:'utf8',maxBuffer:16*1024*1024});
}
test('full research inventory is grouped by driver and chapter without approvals',()=>{
  const result=run();
  assert.equal(result.status,0,result.stderr);
  const plan=JSON.parse(result.stdout);
  assert.equal(plan.totals.drivers,25);
  assert.equal(plan.totals.claims,96);
  assert.equal(plan.totals.human_approved,0);
  assert.equal(plan.totals.published,0);
  assert.equal(plan.drivers.length,25);
  assert.ok(plan.drivers.every(d=>d.review_status==='pending'));
  assert.ok(plan.drivers.every(d=>d.linked_chapters.every(c=>c.review_status==='pending')));
  assert.equal(plan.drivers.reduce((n,d)=>n+d.missing_second_publisher,0),
    plan.totals.missing_second_publisher);
});
test('driver and chapter prioritization is deterministic and conserves claim counts',()=>{
  const plan=JSON.parse(run().stdout);
  assert.ok(plan.drivers.every((d,i,a)=>i===0||
    a[i-1].missing_second_publisher>=d.missing_second_publisher));
  for(const driver of plan.drivers){
    assert.ok(driver.claims>=driver.unlinked_claim_ids.length);
    const linked=new Set(driver.linked_chapters.flatMap(ch=>ch.claim_ids));
    assert.equal(linked.size+driver.unlinked_claim_ids.length,driver.claims);
    assert.ok(driver.unlinked_claim_ids.every(id=>!linked.has(id)));
    assert.ok(driver.linked_chapters.every(ch=>ch.missing_second_publisher<=ch.claim_ids.length));
    assert.ok(driver.linked_chapters.every(ch=>ch.claim_ids.length>0));
  }
});
test('markdown includes chapter-level gap checklist and rejects unsupported options',()=>{
  const output=run(['--format=markdown']);
  assert.equal(output.status,0,output.stderr);
  assert.match(output.stdout,/Need second publisher/);
  assert.match(output.stdout,/- \[ \]/);
  const bad=run(['--publish']);
  assert.notEqual(bad.status,0);
  assert.match(bad.stderr,/Usage:/);
});
test('review plan rejects inconsistent totals and nonresearch approval states',()=>{
  const source={batch_id:'test',mode:'unpublished_human_review_worklist',
    totals:{claims:1,awaiting_second_publisher:0,human_approved:0,published:0},
    items:[{driver_id:'driver',claim_id:'fact',priority_reason:'second_publisher_missing',
      linked_chapters:[]}]};
  assert.throws(()=>buildDriverReviewPlan(source),/totals mismatch/);
  source.totals.awaiting_second_publisher=1;
  source.totals.human_approved=1;
  assert.throws(()=>buildDriverReviewPlan(source),/unpublished research/);
});
