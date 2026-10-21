from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1] / "docs/editorial/batches/season-historical-stories"

class SeasonHistoricalContentTest(unittest.TestCase):
    def test_four_bilingual_seasons_preserve_sources_and_draft_status(self):
        urls = {
            1988: "https://www.formula1.com/en/results/1988/drivers",
            2000: "https://www.formula1.com/en/results/2000/drivers",
            2008: "https://www.formula1.com/en/results/2008/drivers",
            2023: "https://www.formula1.com/en/results/2023/drivers",
        }
        for locale in ("en", "uk"):
            self.assertEqual(len(list((ROOT / locale).glob("*.md"))), 4)
            for year, url in urls.items():
                with self.subTest(locale=locale, year=year):
                    text = (ROOT / locale / f"{year}.md").read_text()
                    self.assertIn(url, text)
                    self.assertIn("RESEARCH DRAFT" if locale == "en" else "ДОСЛІДНИЦЬКИЙ МАТЕРІАЛ", text)
                    self.assertIn("not for publication" if locale == "en" else "не публікувати", text) if year == 1988 else None

    def test_source_research_is_retained(self):
        readme = (ROOT / "README.md").read_text()
        for name in ("THREE_SEASONS.md", "SEASON_1988_STORY.md", "THREE_RACE_STORIES.md"):
            self.assertIn(name, readme)
        self.assertIn("Not published or approved", readme)

if __name__ == "__main__":
    unittest.main()
