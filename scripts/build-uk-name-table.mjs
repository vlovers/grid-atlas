#!/usr/bin/env node
/**
 * Build docs/editorial/names/uk-name-table.json from the reviewed nominative base
 * (uk-names-base.json): every case form of each full name and surname, the entity key each form
 * resolves to, and where each form is already attested in the repository's Ukrainian drafts.
 *
 * Surname-only forms resolve to the same key the English recogniser gives a bare surname:
 * the driver slug when the surname is unique in F1DB, otherwise "ambiguous:<surname>".
 *
 * Usage: node scripts/build-uk-name-table.mjs [--check]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { F1dbIndex, fold, loadCorpus, nameForms, surnameFromSlug } from '../packages/editorial-evidence/src/index.ts';

const root = resolve(import.meta.dirname, '..');
const DIR = join(root, 'docs/editorial/names');
const base = JSON.parse(readFileSync(join(DIR, 'uk-names-base.json'), 'utf8'));
const review = existsSync(join(DIR, 'uk-name-review.json')) ? JSON.parse(readFileSync(join(DIR, 'uk-name-review.json'), 'utf8')) : null;
const archive = JSON.parse(readFileSync(join(root, 'docs/editorial/circuit-completion/archive/f1db-v2026.17.0-circuit-facts.json'), 'utf8'));
const index = new F1dbIndex(archive);
const ukCorpus = loadCorpus(root).blocks.map(b => b.uk).join('\n');

const entries = base.drivers.map(d => {
  const latinSurname = surnameFromSlug(d.key);
  const slugs = index.surnames.get(fold(latinSurname)) ?? [];
  const surnameKey = slugs.length === 1 && slugs[0] === d.key && !index.isConstructorName(latinSurname) ? d.key : `ambiguous:${fold(latinSurname)}`;
  const forms = nameForms(d.given, d.surname);
  for (const given of d.also_given ?? []) forms.full.push(...nameForms(given, d.surname).full);
  const attested = [...new Set([...forms.full, ...forms.surname].filter(f => new RegExp(`(?<![\\p{L}'’])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}'’])`, 'u').test(ukCorpus)))];
  const uk = `${d.given} ${d.surname}`, full_forms = [...new Set(forms.full)], surname_forms = forms.surname;
  // An approval binds the exact forms reviewed; any later change to them needs a fresh review.
  const formsSha = createHash('sha256').update(JSON.stringify([uk, full_forms, surname_forms])).digest('hex');
  const verdict = review?.entries?.[d.key];
  const status = !verdict ? 'pending' : verdict.forms_sha256 !== formsSha ? 'stale_review' : verdict.status;
  return {
    key: d.key, en: archive.drivers[d.key] ?? null, uk, full_forms, surname_forms, surname_key: surnameKey,
    attested_in_drafts: attested, forms_sha256: formsSha,
    review: verdict ? { status, reviewer: review.reviewer, reviewed_on: review.reviewed_on, note: verdict.note ?? null } : { status },
  };
});
const table = {
  schema_version: 1, generated_by: 'scripts/build-uk-name-table.mjs', base: 'docs/editorial/names/uk-names-base.json',
  scope: base.scope, convention: base.convention,
  counts: Object.assign({ entries: entries.length }, ...['approved', 'changes_required', 'stale_review', 'pending', 'rejected'].map(k => ({ [k]: entries.filter(e => e.review.status === k).length }))),
  entries,
};
const out = `${JSON.stringify(table, null, 1)}\n`;
const path = join(DIR, 'uk-name-table.json');
if (process.argv.includes('--check')) {
  if (!existsSync(path) || readFileSync(path, 'utf8') !== out) { console.error('uk-name-table.json is out of date'); process.exit(1); }
} else writeFileSync(path, out);
console.log(JSON.stringify(table.counts));
