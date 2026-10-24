"""First Content Factory enhanced cohort must match the verified 25 F1DB IDs."""
import json
from pathlib import Path
import unittest
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"apps/web/src/components/editorial/circuit-extra-stories.json"
FIVE={"monaco","monza","suzuka","silverstone","spa-francorchamps"}
TWENTY={"interlagos","montreal","hungaroring","zandvoort","melbourne","bahrain","shanghai",
        "sepang","imola","spielberg","catalunya","paul-ricard","mexico-city",
        "hockenheimring","nurburgring","magny-cours","watkins-glen","buenos-aires",
        "kyalami","indianapolis"}

class EnhancedCircuitBatchTests(unittest.TestCase):
    def test_exact_first_25_subject_cohort(self):
        values=json.loads(DATA.read_text(encoding="utf8"))
        self.assertEqual(len(values),20)
        self.assertEqual({item["id"] for item in values},TWENTY)
        self.assertEqual(len(FIVE|TWENTY),25)

    def test_all_have_distinct_english_ukrainian_stories_and_source(self):
        for item in json.loads(DATA.read_text(encoding="utf8")):
            self.assertTrue(item["title"]["en"].strip())
            self.assertTrue(item["title"]["uk"].strip())
            self.assertNotEqual(item["description"]["en"],item["description"]["uk"])
            self.assertGreater(len(item["description"]["en"]),60)
            self.assertGreater(len(item["description"]["uk"]),60)
            url=urlsplit(item["source"])
            self.assertEqual(url.scheme,"https")
            self.assertEqual(url.hostname,"www.formula1.com")
            self.assertTrue(url.path.strip("/"))
            self.assertTrue(item["year"].strip())

if __name__=="__main__":
    unittest.main()
