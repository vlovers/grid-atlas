import copy
import importlib.util
import json
import unittest
from pathlib import Path
p=Path(__file__).resolve().parents[1]/"scripts/validate-1988-duel-results.py"
spec=importlib.util.spec_from_file_location("duel_validation",p)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class DuelTests(unittest.TestCase):
    def setUp(self):
        self.d=json.loads((m.DIR/"season-1988-duel-results.json").read_text())
        self.t=json.loads((m.DIR/"season-1988-winners.json").read_text())
    def corrupt(self,fn):
        d=copy.deepcopy(self.d);fn(d);self.assertTrue(m.validate(d,self.t))
    def test_complete(self):self.assertEqual(m.validate(self.d,self.t),[])
    def test_missing_round(self):self.corrupt(lambda d:d["races"].pop())
    def test_invalid_position(self):self.corrupt(lambda d:d["races"][0]["senna"].update(race_position="WIN"))
    def test_modified_points(self):self.corrupt(lambda d:d["races"][0]["prost"].update(listed_points=0))
    def test_wrong_standings(self):self.corrupt(lambda d:d["official_final_standings"].update(senna=94))
    def test_source_loss(self):self.corrupt(lambda d:d["sources"].clear())
    def test_publication(self):self.corrupt(lambda d:d.update(publication_allowed=True))
    def test_human_review(self):self.corrupt(lambda d:d["review"].update(historical_human=True))
if __name__=="__main__":unittest.main()
