import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { candidateCornerGuides, candidateCircuitNarratives } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { isCircuitEditionApproved, circuitEditionDigest } from '../apps/web/src/components/editorial/circuit-release.ts';

const { values } = parseArgs({ options: { archive: { type: 'string' }, checksums: { type: 'string' }, output: { type: 'string' } } });
if (!values.archive || !values.checksums || !values.output) throw new Error('Required: --archive --checksums --output');
const root = new URL('../', import.meta.url);
const archive = JSON.parse(execFileSync('python3', ['-c', `import sys,json,zipfile
sys.path.insert(0,'packages/data-importer')
from import_seasons import verified_seasons
_,digest=verified_seasons(sys.argv[1],sys.argv[2])
with zipfile.ZipFile(sys.argv[1]) as bundle:
 print(json.dumps({'sha256':digest,'circuits':json.loads(bundle.read('f1db-circuits.json'))}))`, values.archive, values.checksums], { cwd: root, encoding: 'utf8' }));
const legacy = JSON.parse(readFileSync(new URL('apps/web/src/components/editorial/circuit-corner-guides.json', root), 'utf8'));
const rows = archive.circuits.map(circuit => {
  const guide = candidateCornerGuides.find(item => item.circuit_id === circuit.id);
  const narrative = candidateCircuitNarratives.find(item => item.circuit_id === circuit.id);
  const previous = legacy.find(item => item.id === circuit.id);
  const numbers = guide?.sections.flatMap(section => section.numbers).sort((a,b) => a-b) ?? [];
  if (guide && (numbers.length !== guide.numbered_turns || numbers.some((number,index) => number !== index+1))) throw new Error(`Number coverage mismatch: ${circuit.id}`);
  return { circuit_id: circuit.id, name: circuit.fullName ?? circuit.name,
    legacy_sections: previous?.sections.length ?? 0,
    legacy_race_only: previous?.sections.every(section => /\/race-results\.yml$|\/race\.yml$|\/en\/results\//.test(section.source)) ?? false,
    candidate_numbered_turns: numbers.length,
    candidate_named_sections: guide?.sections.filter(section => section.name !== null).length ?? 0,
    candidate_moments: narrative?.moments.length ?? 0,
    candidate_layout: guide?.layout_id ?? null,
    annotated_diagram: Boolean(guide && 'diagram' in guide && guide.diagram),
    publication_approved: isCircuitEditionApproved(circuit.id),
    edition_sha256: guide || narrative ? circuitEditionDigest(circuit.id) : null,
    next_action: guide ? 'Independent bilingual/source/layout/annotation review; no publication approval' : 'Obtain official numbered map and layout-specific naming sources; preserve missing data',
  };
}).sort((a,b) => a.circuit_id.localeCompare(b.circuit_id));
const report = { schema_version: 1, archive: { release: 'v2026.17.0', sha256: archive.sha256 },
  summary: { circuits: rows.length, numbered_guide_candidates: rows.filter(row => row.candidate_numbered_turns).length,
    narrative_candidates: rows.filter(row => row.candidate_moments).length,
    moment_candidates: rows.reduce((sum,row) => sum+row.candidate_moments,0), approved_editions: rows.filter(row => row.publication_approved).length },
  circuits: rows };
writeFileSync(values.output, JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
