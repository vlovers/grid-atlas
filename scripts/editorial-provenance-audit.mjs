#!/usr/bin/env node
// Offline, read-only evidence provenance. Never signs or publishes a dossier.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {inspectEditorialProvenance} from './editorial-provenance-model.mjs';
const root=resolve(import.meta.dirname,'..');
const load=path=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
const batch=load('docs/editorial/batches/drivers-30-v1.json');
const release=load('docs/editorial/releases/v1/manifest.json');
const narratives=load('docs/editorial/batches/drivers-30-v1/narrative-chapters-v1.json');
const pilotIds=new Set(release.drivers.map(x=>x.driver_id));
const cards=new Map(batch.drivers.filter(x=>!pilotIds.has(x.driver_id))
  .map(x=>[x.driver_id,load('docs/editorial/batches/drivers-30-v1/research/'+x.driver_id+'.json')]));
const report=inspectEditorialProvenance({batch,release,cards,narratives});
const summary=process.argv.includes('--summary');
process.stdout.write(JSON.stringify(summary?{batch_id:report.batch_id,mode:report.mode,
  totals:report.totals,errors:report.errors,warnings:report.warnings,caveats:report.caveats}:report,null,2)+'\n');
if(report.errors.length)process.exitCode=1;
