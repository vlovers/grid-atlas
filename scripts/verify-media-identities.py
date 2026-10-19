#!/usr/bin/env python3
"""Verify the small media identity/layout snapshot against checksum-verified F1DB."""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'packages/data-importer'))
from import_seasons import ASSET, RELEASE, verified_seasons


def verify_snapshot(snapshot, collections, digest):
    if snapshot['source'] != {'slug': 'f1db', 'release': RELEASE, 'artifact': ASSET, 'sha256': digest}:
        raise ValueError('Pinned media source release/checksum mismatch')
    seen = set()
    for subject in snapshot['subjects']:
        key = (subject['type'], subject['id'])
        if key in seen:
            raise ValueError('Duplicate canonical media identity')
        seen.add(key)
        rows = [r for r in collections[subject['type']] if str(r['id']) == subject['id']]
        if len(rows) != 1:
            raise ValueError(f'Unknown canonical media identity: {key}')
        row = rows[0]
        observed = hashlib.sha256(json.dumps(row, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
        if observed != subject['record_sha256'] or subject['name'] != (row.get('fullName') or row.get('name') or row.get('officialName')):
            raise ValueError(f'Media identity snapshot changed: {key}')
    for layout in snapshot['layouts']:
        rows = [r for r in collections['layout'] if r['id'] == layout['id'] and r['circuitId'] == layout['circuit_id']]
        if len(rows) != 1:
            raise ValueError('Unknown circuit/layout mapping')
        for race_id in layout['race_ids']:
            rows = [r for r in collections['race'] if str(r['id']) == race_id]
            if len(rows) != 1 or rows[0]['circuitId'] != layout['circuit_id'] or rows[0]['circuitLayoutId'] != layout['id']:
                raise ValueError('Historical race/circuit/layout mismatch')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--checksums', type=Path, required=True)
    args = parser.parse_args()
    try:
        _, digest = verified_seasons(args.archive, args.checksums)
        names = {'driver': 'drivers', 'constructor': 'constructors', 'circuit': 'circuits', 'race': 'races', 'layout': 'circuits-layouts'}
        with zipfile.ZipFile(args.archive) as bundle:
            collections = {kind: json.loads(bundle.read(f'f1db-{name}.json')) for kind, name in names.items()}
        snapshot = json.loads((ROOT / 'docs/media/pilot-identities.json').read_text())
        verify_snapshot(snapshot, collections, digest)
    except (OSError, ValueError, KeyError, zipfile.BadZipFile) as exc:
        parser.exit(1, f'Media identity check failed: {exc}\n')
    print(f"Verified {len(snapshot['subjects'])} canonical media subjects and {len(snapshot['layouts'])} exact layout mappings; no rights approval")


if __name__ == '__main__':
    main()
