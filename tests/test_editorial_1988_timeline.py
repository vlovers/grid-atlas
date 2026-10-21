import copy
import importlib.util
import json
import unittest
from pathlib import Path
SCRIPT=Path(__file__).resolve().parents[1]/"scripts/validate-1988-winner-timeline.py"
spec=importlib.util.spec_from_file_location("winner_timeline",SCRIPT)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
class TimelineTests(unittest.TestCase):
    def setUp(self):self.data=json.loads(module.FILE.read_text(encoding="utf-8"))
    def mutate(self,callback):
        data=copy.deepcopy(self.data);callback(data)
        self.assertTrue(module.validate(data))
    def test_pack_valid(self):self.assertEqual(module.validate(self.data),[])
    def test_missing_race(self):self.mutate(lambda d:d["races"].pop())
    def test_duplicate_round(self):self.mutate(lambda d:d["races"][2].update(round=1))
    def test_winner_changed(self):self.mutate(lambda d:d["races"][0].update(winner_key="ayrton-senna"))
    def test_invalid_date(self):self.mutate(lambda d:d["races"][0].update(date="1988-99-99"))
    def test_wrong_standing(self):self.mutate(lambda d:d["observed_final_standings"][0].update(official_points=94))
    def test_public_flag(self):self.mutate(lambda d:d.update(publication_allowed=True))
    def test_fake_review(self):self.mutate(lambda d:d["review"].update(human_review=True))
    def test_no_source_locator(self):self.mutate(lambda d:d["source"].update(locator=""))
    def test_unsafe_race_story(self):self.mutate(lambda d:d["races"][0].update(race_article_review="verified"))
if __name__=="__main__":unittest.main()
