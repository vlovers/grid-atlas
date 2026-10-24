#!/usr/bin/env node
// Read-only driver and chapter triage; no semantic source verification or publication approval.
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildReviewWorklist} from './editorial-human-review-worklist.mjs';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
function load(script){
  const run=spawnSync(process.execPath,[resolve(root,'scripts',script)],{
    cwd:root,encoding:'utf8',maxBuffer:16*1024*1024
  });
  if(run.error||run.status!==0)throw Error(script+': '+(run.error?.message??run.stderr));
  return JSON.parse(run.stdout);
}
export function buildDriverReviewPlan(report){
  if(report?.mode!=='unpublished_human_review_worklist'||report.totals.human_approved!==0||
     report.totals.published!==0)throw Error('Only unpublished research worklists are supported');
  const drivers=new Map();
  for(const claim of report.items){
    let driver=drivers.get(claim.driver_id);
    if(!driver){
      driver={driver_id:claim.driver_id,claims:0,missing_second_publisher:0,
        linked_chapters:new Map(),unlinked_claim_ids:[],review_status:'pending'};
      drivers.set(claim.driver_id,driver);
    }
    driver.claims++;
    if(claim.priority_reason==='second_publisher_missing')driver.missing_second_publisher++;
    if(!claim.linked_chapters.length)driver.unlinked_claim_ids.push(claim.claim_id);
    for(const chapter of claim.linked_chapters){
      let row=driver.linked_chapters.get(chapter.chapter_id);
      if(!row){
        row={chapter_id:chapter.chapter_id,en_heading:chapter.en_heading,uk_heading:chapter.uk_heading,
          claim_ids:[],missing_second_publisher:0,review_status:'pending'};
        driver.linked_chapters.set(chapter.chapter_id,row);
      }
      row.claim_ids.push(claim.claim_id);
      if(claim.priority_reason==='second_publisher_missing')row.missing_second_publisher++;
    }
  }
  const rows=[...drivers.values()].map(driver=>({
    ...driver,linked_chapters:[...driver.linked_chapters.values()].map(ch=>({
      ...ch,claim_ids:ch.claim_ids.sort()
    })).sort((a,b)=>b.missing_second_publisher-a.missing_second_publisher||
      a.chapter_id.localeCompare(b.chapter_id)),
    unlinked_claim_ids:driver.unlinked_claim_ids.sort()
  })).sort((a,b)=>b.missing_second_publisher-a.missing_second_publisher||
    b.unlinked_claim_ids.length-a.unlinked_claim_ids.length||a.driver_id.localeCompare(b.driver_id));
  const totals={drivers:rows.length,claims:rows.reduce((n,d)=>n+d.claims,0),
    missing_second_publisher:rows.reduce((n,d)=>n+d.missing_second_publisher,0),
    chapters:rows.reduce((n,d)=>n+d.linked_chapters.length,0),
    unlinked_claims:rows.reduce((n,d)=>n+d.unlinked_claim_ids.length,0),
    human_approved:0,published:0};
  if(totals.claims!==report.totals.claims||
     totals.missing_second_publisher!==report.totals.awaiting_second_publisher)
    throw Error('Review plan/worklist totals mismatch');
  return {batch_id:report.batch_id,mode:'unpublished_driver_review_plan',totals,drivers:rows,
    caveat:'Source independence is declared metadata only. Human fact, identity and translation reviews remain pending.'};
}
function markdown(plan){
  const lines=['# Content Factory V1 — driver review plan','',
    'Research only; no automated approval or publication.','',
    '| Driver | Claims | Need second publisher | Chapters | Unlinked claims |',
    '| --- | ---: | ---: | ---: | ---: |'];
  for(const d of plan.drivers)
    lines.push('| '+d.driver_id+' | '+d.claims+' | '+d.missing_second_publisher+
      ' | '+d.linked_chapters.length+' | '+d.unlinked_claim_ids.length+' |');
  for(const d of plan.drivers){
    lines.push('','## '+d.driver_id,'','Second-publisher gaps: '+d.missing_second_publisher,'');
    for(const ch of d.linked_chapters)
      lines.push('- [ ] '+ch.chapter_id+' (EN: '+ch.en_heading+'; UK: '+ch.uk_heading+
        '): '+ch.missing_second_publisher+'/'+ch.claim_ids.length+' claims need a second publisher — '+ch.claim_ids.join(', '));
    if(d.unlinked_claim_ids.length)
      lines.push('','Unlinked claims to assess: '+d.unlinked_claim_ids.join(', '));
  }
  return lines.join('\n')+'\n';
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=process.argv.slice(2);
    if(args.some(x=>!['--format=json','--format=markdown'].includes(x)))
      throw Error('Usage: --format=json|markdown');
    const format=args.includes('--format=markdown')?'markdown':'json';
    const plan=buildDriverReviewPlan(buildReviewWorklist(load('editorial-provenance-audit.mjs'),
      load('editorial-review-packet.mjs')));
    process.stdout.write(format==='markdown'?markdown(plan):JSON.stringify(plan,null,2)+'\n');
  }catch(error){console.error(error.message);process.exitCode=1;}
}
