#!/usr/bin/env python3
"""Read-only20-circuit identity/year/layout/season check against the pinned ZIP."""
import argparse
import json
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'packages/data-importer'))
from import_seasons import verified_seasons, RELEASE, ASSET


def verify(snapshot, collections, digest):
    if snapshot['source'] != {'slug': 'f1db', 'release': RELEASE, 'artifact': ASSET, 'sha256': digest}:
        raise ValueError('Pinned archive/checksum mismatch')
    if len(snapshot['circuits']) != 20 or len({row['id'] for row in snapshot['circuits']}) != 20:
        raise ValueError('Exactly20 distinct circuit identities required')
    circuit_ids = {row['id'] for row in snapshot['circuits']}
    for kind in ['layouts', 'races']:
        records = snapshot[kind]
        if len(records) != 20 or len({row['id'] for row in records}) != 20 or {row['circuitId'] for row in records} != circuit_ids:
            raise ValueError('Exactly20 unique layout/race records covering all20 circuits required')
    for race in snapshot['races']:
        if not any(layout['id'] == race['circuitLayoutId'] and layout['circuitId'] == race['circuitId'] for layout in snapshot['layouts']):
            raise ValueError('Circuit/race/layout relationship mismatch')
    for kind in ['circuits', 'layouts', 'races']:
        source = {row['id']: row for row in collections[kind]}
        for row in snapshot[kind]:
            if row != source.get(row['id']):
                raise ValueError(f'{kind}: source record mismatch: {row["id"]}')
    for circuit in snapshot['circuits']:
        ident = circuit['id']
        years = sorted({race['year'] for race in collections['races'] if race['circuitId'] == ident})
        if snapshot['years_by_circuit'].get(ident) != years:
            raise ValueError(f'{ident}: source season coverage mismatch')
    return {'source': snapshot['source'], 'circuits_checked': 20, 'rights_clearances': 0,
            'result': 'pinned_archive_consistency_only'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--checksums', type=Path, required=True)
    args = parser.parse_args()
    _, digest = verified_seasons(args.archive, args.checksums)
    expected = json.loads((ROOT / 'docs/media/pilot-identities.json').read_text())['source']
    if digest != expected['sha256']:
        raise ValueError('Archive differs from repository pin')
    with zipfile.ZipFile(args.archive) as bundle:
        collections = {kind: json.loads(bundle.read('f1db-' + name + '.json')) for kind, name in
                       [('circuits', 'circuits'), ('layouts', 'circuits-layouts'), ('races', 'races')]}
    snapshot = json.loads((ROOT / 'docs/media/circuit-intake-410/archive-snapshot.json').read_text())
    print(json.dumps(verify(snapshot, collections, digest)))


if __name__ == '__main__':
    main()
