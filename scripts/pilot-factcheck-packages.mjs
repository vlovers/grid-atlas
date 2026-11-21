#!/usr/bin/env node
/**
 * Build fact-check work packages for the pilot circuits: every claim with its exact text, the
 * sources its block cites (with the local snapshot path when one exists), the deterministic F1DB
 * checks, and the circuit's F1DB race records. The packages are inputs for an independent
 * fact-checker; they contain no verdicts.
 *
 * Usage: node scripts/pilot-factcheck-packages.mjs <out-dir> [circuit,...]
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { F1dbIndex, checkCandidate, extractClaims, loadCorpus, sourceId } from '../packages/editorial-evidence/src/index.ts';

const root = resolve(import.meta.dirname, '..');
const out = resolve(process.argv[2] ?? join(root, '.grid-atlas/factcheck-packages'));
const circuits = (process.argv[3] ?? 'monaco,silverstone,interlagos,lusail,brands-hatch,pescara,dallas').split(',');
const archive = JSON.parse(readFileSync(join(root, 'docs/editorial/circuit-completion/archive/f1db-v2026.17.0-circuit-facts.json'), 'utf8'));
const index = new F1dbIndex(archive);
const status = JSON.parse(readFileSync(join(root, 'docs/editorial/circuit-evidence/source-status.json'), 'utf8'));
const snapshots = join(root, '.grid-atlas/source-snapshots');
const corpus = loadCorpus(root);
mkdirSync(out, { recursive: true });

for (const circuitId of circuits) {
  const circuit = archive.circuits.find(c => c.circuit_id === circuitId);
  const blocks = corpus.blocks.filter(b => b.circuit_id === circuitId);
  const claims = blocks.flatMap(block => extractClaims(block).map(c => ({
    claim_id: c.claim_id, block_kind: c.kind, en: c.en, uk: c.uk, uk_alignment: c.alignment, claim_type: c.claim_type,
    provenance: c.provenance,
    sources: block.cited_urls.map(url => {
      const row = status[sourceId(url)] ?? {};
      const path = row.text_sha256 ? join(snapshots, `${row.text_sha256}.txt`) : null;
      return { source_id: sourceId(url), url, outcome: row.outcome ?? 'not_checked', snapshot: path && existsSync(path) ? path : null };
    }),
    f1db_checks: checkCandidate(c, index).map(k => ({ kind: k.kind, status: k.status, detail: k.detail })),
  })));
  const pkg = {
    circuit_id: circuitId, name: circuit.name, f1db_release: archive.source.release,
    layouts: circuit.layouts.map(l => ({ layout_id: l.layout_id, length_km: Number(l.length_km), turns: l.turns, seasons: l.seasons })),
    races: circuit.races.map(r => ({ race_id: r.race_id, season: r.season, date: r.date, name: r.name, winners: r.winners, pole: r.pole, fastest_lap: r.fastest_lap, podium: r.podium })),
    claims,
  };
  writeFileSync(join(out, `${circuitId}.json`), `${JSON.stringify(pkg, null, 1)}\n`);
  console.log(circuitId, claims.length, 'claims;', claims.filter(c => c.sources.some(s => s.snapshot)).length, 'with a readable source');
}
