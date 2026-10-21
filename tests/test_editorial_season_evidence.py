import copy
import importlib.util
import json
import unittest
from pathlib import Path
SCRIPT=Path(__file__).resolve().parents[1]/"scripts/validate-driver-season-evidence.py"
spec=importlib.util.spec_from_file_location("season_evidence",SCRIPT)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
class TestSeasonEvidence(unittest.TestCase):
    def setUp(self):
        self.data=json.loads((module.DIR/"michael-schumacher-season-evidence.json").read_text())
    def test_checked_in_example(self):
        self.assertEqual(module.validate(self.data,"michael-schumacher"),[])
    def test_blocks_publication(self):
        x=copy.deepcopy(self.data);x["publication_allowed"]=True
        self.assertTrue(module.validate(x,"michael-schumacher"))
    def test_blocks_editor(self):
        x=copy.deepcopy(self.data);x["approval"]["human_editor"]="Fake reviewer"
        self.assertTrue(module.validate(x,"michael-schumacher"))
    def test_blocks_unchecked_claim(self):
        x=copy.deepcopy(self.data);x["claims"][0]["review_status"]="verified"
        self.assertTrue(module.validate(x,"michael-schumacher"))
    def test_blocks_missing_uk(self):
        x=copy.deepcopy(self.data);x["claims"][1]["text"]["uk"]=""
        self.assertTrue(module.validate(x,"michael-schumacher"))
    def test_blocks_missing_locator(self):
        x=copy.deepcopy(self.data);x["sources"][0]["locator"]=""
        self.assertTrue(module.validate(x,"michael-schumacher"))
    def test_blocks_unreferenced_claim(self):
        x=copy.deepcopy(self.data);x["claims"][1]["source_ids"]=["unknown"]
        self.assertTrue(module.validate(x,"michael-schumacher"))
    def test_blocks_published_chapter(self):
        x=copy.deepcopy(self.data);x["chapter_treatments"][0]["copy_status"]="published"
        self.assertTrue(module.validate(x,"michael-schumacher"))
if __name__=="__main__": unittest.main()
