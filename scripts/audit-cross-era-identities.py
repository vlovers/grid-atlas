#!/usr/bin/env python3
"""Audit research-only Commons subjects against checksum-verified pinned F1DB.

Missing identity pins are reported as source-derived proposals, never auto-approved.
No image download, public registry update or media rights clearance occurs.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'packages/data-importer'))
from import_seasons import ASSET, RELEASE, verified_seasons

_verifier_spec = importlib.util.spec_from_file_location(
    'grid_atlas_media_identity_verifier', ROOT / 'scripts/verify-media-identities.py')
_verifier = importlib.util.module_from_spec(_verifier_spec)
_verifier_spec.loader.exec_module(_verifier)
verify_snapshot = _verifier.verify_snapshot

COLLECTION_NAMES = {
    'driver': 'drivers', 'constructor': 'constructors',
    'circuit': 'circuits', 'race': 'races', 'layout': 'circuits-layouts',
}
SUBJECT_TYPES = frozenset({'driver', 'constructor', 'circuit', 'race'})


def row_digest(row):
    return hashlib.sha256(json.dumps(
        row, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()


def audit_cross_era_identities(staging, snapshot, collections, digest):
    """Require exact source records and retain an explicit publication barrier."""
    verify_snapshot(snapshot, collections, digest)
    if (staging.get('schema_version') != 1 or staging.get('lane') != 'research_only'
            or staging.get('publication_allowed') is not False
            or not isinstance(staging.get('entries'), list) or not staging['entries']):
        raise ValueError('Invalid research-only staging manifest')

    indexed = {}
    for kind in SUBJECT_TYPES:
        rows = collections[kind]
        if not isinstance(rows, list):
            raise ValueError(f'Invalid F1DB {kind} collection')
        kind_index = {}
        for row in rows:
            identifier = row.get('id') if isinstance(row, dict) else None
            if identifier is None or str(identifier) in kind_index:
                raise ValueError(f'Duplicate or missing canonical {kind} ID in F1DB')
            kind_index[str(identifier)] = row
        indexed[kind] = kind_index

    pinned = {(item['type'], str(item['id'])): item for item in snapshot['subjects']}
    observed, proposed, results = set(), {}, []
    for entry in staging['entries']:
        subject = entry.get('subject') if isinstance(entry, dict) else None
        kind = subject.get('type') if isinstance(subject, dict) else None
        identifier = subject.get('id') if isinstance(subject, dict) else None
        research_id = entry.get('id') if isinstance(entry, dict) else None
        if (not isinstance(research_id, str) or not research_id.startswith('research-')
                or research_id in observed or kind not in SUBJECT_TYPES
                or not isinstance(identifier, str) or not identifier):
            raise ValueError('Invalid or duplicate staged research identity')
        if (entry.get('status') != 'candidate' or entry.get('review') is not None
                or entry.get('content_sha256') is not None
                or entry.get('delivery', {}).get('local_path') is not None
                or entry.get('delivery', {}).get('remote_url') is not None):
            raise ValueError(f'{research_id}: staging must remain unapproved and undelivered')
        observed.add(research_id)
        row = indexed[kind].get(identifier)
        if row is None:
            raise ValueError(f'{research_id}: unknown F1DB {kind}:{identifier}')
        name = row.get('fullName') or row.get('name') or row.get('officialName')
        if not isinstance(name, str) or not name.strip():
            raise ValueError(f'{research_id}: missing source-reported F1DB name')
        key = (kind, identifier)
        source_record = {'type': kind, 'id': identifier, 'name': name,
                         'record_sha256': row_digest(row)}
        existing = pinned.get(key)
        if existing is not None and existing != source_record:
            raise ValueError(f'{research_id}: pinned F1DB identity drift for {kind}:{identifier}')
        if existing is None:
            proposed[key] = source_record
        results.append({'research_id': research_id,
                        'subject': {'type': kind, 'id': identifier},
                        'status': 'pinned' if existing else 'verified_unpinned',
                        'record_sha256': source_record['record_sha256']})
    return {
        'ok': True, 'source': snapshot['source'], 'staged': len(results),
        'already_pinned': sum(item['status'] == 'pinned' for item in results),
        'verified_unpinned': len(proposed), 'entries': results,
        'proposed_pilot_subjects': [proposed[key] for key in sorted(proposed)],
        'publication_allowed': False,
        'warning': 'Verified source identity is not image subject confirmation or rights approval.',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--checksums', type=Path, required=True)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    try:
        _, digest = verified_seasons(args.archive, args.checksums)
        with zipfile.ZipFile(args.archive) as bundle:
            collections = {kind: json.loads(bundle.read(f'f1db-{name}.json'))
                           for kind, name in COLLECTION_NAMES.items()}
        snapshot = json.loads((ROOT / 'docs/media/pilot-identities.json').read_text(encoding='utf-8'))
        staging = json.loads((ROOT / 'docs/media/cross-era-staging.json').read_text(encoding='utf-8'))
        report = audit_cross_era_identities(staging, snapshot, collections, digest)
        encoded = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
        if args.output:
            args.output.write_text(encoded, encoding='utf-8')
        print(encoded, end='')
    except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile) as exc:
        parser.exit(1, f'Cross-era F1DB identity audit failed: {exc}\n')


if __name__ == '__main__':
    main()
