"""Pinned F1DB identity evidence cannot silently become editorial approval."""
import importlib.util,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"scripts/audit-editorial-archive-matches.py"
spec=importlib.util.spec_from_file_location("archive_matches",P);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ArchiveMatchTests(unittest.TestCase):
    def setUp(self):self.a=m.read("archive-matched-event-identities.json");self.b=m.read("subject-event-anchors.json")
    def test_complete(self):self.assertEqual([],m.validate(self.a,self.b))
    def test_missing_event(self):
        self.a["items"].pop()
        self.assertTrue(m.validate(self.a,self.b))
    def test_fake_approval(self):
        self.a["items"][0]["approved"]=True
        self.assertTrue(m.validate(self.a,self.b))
    def test_unverified_layout(self):
        self.a["items"][0]["historical_layout_id"]="modern-layout"
        self.assertTrue(m.validate(self.a,self.b))
    def test_wrong_constructor(self):
        self.a["items"][0]["winner"]["constructor_external_id"]="ferrari"
        self.assertTrue(m.validate(self.a,self.b))
if __name__=="__main__":unittest.main()
