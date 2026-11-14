#!/usr/bin/env python3
"""Reproduce the 72-circuit scope and inventory from the genuine pinned archive.

This read-only audit cannot approve prose, corners, media or a deployment.
--write-targets explicitly updates the frontend's identity allowlist only.
"""
import argparse
import json
from pathlib import Path

from content_factory_circuits import ROOT, source_bundle, RELEASE, ASSET

TARGETS = ROOT / 'apps/web/src/components/editorial/circuit-targets.json'
SELECTION = 'Earliest 72 distinct canonical circuit identities by first recorded race date, then race ID, then circuit ID. All other pages are retained.'
UNKNOWN_IDENTITY = ['opening_date', 'current_status']
UNKNOWN_LAYOUT = ['sectors', 'track_width', 'elevation_change', 'longest_straight',
                  'braking_zones', 'overtaking_locations']


def bilingual_status(text):
    counts = {locale: len(value.strip()) if isinstance(value := text.get(locale), str) else 0
              for locale in ['en', 'uk']}
    return {'characters': counts, 'status': 'present_unapproved' if all(counts.values()) else 'missing_locale'}


def content_inventory():
    """Inspect actual locale bytes; a worklist declaration cannot supply text."""
    result = {}
    base = 'apps/web/src/components/editorial/'
    for batch in ['extra', 'next20', 'final33']:
        path = base + f'archive-summaries/circuit-{batch}-stories.json'
        for row in json.loads((ROOT / path).read_text()):
            result[row['id']] = {'source': path, 'kind': 'short_summary',
                                 **bilingual_status(row.get('description', {}))}
    path = base + 'circuit-narratives-v3.json'
    for row in json.loads((ROOT / path).read_text())['entries']:
        result[row['circuit_id']] = {'source': path, 'kind': 'biography_draft',
                                    **bilingual_status(row.get('biography', {}).get('text', {}))}
    for filename in ['monaco-turns-and-moments-v1.json', 'spa-turns-v1.json']:
        path = 'docs/editorial/circuit-experience-v3/' + filename
        row = json.loads((ROOT / path).read_text())
        result[row['circuit_id']] = {'source': path, 'kind': 'biography_draft',
                                    **bilingual_status(row.get('intro', {}))}
    return result


def select_targets(digest, circuits, races, layouts):
    ids = [row['id'] for row in circuits]
    if len(ids) != 78 or len(set(ids)) != 78:
        raise ValueError('Expected 78 distinct pinned circuit identities')
    by_circuit = {key: [] for key in ids}
    layout_keys = {(row['circuitId'], row['id']) for row in layouts}
    if len(layout_keys) != len(layouts):
        raise ValueError('Duplicate circuit/layout association')
    seen = set()
    for race in races:
        if race['circuitId'] not in by_circuit or race['id'] in seen:
            raise ValueError('Duplicate race or unknown circuit')
        if (race['circuitId'], race['circuitLayoutId']) not in layout_keys:
            raise ValueError('Race layout belongs to another circuit or is missing')
        seen.add(race['id'])
        by_circuit[race['circuitId']].append(race)
    if any(not rows for rows in by_circuit.values()):
        raise ValueError('Every pinned circuit must have a recorded first race')
    first = {key: min(rows, key=lambda row: (row['date'], row['id']))
             for key, rows in by_circuit.items()}
    ordered = sorted(ids, key=lambda key: (first[key]['date'], first[key]['id'], key))
    def entry(key):
        return {'circuit_id': key, 'first_race_id': str(first[key]['id']),
                'first_race_date': first[key]['date']}
    return {'schema_version': 1, 'source': {'release': RELEASE, 'artifact': ASSET,
            'sha256': digest}, 'selection': SELECTION,
            'targets': [entry(key) for key in ordered[:72]],
            'excluded': [{**entry(key), 'reason': 'First recorded race is later than the 72nd identity; existing page retained.'}
                         for key in ordered[72:]]}


