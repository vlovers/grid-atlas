import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const data=JSON.parse(readFileSync(new URL('CIRCUIT_33_STAGING_BUNDLE.json',root),'utf8'));
const dossier=readFileSync(new URL('ALL_33_BILINGUAL_RESEARCH_DOSSIERS_20261028.md',root),'utf8');
test('all 33 dossiers contain their distinct bilingual event manuscripts, without a false five-event completion claim',()=>{
 const titles=[...dossier.matchAll(/^## ([a-z][a-z0-9-]+)$/gm)].map(x=>x[1]);
 assert.deepEqual(titles,data.circuits.map(x=>x.circuit_id));
 assert.equal((dossier.match(/^### \d{4} — dated race manuscript$/gm)||[]).length,76);
 assert.equal((dossier.match(/^### Another perspective on an existing race/gm)||[]).length,10);
 assert.match(dossier,/98 venue-specific event slots are missing/);
 assert.match(dossier,/NOT cleared for publication/);
 for(const circuit of data.circuits){
  const start=dossier.indexOf('## '+circuit.circuit_id+'\n');
  const end=dossier.indexOf('\n---\n',start);
  const section=dossier.slice(start,end);
  assert.equal((section.match(/^### \d{4} — dated race manuscript$/gm)||[]).length,circuit.events.length,circuit.circuit_id);
  assert.equal((section.match(/^### Another perspective on an existing race/gm)||[]).length,circuit.secondary_angles.length,circuit.circuit_id);
  assert.equal((section.match(/^### EN — /gm)||[]).length,circuit.events.length,circuit.circuit_id+' english');
  assert.equal((section.match(/^### UK — /gm)||[]).length,circuit.events.length,circuit.circuit_id+' ukrainian');
 }
});
