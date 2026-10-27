import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/next20-bilingual-histories-v1.json','utf8'));
// Allow only documented, event-specific external publishers. Do not turn a new
// citation host into blanket approval for every circuit or every claim.
const externalSourceHosts = new Map([
 ['imola', new Set(['www.motorsport.com'])],
 ['sepang', new Set(['www.bbc.co.uk'])],
 ['istanbul-park', new Set(['www.autosport.com', 'au.motorsport.com', 'www.independent.co.uk'])],
]);
const acceptedSource = (circuitId, raw) => {
 const url = new URL(raw);
 return url.protocol === 'https:' && (url.hostname === 'www.formula1.com' || externalSourceHosts.get(circuitId)?.has(url.hostname) === true);
};
test('20 circuit research entries remain distinct, bilingual and unpublished',()=>{
 assert.equal(data.circuits.length,20);
 assert.equal(new Set(data.circuits.map(x=>x.circuit_id)).size,20);
 assert.equal(data.status,'research_only');
 assert.equal(data.circuits.reduce((count,c)=>count+c.moments.length,0),105);
 const excluded=new Set(['monaco','spa-francorchamps']);
 for(const c of data.circuits){
   assert.equal(excluded.has(c.circuit_id),false);
   assert.equal(c.publication,'unpublished');
   assert.ok(c.moments.length>=5,c.circuit_id+' has fewer than five story drafts');
   for(const language of ['en','uk']){
     assert.ok(c.editorial_intro[language].trim().length>=95,c.circuit_id+'/'+language);
     assert.ok(c.moments[0].title[language].length>5);
     assert.ok(c.moments[0].narrative[language].trim().length>=60,c.circuit_id+'/'+language);
   }
   assert.ok(c.moments[0].sources?.length > 0);
   assert.ok(c.moments[0].sources.every(s => acceptedSource(c.circuit_id, s)));
   for(const moment of c.moments){
     assert.ok(['unverified_research_draft','source_checked_research_draft','official_classification_checked_interpretation_pending'].includes(moment.review_status));
     assert.ok(moment.sources?.length > 0, c.circuit_id+'/'+moment.year);
     assert.ok(moment.sources.every(url => acceptedSource(c.circuit_id, url)), c.circuit_id+'/'+moment.year);
     if(moment.review_status==='unverified_research_draft') assert.notEqual(moment.source_granularity,'official_F1_article_contains_specific_race');
     for(const lang of ['en','uk']) assert.ok(moment.narrative[lang]?.trim().length>=60,c.circuit_id+'/'+moment.year+'/'+lang);
   }
   for(const turn of c.corner_names){
     assert.equal(turn.turn_number,null);
     assert.equal(turn.configuration_id,null);
     assert.equal(turn.status,'name_candidate_needs_official_number_and_layout');
   }
   assert.ok(c.research_gaps.length>=3);
 }
});
