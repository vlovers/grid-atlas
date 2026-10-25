"""Structure and provenance guard for unpublished bilingual constructor narratives.

This is NOT a fact-check, a native-language review, a team-identity audit, or
permission to publish. The sources themselves still require editorial inspection.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "docs" / "editorial" / "constructor-arcs"
FILES = ("outsiders-volume-01.en-uk.md", "outsiders-volume-02.en-uk.md")
EXPECTED = {
    "Brawn GP", "Stewart Grand Prix", "Toro Rosso", "Force India",
    "Racing Point", "Sauber", "Toyota", "Haas", "Super Aguri", "Hesketh",
}
FOUNDER_PR_289 = {
    "Ferrari", "McLaren", "Williams", "Team Lotus", "Brabham", "Tyrrell",
    "Benetton", "Renault", "Mercedes", "Red Bull Racing", "Minardi", "Jordan",
}


def split_stories(text):
    parts = re.split(r"(?=^## [^\n]+ — )", text, flags=re.MULTILINE)
    return [part for part in parts[1:] if part.startswith("## ")]


class ConstructorOutsiderManuscripts(unittest.TestCase):
    def test_ten_distinct_non_overlapping_research_subjects(self):
        names = []
        for filename in FILES:
            content = (DIR / filename).read_text(encoding="utf-8")
            self.assertIn("UNPUBLISHED", content.upper())
            self.assertIn("not", content.lower())
            stories = split_stories(content)
            self.assertEqual(len(stories), 5, filename)
            names.extend(re.match(r"## (.*?) — ", s).group(1) for s in stories)
        self.assertEqual(set(names), EXPECTED)
        self.assertEqual(len(names), len(set(names)))
        self.assertFalse(set(names) & FOUNDER_PR_289)

    def test_three_act_english_and_ukrainian_with_evidence(self):
        for filename in FILES:
            for story in split_stories((DIR / filename).read_text(encoding="utf-8")):
                subject = story.splitlines()[0]
                with self.subTest(subject=subject):
                    self.assertIn("**Quick EN:**", story)
                    self.assertIn("**Quick UK:**", story)
                    self.assertIn("**Explore:**", story)
                    self.assertIn("**Connections:**", story)
                    self.assertIn("/en/seasons/", story)
                    self.assertIn("/uk/seasons/", story)
                    self.assertIn("### EN · Three acts", story)
                    self.assertIn("### UK · Три акти", story)
                    self.assertIn("**Deep Dive · Sources:**", story)
                    english = story.split("### EN · Three acts", 1)[1].split("### UK · Три акти", 1)[0]
                    ukrainian = story.split("### UK · Три акти", 1)[1].split("**Deep Dive · Sources:**", 1)[0]
                    evidence = story.split("**Deep Dive · Sources:**", 1)[1]
                    for language, passage in (("EN", english), ("UK", ukrainian)):
                        self.assertEqual(
                            re.findall(r"(?m)^\*\*([123])\.\*\*", passage),
                            ["1", "2", "3"],
                            (subject, language),
                        )
                        words = re.findall(r"[^\W\d_]+", passage, flags=re.UNICODE)
                        self.assertGreaterEqual(len(words), 200, (subject, language, len(words)))
                        self.assertRegex(passage, r"\[[A-Z]{2}-[A-Z]\]")
                    cited = set(re.findall(r"\[([A-Z]{2}-[A-Z])\]", english + ukrainian))
                    defined = set(re.findall(r"\[([A-Z]{2}-[A-Z])\]", evidence))
                    self.assertTrue(cited, subject)
                    self.assertTrue(cited <= defined, (subject, cited - defined))
                    urls = re.findall(r"https://[^\s;]+", evidence)
                    self.assertGreaterEqual(len(urls), 1, subject)
                    self.assertTrue(all(url.startswith("https://") for url in urls))


if __name__ == "__main__":
    unittest.main()
