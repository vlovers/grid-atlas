#!/usr/bin/env python3
"""Read-only checks for Batch 2 manuscripts; never approves, exports or publishes."""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scripts.editorial_dossiers import load_json, render_draft, validate_dossier, read_drivers
from scripts.editorial_review import validate_review
from scripts.validate_editorial_batch import validate as validate_manifest, validate_source_ids

BATCH = ROOT / 'docs/editorial/biography-expansion-batch-2'
SHA = '0f1717eaebae646b7ced9ca96f6be3282c1c1d435d0a9d75f2c00f40feb7d2a8'
TABLES = {'drivers', 'races', 'races-race-results', 'races-qualifying-results',
          'races-driver-standings', 'seasons-driver-standings'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def words(text):
    return len(re.findall(r"[^\W_]+(?:[’'\-][^\W_]+)*", text, flags=re.UNICODE))


def checked_assertion(case, rows):
    require(set(case) == {'id', 'driver_id', 'claim_ids', 'table', 'where', 'select', 'expected'}, 'statistic assertion shape')
    require(case['table'] in TABLES and isinstance(case['where'], dict) and case['where'], 'statistic table/filter')
    require(rows and all(isinstance(row, dict) for row in rows), 'statistic collection must contain records')
    fields = set().union(*(set(row) for row in rows))
    require(set(case['where']) <= fields, 'unknown archive filter field')
    selected = [row for row in rows if all(row.get(key) in value if isinstance(value, list)
                else row.get(key) == value for key, value in case['where'].items())]
    projection = case['select']
    if projection == 'count':
        observed = len(selected)
    elif projection == 'distinct_races':
        require('raceId' in fields, 'distinct races needs race records')
        observed = len({row['raceId'] for row in selected})
    else:
        require(isinstance(projection, list) and projection and set(projection) <= fields, 'unknown archive projection field')
        observed = [[row.get(field) for field in projection] for row in selected]
        # Compare row sets deterministically; archive insertion order is not chronology.
        observed.sort(key=lambda row: json.dumps(row, ensure_ascii=False, sort_keys=True))
    expected = case['expected']
    if isinstance(projection, list):
        require(isinstance(expected, list), 'expected archive rows must be a list')
        expected = sorted(expected, key=lambda row: json.dumps(row, ensure_ascii=False, sort_keys=True))
    require(json.dumps(observed, sort_keys=True) == json.dumps(expected, sort_keys=True),
            f"archive mismatch: {case['id']}: expected {expected!r}, observed {observed!r}")
    digest = hashlib.sha256(json.dumps(selected, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    return {'id': case['id'], 'driver_id': case['driver_id'], 'claim_ids': case['claim_ids'],
            'table': 'f1db-' + case['table'] + '.json', 'matched_records': len(selected),
            'records_sha256': digest, 'observed': observed}


def audit(batch=BATCH, archive=None, checksums=None):
    batch = Path(batch)
    manifest = load_json(batch / 'manifest.json')
    require(validate_manifest(manifest) == 10, 'Batch 2 requires ten drivers')
    require(manifest['locale_targets'] == ['en', 'uk'], 'Batch 2 requires EN/UK')
    as_of = dt.date.fromisoformat(manifest['created_at'])
    canonical = set(manifest['drivers'])
    archive_digest = None
    if archive is not None:
        require(checksums is not None, 'archive and checksums are required together')
        identities, archive_digest = read_drivers(Path(archive), Path(checksums))
        require(archive_digest == SHA, 'unexpected archive digest')
        canonical = {row[0] for row in identities}
        validate_source_ids(manifest, canonical)
    files = set((batch / 'dossiers').glob('*.json'))
    expected_files = {batch / 'dossiers' / f'{driver}.{locale}.json' for driver in manifest['drivers'] for locale in ['en', 'uk']}
    require(files == expected_files, 'exactly twenty requested dossiers are required')
    dossiers, profiles = {}, []
    for driver in manifest['drivers']:
        local = {}
        for locale in ['en', 'uk']:
            path = batch / 'dossiers' / f'{driver}.{locale}.json'
            doc = load_json(path)
            validate_dossier(doc, canonical, as_of)
            require(doc['driver_id'] == driver and doc['locale'] == locale, 'dossier filename/identity mismatch')
            require('AI-assisted' in doc['author'], 'AI drafting provenance must remain explicit')
            review = load_json(batch / 'reviews' / f'{driver}.{locale}.review.json')
            require(review['stage'] == 'evidence_review' and review['publication'] is None, 'batch must stay in evidence review')
            require(all(value is None for value in review['claim_reviews'].values()) and all(value is None for value in review['checks'].values()),
                    'Batch 2 supplies no human approval decisions')
            report = validate_review(doc, review, canonical, as_of)
            require(not report['ready_for_publication'], 'unreviewed manuscript must not be publishable')
            count = sum(words(claim['statement']) for claim in doc['claims'])
            require(count >= (500 if locale == 'en' else 400), 'biography regressed to a short card')
            require(len(doc['sections']) >= 6 and doc['sections'][0]['section_id'] == 'origins'
                    and doc['sections'][-1]['section_id'] == 'legacy', 'career arc needs six ordered sections')
            require(any(c['topic'] == 'driving_style' for c in doc['claims']), 'attributed driving-style coverage required')
            require(len(doc['sources']) >= 4 and len({s['independence_group'] for s in doc['sources']}) >= 3, 'source breadth regressed')
            for claim in doc['claims']:
                for evidence in claim['evidence']:
                    for reference in re.findall(r'(?:see |and )([a-z-]+\.json)', evidence['locator']):
                        require((batch / reference).is_file(), 'missing local evidence reference: ' + reference)
            expected_render = render_draft(doc)
            require((batch / 'manuscripts' / f'{driver}.{locale}.md').read_text() == expected_render, 'rendered manuscript is stale or contains uncited prose')
            dossiers[(driver, locale)] = doc
            local[locale] = {'words': count, 'claims': len(doc['claims']), 'sections': len(doc['sections']),
                             'revision_sha256': report['revision_sha256'], 'publication_ready': False}
        en, uk = dossiers[(driver, 'en')], dossiers[(driver, 'uk')]
        require([(c['claim_id'], c['topic'], c['evidence']) for c in en['claims']] ==
                [(c['claim_id'], c['topic'], c['evidence']) for c in uk['claims']], 'EN/UK claims/evidence diverged')
        require(en['sources'] == uk['sources'], 'EN/UK source register diverged')
        require([(s['section_id'], s['claim_ids']) for s in en['sections']] ==
                [(s['section_id'], s['claim_ids']) for s in uk['sections']], 'EN/UK chapter ordering diverged')
        profiles.append({'driver_id': driver, 'locales': local, 'sources': len(en['sources']),
                         'publisher_groups': len({s['independence_group'] for s in en['sources']})})
    ledger = load_json(batch / 'statistics-assertions.json')
    require(set(ledger) == {'schema_version', 'release', 'sha256', 'publication_allowed', 'assertions'}, 'statistics ledger shape')
    require(ledger['schema_version'] == 1 and ledger['release'] == 'v2026.17.0' and ledger['sha256'] == SHA
            and ledger['publication_allowed'] is False, 'statistics must retain pinned, nonpublishing provenance')
    covered, identifiers, checked = set(), set(), []
    tables = {}
    if archive is not None:
        with zipfile.ZipFile(archive) as bundle:
            tables = {name: json.loads(bundle.read('f1db-' + name + '.json')) for name in TABLES}
    for case in ledger['assertions']:
        require(isinstance(case['id'], str) and case['id'] not in identifiers, 'duplicate statistic assertion')
        identifiers.add(case['id'])
        require(case['driver_id'] in manifest['drivers'] and case['claim_ids'], 'unbound statistic assertion')
        doc = dossiers[(case['driver_id'], 'en')]
        require(set(case['claim_ids']) <= {claim['claim_id'] for claim in doc['claims']}, 'statistic references unknown claim')
        covered.update(case['claim_ids'])
        if tables:
            checked.append(checked_assertion(case, tables[case['table']]))
    numeric_claims = {c['claim_id'] for (driver, locale), doc in dossiers.items() if locale == 'en'
                      for c in doc['claims'] if any(e['source_id'] == 'f1db' for e in c['evidence'])}
    require(numeric_claims <= covered, 'archive-cited claim lacks an explicit statistical assertion')
    return {'batch_id': manifest['batch_id'], 'publication_allowed': False, 'human_approved_dossiers': 0,
            'archive_identity_checked': archive_digest is not None, 'archive_sha256': archive_digest,
            'statistics_assertions': len(ledger['assertions']), 'statistics_checked': len(checked),
            'paired_claims': sum(row['locales']['en']['claims'] for row in profiles),
            'en_words': sum(row['locales']['en']['words'] for row in profiles),
            'uk_words': sum(row['locales']['uk']['words'] for row in profiles),
            'profiles': profiles, 'archive_checks': checked,
            'limits': ['Source breadth and byte/record matches are not source-semantic or human approval.',
                       'Statistics assertions cover named fields; they do not mechanically verify every sentence.',
                       'Non-F1 events, early careers, style and interpretation need source review outside F1DB.',
                       'No database, public API, operator authorization or publication state is modified.']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--batch', type=Path, default=BATCH)
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--checksums', type=Path, required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(audit(args.batch, args.archive, args.checksums), ensure_ascii=False, indent=2))
    except (OSError, ValueError, KeyError, zipfile.BadZipFile) as exc:
        parser.exit(1, f'Biography Batch 2 blocked: {exc}\n')


if __name__ == '__main__':
    main()
