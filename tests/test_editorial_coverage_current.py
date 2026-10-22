"""Prevent editorial coverage drift across historical research batches."""
import importlib.util,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"scripts/audit-editorial-coverage-current.py"
spec=importlib.util.spec_from_file_location("coverage_current",P);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class CurrentCoverageTest(unittest.TestCase):
    def setUp(self):self.args=[m.read(n) for n in ("coverage.json","pilot-research.json","season-research.json","season-research-batch-2.json","subject-event-anchors.json")]
    def test_current_coverage(self):self.assertEqual([],m.validate(*self.args))
    def test_stale_count_rejected(self):
        self.args[0]["totals"]["source_located_subjects"]=5
        self.assertTrue(m.validate(*self.args))
    def test_unapproved_state_protected(self):
        self.args[0]["subjects"][0]["approved"]=True
        self.assertTrue(m.validate(*self.args))
    def test_lost_source_detected(self):
        self.args[2]["items"].pop()
        self.assertTrue(m.validate(*self.args))
if __name__=="__main__":unittest.main()
