import unittest
from scripts.f1db_relationships import verify

class RelationshipTests(unittest.TestCase):
    def test_missing_targets_and_years(self):
        data = {"f1db-seasons": [{"year": 1950}, {"year": 1952}],
                "f1db-races": [{"year": 1950, "circuitId": "unknown"},
                               {"year": 1951, "circuitId": "monza"}],
                "f1db-circuits": [{"id": "monza"}]}
        report = verify(data)
        self.assertEqual(report["season_coverage"]["missing_years"], [1951])
        counts = {x["field"]: x["orphan_count"] for x in report["checks"]}
        self.assertEqual(counts["year"], 1)
        self.assertEqual(counts["circuitId"], 1)
        self.assertTrue(report["skipped"])

    def test_unavailable_collections_are_skipped(self):
        result = verify({"f1db-races": [{"year": 1950}]})
        self.assertEqual(result["checks"], [])
        self.assertGreater(len(result["skipped"]), 0)
