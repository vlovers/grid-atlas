import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildReviewPacket } from '../scripts/export-media-review-packet.mjs';
const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const fixtures = () => [load('docs/media/cross-era-staging.json'),load('docs/media/candidates.json'),load('apps/web/src/components/media/publication.json'),load('docs/media/pilot-identities.json')];
test('exports all staged photographs with explicit unresolved publication checks', () => {
 const packet = buildReviewPacket(...fixtures());
 assert.equal(packet.count,5);
 assert.equal(packet.kind,'review_worklist_not_approval');
 for(const item of packet.tasks){
   assert.equal(item.publication_allowed,false);
   assert.ok(Object.values(item.checks).every(v=>v==='pending'));
   assert.ok(item.source_file_page.startsWith('https://commons.wikimedia.org/wiki/File:'));
 }
});
test('fails closed when staging integrity is compromised',()=>{
 const args=fixtures();
 args[0].entries[0].status='verified';
 assert.throws(()=>buildReviewPacket(...args),/Staging integrity failed/);
});
test('does not manufacture identity verification from research IDs',()=>{
 const packet=buildReviewPacket(...fixtures());
 assert.equal(packet.tasks.filter(t=>t.identity_in_pilot).length,1);
 assert.ok(packet.tasks.every(t=>t.checks.canonical_f1db_identity==='pending'));
});
