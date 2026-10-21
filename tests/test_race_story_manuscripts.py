import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
EDITORIAL = ROOT / "docs/editorial"
BATCHES = EDITORIAL / "batches"

class RaceStoryManuscriptsTests(unittest.TestCase):
    def test_1988_race_scenes_keep_source_and_round(self):
        source = json.loads((EDITORIAL / "research-pack-2026-10/remaining-1988-race-scenes.json").read_text())
        self.assertEqual(len(source["scenes"]), 13)
        for locale in ("uk", "en"):
            folder = BATCHES / "1988-race-scenes" / locale
            self.assertEqual(len(list(folder.glob("*.md"))), 13)
            for scene in source["scenes"]:
                text = (folder / f'round-{scene["round"]:02d}.md').read_text()
                self.assertIn(scene["draft_microcopy"][locale], text)
                self.assertIn(source["source"]["url"], text)
                self.assertIn("RESEARCH DRAFT" if locale == "en" else "ДОСЛІДНИЦЬКА ЧЕРНЕТКА", text)

    def test_milestones_have_exact_original_sources(self):
        source = json.loads((BATCHES / "milestone-race-stories-2026-10.json").read_text())
        self.assertEqual(len(source["stories"]), 3)
        for locale in ("uk", "en"):
            folder = BATCHES / "milestone-race-manuscripts" / locale
            self.assertEqual(len(list(folder.glob("*.md"))), 3)
            for item in source["stories"]:
                text = (folder / f'{item["id"]}.md').read_text()
                for value in (item[locale]["body"], item["source"], item["locator"]):
                    self.assertIn(value, text)
                self.assertIn("RESEARCH DRAFT" if locale == "en" else "ДОСЛІДНИЦЬКА ЧЕРНЕТКА", text)

    def test_no_implicit_publication(self):
        readme = (BATCHES / "race-story-workbooks/README.md").read_text()
        self.assertIn("not be loaded by Next.js", readme)
        self.assertIn("No independent historical editorial review", readme)

if __name__ == "__main__":
    unittest.main()
