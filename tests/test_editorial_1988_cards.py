import importlib.util
import json
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,ROOT/"scripts"/path)
    x=importlib.util.module_from_spec(spec);spec.loader.exec_module(x);return x
cards=load("race_cards","build-1988-editorial-cards.py")
recon=load("recon_1988","reconcile-1988-f1db.py")
source=json.loads(cards.TIMELINE.read_text(encoding="utf-8"))
def fixture():
    rows=[]
    for race in source["races"]:
        winner=race["winner_key"]
        result=[]
        for key in ("ayrton-senna","alain-prost"):
            result.append({"driver_external_id":key,"position":1 if winner==key else 2,"position_text":"1" if winner==key else "2","points":9 if winner==key else 6,"constructor_external_id":"mclaren","shared_car":False})
        rows.append({"round":race["round"],"date":race["date"],"grand_prix":race["grand_prix"],"winner_match":True,"external_race_id":str(race["round"]),"driver_results":{item["driver_external_id"]:[item] for item in result}})
    return {"season":1988,"import":"F1DB v2026.17.0","problems":[],"rows":rows,"race_records_compared":16,"winner_matches":{"ayrton-senna":8,"alain-prost":7,"gerhard-berger":1},"publishable":False,"historical_source_human_review":False,"championship_points_reconciled":False}
class CardTests(unittest.TestCase):
    def test_full_nonpublic_cards(self):
        d=cards.build_cards(source,fixture())
        self.assertEqual(len(d["cards"]),16)
        self.assertFalse(d["publication_allowed"])
        self.assertTrue(all(c["historical_narrative"] is None for c in d["cards"]))
    def test_failed_parity_rejected(self):
        d=fixture();d["problems"]=["historical mismatch"]
        with self.assertRaises(ValueError):cards.build_cards(source,d)
    def test_missing_driver_rejected(self):
        d=fixture();d["rows"][0]["driver_results"].pop("alain-prost")
        with self.assertRaises(ValueError):cards.build_cards(source,d)
    def test_duplicate_results_rejected(self):
        d=fixture();d["rows"][0]["driver_results"]["alain-prost"]*=2
        with self.assertRaises(ValueError):cards.build_cards(source,d)
    def test_wrong_race_rejected(self):
        d=fixture();d["rows"][1]["grand_prix"]="Wrong"
        with self.assertRaises(ValueError):cards.build_cards(source,d)
    def test_wrong_release_rejected(self):
        d=fixture();d["import"]="future release"
        with self.assertRaises(ValueError):cards.build_cards(source,d)
    def test_duplicate_canonical_race_id_rejected(self):
        d=fixture();d["rows"][1]["external_race_id"]=d["rows"][0]["external_race_id"]
        with self.assertRaises(ValueError):cards.build_cards(source,d)
    def test_missing_provenance_flags_rejected(self):
        d=fixture();d.pop("historical_source_human_review")
        with self.assertRaises(ValueError):cards.build_cards(source,d)
    def test_misleading_publishable_flag_rejected(self):
        d=fixture();d["publishable"]=True
        with self.assertRaises(ValueError):cards.build_cards(source,d)
    def test_incomplete_report_summary_rejected(self):
        d=fixture();d["race_records_compared"]=15
        with self.assertRaises(ValueError):cards.build_cards(source,d)
    def test_missing_identity_rejected(self):
        d=fixture();d["rows"][1]["external_race_id"]=None
        with self.assertRaises(ValueError):cards.build_cards(source,d)
if __name__=="__main__":unittest.main()
