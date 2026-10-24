// Offline provenance graph for unpublished Content Factory research.
// Source metadata and chapter links are NOT semantic fact checks or approvals.
import {inspectResearchCard} from './editorial-batch-model.mjs';
import {inspectNarrativeBundle} from './editorial-narrative-model.mjs';

export function inspectEditorialProvenance({batch, release, cards, narratives}) {
  const errors=[], warnings=[], claimRows=[], sourceIndex=new Map(), chapterIndex=new Map();
  const candidates=Array.isArray(batch?.drivers)?batch.drivers:[];
  const pilots=Array.isArray(release?.drivers)?release.drivers:[];
  const ids=candidates.map(x=>x?.driver_id);
  const pilotIds=new Set(pilots.map(x=>x.driver_id));
  if (batch?.batch_id!=='drivers-30-v1' || batch?.publication_status!=='unpublished')
    errors.push('invalid_batch_gate');
  if(ids.length!==30 || new Set(ids).size!==30 || ids.some(x=>typeof x!=='string'||!x))
    errors.push('invalid_candidate_inventory');
  if(pilotIds.size!==5 || pilots.length!==5 || pilots.some(x=>!ids.includes(x.driver_id)))
    errors.push('invalid_pilot_inventory');
  for(const candidate of candidates) {
    const id=candidate?.driver_id;
    if(typeof id!=='string'||!id)continue;
    if(JSON.stringify(candidate.required_locales)!==JSON.stringify(['en','uk']))
      errors.push('invalid_locales:'+id);
    const pilot=pilotIds.has(id);
    if(candidate.status!==(pilot?'existing_research_dossier':'research_draft'))
      errors.push('invalid_candidate_status:'+id);
  }
  const expectedResearchIds=ids.filter(x=>!pilotIds.has(x));
  const cardMap=cards instanceof Map?cards:new Map();
  if(!(cards instanceof Map))errors.push('invalid_research_registry');
  if(cardMap.size!==25 || expectedResearchIds.length!==25)
    errors.push('invalid_research_inventory');
  for(const id of cardMap.keys())if(!expectedResearchIds.includes(id))
    errors.push('unexpected_research_card:'+id);
  const allClaimIds=new Set();
  for(const id of expectedResearchIds){
    const card=cardMap.get(id);
    if(!card){errors.push('missing_research_card:'+id);continue;}
    const audit=inspectResearchCard(card,id);
    for(const err of audit.errors)errors.push('research:'+id+':'+err);
    if(audit.errors.length)continue;
    const registry=new Map([card.source,...(card.additional_sources??[])].map(s=>[s.url,s]));
    for(const source of registry.values()){
      const url=new URL(source.url);
      url.hash='';
      const key=url.toString();
      const identity=source.publisher+'::'+source.independence_group;
      const prior=sourceIndex.get(key);
      if(prior && prior.identity!==identity)errors.push('conflicting_source_identity:'+key);
      if(!prior)sourceIndex.set(key,{url:key,identity,publisher:source.publisher,
        publisher_group:source.independence_group,drivers:new Set(),claims:new Set()});
      sourceIndex.get(key).drivers.add(id);
    }
    for(const claim of card.claims){
      const key=id+':'+claim.claim_id;
      if(allClaimIds.has(key))errors.push('duplicate_global_claim:'+key);
      allClaimIds.add(key);
      const groups=new Set();
      for(const item of claim.evidence){
        const source=registry.get(item.source_url);
        if(!source)continue;
        groups.add(source.independence_group);
        const url=new URL(item.source_url);url.hash='';
        sourceIndex.get(url.toString())?.claims.add(key);
      }
      claimRows.push({driver_id:id,claim_id:claim.claim_id,
        publisher_groups:[...groups].sort(),second_publisher_pending:groups.size<2,
        narrative_chapters:[],human_fact_review:'pending',en_editorial_review:'pending',
        uk_editorial_review:'pending',publication_status:'unpublished'});
    }
  }
  const narrativeAudit=inspectNarrativeBundle(narratives,cardMap);
  for(const err of narrativeAudit.errors)errors.push('narrative:'+err);
  const stories=Array.isArray(narratives?.stories)?narratives.stories:[];
  const storyIds=stories.map(s=>s?.driver_id);
  for(const id of expectedResearchIds)if(!storyIds.includes(id))
    errors.push('missing_narrative_story:'+id);
  for(const id of storyIds)if(!expectedResearchIds.includes(id))
    errors.push('unexpected_narrative_story:'+id);
  const claimByKey=new Map(claimRows.map(row=>[row.driver_id+':'+row.claim_id,row]));
  for(const story of stories){
    if(!Array.isArray(story?.chapters))continue;
    for(const chapter of story.chapters){
      const chapterKey=story.driver_id+':'+chapter.chapter_id;
      const claimIds=Array.isArray(chapter?.claim_ids)?chapter.claim_ids:[];
      const unresolved=claimIds.filter(cid=>claimByKey.get(story.driver_id+':'+cid)?.second_publisher_pending);
      chapterIndex.set(chapterKey,{driver_id:story.driver_id,chapter_id:chapter.chapter_id,
        linked_claims:claimIds.length,claims_awaiting_second_publisher:unresolved.length,
        human_review:'pending',publication_status:'unpublished'});
      for(const cid of claimIds)claimByKey.get(story.driver_id+':'+cid)?.narrative_chapters.push(chapter.chapter_id);
    }
  }
  for(const row of claimRows)if(!row.narrative_chapters.length)
    warnings.push('claim_not_used_in_narrative:'+row.driver_id+':'+row.claim_id);
  const sources=[...sourceIndex.values()].map(({url,publisher,publisher_group,drivers,claims})=>
    ({url,publisher,publisher_group,driver_count:drivers.size,claim_count:claims.size}))
    .sort((a,b)=>b.claim_count-a.claim_count||a.url.localeCompare(b.url));
  const chapters=[...chapterIndex.values()].sort((a,b)=>
    a.driver_id.localeCompare(b.driver_id)||a.chapter_id.localeCompare(b.chapter_id));
  const totals={candidates:ids.length,pilots:pilotIds.size,research_profiles:expectedResearchIds.length,
    research_claims:claimRows.length,chapters:chapters.length,unique_source_urls:sources.length,
    claims_awaiting_second_publisher:claimRows.filter(x=>x.second_publisher_pending).length,
    chapters_with_single_publisher_claims:chapters.filter(x=>x.claims_awaiting_second_publisher>0).length,
    claims_not_used_in_narrative:claimRows.filter(x=>!x.narrative_chapters.length).length,
    human_approved:0,published:0};
  return {batch_id:batch?.batch_id,mode:'unpublished_provenance_audit',totals,
    errors:[...new Set(errors)],warnings,claims:claimRows,chapters,sources,
    caveats:['Publisher groups and locators are declared metadata, not live passage verification.',
      'Human fact, translation and identity reviews remain pending; this audit cannot publish.']};
}
