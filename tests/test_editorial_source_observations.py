import copy
import importlib.util
import json
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/validate-editorial-source-observations.py"
spec = importlib.util.spec_from_file_location("source_observations", SCRIPT)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class EditorialObservationsTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads(m.PATH.read_text(encoding="utf-8"))
    def test_checked_in_pack(self):
        self.assertEqual(m.validate(self.data), [])
    def test_prevent_publication(self):
        d = copy.deepcopy(self.data); d["publication_allowed"] = True
        self.assertTrue(m.validate(d))
    def test_prevent_claim_approval(self):
        d = copy.deepcopy(self.data); d["claims"][0]["review_status"] = "verified"
        self.assertTrue(m.validate(d))
    def test_missing_translation_rejected(self):
        d = copy.deepcopy(self.data); d["claims"][0]["uk"] = ""
        self.assertTrue(m.validate(d))
    def test_broken_source_reference(self):
        d = copy.deepcopy(self.data); d["claims"][0]["source_ids"] = ["nonexistent"]
        self.assertTrue(m.validate(d))
    def test_missing_locator(self):
        d = copy.deepcopy(self.data); d["sources"][0]["locator"] = ""
        self.assertTrue(m.validate(d))
    def test_reject_fake_review(self):
        d = copy.deepcopy(self.data); d["review"]["reviewer"] = "Nobody"
        self.assertTrue(m.validate(d))
    def test_win_math(self):
        d = copy.deepcopy(self.data)
        next(c for c in d["claims"] if c["id"] == "senna-prost-1988-winner-rows")["observed_fields"]["prost_win_rows"] = 9
        self.assertTrue(m.validate(d))

if __name__ == "__main__": unittest.main()
