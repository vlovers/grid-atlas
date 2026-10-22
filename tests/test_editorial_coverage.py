"""Editorial Atlas cohort completeness and fail-closed publication."""
import importlib.util,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("coverage_audit",ROOT/"scripts/audit-editorial-coverage.py")
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class CoverageTest(unittest.TestCase):
    def setUp(self):
        self.inputs=[m.load(n) for n in ("briefs.json","pilot-research.json","chapter-drafts.json","framework-chapters.json","coverage.json")]
    def test_cohort(self):self.assertEqual([],m.validate(*self.inputs))
    def test_fabricated_approval(self):
        self.inputs[-1]["subjects"][0]["approved"]=True
        self.assertTrue(m.validate(*self.inputs))
    def test_framework_misrepresented_as_sourced(self):
        self.inputs[3]["articles"][0]["chapters"][0]["claim_ids"]=["invented"]
        self.assertTrue(m.validate(*self.inputs))
    def test_missing_subject(self):
        self.inputs[3]["articles"].pop()
        self.assertTrue(m.validate(*self.inputs))
if __name__=="__main__":unittest.main()
