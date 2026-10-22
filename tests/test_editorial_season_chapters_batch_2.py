"""Historical season chapter source and locale gates."""
import importlib.util,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"scripts/audit-editorial-season-chapters-batch-2.py"
spec=importlib.util.spec_from_file_location("batch2",P);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ChapterTest(unittest.TestCase):
    def setUp(self):self.a=m.read("expanded-season-chapters-batch-2.json");self.b=m.read("season-research-batch-2.json")
    def test_valid(self):self.assertEqual([],m.validate(self.a,self.b))
    def test_unsupported_claim(self):
        self.a["items"][0]["sections"][0]["claim_ids"]=["not-a-claim"]
        self.assertTrue(m.validate(self.a,self.b))
    def test_translation(self):
        self.a["items"][0]["sections"][0]["body"]["uk"]=""
        self.assertTrue(m.validate(self.a,self.b))
    def test_false_approval(self):
        self.a["items"][0]["publication"]=True
        self.assertTrue(m.validate(self.a,self.b))
if __name__=="__main__":unittest.main()
