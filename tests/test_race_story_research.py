"""Structure and provenance guards for unpublished bilingual F1 race stories.

These tests do NOT certify historical accuracy, independent editorial review,
photo rights, race-route availability, or publication readiness.
Run: python3 -m unittest tests/test_race_story_research.py -v
"""
from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RACE_DIR = ROOT / "docs" / "editorial" / "race-arcs"
VOLUMES = (
    RACE_DIR / "turning-points-volume-01.en-uk.md",
    RACE_DIR / "turning-points-volume-02.en-uk.md",
)
YEARS = (1957, 1979, 1982, 1993, 1998, 2005, 2011, 2019, 2020, 2021)
SOURCE = re.compile(r"\[(\d{2}-[A-Z])\]")
URL = re.compile(r"https://(?:www\.)?(?:formula1\.com|theguardian\.com)/[^\s]+")
ACT = re.compile(r"^\*\*([123])\.", re.MULTILINE)


def manuscripts():
    for path in VOLUMES:
        text = path.read_text(encoding="utf-8")
        assert "UNPUBLISHED RESEARCH" in text
        assert "review pending" in text.lower()
        for part in re.split(r"(?=^## \d{4} · )", text, flags=re.MULTILINE)[1:]:
            match = re.match(r"## (\d{4}) · ", part)
            assert match is not None
            yield path, int(match.group(1)), part


class RaceStoryResearchTests(unittest.TestCase):
    def test_ten_distinct_races_with_expected_years(self):
        items = list(manuscripts())
        self.assertEqual(len(items), 10)
        self.assertEqual(tuple(year for _, year, _ in items), YEARS)
        self.assertEqual(len(set(year for _, year, _ in items)), 10)

    def test_each_story_is_a_substantive_bilingual_three_act_narrative(self):
        for path, year, part in manuscripts():
            with self.subTest(path=path.name, year=year):
                self.assertIn("**Quick EN:**", part)
                self.assertIn("**Quick UK:**", part)
                self.assertIn("**Connections:**", part)
                self.assertIn(f"/en/seasons/{year}", part)
                self.assertIn(f"/uk/seasons/{year}", part)
                self.assertIn("### EN · Three acts", part)
                self.assertIn("### UK · Три акти", part)
                self.assertIn("**Deep Dive · Evidence**", part)
                en = part.split("### EN · Three acts", 1)[1].split("### UK · Три акти", 1)[0]
                uk = part.split("### UK · Три акти", 1)[1].split("**Deep Dive · Evidence**", 1)[0]
                for locale, prose in (("en", en), ("uk", uk)):
                    self.assertEqual(ACT.findall(prose), ["1", "2", "3"], (year, locale))
                    self.assertGreaterEqual(len(prose.split()), 200, (year, locale))
                self.assertNotIn("approved for publication", part.lower())

    def test_each_evidence_reference_is_used_and_resolved(self):
        for path, year, part in manuscripts():
            with self.subTest(path=path.name, year=year):
                prose, evidence = part.split("**Deep Dive · Evidence**", 1)
                used = set(SOURCE.findall(prose))
                declared = set(SOURCE.findall(evidence))
                self.assertGreaterEqual(len(used), 2)
                self.assertEqual(used, declared)
                self.assertEqual(len(SOURCE.findall(evidence)), len(declared))
                self.assertGreaterEqual(len(URL.findall(evidence)), 2)
                for key in declared:
                    self.assertTrue(key.startswith(str(year)[-2:] + "-"), (year, key))
                for url in URL.findall(evidence):
                    self.assertNotIn("example.com", url)

    def test_avoid_unverified_internal_race_urls_and_media_claims(self):
        for _, year, part in manuscripts():
            with self.subTest(year=year):
                self.assertNotRegex(part, r"/(?:en|uk)/races/\d+")
                self.assertNotIn("licensed photo included", part.lower())
                self.assertNotIn("human-approved", part.lower())


if __name__ == "__main__":
    unittest.main()
