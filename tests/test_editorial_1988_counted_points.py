import copy
import importlib.util
import json
import unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"scripts/calculate-1988-counted-points.py"
s=importlib.util.spec_from_file_location("counted1988",P)
m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class CountedPointsTests(unittest.TestCase):
    def setUp(self):self.d=json.loads(m.DATA.read_text(encoding="utf-8"))
    def test_matches_official_standings(self):
        c=m.calculate(self.d)
        self.assertEqual(c["calculations"]["senna"]["counted_championship_points"],90)
        self.assertEqual(c["calculations"]["prost"]["counted_championship_points"],87)
        self.assertFalse(c["publication_allowed"])
    def test_discarded_points(self):
        c=m.calculate(self.d)["calculations"]
        self.assertEqual(c["senna"]["discarded_points"],4)
        self.assertEqual(c["prost"]["discarded_points"],18)
        for driver in ("senna","prost"):
            self.assertEqual(len(c[driver]["counted_rounds"]),11)
            self.assertEqual(len(c[driver]["discarded_rounds"]),5)
    def test_round_missing(self):
        d=copy.deepcopy(self.d);d["races"].pop()
        with self.assertRaises(ValueError):m.calculate(d)
    def test_invalid_points(self):
        d=copy.deepcopy(self.d);d["races"][0]["prost"]["listed_points"]=-1
        with self.assertRaises(ValueError):m.calculate(d)
    def test_wrong_points(self):
        d=copy.deepcopy(self.d);d["races"][0]["prost"]["listed_points"]=8
        with self.assertRaises(ValueError):m.calculate(d)
if __name__=="__main__":unittest.main()
