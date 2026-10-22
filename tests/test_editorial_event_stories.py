"""Source-linked bilingual event story draft gates."""
import importlib.util,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"scripts/audit-editorial-event-stories.py"
spec=importlib.util.spec_from_file_location("stories",P);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class StoryTest(unittest.TestCase):
    def setUp(self):self.a=m.read("event-story-drafts.json");self.b=m.read("official-result-crosschecks.json")
    def test_complete(self):self.assertEqual([],m.validate(self.a,self.b))
    def test_missing_uk(self):
        self.a["items"][0]["sections"][0]["body"]["uk"]=""
        self.assertTrue(m.validate(self.a,self.b))
    def test_fake_approval(self):
        self.a["items"][0]["approved"]=True
        self.assertTrue(m.validate(self.a,self.b))
    def test_wrong_source(self):
        self.a["items"][0]["source_url"]="https://example.com"
        self.assertTrue(m.validate(self.a,self.b))
    def test_layout_guess(self):
        self.a["items"][0]["historical_layout_id"]="modern"
        self.assertTrue(m.validate(self.a,self.b))
if __name__=="__main__":unittest.main()
