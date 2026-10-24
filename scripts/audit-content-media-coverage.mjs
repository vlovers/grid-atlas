#!/usr/bin/env node
// Deterministic coverage inventory. No unreviewed content is treated as published.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const load = p => JSON.parse(readFileSync(join(root, p), 'utf8'));
const dossierDir = 'docs/editorial/biography-expansion-batch-2/dossiers';
const media = load('apps/web/src/components/media/publication.json');
const candidates = load('docs/media/candidates.json');
const identities = load('docs/media/pilot-identities.json');
const files = readdirSync(join(root, dossierDir)).filter(f => /\.(en|uk)\.json$/.test(f));
const drivers = [...new Set(files.map(f => f.replace(/\.(en|uk)\.json$/, '')))].sort();
const perType = type => {
  const approved = media.assets.filter(a => a.subject.type === type && a.status === 'verified');
  const research = candidates.assets.filter(a => a.subject.type === type);
  return { approved: approved.length, candidates: research.length, subjects_with_approved_media: new Set(approved.map(a => a.subject.id)).size, candidate_subjects: [...new Set(research.map(a => a.subject.id))].sort() };
};
const biography = drivers.map(id => {
  const locales = Object.fromEntries(['en','uk'].map(locale => {
    const filename = join(root, dossierDir, `${id}.${locale}.json`);
    if (!existsSync(filename)) return [locale, { exists: false, claims: 0, published: false }];
    const dossier = JSON.parse(readFileSync(filename, 'utf8'));
    return [locale, { exists: true, claims: dossier.claims.length, published: dossier.publication_status === 'published' }];
  }));
  return { driver_id: id, locales, complete_pair: locales.en.exists && locales.uk.exists };
});
const summary = {
  schema_version: 1,
  scope: 'repository_checked_in_only',
  disclaimer: 'Counts are file inventory, not historical accuracy, rights clearance, human approval or deployment evidence.',
  biographies: { total_drivers: drivers.length, complete_pairs: biography.filter(d => d.complete_pair).length, missing_pairs: biography.filter(d => !d.complete_pair).map(d => d.driver_id), published_locale_dossiers: biography.flatMap(d => Object.values(d.locales)).filter(l => l.published).length, rows: biography },
  media: { publication_assets: media.assets.length, candidate_assets: candidates.assets.length, by_subject: { driver: perType('driver'), constructor: perType('constructor'), circuit: perType('circuit'), race: perType('race') } },
  pinned_identity_snapshot: Object.fromEntries(['driver','constructor','circuit','race'].map(type => [type, identities.subjects.filter(s => s.type === type).length])),
  caveats: ['Pinned identity snapshot is a limited media pilot, not a complete entity catalogue.', 'Historical SVG circuit diagrams are a separate licensed collection, not counted as photographs.', 'A candidate image is never a public image.']
};
if (process.argv.includes('--json')) console.log(JSON.stringify(summary, null, 2));
else {
  console.log(`Biography drafts: ${summary.biographies.complete_pairs}/${summary.biographies.total_drivers} EN/UK pairs; published dossiers: ${summary.biographies.published_locale_dossiers}`);
  console.log(`Approved public media: ${summary.media.publication_assets}; research candidates: ${summary.media.candidate_assets}`);
  for (const [type, row] of Object.entries(summary.media.by_subject)) console.log(`${type}: ${row.approved} approved, ${row.candidates} candidates; ${row.subjects_with_approved_media} subjects with approved media`);
  console.log('This inventory does not measure all F1DB entities or separate licensed circuit SVGs.');
}
if (process.argv.includes('--require-public-media') && summary.media.publication_assets === 0) process.exitCode = 1;
if (summary.biographies.missing_pairs.length) process.exitCode = 1;
