#!/usr/bin/env node
// Compatibility diagnostic for the canonical 30-driver coverage audit.
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const audit=resolve(import.meta.dirname,'editorial-content-coverage.mjs');
const result=spawnSync(process.execPath,[audit],{encoding:'utf8',maxBuffer:5_000_000});
if(!result.stdout){process.stderr.write(result.stderr||'Coverage audit failed\n');process.exit(1);}
const coverage=JSON.parse(result.stdout);
const rows=coverage.drivers.map(row=>({
  id:row.driver_id,kind:row.kind,championship_years:row.championship_years,
  claim_pairs:row.researchClaims??0,complete_evidence_claims:row.completeEvidenceClaims??0,
  issues:[...(row.errors??[]),...(row.warnings??[])]
}));
const totals={
  drivers:coverage.totals.candidates,pilots:coverage.totals.existing_bilingual_drafts,
  research_drafts:coverage.totals.research_drafts,missing:coverage.totals.missing,
  claim_pairs:rows.reduce((n,x)=>n+x.claim_pairs,0),
  claims_missing_evidence:coverage.totals.research_claims_without_evidence,
  publication_gate_violations:rows.filter(x=>x.issues.some(y=>y.includes('publication_gate'))).length,
  approved:0
};
process.stdout.write(JSON.stringify({batch_id:coverage.batch_id,totals,rows},null,2)+'\n');
if(result.status!==0 || (process.argv.includes('--require-evidence') && totals.claims_missing_evidence))process.exitCode=1;
