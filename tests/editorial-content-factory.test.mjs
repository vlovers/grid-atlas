import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {inspectResearchCard,safeHttpsUrl,summarizeCoverage,sourcePublisherMismatch} from '../scripts/editorial-batch-model.mjs';
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
  assert.equal(report.totals.research_claims_with_evidence,96);
  assert.equal(report.totals.research_claims_without_evidence,0);
  assert.ok(report.totals.research_claims_with_independent_corroboration>=49,'FIA corroboration batch must not regress');
  assert.equal(report.drivers.filter(x=>x.kind==='research_draft').length,25);
  const strict=spawnSync(process.execPath,['scripts/editorial-content-coverage.mjs','--require-evidence'],{encoding:'utf8'});
  assert.equal(strict.status,0,'all 96 research claims should have declared, structurally valid evidence');
  const corroborated=spawnSync(process.execPath,['scripts/editorial-content-coverage.mjs','--require-corroboration'],{encoding:'utf8'});
  assert.equal(corroborated.status,1,'unresolved claims must still block the independent-source gate');
});

test('additional evidence must use declared safe sources with complete metadata',()=>{
  const c=card();
  const source={url:'https://second.example.org/result',title:'Independent race archive',publisher:'Independent archive',independence_group:'independent',accessed_on:'2026-10-24'};
  c.additional_sources=[source];
  c.claims[0].evidence.push({source_url:source.url,locator:'Results table, season 2000, row 1.',supports:true});
  const valid=inspectResearchCard(c,'sample');
  assert.deepEqual(valid.errors,[]);
  assert.equal(valid.corroboratedClaims,1);
  c.additional_sources[0].independence_group='archive';
  assert.equal(inspectResearchCard(c,'sample').corroboratedClaims,0,'two pages in one publisher group are not independent');
  c.additional_sources=[];
  assert.ok(inspectResearchCard(c,'sample').errors.includes('invalid_claim_evidence:sample-one'));
  c.additional_sources=[{...source,url:'https://user:password@second.example.org/result'}];
  assert.ok(inspectResearchCard(c,'sample').errors.includes('additional_source_metadata'));
});
test('research source registry rejects duplicate URLs and undeclared evidence',()=>{
  const c=card();
  c.additional_sources=[{...c.source,title:'Duplicated'}];
  assert.ok(inspectResearchCard(c,'sample').errors.includes('duplicate_source_url'));
  c.additional_sources=[];
  c.claims[0].evidence[0].source_url='https://not-declared.example.org';
  assert.ok(inspectResearchCard(c,'sample').errors.includes('invalid_claim_evidence:sample-one'));
});

test('FIA and Formula 1 publisher groups cannot be spoofed with unrelated hosts',()=>{
  assert.equal(sourcePublisherMismatch({url:'https://www.fia.com/news/history',publisher:'FIA',independence_group:'fia'}),false);
  assert.equal(sourcePublisherMismatch({url:'https://api.fia.com/news/history',publisher:'FIA',independence_group:'fia'}),false);
  assert.equal(sourcePublisherMismatch({url:'https://halloffame.fia.com/',publisher:'FIA',independence_group:'fia'}),false);
  assert.equal(sourcePublisherMismatch({url:'https://www.formula1.com/en/history',publisher:'Formula 1',independence_group:'formula1'}),false);
  assert.equal(sourcePublisherMismatch({url:'https://www.formula1.com/en/history',publisher:'FIA',independence_group:'fia'}),true);
  assert.equal(sourcePublisherMismatch({url:'https://fake-fia.example.org/news',publisher:'FIA',independence_group:'fia'}),true);
  const fake=card();fake.source={url:'https://www.fia.com/news/history',publisher:'Formula 1',independence_group:'formula1',accessed_on:'2026-10-24'};
  fake.claims[0].evidence[0].source_url=fake.source.url;
  assert.ok(inspectResearchCard(fake,'sample').errors.includes('source_publisher_identity'));
  const extra=card();extra.additional_sources=[{url:'https://www.fia.com/news/history',title:'FIA record',publisher:'Formula 1',independence_group:'formula1',accessed_on:'2026-10-24'}];
  extra.claims[0].evidence.push({source_url:extra.additional_sources[0].url,locator:'Specific historical result table row 1950',supports:true});
  assert.ok(inspectResearchCard(extra,'sample').errors.includes('additional_source_publisher_identity'));
});

test('independent corroboration queue tracks all 96 research claims without approving publication',()=>{
  const run=spawnSync(process.execPath,['scripts/editorial-corroboration-queue.mjs'],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const queue=JSON.parse(run.stdout);
  assert.equal(queue.totals.drivers,25);
  assert.equal(queue.totals.claims,96);
  assert.ok(queue.totals.claims_with_independent_publisher_links>=49);
  assert.equal(queue.totals.claims_with_independent_publisher_links+queue.totals.pending_independent_publisher,96);
  assert.equal(queue.totals.approved_for_publication,0);
  assert.equal(queue.drivers.length,25);
});

test('duplicate citations cannot inflate claim-level evidence coverage',()=>{
  const c=card();
  c.claims[0].evidence.push({...c.claims[0].evidence[0]});
  const report=inspectResearchCard(c,'sample');
  assert.ok(report.errors.includes('duplicate_claim_evidence:sample-one'));
  assert.equal(report.completeEvidenceClaims,0);
  assert.equal(report.corroboratedClaims,0);
});

test('equivalent locators with whitespace and case changes are duplicates',()=>{
  const c=card();
  c.claims[0].evidence.push({...c.claims[0].evidence[0],locator:'  paragraph   3: THE FIRST FACT IS STATED.  '});
  const report=inspectResearchCard(c,'sample');
  assert.ok(report.errors.includes('duplicate_claim_evidence:sample-one'));
});

test('distinct passages from the same publisher remain valid but not independent',()=>{
  const c=card();
  c.claims[0].evidence.push({...c.claims[0].evidence[0],locator:'Paragraph 4: another relevant observation.'});
  const report=inspectResearchCard(c,'sample');
  assert.deepEqual(report.errors,[]);
  assert.equal(report.completeEvidenceClaims,1);
  assert.equal(report.corroboratedClaims,0);
});
