import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {inspectResearchCard,safeHttpsUrl,summarizeCoverage} from '../scripts/editorial-batch-model.mjs';
const card=()=>({
  schema_version:1,driver_id:'sample',status:'research_only',publication_status:'unpublished',
  reviewer:null,reviewed_at:null,media:[],gaps:['Await independent editorial review'],
  source:{url:'https://example.org/history',publisher:'Test archive',accessed_on:'2026-10-24',independence_group:'archive'},
  claims:[{claim_id:'sample-one',en:'First fact.',uk:'Перший факт.',review_status:'needs_review',
    evidence:[{source_url:'https://example.org/history',locator:'Paragraph 3: the first fact is stated.',supports:true}]}]
});
test('rejects unsafe URLs, credentials and malformed links',()=>{
  for(const url of ['javascript:alert(1)','http://example.org','https://user:pass@example.org','not-a-url','https://'])assert.equal(safeHttpsUrl(url),false);
  assert.equal(safeHttpsUrl('https://example.org/archive'),true);
});
test('research evidence requires a traceable locator and matching source',()=>{
  assert.deepEqual(inspectResearchCard(card(),'sample').errors,[]);
  assert.equal(inspectResearchCard(card(),'sample').completeEvidenceClaims,1);
  const missing=card();delete missing.claims[0].evidence;
  assert.equal(inspectResearchCard(missing,'sample').completeEvidenceClaims,0);
  assert.ok(inspectResearchCard(missing,'sample').warnings.some(x=>x.startsWith('missing_claim_evidence')));
  const mismatch=card();mismatch.claims[0].evidence[0].source_url='https://other.org/history';
  assert.ok(inspectResearchCard(mismatch,'sample').errors.some(x=>x.startsWith('invalid_claim_evidence')));
  const short=card();short.claims[0].evidence[0].locator='paragraph';
  assert.ok(inspectResearchCard(short,'sample').errors.some(x=>x.startsWith('invalid_claim_evidence')));
});
test('unsigned research cannot be silently marked approved',()=>{
  const signed=card();signed.publication_status='published';signed.reviewer='AI';signed.reviewed_at='2026-10-24';
  assert.ok(inspectResearchCard(signed,'sample').errors.includes('publication_gate'));
  const duplicate=card();duplicate.claims.push({...duplicate.claims[0]});
  assert.ok(inspectResearchCard(duplicate,'sample').errors.includes('duplicate_or_missing_claim_id'));
  const untranslated=card();untranslated.claims[0].uk='';
  assert.ok(inspectResearchCard(untranslated,'sample').errors.includes('missing_translation'));
});
test('summary never treats drafts or source references as human approval',()=>{
  const row={kind:'research_draft',errors:[],locales:{en:{claims:2},uk:{claims:2}},researchClaims:2,completeEvidenceClaims:1};
  const result=summarizeCoverage([row]);
  assert.equal(result.research_claims_without_evidence,1);
  assert.equal(result.approved_for_publication,0);
});
test('real 30-driver batch reports 5 pilots and 25 research cards without inventing approval',()=>{
  const run=spawnSync(process.execPath,['scripts/editorial-content-coverage.mjs'],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const report=JSON.parse(run.stdout);
  assert.equal(report.totals.candidates,30);
  assert.equal(report.totals.existing_bilingual_drafts,5);
  assert.equal(report.totals.research_drafts,25);
  assert.equal(report.totals.missing,0);
  assert.equal(report.totals.invalid,0);
  assert.equal(report.totals.approved_for_publication,0);
  assert.ok(report.totals.research_claims_without_evidence>0);
  assert.equal(report.drivers.filter(x=>x.kind==='research_draft').length,25);
  const strict=spawnSync(process.execPath,['scripts/editorial-content-coverage.mjs','--require-evidence'],{encoding:'utf8'});
  assert.equal(strict.status,1,'strict mode must reject incomplete claim-level evidence');
});
