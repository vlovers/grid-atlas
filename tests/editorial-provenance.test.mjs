import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {inspectEditorialProvenance} from '../scripts/editorial-provenance-model.mjs';

const paragraph='The historical event is tied to a documented season result, with an explicit research claim reference.';
function fixture(){
  const ids=Array.from({length:30},(_,i)=>'driver-'+i);
  const pilots=ids.slice(0,5).map(driver_id=>({driver_id}));
  const batch={batch_id:'drivers-30-v1',publication_status:'unpublished',
    drivers:ids.map((driver_id,i)=>({driver_id,status:i<5?'existing_research_dossier':'research_draft',
      required_locales:['en','uk']}))};
  const release={drivers:pilots};
  const cards=new Map(),stories=[];
  for(const id of ids.slice(5)){
    const source={url:'https://example.org/'+id,publisher:'Example archive',
      independence_group:'archive',accessed_on:'2026-10-24'};
    const claim={claim_id:id+'-event',en:'A documented event.',uk:'Документована подія.',
      review_status:'needs_review',evidence:[{source_url:source.url,
        locator:'Historical results section, season 1970, row 1.',supports:true}]};
    cards.set(id,{schema_version:1,driver_id:id,status:'research_only',
      publication_status:'unpublished',reviewer:null,reviewed_at:null,media:[],
      gaps:['Await human review'],source,claims:[claim]});
    const chapter=(chapter_id)=>({chapter_id,claim_ids:[claim.claim_id],
      en:{heading:'Documented season',body:paragraph},
      uk:{heading:'Документований сезон',body:'Цей історичний епізод підтверджено записом про сезон і пов’язано з окремим дослідницьким твердженням, яке потребує перевірки.'}});
    stories.push({driver_id:id,chapters:[chapter('start'),chapter('finish')]});
  }
  const narratives={schema_version:1,batch_id:'drivers-30-v1',status:'research_only',
    publication_status:'unpublished',reviewer:null,reviewed_at:null,stories};
  return {batch,release,cards,narratives};
}

test('provenance graph joins every candidate, claim and chapter without approvals',()=>{
  const report=inspectEditorialProvenance(fixture());
  assert.deepEqual(report.errors,[]);
  assert.equal(report.totals.candidates,30);
  assert.equal(report.totals.pilots,5);
  assert.equal(report.totals.research_profiles,25);
  assert.equal(report.totals.research_claims,25);
  assert.equal(report.totals.chapters,50);
  assert.equal(report.totals.claims_awaiting_second_publisher,25);
  assert.equal(report.totals.human_approved,0);
  assert.equal(report.totals.published,0);
  assert.ok(report.claims.every(x=>x.narrative_chapters.length===2));
});

test('cross-card source publisher conflicts fail closed',()=>{
  const data=fixture();
  const card=data.cards.get('driver-6');
  const other=data.cards.get('driver-5');
  card.source={...card.source,url:other.source.url,publisher:'Different archive',
    independence_group:'other'};
  card.claims[0].evidence[0].source_url=card.source.url;
  const report=inspectEditorialProvenance(data);
  assert.ok(report.errors.some(x=>x.startsWith('conflicting_source_identity:')));
});

test('missing stories and malformed candidate locale metadata are explicit errors',()=>{
  const data=fixture();
  data.narratives.stories.pop();
  data.batch.drivers[0].required_locales=['en'];
  const report=inspectEditorialProvenance(data);
  assert.ok(report.errors.includes('invalid_locales:driver-0'));
  assert.ok(report.errors.includes('missing_narrative_story:driver-29'));
});

test('real batch emits a consistent 30-profile provenance graph with no approvals',()=>{
  const result=spawnSync(process.execPath,['scripts/editorial-provenance-audit.mjs','--summary'],
    {encoding:'utf8'});
  assert.equal(result.status,0,result.stderr+'\n'+result.stdout);
  const report=JSON.parse(result.stdout);
  assert.deepEqual(report.errors,[]);
  assert.equal(report.totals.candidates,30);
  assert.equal(report.totals.pilots,5);
  assert.equal(report.totals.research_profiles,25);
  assert.equal(report.totals.research_claims,96);
  assert.equal(report.totals.chapters,81);
  assert.equal(report.totals.human_approved,0);
  assert.equal(report.totals.published,0);
});
