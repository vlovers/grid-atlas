"""Official result crosscheck integrity tests."""
import importlib.util,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"scripts/audit-editorial-official-crosschecks.py"
spec=importlib.util.spec_from_file_location("crosschecks",P);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class CrosscheckTest(unittest.TestCase):
    def setUp(self):self.a=m.read("official-result-crosschecks.json");self.b=m.read("archive-matched-event-identities.json")
    def test_valid(self):self.assertEqual([],m.validate(self.a,self.b))
    def test_wrong_year(self):
        self.a["items"][0]["source"]["url"]="https://www.formula1.com/en/results/1978/races"
        self.assertTrue(m.validate(self.a,self.b))
    def test_false_publication(self):
        self.a["items"][0]["published"]=True
        self.assertTrue(m.validate(self.a,self.b))
    def test_wrong_source(self):
        self.a["items"][0]["source"]["url"]="https://example.com"
        self.assertTrue(m.validate(self.a,self.b))
if __name__=="__main__":unittest.main()
