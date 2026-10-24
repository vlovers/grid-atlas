import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {inspectNarrativeBundle} from '../scripts/editorial-narrative-model.mjs';

const sample=()=>{
  const card={driver_id:'sample',status:'research_only',publication_status:'unpublished',
    claims:[{claim_id:'sample-debut',review_status:'needs_review',evidence:[{source_url:'https://example.org',locator:'Historical result row',supports:true}]}]};
  const chapter={chapter_id:'opening',claim_ids:['sample-debut'],
    en:{heading:'The opening race',body:'A documented debut marks the opening chapter of the driver career. The race is tied to the verified claim record.'},
    uk:{heading:'Перші перегони',body:'Підтверджений дебют відкриває історію кар’єри пілота. Ці перегони пов’язані з перевірюваним записом факту.'}};
  const bundle={schema_version:1,batch_id:'drivers-30-v1',status:'research_only',publication_status:'unpublished',
    reviewer:null,reviewed_at:null,stories:[{driver_id:'sample',chapters:[chapter,{...structuredClone(chapter),chapter_id:'second'}]}]};
  return {bundle,cards:new Map([['sample',card]])};
};

test('narrative research requires bilingual text and source-linked claim references',()=>{
  const {bundle,cards}=sample();
  const audit=inspectNarrativeBundle(bundle,cards);
  assert.deepEqual(audit.errors,[]);
  assert.equal(audit.stories,1);
  assert.equal(audit.chapters,2);
  assert.equal(audit.details[0].linked_claim_ids,1);
});

test('narrative audit blocks invented claim references and duplicate chapters',()=>{
  const {bundle,cards}=sample();
  bundle.stories[0].chapters[0].claim_ids=['not-in-research'];
  bundle.stories[0].chapters[1].chapter_id='opening';
  const errors=inspectNarrativeBundle(bundle,cards).errors;
  assert.ok(errors.some(x=>x.startsWith('orphan_claim')));
  assert.ok(errors.some(x=>x.startsWith('duplicate_chapter')));
});

test('narrative audit blocks fake publication approvals and untranslated copy',()=>{
  const {bundle,cards}=sample();
  bundle.reviewer='AI';bundle.publication_status='published';
  bundle.stories[0].chapters[0].uk.body='';
  const errors=inspectNarrativeBundle(bundle,cards).errors;
  assert.ok(errors.includes('publication_gate'));
  assert.ok(errors.some(x=>x.startsWith('missing_or_short_locale')));
});

test('real narrative bundle has 25 bilingual chapters across eight research-only profiles',()=>{
  const run=spawnSync(process.execPath,['scripts/editorial-narrative-audit.mjs'],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
  const report=JSON.parse(run.stdout);
  assert.equal(report.stories,8);
  assert.equal(report.chapters,25);
  assert.deepEqual(report.errors,[]);
  assert.equal(report.publication_status,'unpublished');
});
