#!/usr/bin/env python3
"""Independent source-row census of recorded pole/fastest-lap flags, not times."""
import argparse
from collections import Counter
import json
from pathlib import Path
import zipfile

from content_factory_circuits import ROOT, source_bundle, records


def census(archive, checksums):
    digest, circuits, races, _ = source_bundle(archive, checksums)
    with zipfile.ZipFile(archive) as bundle:
        results = records(bundle, 'f1db-races-race-results.json')
        drivers = {row['id']: row.get('fullName') or row['name'] for row in records(bundle, 'f1db-drivers.json')}
        constructors = {row['id']: row.get('fullName') or row['name'] for row in records(bundle, 'f1db-constructors.json')}
    by_race = {}
    for row in results:
        by_race.setdefault(row['raceId'], []).append(row)
    targets = json.loads((ROOT / 'apps/web/src/components/editorial/circuit-targets.json').read_text())
    if targets['source']['sha256'] != digest:
        raise ValueError('Target pin differs from source archive')
    output = []
    for target in targets['targets']:
        events = [race for race in races if race['circuitId'] == target['circuit_id']]
        metrics = {}
        for field, key in [('polePosition', 'poles'), ('fastestLap', 'fastest_laps')]:
            driver_counts, constructor_counts, complete = Counter(), Counter(), 0
            for event in events:
                rows = by_race.get(event['id'], [])
                complete += bool(rows) and all(type(row.get(field)) is bool for row in rows)
                classified = [row for row in rows if row.get(field) is True]
                driver_counts.update({row['driverId'] for row in classified})
                constructor_counts.update({row['constructorId'] for row in classified})
            metrics[key] = {'complete_races': complete, 'race_records': len(events),
                'drivers': [{'external_id': ident, 'name': drivers[ident], 'count': count} for ident, count in sorted(driver_counts.items())],
                'constructors': [{'external_id': ident, 'name': constructors[ident], 'count': count} for ident, count in sorted(constructor_counts.items())]}
        output.append({'circuit_id': target['circuit_id'], **metrics})
    return {'source_sha256': digest, 'circuits': output,
            'limits': 'Source-reported main-race result flags only; not lap times, qualifying records, circuit records, or editorial approval.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', required=True, type=Path)
    parser.add_argument('--checksums', required=True, type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    report = json.dumps(census(args.archive, args.checksums), ensure_ascii=False, indent=2) + '\n'
    if args.output:
        args.output.write_text(report)
    else:
        print(report, end='')


if __name__ == '__main__':
    main()
