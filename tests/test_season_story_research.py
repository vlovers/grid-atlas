"""Guardrails for unpublished EN/UK season-story research manuscripts.

Run: python3 -m unittest tests/test_season_story_research.py
These checks validate structure and provenance pointers, not historical truth or editorial approval.
"""
from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "docs" / "editorial" / "season-arcs"
VOLUMES = (
    DIR / "title-deciders-volume-01.en-uk.md",
    DIR / "title-deciders-volume-02.en-uk.md",
    DIR / "title-deciders-volume-03.en-uk.md",
    DIR / "title-deciders-volume-04.en-uk.md",
    DIR / "title-deciders-volume-05.en-uk.md",
    DIR / "title-deciders-volume-06a.en-uk.md",
    DIR / "title-deciders-volume-06b.en-uk.md",
)
EXPECTED_YEARS = {1950, 1958, 1959, 1961, 1964, 1970, 1974, 1976, 1979, 1981, 1982, 1984, 1986, 1988, 1999, 2003, 2007, 2008, 2009, 2010, 2012, 2014, 2016, 2021, 2025, 1967, 1978, 1983, 1989, 1997, 2000, 2005, 2017, 2022, 2024}
MARKER = re.compile(r"\[(\d{2}-[A-Z])\]")
URL = re.compile(r"https://www\.formula1\.com/[^\s;]+")


def evidence_marker(part: str) -> str:
    return "**Deep Dive · Evidence**" if "**Deep Dive · Evidence**" in part else "**Evidence:**"


def chapters():
    for path in VOLUMES:
        text = path.read_text(encoding="utf-8")
        assert "UNPUBLISHED RESEARCH" in text and "pending" in text.lower()
        parts = re.split(r"(?=^## \d{4} — )", text, flags=re.MULTILINE)
        for part in parts[1:]:
            yield path.name, int(part[3:7]), part


class SeasonStoryResearchTests(unittest.TestCase):
    def test_thirty_five_distinct_championship_seasons(self):
        items = list(chapters())
        self.assertEqual(len(items), 35)
        self.assertEqual({year for _, year, _ in items}, EXPECTED_YEARS)
        self.assertEqual(len({year for _, year, _ in items}), 35)

    def test_bilingual_three_act_narratives_are_substantive(self):
        for path, year, part in chapters():
            with self.subTest(path=path, year=year):
                self.assertIn("### EN ·", part)
                self.assertIn("### UK ·", part)
                en = part.split("### EN ·", 1)[1].split("### UK ·", 1)[0]
                uk = part.split("### UK ·", 1)[1].split(evidence_marker(part), 1)[0]
                for label, text in (("en", en), ("uk", uk)):
                    self.assertEqual(len(re.findall(r"^\*\*[123]\.", text, re.MULTILINE)), 3, (year, label))
                    self.assertGreaterEqual(len(text.split()), 200, (year, label))
                self.assertIn(f"/en/seasons/{year}", part)
                self.assertIn(f"/uk/seasons/{year}", part)

    def test_claim_markers_have_explicit_source_entries(self):
        for path, year, part in chapters():
            with self.subTest(path=path, year=year):
                self.assertIn(evidence_marker(part), part)
                prose, references = part.split(evidence_marker(part), 1)
                used = set(MARKER.findall(prose))
                supplied = set(MARKER.findall(references))
                self.assertGreaterEqual(len(used), 2)
                self.assertEqual(used, supplied, "Every referenced source must be defined and used")
                self.assertGreaterEqual(len(URL.findall(references)), 2)
                self.assertTrue(all(id.startswith(str(year)[-2:]) for id in used))
                self.assertNotIn("http://", references)

    def test_volume_six_has_ten_unique_reader_first_stories(self):
        paths = (DIR / "title-deciders-volume-06a.en-uk.md", DIR / "title-deciders-volume-06b.en-uk.md")
        text = "\n".join(p.read_text(encoding="utf-8") for p in paths)
        for year in (1967, 1978, 1983, 1989, 1997, 2000, 2005, 2017, 2022, 2024):
            self.assertEqual(text.count(f"## {year} — "), 1, year)
        self.assertEqual(text.count("**Explore next:**"), 10)
        self.assertEqual(text.count("**Deep Dive · Evidence**"), 10)
        self.assertNotIn("APPROVED", text)
        self.assertNotIn("PUBLISHED ARTICLE", text)
        for _, year, chapter in chapters():
            if year not in {1967, 1978, 1983, 1989, 1997, 2000, 2005, 2017, 2022, 2024}:
                continue
            for locale, section in (("en", chapter.split("### EN ·", 1)[1].split("### UK ·", 1)[0]),
                                    ("uk", chapter.split("### UK ·", 1)[1].split("**Deep Dive · Evidence**", 1)[0])):
                for act in re.split(r"(?=^\*\*[123]\.)", section, flags=re.MULTILINE)[1:]:
                    self.assertGreaterEqual(len(set(MARKER.findall(act))), 2, (year, locale))

    def test_official_final_points_are_not_replaced_with_result_sums(self):
        joined = "\n".join(p.read_text(encoding="utf-8") for p in VOLUMES)
        for expected in ("423", "421", "410", "369.5", "395.5", "387.5",
                         "69", "68", "90", "87", "110", "109", "281", "278", "385", "380"):
            self.assertIn(expected, joined)

    def test_new_volume_has_cross_season_reading_paths(self):
        text = (DIR / "title-deciders-volume-05.en-uk.md").read_text(encoding="utf-8")
        for year in (1959, 1961, 1970, 1979, 1981, 2003, 2009, 2014):
            self.assertIn(f"## {year} — ", text)
        for _, year, chapter in chapters():
            self.assertIn("Read next:", chapter, year)
            if year in {1959, 1961, 1970, 1979, 1981, 2003, 2009, 2014}:
                self.assertIn("**Explore next:**", chapter, year)

    def test_publication_gate_remains_explicit(self):
        for path in VOLUMES:
            text = path.read_text(encoding="utf-8")
            self.assertIn("UNPUBLISHED RESEARCH", text)
            self.assertRegex(text.lower(), r"(independent|editorial).{0,50}review")
            self.assertIn("not", text.lower())
        self.assertNotIn("published", str(DIR).split("/")[-1])


if __name__ == "__main__":
    unittest.main()
