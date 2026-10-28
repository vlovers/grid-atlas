import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('all bilingual circuit research exports are blocked and include provenance warnings', () => {
 const run=spawnSync(process.execPath,['scripts/export-circuit-story-review.mjs'],{encoding:'utf8',maxBuffer:4*1024*1024});
 assert.equal(run.status,0,run.stderr);
 const report=JSON.parse(run.stdout);
 assert.equal(report.kind,'editorial_research_payload_not_publication');
 assert.equal(report.summary.stories,76);
 assert.equal(report.summary.circuits,33);
 assert.equal(report.summary.published,0);
 const keys=new Set();
 for(const story of report.stories){
  const key=story.circuit_id+':'+story.event_year;
  assert.ok(!keys.has(key),'duplicate '+key);
  keys.add(key);
  assert.equal(story.publication_allowed,false);
  assert.equal(story.editorial_status,'unreviewed');
  for(const locale of ['en','uk']){
   assert.ok(story.title[locale].length>10,key+': missing '+locale+' heading');
   assert.ok(story.excerpt[locale].length>100,key+': missing '+locale+' text');
  }
  assert.ok(story.review_warnings.every(x=>typeof x==='string'));
 }
});
