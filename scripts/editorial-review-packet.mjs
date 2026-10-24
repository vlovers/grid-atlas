#!/usr/bin/env node
// Export an evidence-review worksheet, never a publication decision or signed sidecar.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {inspectResearchCard} from './editorial-batch-model.mjs';
const root=resolve(import.meta.dirname,'..');
const load=path=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
const batch=load('docs/editorial/batches/drivers-30-v1.json');
const pilots=new Set(load('docs/editorial/releases/v1/manifest.json').drivers.map(row=>row.driver_id));
const narratives=load('docs/editorial/batches/drivers-30-v1/narrative-chapters-v1.json');
const chaptersByDriver=new Map(narratives.stories.map(story=>[story.driver_id,story.chapters]));
const rows=[];
for(const {driver_id:id} of batch.drivers){
  if(pilots.has(id))continue;
  const card=load('docs/editorial/batches/drivers-30-v1/research/'+id+'.json');
  const audit=inspectResearchCard(card,id);
  if(audit.errors.length)throw Error(id+': '+audit.errors.join(', '));
  const registry=new Map([card.source,...(card.additional_sources??[])].map(source=>[source.url,source]));
  for(const claim of card.claims){
    const evidence=(claim.evidence??[]).map(item=>{
      const source=registry.get(item.source_url);
      return {source_url:item.source_url,publisher:source.publisher,publisher_group:source.independence_group,
        locator:item.locator,claimed_support:item.supports===true,semantic_review:'pending'};
    });
    const groups=[...new Set(evidence.map(item=>item.publisher_group))].sort();
    const linked_chapters=(chaptersByDriver.get(id)??[]).filter(chapter=>chapter.claim_ids.includes(claim.claim_id))
      .map(chapter=>({chapter_id:chapter.chapter_id,en_heading:chapter.en.heading,uk_heading:chapter.uk.heading,en_body:chapter.en.body,uk_body:chapter.uk.body}));
    rows.push({driver_id:id,claim_id:claim.claim_id,topic:claim.topic,en:claim.en,uk:claim.uk,linked_chapters,
      publisher_groups:groups,independent_publisher_links:groups.length>=2,evidence,
      human_identity_review:'pending',human_fact_review:'pending',en_editorial_review:'pending',
      uk_editorial_review:'pending',publication_status:'unpublished'});
  }
}
const selected=process.argv.find(x=>x.startsWith('--driver='))?.slice('--driver='.length);
if(selected && !batch.drivers.some(x=>x.driver_id===selected))throw Error('Unknown driver: '+selected);
const claims=selected?rows.filter(x=>x.driver_id===selected):rows;
const totals={claims:claims.length,with_independent_publisher_links:claims.filter(x=>x.independent_publisher_links).length,
  awaiting_second_publisher:claims.filter(x=>!x.independent_publisher_links).length,human_approved:0,published:0};
process.stdout.write(JSON.stringify({batch_id:batch.batch_id,mode:'research_review_packet',driver_filter:selected??null,
  totals,claims,caveats:['Publisher-group diversity is metadata, not semantic verification.',
    'This worksheet is not an approved dossier or reviewer sidecar. No automatic human approvals.']},null,2)+'\n');
