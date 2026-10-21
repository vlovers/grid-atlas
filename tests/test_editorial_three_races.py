import copy
import importlib.util
import json
import unittest
from pathlib import Path
FILE=Path(__file__).resolve().parents[1]/"scripts/validate-three-race-stories.py"
spec=importlib.util.spec_from_file_location("three_races",FILE)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ResearchSafetyTests(unittest.TestCase):
    def setUp(self):self.data=json.loads(m.FILE.read_text(encoding="utf-8"))
    def reject(self,edit):
        d=copy.deepcopy(self.data);edit(d)
        self.assertTrue(m.validate(d))
    def test_valid_research(self):self.assertEqual(m.validate(self.data),[])
    def test_public_flag(self):self.reject(lambda d:d.update(publication_allowed=True))
    def test_fake_review(self):self.reject(lambda d:d["overall_review"].update(historical_human=True))
    def test_unreviewed_scene(self):self.reject(lambda d:d["scenes"][0].update(claim_review="verified"))
    def test_wrong_round(self):self.reject(lambda d:d["scenes"][1].update(round=13))
    def test_lost_source(self):self.reject(lambda d:d["scenes"][0]["sources"].clear())
    def test_wrong_evidence_id(self):self.reject(lambda d:d["scenes"][1]["claims"][0].update(evidence="unknown"))
    def test_missing_uk(self):self.reject(lambda d:d["scenes"][2]["claims"][0].update(uk=""))
    def test_duplicate_claim_id(self):self.reject(lambda d:d["scenes"][2]["claims"][0].update(id="monaco-prost-victory"))
if __name__=="__main__":unittest.main()
