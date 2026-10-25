"""Structural checks for unpublished bilingual F1 rivalry manuscripts.

Passing tests never means independent historical, linguistic, licensing, or
publication approval. Source URLs are review pointers, not automatic fact checks.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "docs" / "editorial" / "rivalry-arcs"
FILES = ("rivalries-volume-01.en-uk.md", "rivalries-volume-02.en-uk.md")
EXPECTED = {
    "Juan Manuel Fangio and Stirling Moss",
    "Niki Lauda and James Hunt",
    "Nigel Mansell and Nelson Piquet",
    "Ayrton Senna and Alain Prost",
    "Mika Häkkinen and Michael Schumacher",
    "Fernando Alonso and Kimi Räikkönen",
    "Fernando Alonso and Lewis Hamilton",
    "Sebastian Vettel and Mark Webber",
    "Lewis Hamilton and Nico Rosberg",
    "Lando Norris, Oscar Piastri and Max Verstappen",
}


def stories(text):
    return [part for part in re.split(r"(?=^## [^\n]+ — )", text, flags=re.M)[1:]
            if part.startswith("## ")]


class RivalryResearchTests(unittest.TestCase):
    def test_ten_unique_bilingual_subjects(self):
        found = []
        for filename in FILES:
            text = (DIR / filename).read_text(encoding="utf-8")
            self.assertIn("UNPUBLISHED", text)
            self.assertIn("review", text.lower())
            items = stories(text)
            self.assertEqual(len(items), 5, filename)
            found.extend(re.match(r"## (.*?) — ", s).group(1) for s in items)
        self.assertEqual(set(found), EXPECTED)
        self.assertEqual(len(found), len(set(found)))

    def test_reader_first_narrative_structure_and_evidence(self):
        for filename in FILES:
            text = (DIR / filename).read_text(encoding="utf-8")
            for story in stories(text):
                title = story.splitlines()[0]
                with self.subTest(title=title):
                    for marker in (
                        "**Quick EN:**", "**Quick UK:**", "**Explore:**",
                        "**Connections:**", "### EN · Three acts",
                        "### UK · Три акти", "**Deep Dive · Evidence:**",
                    ):
                        self.assertIn(marker, story)
                    self.assertRegex(story, r"/en/seasons/\d{4}")
                    self.assertRegex(story, r"/uk/seasons/\d{4}")
                    en = story.split("### EN · Three acts", 1)[1].split(
                        "### UK · Три акти", 1
                    )[0]
                    uk = story.split("### UK · Три акти", 1)[1].split(
                        "**Deep Dive · Evidence:", 1
                    )[0]
                    sources = story.split("**Deep Dive · Evidence:", 1)[1]
                    for lang, passage in (("EN", en), ("UK", uk)):
                        self.assertEqual(
                            re.findall(r"(?m)^\*\*([123])\.\*\*", passage),
                            ["1", "2", "3"], (title, lang),
                        )
                        words = re.findall(r"[^\W\d_]+", passage, re.UNICODE)
                        self.assertGreaterEqual(len(words), 200, (title, lang, len(words)))
                    cited = set(re.findall(r"\[([A-Z]{2}-[A-Z])\]", en + uk))
                    defined = set(re.findall(r"\[([A-Z]{2}-[A-Z])\]", sources))
                    self.assertTrue(cited, title)
                    self.assertEqual(cited, defined, title)
                    urls = re.findall(r"https://[^\s;]+", sources)
                    self.assertGreaterEqual(len(urls), 1, title)
                    self.assertTrue(
                        all(u.startswith("https://www.formula1.com/")
                            or u.startswith("https://www.autosport.com/") for u in urls),
                        (title, urls),
                    )
                    self.assertNotIn("approved for publication", story.lower())

    def test_2025_three_contender_ending_not_misreported(self):
        text = (DIR / FILES[1]).read_text(encoding="utf-8")
        final = next(s for s in stories(text) if "Norris, Oscar Piastri" in s)
        for number in ("423", "421", "410", "104", "12"):
            self.assertIn(number, final)
        self.assertIn("Norris finished third", final)
        self.assertIn("Verstappen won", final)
        self.assertIn("Piastri finished second", final)
        self.assertIn("Норріс — 423", final)

    def test_no_media_or_publication_sidecars(self):
        for filename in FILES:
            text = (DIR / filename).read_text(encoding="utf-8")
            self.assertNotIn("![", text)
            self.assertNotIn("<iframe", text.lower())
            self.assertNotIn("publication_status: approved", text.lower())


if __name__ == "__main__":
    unittest.main()
