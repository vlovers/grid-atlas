#!/usr/bin/env node
// Read-only batch research audit. Never signs, approves, or publishes.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const load=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const batch=load('docs/editorial/batches/drivers-30-v1.json');
const pilots=new Set(load('docs/editorial/releases/v1/manifest.json').drivers.map(x=>x.driver_id));
const seen=new Set(), results=[];
for(const row of batch.drivers){
  if(seen.has(row.driver_id)) throw new Error('Duplicate candidate: '+row.driver_id);
  seen.add(row.driver_id);
  const path='docs/editorial/batches/drivers-30-v1/research/'+row.driver_id+'.json';
  if(pilots.has(row.driver_id)){results.push({driver_id:row.driver_id,state:'existing_pilot',claim_pairs:null});continue;}
  if(!existsSync(resolve(root,path))){results.push({driver_id:row.driver_id,state:'missing',claim_pairs:0});continue;}
  const doc=load(path),errors=[];
  if(doc.driver_id!==row.driver_id) errors.push('driver_id mismatch');
  if(doc.publication_status!=='unpublished'||doc.reviewer!==null||doc.reviewed_at!==null)errors.push('research must remain unpublished and unsigned');
  if(!doc.source?.url?.startsWith('https://')) errors.push('missing https source');
  if(!Array.isArray(doc.media)||doc.media.length!==0)errors.push('unapproved media');
  const claims=doc.claims??[],ids=new Set();
  for(const claim of claims){
    if(!claim.claim_id||ids.has(claim.claim_id)) errors.push('duplicate/missing claim_id');
    ids.add(claim.claim_id);
    if(!claim.en?.trim()||!claim.uk?.trim())errors.push('missing EN/UK text: '+claim.claim_id);
    if(claim.review_status!=='needs_review')errors.push('unexpected claim review status: '+claim.claim_id);
  }
  results.push({driver_id:row.driver_id,state:errors.length?'invalid':'research_draft',claim_pairs:claims.length,errors});
}
if(seen.size!==30)throw new Error('Expected 30 candidates');
const totals={candidates:seen.size,existing_pilots:results.filter(x=>x.state==='existing_pilot').length,research_drafts:results.filter(x=>x.state==='research_draft').length,missing:results.filter(x=>x.state==='missing').length,invalid:results.filter(x=>x.state==='invalid').length,claim_pairs:results.reduce((n,x)=>n+(x.claim_pairs??0),0),approved:0};
process.stdout.write(JSON.stringify({batch_id:batch.batch_id,totals,results},null,2)+'\n');
if(totals.invalid)process.exitCode=1;
