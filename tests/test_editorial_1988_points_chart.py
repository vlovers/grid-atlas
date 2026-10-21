import copy
import importlib.util
import json
import unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"scripts/build-1988-points-chart.py"
spec=importlib.util.spec_from_file_location("chart1988",P)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ChartTests(unittest.TestCase):
    def setUp(self):self.doc=json.loads(m.FILE.read_text(encoding="utf-8"))
    def test_sixteen(self):
        out=m.chart(self.doc)
        self.assertEqual(len(out["series"]),16)
        self.assertFalse(out["publication_allowed"])
    def test_final(self):
        last=m.chart(self.doc)["series"][-1]
        self.assertEqual((last["senna"]["raw_cumulative"],last["prost"]["raw_cumulative"]),(94,105))
        self.assertEqual((last["senna"]["best_eleven_cumulative"],last["prost"]["best_eleven_cumulative"]),(90,87))
    def test_prior_to_twelve_no_drop(self):
        for row in m.chart(self.doc)["series"][:11]:
            for driver in ("senna","prost"):
                self.assertEqual(row[driver]["raw_cumulative"],row[driver]["best_eleven_cumulative"])
    def test_no_declining_counted_points(self):
        series=m.chart(self.doc)["series"]
        for driver in ("senna","prost"):
            vals=[r[driver]["best_eleven_cumulative"] for r in series]
            self.assertEqual(vals,sorted(vals))
    def test_missing_race(self):
        data=copy.deepcopy(self.doc);data["races"].pop()
        with self.assertRaises(ValueError):m.chart(data)
    def test_bad_round(self):
        data=copy.deepcopy(self.doc);data["races"][2]["round"]=1
        with self.assertRaises(ValueError):m.chart(data)
if __name__=="__main__":unittest.main()
