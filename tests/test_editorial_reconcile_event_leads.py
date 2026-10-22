"""Archive candidate reconciliation: fail-closed regression tests."""
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
        item=m.reconcile(self.leads,self.races,self.results)[0]
        self.assertEqual("candidate_races_only",item["status"])
        self.assertEqual(1,item["candidate_count"])
        self.assertEqual("other-track",item["candidate_races"][0]["circuit_external_id"])
        self.assertEqual("driver-a",item["candidate_races"][0]["winning_results"][0]["driver_external_id"])
        self.assertTrue(item["editorial_review_required"])
    def test_missing_winner_is_not_invented(self):
        item=m.reconcile(self.leads,self.races,[])[0]
        self.assertEqual([],item["candidate_races"][0]["winning_results"])
    def test_no_year_is_rejected(self):
        self.leads["items"][0]["claims"][0]["id"]="circuit-suzuka-winner"
        with self.assertRaises(ValueError):m.reconcile(self.leads,self.races,self.results)
    def test_duplicate_subject_is_rejected(self):
        self.leads["items"].append(self.leads["items"][0])
        with self.assertRaises(ValueError):m.reconcile(self.leads,self.races,self.results)
    def test_manifest_exact_filename(self):
        d="a"*64
        m.verify_manifest(f"{d}  f1db-json-splitted.zip\n",d)
        with self.assertRaises(ValueError):m.verify_manifest(f"{d}  malicious-f1db-json-splitted.zip\n",d)
        with self.assertRaises(ValueError):m.verify_manifest(f"{d}  other.zip\n",d)
    def test_candidate_order_deterministic(self):
        self.races.insert(0,{"id":9,"year":1987,"round":2,"date":"1987-02-01","officialName":"Second GP","circuitId":"second"})
        ids=[x["race_id"] for x in m.reconcile(self.leads,self.races,self.results)[0]["candidate_races"]]
        self.assertEqual([10,9],ids)
if __name__=="__main__":unittest.main()
