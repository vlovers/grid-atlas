"""Research leads must never silently become verified claims."""
import importlib.util,json,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"scripts/audit-editorial-event-anchors.py"
spec=importlib.util.spec_from_file_location("anchors",P);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class AnchorTest(unittest.TestCase):
    def setUp(self):self.d=json.loads(m.P.read_text(encoding="utf-8"))
    def test_unverified_leads_valid(self):self.assertEqual([],m.validate(self.d))
    def test_fake_reconciliation(self):
        self.d["items"][0]["identity_reconciliation"]["status"]="verified"
        self.assertTrue(m.validate(self.d))
    def test_fabricated_id(self):
        self.d["items"][0]["identity_reconciliation"]["race_id"]=1
        self.assertTrue(m.validate(self.d))
    def test_publication(self):
        self.d["items"][0]["published"]=True
        self.assertTrue(m.validate(self.d))
    def test_source_kind(self):
        self.d["items"][0]["claims"][0]["evidence"]["kind"]="verified"
        self.assertTrue(m.validate(self.d))
if __name__=="__main__":unittest.main()
