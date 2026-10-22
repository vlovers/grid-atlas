"""Bilingual historical chapter evidence guard."""
import importlib.util,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"scripts/audit-editorial-season-chapters.py"
spec=importlib.util.spec_from_file_location("seasonchapters",P);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ChaptersTest(unittest.TestCase):
    def setUp(self):self.a=m.read("expanded-season-chapters.json");self.b=m.read("pilot-research.json");self.c=m.read("season-research.json")
    def test_valid(self):self.assertEqual([],m.validate(self.a,self.b,self.c))
    def test_unsupported_claim(self):
        self.a["items"][0]["sections"][0]["claim_ids"]=["fabricated"]
        self.assertTrue(m.validate(self.a,self.b,self.c))
    def test_missing_translation(self):
        self.a["items"][0]["sections"][0]["body"]["uk"]=""
        self.assertTrue(m.validate(self.a,self.b,self.c))
    def test_false_publication(self):
        self.a["items"][0]["publication"]=True
        self.assertTrue(m.validate(self.a,self.b,self.c))
if __name__=="__main__":unittest.main()
