"""Offline unit checks for circuit editorial crosswalk (no F1DB archive required)."""
import importlib.util
from pathlib import Path
import unittest

FILE = Path(__file__).resolve().parents[1] / "scripts/editorial-circuit-crosswalk.py"
spec = importlib.util.spec_from_file_location("circuit_crosswalk", FILE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CircuitCrosswalkTests(unittest.TestCase):
    def setUp(self):
        self.circuits = [{"id": "silverstone", "name": "Silverstone Circuit"}]
        self.layouts = [{"id": "silverstone-1", "circuitId": "silverstone"}]
        self.races = [{"id": 1, "year": 1950, "circuitId": "silverstone",
                       "circuitLayoutId": "silverstone-1",
                       "date": "1950-05-13", "officialName": "British Grand Prix"}]

    def test_exact_layout_and_race(self):
        result = module.crosswalk(self.circuits, self.layouts, self.races,
                                  {"silverstone": [1950]})
        self.assertEqual(result[0]["events"][0]["layout_external_id"], "silverstone-1")
        self.assertEqual(result[0]["events"][0]["race_external_id"], "1")

    def test_missing_season_explicit(self):
        result = module.crosswalk(self.circuits, self.layouts, self.races,
                                  {"silverstone": [1960]})
        self.assertEqual(result[0]["events"][0]["status"], "no_matching_race_in_pinned_archive")

    def test_wrong_layout_circuit_rejected(self):
        self.layouts[0]["circuitId"] = "monaco"
        with self.assertRaises(ValueError):
            module.crosswalk(self.circuits, self.layouts, self.races, {"silverstone": [1950]})

    def test_unknown_circuit_rejected(self):
        with self.assertRaises(ValueError):
            module.crosswalk(self.circuits, self.layouts, self.races, {"monaco": [1950]})

    def test_duplicate_layout_rejected(self):
        with self.assertRaises(ValueError):
            module.crosswalk(self.circuits, self.layouts * 2, self.races, {"silverstone": [1950]})


if __name__ == "__main__":
    unittest.main()
