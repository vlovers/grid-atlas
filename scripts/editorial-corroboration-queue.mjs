#!/usr/bin/env node
// Read-only research queue. Publisher diversity is declared, not a human fact check.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {inspectResearchCard} from './editorial-batch-model.mjs';
const root=resolve(import.meta.dirname,'..');
const load=path=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
const prefix='docs/editorial/batches/drivers-30-v1/';
const batch=load('docs/editorial/batches/drivers-30-v1.json');
const pilots=new Set(load('docs/editorial/releases/v1/manifest.json').drivers.map(row=>row.driver_id));
const drivers=[];
for(const row of batch.drivers){
  const id=row.driver_id;
  if(pilots.has(id))continue;
  const card=load(prefix+'research/'+id+'.json');
  const audit=inspectResearchCard(card,id);
  if(audit.errors.length)throw Error(id+': '+audit.errors.join(', '));
  const registry=new Map([card.source,...(card.additional_sources??[])].map(source=>[source.url,source]));
  const pending=[];
  let independentlyLinked=0;
  for(const claim of card.claims){
    const groups=[...new Set((claim.evidence??[]).filter(e=>e.supports===true && registry.has(e.source_url))
      .map(e=>registry.get(e.source_url).independence_group))].sort();
    if(groups.length>=2)independentlyLinked++;
    else pending.push({claim_id:claim.claim_id,topic:claim.topic,source_groups:groups,
      next_step:'Find an independently published, precisely located passage; verify semantic support.'});
  }
  drivers.push({driver_id:id,claims:card.claims.length,claims_with_independent_publisher_links:independentlyLinked,
    pending_independent_publisher:pending.length,pending_claims:pending});
}
drivers.sort((a,b)=>b.pending_independent_publisher-a.pending_independent_publisher||a.driver_id.localeCompare(b.driver_id));
const totals={drivers:drivers.length,claims:drivers.reduce((n,x)=>n+x.claims,0),
  claims_with_independent_publisher_links:drivers.reduce((n,x)=>n+x.claims_with_independent_publisher_links,0),
  pending_independent_publisher:drivers.reduce((n,x)=>n+x.pending_independent_publisher,0),
  approved_for_publication:0};
process.stdout.write(JSON.stringify({batch_id:batch.batch_id,as_of:'2026-10-24',totals,drivers,
  caveats:['This is an offline inventory of declared publisher groups, not independent human verification.',
    'No draft or chapter becomes publishable through this command.']},null,2)+'\n');
