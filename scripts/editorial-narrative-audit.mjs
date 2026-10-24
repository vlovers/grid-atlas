#!/usr/bin/env node
// Research-only narrative validation. No publishing or approval side effects.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {inspectNarrativeBundle} from './editorial-narrative-model.mjs';
const root=resolve(import.meta.dirname,'..');
const load=path=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
const path='docs/editorial/batches/drivers-30-v1/';
const bundle=load(path+'narrative-chapters-v1.json');
const batch=load('docs/editorial/batches/drivers-30-v1.json');
const pilotIds=new Set(load('docs/editorial/releases/v1/manifest.json').drivers.map(x=>x.driver_id));
const cards=new Map();
for(const row of batch.drivers){
  if(pilotIds.has(row.driver_id))continue;
  cards.set(row.driver_id,load(path+'research/'+row.driver_id+'.json'));
}
const report=inspectNarrativeBundle(bundle,cards);
const result={batch_id:bundle.batch_id,publication_status:'unpublished',...report,
  caveats:['Narrative audit verifies claim references and bilingual structure, not semantic accuracy.',
    'Claims and chapters require independent human review; source URLs and passage locators must be checked before publication.']};
process.stdout.write(JSON.stringify(result,null,2)+'\n');
if(report.errors.length)process.exitCode=1;
