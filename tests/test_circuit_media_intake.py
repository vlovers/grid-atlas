"""Negative identity checks use explicitly synthetic records, never approvals."""
import copy
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('circuit_media_verifier', ROOT / 'scripts/verify-circuit-media-intake.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CircuitMediaIntakeTests(unittest.TestCase):
    def setUp(self):
        self.digest = 'a' * 64
        self.collections = {
            'circuits': [{'id': f'fixture-{n}', 'name': 'Synthetic venue'} for n in range(20)],
            'layouts': [{'id': f'fixture-{n}-1', 'circuitId': f'fixture-{n}', 'length': 1} for n in range(20)],
            'races': [{'id': n, 'circuitId': f'fixture-{n}', 'circuitLayoutId': f'fixture-{n}-1', 'year': 2000} for n in range(20)],
        }
        self.snapshot = copy.deepcopy(self.collections)
        self.snapshot['source'] = {'slug': 'f1db', 'release': module.RELEASE, 'artifact': module.ASSET, 'sha256': self.digest}
        self.snapshot['years_by_circuit'] = {f'fixture-{n}': [2000] for n in range(20)}

    def test_known_passing_baseline_has_no_rights_approvals(self):
        result = module.verify(self.snapshot, self.collections, self.digest)
        self.assertEqual(result['circuits_checked'], 20)
        self.assertEqual(result['rights_clearances'], 0)

    def test_original_source_records_cannot_drift(self):
        for kind, key, value in [('circuits', 'name', 'Wrong venue'), ('layouts', 'length', 999), ('races', 'year', 1900), ('races', 'circuitLayoutId', 'wrong')]:
            with self.subTest(kind=kind, key=key):
                snapshot = copy.deepcopy(self.snapshot)
                snapshot[kind][0][key] = value
                with self.assertRaises(ValueError):
                    module.verify(snapshot, self.collections, self.digest)

    def test_source_digest_and_observed_seasons_cannot_be_fabricated(self):
        with self.assertRaises(ValueError):
            module.verify(self.snapshot, self.collections, 'b' * 64)
        self.snapshot['years_by_circuit']['fixture-0'] = [1999, 2000]
        with self.assertRaises(ValueError):
            module.verify(self.snapshot, self.collections, self.digest)

    def test_empty_duplicate_or_partial_selected_records_cannot_claim_twenty_checked(self):
        for kind in ['layouts', 'races']:
            for transform in [lambda rows: [], lambda rows: rows[:-1], lambda rows: rows[:-1] + [rows[0]]]:
                with self.subTest(kind=kind, transform=transform):
                    snapshot = copy.deepcopy(self.snapshot)
                    snapshot[kind] = transform(snapshot[kind])
                    with self.assertRaises(ValueError):
                        module.verify(snapshot, self.collections, self.digest)
