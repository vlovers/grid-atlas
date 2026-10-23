import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const EXPECTED_COLUMNS = [
  'candidate_id','subject_type','subject_name','file_page_url','source_license_claim',
  'context','priority','identity_risk','rights_status','publication_status',
];

/** RFC 4180-style CSV parser: quoted fields, escaped quotes, CRLF, embedded newlines. */
export function parseCsv(source) {
  if (source.charCodeAt(0) === 0xfeff) source = source.slice(1);
  const rows = []; let row = [], field = '', quoted = false, closed = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c === '"' && source[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === '"' && !field && !closed) quoted = true;
    else if (c === ',') { row.push(field); field = ''; closed = false; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && source[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = ''; closed = false;
    } else {
      if (closed || c === '"') throw new Error('Malformed CSV quoting');
      field += c;
    }
  }
  if (quoted) throw new Error('Unterminated CSV quote');
  if (row.length || field || closed) { row.push(field); rows.push(row); }
  return rows;
}

export function auditResearchIndex(source) {
  const rows = parseCsv(source);
  if (JSON.stringify(rows.shift()) !== JSON.stringify(EXPECTED_COLUMNS)) throw new Error('Unexpected research index header');
  const ids = new Set(), urls = new Set(), byType = {}, byPriority = {};
  for (const [i, row] of rows.entries()) {
    const line = i + 2;
    if (row.length !== EXPECTED_COLUMNS.length) throw new Error(`Row ${line}: wrong column count`);
    const [id,type,name,url,license,context,priority,risk,rights,publication] = row;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || ids.has(id)) throw new Error(`Row ${line}: invalid or duplicate candidate ID`);
    ids.add(id);
    if (!['driver','constructor','circuit','race'].includes(type) || !name.trim() || !context.trim() || !risk.trim())
      throw new Error(`Row ${line}: missing identity/context`);
    let parsed;
    try { parsed = new URL(url); } catch { throw new Error(`Row ${line}: invalid file URL`); }
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'commons.wikimedia.org' ||
        !parsed.pathname.startsWith('/wiki/File:') || parsed.username || parsed.password || urls.has(url))
      throw new Error(`Row ${line}: non-Commons or duplicate file URL`);
    urls.add(url);
    if (!license.trim() || !['P0','P1','P2'].includes(priority)) throw new Error(`Row ${line}: license metadata or priority missing`);
    if (rights !== 'human_review_required' || publication !== 'not_approved')
      throw new Error(`Row ${line}: research cannot claim rights approval or publication`);
    byType[type] = (byType[type] ?? 0) + 1;
    byPriority[priority] = (byPriority[priority] ?? 0) + 1;
  }
  const blocked = rows.filter(row => row[7] !== 'normal').length;
  return { total: rows.length, byType, byPriority, requiresIdentityReview: blocked, approved: 0 };
}

const entry = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (entry) {
  const file = process.argv[2] ?? fileURLToPath(new URL('../docs/research/commons-photo-research-index.csv', import.meta.url));
  try { console.log(JSON.stringify(auditResearchIndex(readFileSync(file, 'utf8')), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
