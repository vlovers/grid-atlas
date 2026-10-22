"""Offline candidate reconciliation must never invent circuit associations."""
import importlib.util,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"scripts/reconcile-editorial-event-leads.py"
spec=importlib.util.spec_from_file_location("reconcile",P);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ReconcileTest(unittest.TestCase):
    def setUp(self):
        self.leads={"items":[{"subject_id":"circuit-suzuka","claims":[{"id":"circuit-suzuka-1987-winner"}]}]}
        self.races=[{"id":10,"year":1987,"round":1,"date":"1987-01-01","officialName":"Test GP","circuitId":"other-track"},{"id":11,"year":1988,"round":2,"date":"1988-01-01","officialName":"Test GP","circuitId":"suzuka"}]
        self.results=[{"raceId":10,"positionNumber":1,"driverId":"driver-a","constructorId":"constructor-a","positionDisplayOrder":1},{"raceId":10,"positionNumber":2,"driverId":"driver-b","constructorId":"constructor-b","positionDisplayOrder":2}]
    def test_year_scope_and_winner(self):
        r=m.reconcile(self.leads,self.races,self.results)[0]
        self.assertEqual("candidate_races_only",r["status"])
        self.assertEqual(1,len(r["candidate_races"]))
        self.assertEqual("other-track",r["candidate_races"][0]["circuit_external_id"])
        self.assertEqual("driver-a",r["candidate_races"][0]["winning_results"][0]["driver_external_id"])
        self.assertTrue(r["editorial_review_required"])
    def test_missing_result_does_not_become_win(self):
        r=m.reconcile(self.leads,self.races,[])[0]
        self.assertEqual([],r["candidate_races"][0]["winning_results"])
if __name__=="__main__":unittest.main()