def inventory(manifest, circuits, races, layouts):
    load = lambda path: json.loads((ROOT / path).read_text())
    worklist = {row['circuit_id']: row for row in load('docs/editorial/circuit-experience-v3/F1DB_78_RELEASE_WORKLIST.json')['circuits']}
    corners = load('apps/web/src/components/editorial/circuit-corners-v3.json')
    guides = {row['circuit_id']: row for row in corners['guides'] + corners['bindings']}
    names = {row['id']: row for row in circuits}
    content = content_inventory()
    rows = []
    for target in manifest['targets']:
        key = target['circuit_id']
        events = sorted((row for row in races if row['circuitId'] == key), key=lambda row: (row['year'], row['round']))
        guide = guides.get(key)
        configurations = []
        for layout in layouts:
            if layout['circuitId'] != key:
                continue
            linked = [row for row in events if row['circuitLayoutId'] == layout['id']]
            configurations.append({'layout_id': layout['id'], 'race_records': len(linked),
                'first_observed_year': min((row['year'] for row in linked), default=None),
                'last_observed_year': max((row['year'] for row in linked), default=None),
                'layout_length_km': layout['length'], 'layout_turns': layout['turns'],
                'event_measurement_discrepancies': [str(row['id']) for row in linked
                    if row['courseLength'] != layout['length'] or row['turns'] != layout['turns']],
                'candidate_numbered_guide': bool(guide and guide['layout_id'] == layout['id']),
                'independent_corner_approval': 'not_evidenced'})
        identity = names[key]
        rows.append({'circuit_id': key, 'name': identity['fullName'],
            'source_locator': f'f1db-circuits.json#id={key}',
            'race_records': len(events), 'first_recorded_date': events[0]['date'],
            'last_recorded_date': events[-1]['date'],
            'identity_fields_present': [field for field in ['fullName', 'previousNames', 'placeName', 'countryId', 'latitude', 'longitude', 'type', 'direction'] if identity.get(field) is not None],
            'unknown_identity_fields': UNKNOWN_IDENTITY,
            'layouts': configurations,
            'candidate_numbered_positions': guide.get('numbered_turns', 0) if guide else 0,
            'research_stage': worklist[key]['content_stage'],
            'en_uk_text_inventory': content.get(key, {'source': None, 'kind': 'absent', **bilingual_status({})}),
            'independent_editorial_approval': 'not_evidenced',
            'production_route_verification': 'not_evidenced'})
    return {'source': manifest['source'], 'selection': SELECTION,
        'target_count': len(rows), 'excluded': manifest['excluded'], 'circuits': rows,
        'summary': {'recorded_layouts': sum(len(row['layouts']) for row in rows),
            'race_records': sum(row['race_records'] for row in rows),
            'candidate_numbered_positions': sum(row['candidate_numbered_positions'] for row in rows)},
        'unknown_layout_fields': UNKNOWN_LAYOUT,
        'unknown_reason': 'These fields are absent from the imported F1DB circuit/layout/race records; independent period-specific evidence is required.',
        'limitations': ['Recorded race dates include provisional 2026 data and do not prove a final F1 appearance or present-day circuit status.',
            'Layout observations do not establish construction or continuous configuration validity dates.',
            'Candidate numbered positions are research, not independently documented historical corners.',
            'Existing public summaries are preserved; expanded manuscripts and media require independent approval.',
            'No production origin or publication state is inferred from files, CI, or local HTTP success.']}


def markdown(report):
    lines = ['# 72-circuit completion checkpoint', '',
        'Generated from checksum-verified F1DB; inventory only, not editorial or publication approval.', '',
        report['selection'], '', f"Archive SHA-256: `{report['source']['sha256']}`.", '',
        '| Circuit | Race records | First–last record | Layouts | Candidate turn positions | EN/UK text inventory | Editorial / live |',
        '| --- | ---: | --- | ---: | ---: | --- | --- |']
    for row in report['circuits']:
        text = row['en_uk_text_inventory']
        label = 'biography draft' if text['kind'] == 'biography_draft' else 'short summary'
        presence = 'EN+UK' if text['status'] == 'present_unapproved' else 'MISSING LOCALE'
        lines.append(f"| {row['circuit_id']} | {row['race_records']} | {row['first_recorded_date']}–{row['last_recorded_date']} | {len(row['layouts'])} | {row['candidate_numbered_positions']} | {presence}, {label} | pending / unverified |")
    lines += ['', 'Excluded from this batch; existing pages retained:', '']
    lines += [f"- `{row['circuit_id']}`: first recorded race {row['first_race_date']}; later than the 72nd identity." for row in report['excluded']]
    lines += ['', f"Totals: {report['summary']['recorded_layouts']} layout records; {report['summary']['race_records']} race records; {report['summary']['candidate_numbered_positions']} candidate numbered positions (not approved corners).", '',
        'Every target has a source record for name, location, country, coordinates, type and direction. Historical names are retained where F1DB supplies them. Opening dates and present-day status need separate evidence. Sector counts, width, elevation, longest straight, braking zones and overtaking locations are unavailable in these imported records. Unknown does not mean zero or that research cannot resolve a field.', '',
        'The JSON report retains per-layout observations and event/layout measurement discrepancies. Pole, qualifying and lap-record data are not imported by the current race-result schema; they are not inferred from winners. The text inventory reads actual nonempty EN/UK fields, records their file and character counts, and distinguishes biography drafts from short summaries. Presence is not full manuscript completion or translation approval. The research-stage column in JSON is separately declared by the existing worklist.', '',
        'No media asset is approved by this inventory. The reader uses an original season illustration when no rights-cleared photo or diagram exists. Production access, enrolled independent reviewers/publishers, exact-revision receipts and issue #104 remain release gates.', '',
        'Reproduce:', '', '```sh',
        'python3 scripts/audit-circuit-targets.py --archive /private/tmp/grid-atlas-72/f1db-json-splitted.zip --checksums /private/tmp/grid-atlas-72/checksums_sha256.txt --output /private/tmp/grid-atlas-72/completion.json --markdown docs/editorial/circuit-72-completion.md',
        '```', '', 'Limits:', '']
    lines += [f'- {item}' for item in report['limitations']]
    return '\n'.join(lines) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', required=True, type=Path)
    parser.add_argument('--checksums', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--markdown', type=Path)
    parser.add_argument('--write-targets', action='store_true')
    args = parser.parse_args()
    digest, circuits, races, layouts = source_bundle(args.archive, args.checksums)
    manifest = select_targets(digest, circuits, races, layouts)
    if args.write_targets:
        TARGETS.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    elif json.loads(TARGETS.read_text()) != manifest:
        raise ValueError('Checked-in target manifest differs from pinned archive selection')
    report = inventory(manifest, circuits, races, layouts)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    if args.markdown:
        args.markdown.write_text(markdown(report))
    print(json.dumps({'targets': report['target_count'], **report['summary']}))


if __name__ == '__main__':
    main()
