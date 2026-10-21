"""Research-data safety tests: no invented IDs, publication, or unsupported citations."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("constructor_audit", ROOT / "scripts/audit_constructor_2025.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
DATA = json.loads(module.PATH.read_text(encoding="utf-8"))


class ConstructorResearchAuditTests(unittest.TestCase):
    def test_whole_2025_cohort(self):
        self.assertEqual(len(DATA["claims"]), 15)
        self.assertEqual(module.audit(DATA), [])
        self.assertEqual(DATA["publication"], "unpublished")

    def test_blocks_publication(self):
        doc = copy.deepcopy(DATA)
        doc["publication"] = "published"
        self.assertTrue(module.audit(doc))

    def test_blocks_fake_human_review(self):
        doc = copy.deepcopy(DATA)
        doc["claims"][0]["human_reviewed"] = True
        self.assertTrue(module.audit(doc))

    def test_blocks_guessed_f1db_id(self):
        doc = copy.deepcopy(DATA)
        doc["claims"][0]["internal_constructor_id"] = 42
        self.assertTrue(module.audit(doc))

    def test_blocks_unlicensed_media(self):
        doc = copy.deepcopy(DATA)
        doc["claims"][0]["media"] = ["https://example.org/unlicensed.jpg"]
        self.assertTrue(module.audit(doc))

    def test_blocks_unsupported_domain(self):
        doc = copy.deepcopy(DATA)
        doc["sources"]["ferrari-launch"]["url"] = "https://fake.example/en/latest/article/claim"
        self.assertTrue(module.audit(doc))

    def test_blocks_missing_locator(self):
        doc = copy.deepcopy(DATA)
        doc["claims"][0]["locator"] = ""
        self.assertTrue(module.audit(doc))

    def test_blocks_duplicate_evidence(self):
        doc = copy.deepcopy(DATA)
        doc["claims"].append(copy.deepcopy(doc["claims"][0]))
        self.assertTrue(module.audit(doc))

    def test_blocks_missing_source(self):
        doc = copy.deepcopy(DATA)
        doc["claims"][0]["source_id"] = "made-up"
        self.assertTrue(module.audit(doc))

    def test_blocks_future_season_mislabeling(self):
        doc = copy.deepcopy(DATA)
        doc["claims"][0]["season_year"] = 2026
        self.assertTrue(module.audit(doc))

    def test_blocks_invented_historical_field(self):
        doc = copy.deepcopy(DATA)
        doc["claims"][0]["field"] = "constructor_titles"
        self.assertTrue(module.audit(doc))


if __name__ == "__main__":
    unittest.main()
