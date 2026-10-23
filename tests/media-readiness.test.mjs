import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mediaReadinessReport } from '../scripts/audit-media-readiness.mjs';
test('media readiness reports actual blocking metadata without approving or mutating candidates',()=>{
 const path='apps/web/src/components/media/publication.json';const before=readFileSync(path,'utf8');
 const candidates=readFileSync('docs/media/candidates.json','utf8');
 const report=mediaReadinessReport('2026-10-23');
 assert.equal(report.approved_publication_assets,0);assert.equal(report.candidates,5);
 assert.equal(report.pending.length,5);assert.ok(report.pending.every(a=>a.blocking_fields.some(v=>v.includes('review'))));
 assert.equal(report.circuit_artwork.source_attributed_layouts,160);
 assert.deepEqual(report.boundaries,{automatic_approvals:false,downloads:false,remote_hotlinking:false,publication_changes:false});
 assert.equal(readFileSync(path,'utf8'),before);assert.equal(readFileSync('docs/media/candidates.json','utf8'),candidates);
 assert.throws(()=>mediaReadinessReport('not-a-date'),/YYYY-MM-DD/);
});
