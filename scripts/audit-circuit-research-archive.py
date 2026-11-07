#!/usr/bin/env python3
"""Check candidate identities against pinned data; never approve historical prose."""
import argparse
import json
from pathlib import Path

from content_factory_circuits import ROOT, source_bundle


def audit(circuits, races, layouts, model, routes):
    ids = {circuit['id'] for circuit in circuits}
    guides = model['guides'] + model['bindings']
    historic_ids = {'ain-diab', 'clermont-ferrand', 'dallas', 'detroit', 'pescara', 'porto', 'sebring'}
    historic = [route for route in routes['circuits'] if route['circuit_id'] in historic_ids]
    records = guides + historic
    errors, rows = [], []
    if len(records) != 78 or len({row['circuit_id'] for row in records}) != 78 or {row['circuit_id'] for row in records} != ids:
        errors.append('Candidate union must match all 78 pinned circuit identities exactly')
    for row in records:
        circuit_id, layout_id = row['circuit_id'], row['layout_id']
        layout = next((item for item in layouts if item['circuitId'] == circuit_id and item['id'] == layout_id), None)
        events = [race for race in races if race['circuitId'] == circuit_id and race['circuitLayoutId'] == layout_id]
        if not layout or not events:
            errors.append(f'{circuit_id}: layout has no pinned circuit/race association')
        year = row.get('numbering_year', row.get('layout_evidence_review', {}).get('period_layout_year'))
        same_year = [event for event in events if event['year'] == year]
        positions = row.get('numbered_turns')
        caveats = []
        if circuit_id in historic_ids:
            if row.get('independent_numbering_verified') is not False or any(section['turn_numbers'] is not None for section in row['sections']):
                errors.append(f'{circuit_id}: unnumbered route must not assert apex numbers')
            reported = row.get('layout_evidence_review', {}).get('archive_turn_count')
            if reported is not None and (not same_year or any(event['turns'] != reported for event in same_year)):
                errors.append(f'{circuit_id}: stated historical archive count differs from event metadata')
            if reported is None:
                caveats.append('Research record asserts no archive turn count; event metadata is reported separately')
            caveats.append('Unnumbered route: period apex mapping and source review pending')
        elif row.get('configuration_scope') == 'modern_comparison_only':
            if circuit_id == 'bugatti':
                if not (layout and year == 1967 and positions == row.get('study_position_count') == row.get('archive_layout_turn_count') == layout['turns'] == 14
                        and row.get('archive_race_turn_count') == 8 and same_year and all(event['turns'] == 8 for event in same_year)):
                    errors.append('bugatti: declared 14-position/8-event-turn discrepancy drifted')
                caveats.append('14 current-layout study positions differ from 8 turns in the 1967 race; historical alignment unverified')
            elif circuit_id == 'mont-tremblant' and year == 2001 and {event['year'] for event in events} == {1968, 1970}:
                caveats.append('2001 modern comparison is not a 1968/1970 period map')
            else:
                errors.append(f'{circuit_id}: unexpected or undocumented modern comparison')
            if not row.get('configuration_caveat', {}).get('uk') or not row.get('configuration_caveat', {}).get('en'):
                errors.append(f'{circuit_id}: bilingual configuration caveat missing')
        elif not same_year or any(event['turns'] != positions for event in same_year):
            errors.append(f'{circuit_id}: candidate layout/year/position count differs from race metadata')
        if not same_year and circuit_id != 'mont-tremblant':
            errors.append(f'{circuit_id}: no race for exact historical layout/year {year}')
        rows.append({'circuit_id': circuit_id, 'layout_id': layout_id, 'reference_year': year,
                     'candidate_positions': positions, 'archive_layout_turns': layout['turns'] if layout else None,
                     'same_year_race_turns': sorted({event['turns'] for event in same_year}),
                     'caveats': caveats, 'historical_approval': False})
    return {'circuits_checked': len(rows), 'approved_circuits': 0, 'errors': errors, 'circuits': rows,
            'limits': ['Archive parity is not independent historical or per-apex verification.',
                       'Sources, translations and all media still require independent review.']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--checksums', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    digest, circuits, races, layouts = source_bundle(args.archive, args.checksums)
    model = json.loads((ROOT / 'apps/web/src/components/editorial/circuit-corners-v3.json').read_text())
    routes = json.loads((ROOT / 'docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json').read_text())
    report = audit(circuits, races, layouts, model, routes)
    report['source_sha256'] = digest
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: value for key, value in report.items() if key != 'circuits'}))
    return 1 if report['errors'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
