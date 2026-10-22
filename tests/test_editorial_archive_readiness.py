"""Aggregate archive completeness guard."""
import importlib.util,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("archive_readiness",ROOT/"scripts/audit-editorial-archive-readiness.py")
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ReadinessTest(unittest.TestCase):
    def setUp(self):self.d=json.loads(m.FILE.read_text(encoding="utf-8"))
    def test_baseline(self):self.assertEqual([],m.validate(self.d))
    def test_missing_evidence_not_hidden(self):
        next(r for r in self.d["rows"] if r["field"]=="race_result_evidence" and r["entity"]=="drivers")["value"]="917/917"
        self.assertTrue(m.validate(self.d))
    def test_false_approval(self):
        self.d["editorial_publication"]["published_subjects"]=25
        self.assertTrue(m.validate(self.d))
    def test_invented_technical_data(self):
        next(r for r in self.d["rows"] if r["field"]=="precise_corners_sectors_drs")["kind"]="measured"
        self.assertTrue(m.validate(self.d))
if __name__=="__main__":unittest.main()
