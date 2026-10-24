#!/usr/bin/env node
// Human-review worklist for unpublished Content Factory research.
// This script only prioritizes existing claims; it never verifies sources or approves publication.
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
function readReport(name){
  const run=spawnSync(process.execPath,[resolve(root,'scripts',name)],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
  if(run.error||run.status!==0)throw Error(name+' failed: '+(run.error?.message??run.stderr??'unknown error'));
  return JSON.parse(run.stdout);
}
export function buildReviewWorklist(provenance,worksheet){
  if(provenance?.errors?.length)throw Error('Provenance audit failed: '+provenance.errors.join(', '));
  if(provenance?.mode!=='unpublished_provenance_audit'||worksheet?.mode!=='research_review_packet')
    throw Error('Unexpected audit inputs');
  if(provenance.batch_id!==worksheet.batch_id)throw Error('Batch mismatch');
  if(provenance.totals.human_approved!==0||provenance.totals.published!==0||
     worksheet.totals.human_approved!==0||worksheet.totals.published!==0)
    throw Error('Review worklist requires an entirely unpublished research batch');
  const index=new Map();
  for(const row of provenance.claims){
    const key=row.driver_id+':'+row.claim_id;
    if(index.has(key))throw Error('Duplicate provenance claim: '+key);
    index.set(key,row);
  }
  const seen=new Set(),items=[],chapterContexts=new Map();
  for(const claim of worksheet.claims){
    const key=claim.driver_id+':'+claim.claim_id;
    if(seen.has(key))throw Error('Duplicate worksheet claim: '+key);
    seen.add(key);
    const source=index.get(key);
    if(!source)throw Error('Worksheet claim missing from provenance: '+key);
    if(source.second_publisher_pending===claim.independent_publisher_links)
      throw Error('Publisher coverage mismatch: '+key);
    const expectedChapters=[...source.narrative_chapters].sort();
    const actualChapters=(claim.linked_chapters??[]).map(ch=>ch.chapter_id).sort();
    if((claim.linked_chapters??[]).some(ch=>!ch.en_heading?.trim()||!ch.uk_heading?.trim()||
      !ch.en_body?.trim()||!ch.uk_body?.trim()))
      throw Error('Incomplete bilingual narrative context: '+key);
    if(JSON.stringify(expectedChapters)!==JSON.stringify(actualChapters))
      throw Error('Chapter references mismatch: '+key);
    for(const chapter of claim.linked_chapters??[]){
      const chapterKey=claim.driver_id+':'+chapter.chapter_id;
      const context=JSON.stringify([chapter.en_heading,chapter.uk_heading,chapter.en_body,chapter.uk_body]);
      const previous=chapterContexts.get(chapterKey);
      if(previous!==undefined&&previous!==context)
        throw Error('Conflicting chapter text across claims: '+chapterKey);
      chapterContexts.set(chapterKey,context);
    }
    const evidenceGroups=[...new Set((claim.evidence??[]).map(e=>e.publisher_group))].sort();
    const declaredGroups=[...(claim.publisher_groups??[])].sort();
    if(JSON.stringify(evidenceGroups)!==JSON.stringify(declaredGroups)||
       JSON.stringify(evidenceGroups)!==JSON.stringify(source.publisher_groups))
      throw Error('Publisher evidence groups mismatch: '+key);
    if((claim.evidence??[]).some(e=>!e.source_url?.trim()||!e.locator?.trim()||
       !e.publisher?.trim()||!e.publisher_group?.trim()||e.claimed_support!==true))
      throw Error('Incomplete source locator metadata: '+key);
    if(!claim.en?.trim()||!claim.uk?.trim()||!Array.isArray(claim.evidence)||!claim.evidence.length)
      throw Error('Incomplete bilingual evidence: '+key);
    if(claim.publication_status!=='unpublished'||claim.human_fact_review!=='pending'||
       claim.en_editorial_review!=='pending'||claim.uk_editorial_review!=='pending'||
       claim.evidence.some(e=>e.semantic_review!=='pending'))
      throw Error('Unexpected review state: '+key);
    const missingSecond=source.second_publisher_pending;
    const chapterCount=expectedChapters.length;
    // Triage heuristic only: no implication that a claim is accurate or important.
    const priority_score=(missingSecond?100:0)+chapterCount*20+(chapterCount===0?10:0);
    const tasks=[
      {kind:'identity',status:'pending',instruction:'Reconcile the driver with the pinned archive and an independent human identity check.'},
      ...(missingSecond?[{kind:'second_publisher',status:'pending',instruction:'Find an independent publisher and record a precisely located passage.'}]:[]),
      {kind:'source_semantics',status:'pending',instruction:'Open each source and verify that the located passage actually supports this exact claim.'},
      {kind:'english_edit',status:'pending',instruction:'Review the English wording against verified passages.'},
      {kind:'ukrainian_edit',status:'pending',instruction:'Review Ukrainian meaning and terminology independently.'},
      {kind:'narrative',status:'pending',instruction:'Check every linked chapter in context; revise unsupported prose.'}
    ];
    items.push({driver_id:claim.driver_id,claim_id:claim.claim_id,topic:claim.topic,
      priority_score,priority_reason:missingSecond?'second_publisher_missing':'source_semantics_unverified',
      chapter_count:chapterCount,linked_chapters:claim.linked_chapters??[],
      en:claim.en,uk:claim.uk,evidence:claim.evidence,
      publisher_groups:claim.publisher_groups,review_tasks:tasks,
      publication_status:'unpublished'});
  }
  if(index.size!==seen.size)throw Error('Provenance/worksheet claim count mismatch');
  items.sort((a,b)=>b.priority_score-a.priority_score||
    a.driver_id.localeCompare(b.driver_id)||a.claim_id.localeCompare(b.claim_id));
  const totals={claims:items.length,awaiting_second_publisher:items.filter(x=>x.priority_reason==='second_publisher_missing').length,
    with_multiple_publisher_groups:items.filter(x=>x.priority_reason!=='second_publisher_missing').length,
    chapter_links:items.reduce((n,x)=>n+x.chapter_count,0),human_approved:0,published:0};
  return {batch_id:provenance.batch_id,mode:'unpublished_human_review_worklist',totals,items,
    caveats:['Priority is a deterministic triage heuristic, not historical significance or factual certainty.',
      'Source URLs, passage locators and translations require human verification; no publication decision is made.']};
}
function renderMarkdown(report,items){
  const plain=value=>String(value??'').replace(/[\r\n]+/g,' ').trim();
  const cell=value=>plain(value).replace(/\|/g,'\\|');
  const lines=['# Content Factory V1 — human review queue','',
    'Research only. No source semantics, translations or publication approvals have been verified.','',
    'Batch claims: '+report.totals.claims+'; shown: '+items.length+
      '; batch awaiting second publisher: '+report.totals.awaiting_second_publisher+
      '; human approved: 0; published: 0.','',
    '| Priority | Driver | Claim | Second publisher | Chapters |',
    '| ---: | --- | --- | --- | ---: |'];
  for(const item of items){
    lines.push('| '+item.priority_score+' | '+cell(item.driver_id)+' | '+cell(item.claim_id)+
      ' | '+(item.priority_reason==='second_publisher_missing'?'needed':'linked, verify')+
      ' | '+item.chapter_count+' |');
  }
  for(const item of items){
    lines.push('','## '+plain(item.driver_id)+' — '+plain(item.claim_id),'',
      '**Priority:** '+item.priority_score+' ('+item.priority_reason+')',
      '',
      '**EN:** '+plain(item.en),'',
      '**UK:** '+plain(item.uk),'',
      '**Evidence (declared, semantic review pending):**','');
    item.evidence.forEach((e,i)=>{
      lines.push((i+1)+'. '+plain(e.source_url),
        '   - Publisher group: '+plain(e.publisher_group??'not specified'),
        '   - Exact locator: '+plain(e.locator),
        '   - Semantic review: pending');
    });
    lines.push('','**Linked narrative chapters:**');
    if(!item.linked_chapters.length)lines.push('- None; check whether narrative coverage is needed.');
    else for(const chapter of item.linked_chapters)
      lines.push('- '+plain(chapter.chapter_id)+' — EN: '+plain(chapter.en_heading)+' / UK: '+plain(chapter.uk_heading),
        '  - EN text: '+plain(chapter.en_body),
        '  - UK text: '+plain(chapter.uk_body));
    lines.push('','**Human review checklist:**');
    for(const task of item.review_tasks)
      lines.push('- [ ] '+plain(task.kind)+': '+plain(task.instruction));
  }
  lines.push('','Publisher diversity is declared metadata, not independent human fact checking.');
  return lines.join('\n')+'\n';
}
const direct=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(direct){
  try{
    const options=process.argv.slice(2);
    if(options.some(x=>!/^--(driver|chapter|limit|format)=/.test(x)))throw Error('Unknown option');
    const get=name=>options.find(x=>x.startsWith('--'+name+'='))?.split('=').slice(1).join('=');
    const driver=get('driver'),chapter=get('chapter'),limitRaw=get('limit'),format=get('format')??'json';
    if(chapter&&!driver)throw Error('Chapter filter requires --driver');
    if(!['json','markdown'].includes(format))throw Error('Invalid format');
    const limit=limitRaw===undefined?undefined:Number(limitRaw);
    if(limitRaw!==undefined&&(!Number.isInteger(limit)||limit<1||limit>1000))throw Error('Invalid limit');
    const report=buildReviewWorklist(readReport('editorial-provenance-audit.mjs'),
      readReport('editorial-review-packet.mjs'));
    if(driver&&!report.items.some(x=>x.driver_id===driver))throw Error('Unknown research driver: '+driver);
    const byDriver=driver?report.items.filter(x=>x.driver_id===driver):report.items;
    if(chapter&&!byDriver.some(x=>x.linked_chapters.some(c=>c.chapter_id===chapter)))
      throw Error('Unknown chapter for research driver: '+chapter);
    const filtered=chapter?byDriver.filter(x=>x.linked_chapters.some(c=>c.chapter_id===chapter)):byDriver;
    const items=limit===undefined?filtered:filtered.slice(0,limit);
    process.stdout.write(format==='markdown'?renderMarkdown(report,items):
      JSON.stringify({...report,driver_filter:driver??null,chapter_filter:chapter??null,shown:items.length,items},null,2)+'\n');
  }catch(error){console.error(error.message);process.exitCode=1;}
}
