import importlib.util
import json
import unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"scripts/render-1988-duel-preview.py"
spec=importlib.util.spec_from_file_location("privatepreview",P)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class PreviewTests(unittest.TestCase):
    def setUp(self):
        self.data=json.loads(m.LEDGER.read_text(encoding="utf-8"))
        self.template=m.TEMPLATE.read_text(encoding="utf-8")
    def test_all_rounds_and_scoring(self):
        p=m.payload(self.data)
        self.assertEqual(len(p["series"]),16)
        self.assertEqual(p["series"][-1]["driver"]["senna"]["counted"],90)
        self.assertEqual(p["series"][-1]["driver"]["prost"]["counted"],87)
        self.assertFalse(p["publicationAllowed"])
    def test_html_is_standalone_and_not_indexed(self):
        html=m.render(self.data,self.template)
        self.assertIn('noindex,nofollow,noarchive',html)
        self.assertIn('PRIVATE RESEARCH',html)
        self.assertIn('1988',html)
        self.assertNotIn('/*INJECT_DATA*/',html)
    def test_escapes_inline_script(self):
        d=json.loads(json.dumps(self.data))
        d["races"][0]["grand_prix"]="</script><script>alert(1)</script>"
        html=m.render(d,self.template)
        self.assertNotIn("</script><script>alert(1)",html)
    def test_no_approval_possible(self):
        self.assertFalse(m.payload(self.data)["publicationAllowed"])
    def test_bad_count_rejected(self):
        d=json.loads(json.dumps(self.data));d["races"].pop()
        with self.assertRaises(ValueError):m.payload(d)
    def test_invalid_points_rejected(self):
        d=json.loads(json.dumps(self.data));d["races"][0]["senna"]["listed_points"]=-4
        with self.assertRaises(ValueError):m.payload(d)
if __name__=="__main__":unittest.main()
