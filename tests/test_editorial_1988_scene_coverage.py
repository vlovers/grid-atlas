import copy
import importlib.util
import json
import unittest
from pathlib import Path
SCRIPT=Path(__file__).resolve().parents[1]/"scripts/validate-1988-scene-coverage.py"
spec=importlib.util.spec_from_file_location("coverage",SCRIPT)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def read(name):return json.loads((m.DIR/name).read_text(encoding="utf-8"))
class CoverageTests(unittest.TestCase):
    def setUp(self):
        self.a=read("season-1988-winners.json")
        self.b=read("remaining-1988-race-scenes.json")
        self.c=read("three-pivotal-races-1988.json")
    def fail(self,cb):
        b=copy.deepcopy(self.b);cb(b)
        self.assertTrue(m.validate(self.a,b,self.c))
    def test_all_sixteen(self):self.assertEqual(m.validate(self.a,self.b,self.c),[])
    def test_missing_round(self):self.fail(lambda d:d["scenes"].pop())
    def test_duplicate_round(self):self.fail(lambda d:d["scenes"][0].update(round=2))
    def test_wrong_gp(self):self.fail(lambda d:d["scenes"][0].update(grand_prix="Imaginary"))
    def test_missing_uk(self):self.fail(lambda d:d["scenes"][0]["draft_microcopy"].update(uk=""))
    def test_fake_approval(self):self.fail(lambda d:d["review"].update(publication=True))
    def test_public_flag(self):self.fail(lambda d:d.update(publication_allowed=True))
    def test_false_causality(self):self.fail(lambda d:d["scenes"][0].update(no_causal_claims=False))
    def test_missing_context_questions(self):self.fail(lambda d:d["scenes"][0].update(context_questions=[]))
if __name__=="__main__":unittest.main()
