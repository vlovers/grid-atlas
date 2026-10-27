import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/next25-research-leads.json','utf8'));
test('25 next circuit candidates keep bilingual leads out of public publication',()=>{
 assert.equal(data.status,'research_only');
 assert.equal(data.publication,'blocked');
 assert.equal(data.circuits.length,25);
 assert.equal(new Set(data.circuits.map(c=>c.candidate_slug)).size,25);
 const earlier=JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/next20-bilingual-histories-v1.json','utf8'));
 const old=new Set(earlier.circuits.map(c=>c.circuit_id).concat(['monaco','spa-francorchamps']));
 for(const circuit of data.circuits){
  assert.ok(!old.has(circuit.candidate_slug),circuit.candidate_slug);
  const pinnedAliases = {'las-vegas-strip':'las-vegas','donington-park':'donington','valencia-street':'valencia','korea-international':'yeongam','sochi':'sirius','phoenix-street':'phoenix','detroit-street':'detroit'};
  const canonicalId = pinnedAliases[circuit.candidate_slug] ?? circuit.candidate_slug;
  assert.equal(circuit.canonical_f1db_id,canonicalId);
  assert.equal(circuit.f1db_identity_source,`https://github.com/f1db/f1db/blob/v2026.17.0/src/data/circuits/${canonicalId}.yml`);
  assert.equal(circuit.configuration_id,null);
  assert.equal(circuit.publication,'unpublished');
  assert.equal(circuit.story_leads.length,5);
  assert.equal(circuit.story_leads.filter(s=>s.status==='unverified_historical_narrative'||s.status==='official_f1_source_checked_human_review_pending').length,1);
  assert.ok(circuit.story_leads.filter(s=>s.status==='research_question_not_historical_article').length<=4);
  assert.ok(circuit.story_leads.filter(s=>s.status==='source_checked_research_draft').every(s=>s.narrative?.en.length>120&&s.narrative?.uk.length>120&&s.sources.length>0));
  for(const story of circuit.story_leads){
    assert.ok(story.sources.every(s=>{ const host=new URL(s).hostname; return host==='www.formula1.com' || (circuit.candidate_slug==='fuji' && host==='www.motorsportmagazine.com') || (circuit.candidate_slug==='kyalami' && host==='www.autosport.com') || (circuit.candidate_slug==='long-beach' && host==='gplb.com') || (circuit.candidate_slug==='detroit-street' && host==='www.detroitgp.com') || (circuit.candidate_slug==='phoenix-street' && host==='www.fia.com') || (circuit.candidate_slug==='watkins-glen' && host==='www.ebay.com') || (circuit.candidate_slug==='paul-ricard' && host==='www.circuitpaulricard.com') || (circuit.candidate_slug==='donington-park' && host==='www.crash.net') || (circuit.candidate_slug==='korea-international' && host==='en.yna.co.kr') || (circuit.candidate_slug==='buddh' && host==='news.sky.com'); }),circuit.candidate_slug);
    for(const locale of ['en','uk']){
      assert.ok(story.title[locale].trim().length>=6);
      assert.ok(story.editorial_direction[locale].trim().length>=30);
      assert.ok(circuit.editorial_intro[locale].trim().length>=45);
    }
  }
 }
});

test('all 25 event anchors carry exact-year Formula 1 sources but remain blocked',()=>{
 const audit=JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/NEXT25_PUBLICATION_AUDIT.json','utf8'));
 assert.equal(audit.publication,'blocked');
 assert.equal(audit.official_f1_result_anchors_with_source,25);
 assert.equal(audit.publication_ready_circuits,0);
 assert.equal(audit.fully_cited_race_narratives,0);
 for(const circuit of data.circuits){
  const anchor=circuit.story_leads[0];
  assert.equal(anchor.status,'official_f1_source_checked_human_review_pending');
  assert.ok(anchor.sources.length>=1,circuit.candidate_slug);
  assert.ok(anchor.sources.some(url=>url.includes('/results/'+anchor.year+'/')),circuit.candidate_slug);
  assert.equal(circuit.publication,'unpublished');
 }
 const hatch=data.circuits.find(c=>c.candidate_slug==='brands-hatch').story_leads[0];
 assert.match(hatch.narrative.en,/disqualified/);
 assert.match(hatch.narrative.en,/Niki Lauda/);
});

test('additional research drafts are explicitly gated and coverage matches the audit',()=>{
 const audit=JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/NEXT25_PUBLICATION_AUDIT.json','utf8'));
 const extra=data.circuits.flatMap(c=>c.story_leads.slice(1));
 assert.equal(extra.length,100);
 assert.equal(extra.filter(s=>s.status==='research_question_not_historical_article').length,audit.bilingual_research_questions);
 assert.equal(extra.filter(s=>s.status==='source_checked_research_draft').length,audit.bilingual_additional_sourced_drafts);
 const pending=extra.filter(s=>s.status==='classification_supported_research_draft');
 assert.equal(pending.length,audit.bilingual_additional_classification_supported_drafts);
 for(const story of pending){
  assert.ok(story.year===null || (Number.isInteger(story.year) && story.year>=1950));
  assert.ok(story.narrative.en.length>=150&&story.narrative.uk.length>=150);
  assert.ok(story.sources.length>0);
  assert.match(story.source_granularity,/review|check|candidate/);
 }
});

test('inherited classification sources cite the actual event year, never a different season',()=>{
 for(const circuit of data.circuits){
  for(const story of circuit.story_leads.slice(1)){
   if(story.status!=='classification_supported_research_draft') continue;
   const years=story.sources.flatMap(url=>[...url.matchAll(/\/en\/results\/(\d{4})\/races/g)].map(m=>Number(m[1])));
   if(story.year===null){
    assert.ok(story.source_granularity.includes('unverified') || story.source_granularity.includes('candidate') || story.source_granularity.includes('review'),circuit.candidate_slug);
   } else {
    assert.ok(years.every(year=>year===story.year),`${circuit.candidate_slug}: ${story.year} vs ${years}`);
   }
   assert.equal(circuit.publication,'unpublished');
  }
 }
});

test('editorial caveats removed from reader narrative remain documented in unpublished editorial direction',()=>{
 const examples=[['lusail',2],['mexico-city',1],['miami',3],['indianapolis',4],['watkins-glen',3]];
 for(const [slug,index] of examples){
  const circuit=data.circuits.find(c=>c.candidate_slug===slug);
  const story=circuit.story_leads[index];
  assert.equal(circuit.publication,'unpublished');
  for(const locale of ['en','uk']){
   assert.ok(story.narrative[locale].length>=145);
   assert.ok(story.editorial_direction[locale].length>60);
  }
 }
});

test('25 next circuit IDs are distinct from 20 pinned F1DB identities and are not publication approval',()=>{
 const catalog=JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/next20-f1db-layout-catalog-v1.json','utf8'));
 const existing=new Set(catalog.circuits.map(c=>c.f1db_circuit_id));
 const next=data.circuits.map(c=>c.canonical_f1db_id);
 assert.equal(new Set(next).size,25);
 assert.ok(next.every(id=>!existing.has(id)));
 const audit=JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/NEXT25_PUBLICATION_AUDIT.json','utf8'));
 assert.equal(audit.official_f1db_identity_matches,25);
 assert.equal(audit.f1db_race_layout_identities_verified,0);
 assert.equal(audit.publication_ready_circuits,0);
 assert.ok(data.circuits.every(c=>c.configuration_id===null&&c.publication==='unpublished'));
});
