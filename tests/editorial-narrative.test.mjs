import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
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

test('real narrative bundle has 66 bilingual chapters across all 25 research-only profiles',()=>{
  const run=spawnSync(process.execPath,['scripts/editorial-narrative-audit.mjs'],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
  const report=JSON.parse(run.stdout);
  assert.equal(report.stories,25);
  assert.equal(report.chapters,66);
  assert.deepEqual(report.errors,[]);
  assert.equal(report.publication_status,'unpublished');
});

test('malformed narrative arrays fail validation without throwing',()=>{
  const {bundle,cards}=sample();
  bundle.stories={driver_id:'sample'};
  assert.ok(inspectNarrativeBundle(bundle,cards).errors.includes('missing_stories'));
  bundle.stories=[{driver_id:'sample',chapters:{chapter_id:'not-an-array'}}];
  assert.ok(inspectNarrativeBundle(bundle,cards).errors.some(x=>x.startsWith('insufficient_chapters')));
});

test('every new candidate has a story with two or more chapters and valid claim IDs',()=>{
  const batch=JSON.parse(readFileSync('docs/editorial/batches/drivers-30-v1.json','utf8'));
  const release=JSON.parse(readFileSync('docs/editorial/releases/v1/manifest.json','utf8'));
  const narratives=JSON.parse(readFileSync('docs/editorial/batches/drivers-30-v1/narrative-chapters-v1.json','utf8'));
  const pilots=new Set(release.drivers.map(x=>x.driver_id));
  const candidates=new Set(batch.drivers.map(x=>x.driver_id).filter(id=>!pilots.has(id)));
  assert.equal(candidates.size,25);
  assert.equal(narratives.stories.length,25);
  for(const story of narratives.stories){
    assert.ok(candidates.delete(story.driver_id),'unknown or duplicate story: '+story.driver_id);
    assert.ok(story.chapters.length>=2,story.driver_id);
    const card=JSON.parse(readFileSync('docs/editorial/batches/drivers-30-v1/research/'+story.driver_id+'.json','utf8'));
    const known=new Set(card.claims.map(x=>x.claim_id));
    for(const chapter of story.chapters){
      assert.ok(chapter.en.body.length>=80 && chapter.uk.body.length>=80,story.driver_id+':'+chapter.chapter_id);
      for(const claimId of chapter.claim_ids) assert.ok(known.has(claimId),story.driver_id+':'+claimId);
    }
  }
  assert.deepEqual([...candidates],[],'candidates without narrative chapters');
});

test('invalid registry is rejected without throwing',()=>{
  const {bundle}=sample();
  assert.deepEqual(inspectNarrativeBundle(bundle,null).errors,['invalid_card_registry']);
});

test('malformed research claims and chapter claim references fail closed',()=>{
  const {bundle,cards}=sample();
  cards.get('sample').claims={claim_id:'not-an-array'};
  bundle.stories[0].chapters[0].claim_ids={id:'sample-debut'};
  const errors=inspectNarrativeBundle(bundle,cards).errors;
  assert.ok(errors.some(x=>x.startsWith('invalid_claim_reference_collection')));
  assert.ok(errors.some(x=>x.startsWith('invalid_claim_references')));
  assert.ok(errors.some(x=>x.startsWith('orphan_claim')));
});

test('empty claim identifiers cannot pass narrative validation',()=>{
  const {bundle,cards}=sample();
  bundle.stories[0].chapters[0].claim_ids=[''];
  const errors=inspectNarrativeBundle(bundle,cards).errors;
  assert.ok(errors.some(x=>x.startsWith('invalid_claim_references')));
});
