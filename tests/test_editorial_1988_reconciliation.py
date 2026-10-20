import importlib.util
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FILE=ROOT/"scripts/reconcile-1988-f1db.py"
spec=importlib.util.spec_from_file_location("reconcile1988",FILE)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
def fixtures():
    import json
    source=json.loads(mod.SOURCE.read_text())
    results=[]
    for r in source["races"]:
        winner=r["winner_key"]
        rows=[{"driver_external_id":key,"position":1 if key==winner else 2,"points":9 if key==winner else 6,"shared_car":False} for key in ("ayrton-senna","alain-prost")]
        if winner=="gerhard-berger":rows.append({"driver_external_id":"gerhard-berger","position":1,"points":9,"shared_car":False})
        results.append({"round":r["round"],"date":r["date"],"external_race_id":"sample-"+str(r["round"]),"results":rows})
    return source,{"source_release":1,"races":results}
class ReconciliationTests(unittest.TestCase):
    def test_detects_valid_winner_sequence(self):
        s,p=fixtures()
        self.assertEqual(mod.verify(s,p)["problems"],[])
    def test_no_source_release(self):
        s,p=fixtures();p["source_release"]=0
        self.assertTrue(mod.verify(s,p)["problems"])
    def test_dropped_round(self):
        s,p=fixtures();p["races"].pop()
        self.assertTrue(mod.verify(s,p)["problems"])
    def test_unexpected_winner(self):
        s,p=fixtures();p["races"][0]["results"][1]["position"]=3
        self.assertTrue(mod.verify(s,p)["problems"])
    def test_missing_driver(self):
        s,p=fixtures();p["races"][0]["results"]=[x for x in p["races"][0]["results"] if x["driver_external_id"]!="alain-prost"]
        self.assertTrue(mod.verify(s,p)["problems"])
    def test_date_mismatch(self):
        s,p=fixtures();p["races"][0]["date"]="1988-01-01"
        self.assertTrue(mod.verify(s,p)["problems"])
    def test_does_not_claim_championship(self):
        s,p=fixtures()
        out=mod.verify(s,p)
        self.assertFalse(out["championship_points_reconciled"])
        self.assertFalse(out["publishable"])
if __name__=="__main__":unittest.main()
