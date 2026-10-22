"""Fail closed on malformed candidate reports."""
import importlib.util,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"scripts/audit-editorial-event-candidates.py"
spec=importlib.util.spec_from_file_location("candidates",P);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class CandidateReportTest(unittest.TestCase):
    def setUp(self):
        self.d={"status":"candidate_only_not_verified","items":[{"subject_id":str(i),"status":"candidate_races_only","editorial_review_required":True,"year":1950,"candidate_count":1,"candidate_races":[{"race_id":i,"year":1950,"round":1,"official_name":"Example","circuit_external_id":"track","winning_results":[{"driver_external_id":"d","constructor_external_id":"c"}]}]} for i in range(11)]}
    def test_valid(self):self.assertEqual([],m.validate(self.d))
    def test_false_approval(self):
        self.d["status"]="verified"
        self.assertTrue(m.validate(self.d))
    def test_truncated_candidate_list(self):
        self.d["items"][0]["candidate_count"]=2
        self.assertTrue(m.validate(self.d))
    def test_missing_circuit_identity(self):
        self.d["items"][0]["candidate_races"][0]["circuit_external_id"]=""
        self.assertTrue(m.validate(self.d))
    def test_duplicate_subject(self):
        self.d["items"][1]["subject_id"]="0"
        self.assertTrue(m.validate(self.d))
if __name__=="__main__":unittest.main()
