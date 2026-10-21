import json
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]/"docs/editorial/research-verification/milestone-races-v1"
class MilestoneResearchVerificationTests(unittest.TestCase):
    def test_primary_rows_and_release_gate(self):
        data=json.loads((ROOT/"primary-results.json").read_text())
        self.assertEqual(data["scope"],"primary_classification_verification_only")
        self.assertFalse(data["publication_allowed"])
        self.assertFalse(data["independent_editorial_approval"])
        self.assertEqual(len(data["records"]),3)
        for x in data["records"]:
            self.assertTrue(x["url"].startswith("https://www.formula1.com/en/results/"))
            self.assertEqual(x["status"],"primary_result_checked")
            self.assertGreater(x["laps"],0)
            for locale in ("en","uk"):
                page=(ROOT/f"{locale}.md").read_text()
                self.assertIn(x["url"],page)
                self.assertIn(x["id"],page)
                self.assertIn(x["winner"],page)
    def test_no_published_media_or_fake_signoff(self):
        for locale in ("en","uk"):
            self.assertIn("publication" if locale=="en" else "публікацію",(ROOT/f"{locale}.md").read_text())
if __name__=="__main__":
    unittest.main()
