import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fromRoot = path => readFileSync(resolve(root, path), 'utf8');
const base = 'docs/editorial/circuit-experience-v3/';
const bundle = JSON.parse(fromRoot(base + 'CIRCUIT_33_STAGING_BUNDLE.json'));
const index = JSON.parse(fromRoot(base + 'CIRCUIT_33_CANONICAL_STORY_INDEX.json'));
const coverage = JSON.parse(fromRoot(base + 'F1DB_78_CONTENT_COVERAGE_20261027.json'));
const errors = [];
const fail = msg => errors.push(msg);
const expected = coverage.circuits.filter(x => !x.five_story_research_batch).map(x => x.circuit_id).sort();
const circuits = bundle.circuits.map(x => x.circuit_id).sort();
if (JSON.stringify(expected) !== JSON.stringify(circuits)) fail('Circuit identities differ from pinned coverage');
if (bundle.kind !== 'editorial_staging_only' || bundle.summary.approved_articles !== 0) fail('Staging manifest must remain unpublished');
const docCache = new Map();
const file = name => {
 if (!docCache.has(name)) {
  if (!name.startsWith(base) || name.includes('..')) { fail('Unsafe source path: '+name); return ''; }
  try { docCache.set(name,fromRoot(name)); } catch { fail('Missing source: '+name); return ''; }
 }
 return docCache.get(name);
};
let events=0, angles=0, orphans=0;
for (const circuit of bundle.circuits) {
 if (circuit.editorial_gate?.publish !== false || circuit.editorial_gate.fact_check !== false) fail(circuit.circuit_id+': gate is not blocked');
 const active=index.entries.filter(x=>x.circuit_id===circuit.circuit_id&&x.event_year!==null);
 const recorded=new Set(circuit.events.map(x=>x.year));
 if (recorded.size!==circuit.events.length || active.length!==circuit.events.length) fail(circuit.circuit_id+': inconsistent event count');
 for (const event of circuit.events) {
  events++;
  const source=active.find(x=>x.event_year===event.year);
  if (!source || source.preferred_manuscript!==event.draft_path) fail(circuit.circuit_id+': incorrect preferred source '+event.year);
  if (event.publication_allowed !== false || event.review_status !== 'unreviewed') fail(circuit.circuit_id+': event incorrectly marked publishable');
  const contents=file(event.draft_path);
  const sections=contents.split(/^## \d+\. /m).slice(1);
  const chapter=sections.find(s=>s.startsWith(circuit.circuit_id+' ') && s.includes(String(event.year)));
  if(!chapter) { fail(circuit.circuit_id+': missing chapter '+event.year);continue; }
  if(!chapter.includes('### EN — ') || !chapter.includes('### UK — ')) fail(circuit.circuit_id+': bilingual chapters missing '+event.year);
  if(!/https:\/\//.test(chapter)) fail(circuit.circuit_id+': no source locator '+event.year);
 }
 for(const angle of circuit.secondary_angles){
  angles++;
  if(angle.relation !== 'same_event' || angle.publication_allowed !== false || angle.review_status!=='unreviewed') fail(circuit.circuit_id+': invalid angle gate');
  if (!file(angle.source_chapter).includes('## ')) fail(circuit.circuit_id+': angle missing source chapter');
  for(const locale of ['en','uk']) if((angle.title?.[locale]?.length??0)<10 || (angle.body?.[locale]?.length??0)<250) fail(circuit.circuit_id+': empty '+locale+' narrative angle');
 }
}
for(const entry of index.entries) if(entry.event_year===null) orphans++;
if(events!==bundle.summary.dated_events || angles!==bundle.summary.second_angles) fail('Staging counts do not match manifest');
if(errors.length){console.error('Circuit staging integrity FAILED\n'+errors.map(e=>' - '+e).join('\n'));process.exitCode=1;}
else console.log('Circuit staging integrity OK: '+circuits.length+' circuits; '+events+' events; '+angles+' additional angles; '+orphans+' research gaps; 0 publishable stories.');
