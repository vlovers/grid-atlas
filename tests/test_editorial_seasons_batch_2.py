"""Source-linked season dossiers must fail closed."""
import importlib.util,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("season2",ROOT/"scripts/audit-editorial-seasons-batch-2.py")
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class SeasonBatch2Test(unittest.TestCase):
    def setUp(self):self.d=json.loads(m.FILE.read_text(encoding="utf-8"))
    def test_cohort(self):self.assertEqual([],m.validate(self.d))
    def test_fake_approval(self):
        self.d["items"][0]["review_state"]="approved"
        self.assertTrue(m.validate(self.d))
    def test_orphan_claim(self):
        self.d["items"][0]["chapters"][0]["claim_ids"]=["unknown"]
        self.assertTrue(m.validate(self.d))
    def test_missing_source(self):
        self.d["items"][0]["claims"][0]["source"]["locator"]=""
        self.assertTrue(m.validate(self.d))
if __name__=="__main__":unittest.main()
