#!/usr/bin/env node
// Read-only research inventory; shares validation with the canonical coverage report.
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const result=spawnSync(process.execPath,[resolve(import.meta.dirname,'editorial-content-coverage.mjs')],{encoding:'utf8',maxBuffer:5_000_000});
if(!result.stdout){process.stderr.write(result.stderr||'Coverage audit failed\n');process.exit(1);}
const coverage=JSON.parse(result.stdout);
const results=coverage.drivers.map(row=>({
  driver_id:row.driver_id,
  state:row.kind==='existing_pilot'?'existing_pilot':row.kind==='missing'?'missing':row.errors.length?'invalid':'research_draft',
  claim_pairs:row.researchClaims,
  claim_evidence_pairs:row.completeEvidenceClaims,
  errors:row.errors,
  warnings:row.warnings
}));
const totals={
  candidates:coverage.totals.candidates,existing_pilots:coverage.totals.existing_bilingual_drafts,
  research_drafts:coverage.totals.research_drafts,missing:coverage.totals.missing,
  invalid:coverage.totals.invalid,claim_pairs:results.reduce((n,x)=>n+x.claim_pairs,0),
  claims_missing_evidence:coverage.totals.research_claims_without_evidence,approved:0
};
process.stdout.write(JSON.stringify({batch_id:coverage.batch_id,totals,results},null,2)+'\n');
if(result.status!==0 || (process.argv.includes('--require-evidence') && totals.claims_missing_evidence))process.exitCode=1;
