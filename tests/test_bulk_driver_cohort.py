import importlib.util
import unittest
import json
import tempfile
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"scripts/prepare_bulk_driver_cohort.py"
spec=importlib.util.spec_from_file_location("bulk_cohort",P)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class SelectionTests(unittest.TestCase):
    def test_existing_legacy_and_structured_manifest_entries(self):
        with tempfile.TemporaryDirectory() as tmp:
            base=Path(tmp)
            (base/'manifest.json').write_text(json.dumps({'drivers':['driver-a','driver-b']}))
            (base/'qa.json').write_text(json.dumps({'drivers':[{'driver_id':'driver-c'},{'id':'driver-d'}]}))
            self.assertEqual(m.existing_ids(base),{'driver-a','driver-b','driver-c','driver-d'})
    def test_fifty_excluding_existing(self):
        rows=[(f"driver-{i}",f"Driver {i}","hash") for i in range(75)]
        results=[f"driver-{i}" for i in range(75) for _ in range(75-i)]
        chosen,_=m.plan(rows,results,{"driver-0","driver-1"})
        self.assertEqual(len(chosen),50)
        self.assertEqual(chosen[0],"driver-2")
        self.assertNotIn("driver-0",chosen)
    def test_insufficient(self):
        with self.assertRaises(ValueError):m.plan([("abc","ABC","x")],["abc"],set())
    def test_deterministic_ties(self):
        rows=[(f"driver-{i}","n","x") for i in range(55)]
        a,_=m.plan(rows,[r[0] for r in rows],set())
        z,_=m.plan(list(reversed(rows)),[r[0] for r in reversed(rows)],set())
        self.assertEqual(a,z)
    def test_exclusions(self):
        rows=[(f"driver-{i}","n","x") for i in range(60)]
        ids=[x[0] for x in rows]
        chosen,_=m.plan(rows,ids,set(ids[:10]))
        self.assertEqual(set(chosen),set(ids[10:]))
if __name__=="__main__":unittest.main()
