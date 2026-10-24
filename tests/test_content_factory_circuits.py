"""Offline deterministic content factory checks without real F1DB ZIP."""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("content_factory_circuits", ROOT / "scripts/content_factory_circuits.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CircuitFactoryTests(unittest.TestCase):
    def setUp(self):
        self.circuits = [{"id": f"track-{n}", "name": f"Track {n}"} for n in range(30)]
        self.races = [{"id": n + 1, "circuitId": f"track-{n % 30}", "year": 1950 + n % 3,
                       "circuitLayoutId": f"track-{n % 30}-1"} for n in range(60)]
        self.layouts = [{"id": f"track-{n}-1", "circuitId": f"track-{n}"} for n in range(30)]

    def test_exactly_25_unpublished_bilingual_profiles(self):
        result = module.compile_batch("a" * 64, self.circuits, self.races, self.layouts)
        self.assertEqual(len(result["circuits"]), 25)
        self.assertEqual(result["status"], "unpublished")
        for subject in result["circuits"]:
            self.assertEqual(set(subject["locales"]), {"en", "uk"})
            self.assertIsNone(subject["enriched_story"])
            self.assertEqual(subject["licensed_media"], [])
            self.assertEqual(subject["recorded_races"], len(subject["source_race_ids"]))

    def test_deterministic_order_independent_of_input_order(self):
        original = module.compile_batch("a" * 64, self.circuits, self.races, self.layouts)
        reversed_data = module.compile_batch("a" * 64, list(reversed(self.circuits)),
                                             list(reversed(self.races)), self.layouts)
        self.assertEqual([x["circuit_external_id"] for x in original["circuits"]],
                         [x["circuit_external_id"] for x in reversed_data["circuits"]])

    def test_wrong_layout_refuses(self):
        self.races[0]["circuitLayoutId"] = "track-29-1"
        with self.assertRaises(ValueError):
            module.compile_batch("a" * 64, self.circuits, self.races, self.layouts)

    def test_duplicate_race_refuses(self):
        with self.assertRaises(ValueError):
            module.compile_batch("a" * 64, self.circuits, self.races + [self.races[0]], self.layouts)

    def test_absent_circuit_refuses(self):
        self.races[0]["circuitId"] = "unknown"
        with self.assertRaises(ValueError):
            module.compile_batch("a" * 64, self.circuits, self.races, self.layouts)

    def test_insufficient_cohort_refuses(self):
        with self.assertRaises(ValueError):
            module.compile_batch("a" * 64, self.circuits[:10], [], [])


if __name__ == "__main__":
    unittest.main()
