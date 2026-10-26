#!/usr/bin/env node
// Offline coverage audit for all 30 drivers. Read-only; never approves or publishes.
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {inspectResearchCard,summarizeCoverage} from './editorial-batch-model.mjs';
const root=resolve(import.meta.dirname,'..');
const load=path=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
const exists=path=>existsSync(resolve(root,path));
const batch=load('docs/editorial/batches/drivers-30-v1.json');
const release=load('docs/editorial/releases/v1/manifest.json');
const reference=load('docs/editorial/batches/drivers-30-v1/championship-reference.json');
const pilots=new Map(release.drivers.map(row=>[row.driver_id,row]));
const ids=batch.drivers.map(row=>row.driver_id);
if(ids.length!==30 || new Set(ids).size!==30) throw Error('Expected exactly 30 unique driver IDs');
if(new Set(release.drivers.map(x=>x.driver_id)).size!==release.drivers.length)throw Error('Duplicate pilot IDs');
const rows=[];
for(const candidate of batch.drivers){
  const id=candidate.driver_id, pilot=pilots.get(id), errors=[];
  if(!Object.hasOwn(reference.driver_championship_years,id))errors.push('championship_reference_missing');
  const locales={};
  let parity=null,kind='missing',researchClaims=0,completeEvidenceClaims=0,corroboratedClaims=0,warnings=[];
  if(pilot){
    kind='existing_pilot';
    const claimsByLocale={};
    for(const locale of ['en','uk']){
      const refs=pilot.locales?.[locale];
      if(!refs || !exists(refs.dossier) || !exists(refs.review)){
        errors.push('missing_pilot_file:'+locale);
        locales[locale]={state:'missing',claims:0,sources:0,reviewed:0};
        continue;
      }
      const dossier=load(refs.dossier),review=load(refs.review);
      const claims=Array.isArray(dossier.claims)?dossier.claims:[];
      claimsByLocale[locale]=claims.map(x=>x.claim_id).sort();
      if(dossier.driver_id!==id || dossier.locale!==locale)errors.push('pilot_identity_or_locale:'+locale);
      if(dossier.publication_status!=='unpublished' || dossier.reviewer!==null || dossier.reviewed_at!==null)errors.push('pilot_publication_gate:'+locale);
      const decisions=review.claim_reviews??{};
      const reviewed=claims.filter(x=>decisions[x.claim_id]!=null).length;
      if(reviewed)errors.push('pilot_review_requires_independent_signoff:'+locale);
      locales[locale]={state:'research_draft',claims:claims.length,sources:(dossier.sources??[]).length,reviewed,published:false};
    }
    if(claimsByLocale.en && claimsByLocale.uk){
      parity=JSON.stringify(claimsByLocale.en)===JSON.stringify(claimsByLocale.uk);
      if(!parity)errors.push('pilot_claim_id_parity');
    }
  }else{
    const path='docs/editorial/batches/drivers-30-v1/research/'+id+'.json';
    if(!exists(path)){
      errors.push('research_file_missing');
      for(const locale of ['en','uk'])locales[locale]={state:'missing',claims:0,sources:0,reviewed:0};
    }else{
      kind='research_draft';
      const card=load(path),audit=inspectResearchCard(card,id);
      errors.push(...audit.errors);
      warnings=audit.warnings;
      researchClaims=audit.claims;
      completeEvidenceClaims=audit.completeEvidenceClaims;
      corroboratedClaims=audit.corroboratedClaims;
      // A single paired research claim is not equivalent to separately reviewed EN/UK dossiers.
      parity=!(audit.errors.includes('missing_translation') || audit.errors.includes('duplicate_or_missing_claim_id'));
      for(const locale of ['en','uk'])locales[locale]={
        state:'research_draft',claims:audit.claims,sources:card.source?1:0,reviewed:0,
        claim_level_evidence:audit.completeEvidenceClaims,published:false
      };
    }
  }
  rows.push({driver_id:id,kind,identity_verified:false,championship_years:reference.driver_championship_years[id]??null,
    locales,claim_id_parity:parity,researchClaims,completeEvidenceClaims,corroboratedClaims,warnings,errors,ready_for_publication:false});
}
for(const id of pilots.keys())if(!ids.includes(id))throw Error('Release pilot absent from batch: '+id);
const totals=summarizeCoverage(rows);
const report={batch_id:batch.batch_id,as_of:reference.as_of,totals,drivers:rows,
  caveats:['Offline structural checks do not establish that external URLs resolve or support claims.',
    'Research cards pair EN/UK text; only release dossiers have independent locale-specific review sidecars.',
    'Zero human approvals and zero published biographies are inferred from this report.']};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if(totals.invalid||totals.missing)process.exitCode=1;
if(process.argv.includes('--require-evidence') && totals.research_claims_without_evidence)process.exitCode=1;
if(process.argv.includes('--require-corroboration') && totals.research_claims_with_independent_corroboration < totals.research_claims_with_evidence)process.exitCode=1;
