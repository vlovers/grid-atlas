"""Archive mismatch tests are synthetic and never approve candidate content."""
import copy
import importlib.util
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
spec = importlib.util.spec_from_file_location('circuit_archive_audit', ROOT / 'scripts/audit-circuit-research-archive.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CircuitResearchArchiveTests(unittest.TestCase):
    def setUp(self):
        self.model = json.loads((ROOT / 'apps/web/src/components/editorial/circuit-corners-v3.json').read_text())
        self.routes = json.loads((ROOT / 'docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json').read_text())
        historic_ids = {'ain-diab', 'clermont-ferrand', 'dallas', 'detroit', 'pescara', 'porto', 'sebring'}
        records = self.model['guides'] + self.model['bindings'] + [r for r in self.routes['circuits'] if r['circuit_id'] in historic_ids]
        self.circuits = [{'id': r['circuit_id']} for r in records]
        self.layouts = [{'id': r['layout_id'], 'circuitId': r['circuit_id'], 'turns': r.get('numbered_turns', r.get('layout_evidence_review', {}).get('archive_turn_count'))} for r in records]
        self.races = []
        for r in records:
            year = r.get('numbering_year', r.get('layout_evidence_review', {}).get('period_layout_year'))
            years = [1968, 1970] if r['circuit_id'] == 'mont-tremblant' else [year]
            for y in years:
                self.races.append({'circuitId': r['circuit_id'], 'circuitLayoutId': r['layout_id'], 'year': y,
                                   'turns': 8 if r['circuit_id'] == 'bugatti' else r.get('numbered_turns', r.get('layout_evidence_review', {}).get('archive_turn_count'))})

    def run_audit(self):
        return module.audit(self.circuits, self.races, self.layouts, self.model, self.routes)

    def test_identity_year_and_count_drift_fail_with_a_known_passing_baseline(self):
        self.assertEqual(self.run_audit()['errors'], [])
        original = copy.deepcopy(self.races)
        for key, value in [('circuitId', 'wrong'), ('circuitLayoutId', 'wrong-layout'), ('year', 1949), ('turns', 999)]:
            with self.subTest(key=key):
                self.races = copy.deepcopy(original)
                self.races[0][key] = value
                self.assertTrue(self.run_audit()['errors'])

    def test_comparison_scope_does_not_hide_undocumented_mismatches(self):
        self.assertEqual(self.run_audit()['errors'], [])
        self.model['guides'][0]['configuration_scope'] = 'modern_comparison_only'
        self.assertTrue(self.run_audit()['errors'])

    def test_missing_bugatti_layout_produces_report_and_historical_count_drift_fails(self):
        self.assertEqual(self.run_audit()['errors'], [])
        original = self.layouts
        self.layouts = [item for item in original if item['id'] != 'bugatti-1']
        self.assertTrue(self.run_audit()['errors'])
        self.layouts = original
        route = next(r for r in self.routes['circuits'] if r['circuit_id'] == 'dallas')
        route['layout_evidence_review']['archive_turn_count'] = 999
        self.assertTrue(self.run_audit()['errors'])

    def test_bugatti_event_count_and_unnumbered_route_cannot_be_laundered(self):
        self.assertEqual(self.run_audit()['errors'], [])
        bugatti = next(g for g in self.model['guides'] if g['circuit_id'] == 'bugatti')
        bugatti['archive_race_turn_count'] = 14
        self.assertTrue(self.run_audit()['errors'])
        bugatti['archive_race_turn_count'] = 8
        route = next(r for r in self.routes['circuits'] if r['circuit_id'] == 'dallas')
        route['sections'][0]['turn_numbers'] = [1]
        self.assertTrue(self.run_audit()['errors'])


if __name__ == '__main__':
    unittest.main()
