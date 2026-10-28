import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const base = 'docs/editorial/circuit-experience-v3/';
const read = path => readFileSync(resolve(root, path), 'utf8');
const bundle = JSON.parse(read(base + 'CIRCUIT_33_STAGING_BUNDLE.json'));
const index = JSON.parse(read(base + 'CIRCUIT_33_CANONICAL_STORY_INDEX.json'));
const cache = new Map();
const manuscripts = path => {
  if (!path.startsWith(base) || path.includes('..')) throw new Error('Unsafe manuscript path: '+path);
  if (!cache.has(path)) cache.set(path,read(path));
  return cache.get(path);
};
const chapters = path => manuscripts(path).split(/^## \d+\. /m).slice(1);
const stories = [];
const errors = [];
for (const circuit of bundle.circuits) {
  for (const event of circuit.events) {
    const matching = chapters(event.draft_path).filter(part => part.startsWith(circuit.circuit_id+' ') && /(?:\(|— )\d{4}/.test(part.split('\n')[0]) && part.split('\n')[0].includes(String(event.year)));
    if (matching.length !== 1) { errors.push(circuit.circuit_id+':'+event.year+' has '+matching.length+' manuscript matches'); continue; }
    const part = matching[0];
    const en = part.match(/^### EN — ([^\n]+)\n\n([\s\S]*?)(?=^### UK — )/m);
    const uk = part.match(/^### UK — ([^\n]+)\n\n([\s\S]*?)(?=^\*\*|$)/m);
    if (!en || !uk) { errors.push(circuit.circuit_id+':'+event.year+' incomplete locale sections');continue; }
    const urls = [...part.matchAll(/https:\/\/[^\s)>]+/g)].map(x => x[0]);
    const sourceYearMismatch = urls.some(url => {
      const match = url.match(/(?:formula1\.com\/en\/results\/|f1db\/blob\/[^/]+\/src\/data\/seasons\/)(\d{4})/);
      return match && Number(match[1]) !== event.year;
    });
    const directEventSource = urls.some(url=>/formula1\.com\/en\/results\/\d{4}\/races\/\d+\/|f1db\/blob\/[^/]+\/src\/data\/seasons\/\d{4}\/races\//.test(url));
    const yearIndexOnly = urls.some(url => /formula1\.com\/en\/results\/\d{4}\/races\/?$/.test(url));
    const warnings = [];
    if (sourceYearMismatch) warnings.push('source_year_mismatch');
    if (!directEventSource) warnings.push(yearIndexOnly?'season_index_only':'no_direct_race_result_locator');
    if (!urls.length) warnings.push('no_source_url');
    if (/(?:first|only|championship|title|fatal|died|killed|record|debut|disqualified|penalty|weather|rain)/i.test(en[2])) warnings.push('context_claims_require_independent_corroboration');
    stories.push({
      circuit_id:circuit.circuit_id, event_year:event.year, title:{en:en[1].trim(),uk:uk[1].trim()},
      excerpt:{en:en[2].trim(),uk:uk[2].trim()}, source_urls:urls,
      provenance_level:directEventSource?'race_result_locator':'broad_or_missing_locator',
      review_warnings:warnings, manuscript_path:event.draft_path,
      publication_allowed:false, editorial_status:'unreviewed'
    });
  }
}
const keys=stories.map(s=>s.circuit_id+':'+s.event_year);
if(new Set(keys).size!==stories.length) errors.push('Duplicate circuit/year story key');
if(stories.length!==bundle.summary.dated_events) errors.push('Lost stories from staging bundle');
if(index.entries.filter(x=>x.event_year!==null).length!==stories.length) errors.push('Canon index mismatch');
if(errors.length){ console.error(errors.join('\n'));process.exitCode=1; }
else {
  const report={
    schema_version:1,kind:'editorial_research_payload_not_publication',
    notice:'Research drafts are NOT approved for website publication. Source locator presence and matching years do NOT constitute factual verification.',
    summary:{stories:stories.length,circuits:bundle.circuits.length,with_warnings:stories.filter(x=>x.review_warnings.length>0).length,direct_result_locators:stories.filter(x=>x.provenance_level==='race_result_locator').length,published:0},
    stories
  };
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
}
