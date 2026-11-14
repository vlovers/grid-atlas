import importlib.util
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
spec = importlib.util.spec_from_file_location('circuit_targets', ROOT / 'scripts/audit-circuit-targets.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CircuitTargetTests(unittest.TestCase):
    def test_absent_or_blank_translation_is_never_counted_as_bilingual(self):
        for text in [{'en': 'A source-backed paragraph'}, {'en': 'English', 'uk': '  '},
                     {'en': None, 'uk': 'Український текст'}]:
            self.assertEqual(module.bilingual_status(text)['status'], 'missing_locale')
        result = module.bilingual_status({'en': 'English', 'uk': 'Український текст'})
        self.assertEqual(result['status'], 'present_unapproved')
        self.assertEqual(result['characters']['en'], 7)

    def fixture(self):
        circuits = [{'id': f'circuit-{i}'} for i in range(78)]
        races = [{'id': i + 1, 'circuitId': row['id'], 'circuitLayoutId': row['id'] + '-1',
                  'date': f'{1950 + i}-01-01'} for i, row in enumerate(circuits)]
        layouts = [{'id': row['circuitLayoutId'], 'circuitId': row['circuitId']} for row in races]
        return circuits, races, layouts

    def test_selection_is_chronological_and_independent_of_file_order(self):
        circuits, races, layouts = self.fixture()
        result = module.select_targets('a' * 64, circuits, races, layouts)
        self.assertEqual(result, module.select_targets('a' * 64, circuits[::-1], races[::-1], layouts[::-1]))
        self.assertEqual(len(result['targets']), 72)
        self.assertEqual(len(result['excluded']), 6)
        self.assertEqual(result['targets'][-1]['circuit_id'], 'circuit-71')
        self.assertEqual(result['excluded'][0]['circuit_id'], 'circuit-72')
        self.assertEqual(result['targets'][0]['first_race_id'], '1')

    def test_same_date_tie_uses_canonical_race_id_and_not_circuit_spelling(self):
        circuits, races, layouts = self.fixture()
        races[72]['date'] = races[71]['date']
        races[72]['id'], races[71]['id'] = races[71]['id'], races[72]['id']
        result = module.select_targets('a' * 64, circuits, races, layouts)
        self.assertEqual(result['targets'][-1]['circuit_id'], 'circuit-72')

    def test_wrong_venue_layout_duplicate_race_and_duplicate_identity_fail(self):
        for case in ['layout', 'race', 'identity', 'missing']:
            circuits, races, layouts = self.fixture()
            if case == 'layout':
                races[0]['circuitLayoutId'] = races[1]['circuitLayoutId']
            elif case == 'race':
                races.append(races[0])
            elif case == 'identity':
                circuits[-1] = circuits[0]
            else:
                races.pop()
            with self.subTest(case=case), self.assertRaises(ValueError):
                module.select_targets('a' * 64, circuits, races, layouts)
