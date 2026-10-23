"""Regression for sourced season content publication boundaries."""
import importlib.util,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("season_audit",ROOT/"scripts/audit-editorial-seasons.py")
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class SeasonResearchTest(unittest.TestCase):
    def setUp(self):self.d=json.loads(mod.PATH.read_text(encoding="utf-8"))
    def test_structure(self):self.assertEqual([],mod.validate(self.d))
    def test_approval_guard(self):
        self.d["items"][0]["publication"]=True
        self.assertTrue(mod.validate(self.d))
    def test_evidence_guard(self):
        self.d["items"][0]["claim_records"][0]["source"]["locator"]=""
        self.assertTrue(mod.validate(self.d))
    def test_translation_guard(self):
        self.d["items"][0]["editorial_sections"][0]["body"]["uk"]=""
        self.assertTrue(mod.validate(self.d))
if __name__=="__main__":unittest.main()
