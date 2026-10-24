#!/usr/bin/env node
// Strict, read-only evidence completeness report. Does not grant editorial approval.
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const batch=read('docs/editorial/batches/drivers-30-v1.json');
const years=read('docs/editorial/batches/drivers-30-v1/championship-reference.json').driver_championship_years;
const existing=new Set(read('docs/editorial/releases/v1/manifest.json').drivers.map(x=>x.driver_id));
const rows=[];
for(const {driver_id:id} of batch.drivers){
  if(!Object.hasOwn(years,id))throw Error('Missing championship reference: '+id);
  if(existing.has(id)){rows.push({id,kind:'existing_pilot',championship_years:years[id]});continue;}
  const path='docs/editorial/batches/drivers-30-v1/research/'+id+'.json';
  if(!existsSync(resolve(root,path))){rows.push({id,kind:'missing'});continue;}
  const doc=read(path),issues=[];
  if(doc.driver_id!==id)issues.push('identity_mismatch');
  if(doc.publication_status!=='unpublished'||doc.reviewer!==null)issues.push('publication_gate_violation');
  if(!doc.source?.url?.startsWith('https://'))issues.push('source_url_missing');
  if(!doc.source?.accessed_on)issues.push('source_access_date_missing');
  if(!doc.source?.independence_group)issues.push('source_group_missing');
  if(!doc.source?.locator||/pending|verify|career narrative|career chronology/i.test(doc.source.locator))issues.push('precise_locator_pending');
  if((doc.claims??[]).some(x=>!x.en?.trim()||!x.uk?.trim()||x.review_status!=='needs_review'))issues.push('bilingual_or_review_state_invalid');
  if(new Set((doc.claims??[]).map(x=>x.claim_id)).size!==(doc.claims??[]).length)issues.push('duplicate_claim_ids');
  rows.push({id,kind:'research_draft',claim_pairs:doc.claims?.length??0,championship_years:years[id],issues});
}
if(rows.length!==30)throw Error('Expected 30 drivers');
const totals={drivers:rows.length,pilots:rows.filter(x=>x.kind==='existing_pilot').length,research_drafts:rows.filter(x=>x.kind==='research_draft').length,missing:rows.filter(x=>x.kind==='missing').length,claim_pairs:rows.reduce((n,x)=>n+(x.claim_pairs??0),0),pending_precise_locators:rows.filter(x=>x.issues?.includes('precise_locator_pending')).length,publication_gate_violations:rows.filter(x=>x.issues?.includes('publication_gate_violation')).length};
process.stdout.write(JSON.stringify({totals,rows},null,2)+'\n');
if(totals.missing||totals.publication_gate_violations||rows.some(x=>x.issues?.includes('identity_mismatch')||x.issues?.includes('bilingual_or_review_state_invalid')))process.exitCode=1;
