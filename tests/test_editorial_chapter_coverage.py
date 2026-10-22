"""Coverage must reflect all completed bilingual editorial drafts."""
import importlib.util,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]/"scripts/audit-editorial-chapter-coverage.py"
spec=importlib.util.spec_from_file_location("chaptercoverage",P);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ChapterCoverageTest(unittest.TestCase):
    def setUp(self):self.a=m.load("coverage.json");self.b=m.load("expanded-season-chapters.json");self.c=m.load("expanded-season-chapters-batch-2.json");self.d=m.load("chapter-drafts.json")
    def test_valid(self):self.assertEqual([],m.validate(self.a,self.b,self.c,self.d))
    def test_missing_flag(self):
        next(x for x in self.a["subjects"] if x["id"]=="season-1950")["subject_specific_chapter_draft"]=False
        self.assertTrue(m.validate(self.a,self.b,self.c,self.d))
    def test_false_publication(self):
        self.b["items"][0]["publication"]=True
        self.assertTrue(m.validate(self.a,self.b,self.c,self.d))
    def test_stale_totals(self):
        self.a["totals"]["expanded_season_sections"]=29
        self.assertTrue(m.validate(self.a,self.b,self.c,self.d))
if __name__=="__main__":unittest.main()
