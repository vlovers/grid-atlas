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

    def test_missing_layout_is_explicit_not_invented(self):
        self.races[0]["circuitLayoutId"] = None
        result = module.crosswalk(self.circuits, self.layouts, self.races,
                                  {"silverstone": [1950]})
        self.assertEqual(result[0]["events"][0]["layout_status"], "missing_in_source")

    def test_duplicate_race_rejected(self):
        with self.assertRaises(ValueError):
            module.crosswalk(self.circuits, self.layouts, self.races * 2,
                             {"silverstone": [1950]})

    def test_multiple_events_sorted_by_date(self):
        self.races.insert(0, {"id": 2, "year": 1950, "circuitId": "silverstone",
                              "circuitLayoutId": "silverstone-1",
                              "date": "1950-08-01", "officialName": "Later"})
        result = module.crosswalk(self.circuits, self.layouts, self.races,
                                  {"silverstone": [1950]})
        self.assertEqual([x["race_external_id"] for x in result[0]["events"]], ["1", "2"])

    def test_expected_event_matches_pinned_record(self):
        rows = [{"circuit_external_id": circuit, "events": [
            {"year": year, "race_external_id": race_id,
             "race_date": date, "layout_external_id": layout}
            for (venue, year), (race_id, date, layout)
            in module.EXPECTED_EVENTS.items() if venue == circuit
        ]} for circuit in sorted({x[0] for x in module.EXPECTED_EVENTS})]
        module.verify_expected_events(rows)

    def test_changed_layout_fails_pinned_record(self):
        rows = [{"circuit_external_id": circuit, "events": [
            {"year": year, "race_external_id": race_id,
             "race_date": date, "layout_external_id": layout}
            for (venue, year), (race_id, date, layout)
            in module.EXPECTED_EVENTS.items() if venue == circuit
        ]} for circuit in sorted({x[0] for x in module.EXPECTED_EVENTS})]
        rows[0]["events"][0]["layout_external_id"] = "wrong-layout"
        with self.assertRaises(ValueError):
            module.verify_expected_events(rows)

    def test_duplicate_layout_rejected(self):
        with self.assertRaises(ValueError):
            module.crosswalk(self.circuits, self.layouts * 2, self.races, {"silverstone": [1950]})


if __name__ == "__main__":
    unittest.main()
