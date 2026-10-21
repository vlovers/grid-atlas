import copy
import importlib.util
import json
import unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"scripts/validate-1988-official-spotcheck.py"
spec=importlib.util.spec_from_file_location("spotcheck",P)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Checks(unittest.TestCase):
    def setUp(self):
        self.a=json.loads((m.ROOT/"official-result-spotcheck-1988.json").read_text())
        self.b=json.loads((m.ROOT/"three-pivotal-races-1988.json").read_text())
    def reject(self,f):
        d=copy.deepcopy(self.a);f(d);self.assertTrue(m.validate(d,self.b))
    def test_valid(self):self.assertEqual(m.validate(self.a,self.b),[])
    def test_missing(self):self.reject(lambda d:d["observations"].pop())
    def test_double(self):self.reject(lambda d:d["observations"].append(copy.deepcopy(d["observations"][0])))
    def test_false_approval(self):self.reject(lambda d:d.update(human_editor_approved=True))
    def test_source_mismatch(self):self.reject(lambda d:d["observations"][0].update(url="https://www.formula1.com/en/results/1988/drivers"))
    def test_missing_locator(self):self.reject(lambda d:d["observations"][0].update(locator=""))
if __name__=="__main__":unittest.main()
