"""Event-anchor editorial guards."""
import importlib.util,json,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"scripts/audit-editorial-event-anchors.py"
spec=importlib.util.spec_from_file_location("eventanchors",P);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class EventAnchorTest(unittest.TestCase):
    def setUp(self):self.d=json.loads(m.P.read_text(encoding="utf-8"))
    def test_valid(self):self.assertEqual([],m.validate(self.d))
    def test_fake_approval(self):
        self.d["items"][0]["published"]=True
        self.assertTrue(m.validate(self.d))
    def test_missing_locale(self):
        self.d["items"][0]["sections"][0]["body"]["uk"]=""
        self.assertTrue(m.validate(self.d))
    def test_broken_evidence(self):
        self.d["items"][0]["claims"][0]["evidence"]["locator"]=""
        self.assertTrue(m.validate(self.d))
if __name__=="__main__":unittest.main()
