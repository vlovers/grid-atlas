import importlib.util
import unittest
from pathlib import Path
p=Path(__file__).resolve().parents[1]/"scripts/build-1988-editorial-review-queue.py"
s=importlib.util.spec_from_file_location("reviewqueue",p)
m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class ReviewQueueTests(unittest.TestCase):
    def test_full_claims_queue(self):
        x=m.build()
        self.assertEqual(x["claim_count"],24)
        self.assertEqual(x["unapproved_count"],24)
        self.assertFalse(x["publication_allowed"])
        self.assertFalse(x["human_reviewed"])
    def test_every_claim_has_sources_and_locales(self):
        x=m.build()
        self.assertTrue(all(i["sources"] and i["uk"] and i["en"] for i in x["items"]))
    def test_ids_unique(self):
        x=m.build()
        self.assertEqual(len(set(i["id"] for i in x["items"])),24)
    def test_pivotal_scene_count(self):
        x=m.build()
        self.assertEqual(sum(i["scope"]=="pivotal_record_claim" for i in x["items"]),7)
    def test_remaining_race_scene_count(self):
        x=m.build()
        self.assertEqual(sum(i["scope"]=="winner_sequence_caption" for i in x["items"]),13)
    def test_crosscutting_claims_count(self):
        x=m.build()
        self.assertEqual(sum(i["scope"]=="season_crosscutting_claim" for i in x["items"]),4)
if __name__=="__main__":unittest.main()
