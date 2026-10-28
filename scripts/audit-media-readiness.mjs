import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { validatePilot } from './validate-media-registry.mjs';
import { publicationProblems, parseMediaRegistry } from '../apps/web/src/components/media/registry.ts';
import { loadBatch } from './media-batch-290.mjs';
const root=new URL('../',import.meta.url);
const json=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));

/** Read-only readiness, not a legal opinion or an approval/publication command. */
export function mediaReadinessReport(asOf){
 const validation=validatePilot(asOf);
 const identity=json('docs/media/pilot-identities.json');
 const candidates=json('docs/media/candidates.json').assets;
 const publication=json('apps/web/src/components/media/publication.json').assets;
 const layouts=json('apps/web/src/components/circuit-layout-manifest.json');
 const batch = asOf >= '2026-10-28' ? loadBatch() : [];
 if (batch.length) parseMediaRegistry(json('docs/media/batch-290-new-candidates.json'), identity.subjects, asOf, 'candidates');
 return {
  checked_on:asOf, source:identity.source,
  candidates:validation.candidates, approved_publication_assets:validation.publication_assets,
  research_batches: batch.length ? [{ issue: 290, distinct_candidates: batch.length, reused_candidates: 7, new_candidates: 5,
    publication_allowed: false, prior_original_sha256_observations: batch.filter(row => row.task.byte_verification.sha256).length,
    newly_verified_originals: 0, independent_approvals: 0 }] : [],
  subjects:['driver','constructor','circuit','race'].map(type=>({type,candidates:candidates.filter(a=>a.subject.type===type).length,approved:publication.filter(a=>a.subject.type===type&&a.status==='verified').length})),
  pending:candidates.filter(a=>a.status==='candidate').map(asset=>({id:asset.id,subject:asset.subject,kind:asset.kind,blocking_fields:publicationProblems(asset,asOf)})),
  circuit_artwork:{source_attributed_layouts:layouts.length,lane:'Separate pinned circuit artwork manifest; not photographic approval.'},
  boundaries:{automatic_approvals:false,downloads:false,remote_hotlinking:false,publication_changes:false},
  limitations:['A valid metadata fingerprint does not prove a reviewer’s independence or legal rights.','Image decoding, subject identity, historical context and license conditions still need independent review.','Photographic candidates and the dedicated attributed circuit SVG collection are different approval lanes.'],
 };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const {values}=parseArgs({options:{'as-of':{type:'string'}}});
  if(!values['as-of'])throw Error('Required: --as-of YYYY-MM-DD');
  console.log(JSON.stringify(mediaReadinessReport(values['as-of']),null,2));
 }catch(error){console.error(`Media readiness audit failed: ${error.message}`);process.exitCode=1;}
}
