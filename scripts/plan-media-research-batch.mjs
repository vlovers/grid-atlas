import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { auditResearchIndex, parseCsv } from './audit-commons-research.mjs';

const root = new URL('../', import.meta.url);
const load = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

export function planMediaBatch(csv, identities, candidates, publication) {
  auditResearchIndex(csv);
  const rows = parseCsv(csv).slice(1);
  const known = new Set(identities.subjects.map(s => s.type + ':' + s.id));
  const existingUrls = new Set([...candidates.assets, ...publication.assets].map(a => a.file_page_url));
  const knownNames = new Map([
    ['Michael Schumacher','michael-schumacher'],
    ['Fernando Alonso','fernando-alonso'],
    ['Max Verstappen','max-verstappen'],
    ['Niki Lauda','niki-lauda'],
    ['McLaren','mclaren'],
    ['Lotus','lotus'],
    ['Ferrari','ferrari'],
    ['Silverstone','silverstone'],
    ['Monaco','monaco'],
  ]);
  const result = rows.map(row => {
    const [id,type,name,url,,context,priority,risk] = row;
    const canonicalId = knownNames.get(name) ?? null;
    const reasons = [];
    if (existingUrls.has(url)) reasons.push('already_in_media_registry');
    if (!canonicalId || !known.has(type + ':' + canonicalId)) reasons.push('canonical_identity_not_in_pilot_allowlist');
    if (risk !== 'normal') reasons.push('context_or_identity_review_required');
    if (type === 'race') reasons.push('race_id_not_resolved');
    return { id, type, name, url, priority, context, canonicalId, reasons, readyForPublication: false };
  });
  return {
    total: result.length,
    byPriority: Object.fromEntries(['P0','P1','P2'].map(p => [p, result.filter(r => r.priority === p).length])),
    duplicateFilePages: result.filter(r => r.reasons.includes('already_in_media_registry')).map(r => r.id),
    identityNotInPilot: result.filter(r => r.reasons.includes('canonical_identity_not_in_pilot_allowlist')).map(r => r.id),
    reviewQueue: result.sort((a,b) => a.priority.localeCompare(b.priority) || a.id.localeCompare(b.id)),
    approved: 0,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const csv = readFileSync(new URL('../docs/research/commons-photo-research-index.csv', import.meta.url), 'utf8');
  const plan = planMediaBatch(csv, load('docs/media/pilot-identities.json'), load('docs/media/candidates.json'), load('apps/web/src/components/media/publication.json'));
  console.log(JSON.stringify(plan, null, 2));
}
