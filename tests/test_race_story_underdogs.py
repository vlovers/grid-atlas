"""Guards for unpublished EN/UK race turning-point manuscripts, volumes III–IV.

These checks certify structural completeness and source attribution, NOT
historical truth, editorial sign-off, media rights or publication readiness.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "docs/editorial/race-arcs"
VOLUMES = [
    FOLDER / "turning-points-volume-03.en-uk.md",
    FOLDER / "turning-points-volume-04.en-uk.md",
]
EXPECTED = {
    (1967, "Italy"), (1970, "Monaco"), (1996, "Monaco"),
    (1999, "Europe"), (2003, "Brazil"), (2006, "Hungary"),
    (2008, "Italy"), (2012, "Spain"), (2014, "Bahrain"),
    (2020, "Italy"),
}
REF = re.compile(r"\[(\d{2}-[A-Z])\]")
ACT = re.compile(r"^\*\*([123])\.", re.MULTILINE)
URL = re.compile(r"https://(?:www\.)?(?:formula1\.com|motorsportmagazine\.com|theguardian\.com)/[^\s]+")
HEADER = re.compile(r"^## (\d{4}) · ([A-Za-z ]+) —", re.MULTILINE)


def stories():
    for path in VOLUMES:
        text = path.read_text(encoding="utf-8")
        assert "UNPUBLISHED RESEARCH" in text
        assert "review" in text.lower() and "pending" in text.lower()
        parts = re.split(r"(?=^## \d{4} · )", text, flags=re.MULTILINE)[1:]
        for part in parts:
            match = HEADER.match(part)
            assert match is not None
            yield path, int(match.group(1)), match.group(2), part


class UnderdogRaceStoryTests(unittest.TestCase):
    def test_ten_distinct_races_in_two_volumes(self):
        items = list(stories())
        self.assertEqual(len(items), 10)
        self.assertEqual({(year, race) for _, year, race, _ in items}, EXPECTED)

    def test_full_three_act_bilingual_prose_not_microcopy(self):
        for path, year, race, text in stories():
            with self.subTest(path=path.name, year=year, race=race):
                for marker in ("**Quick EN:**", "**Quick UK:**", "**Connections:**",
                               "### EN · Three acts", "### UK · Три акти",
                               "**Deep Dive · Evidence**"):
                    self.assertIn(marker, text)
                self.assertIn(f"/en/seasons/{year}", text)
                self.assertIn(f"/uk/seasons/{year}", text)
                en = text.split("### EN · Three acts", 1)[1].split("### UK · Три акти", 1)[0]
                uk = text.split("### UK · Три акти", 1)[1].split("**Deep Dive · Evidence**", 1)[0]
                for language, prose in (("en", en), ("uk", uk)):
                    self.assertEqual(ACT.findall(prose), ["1", "2", "3"], language)
                    self.assertGreaterEqual(len(prose.split()), 200, (year, race, language))
                self.assertNotIn("approved for publication", text.lower())
                self.assertNotRegex(text, r"/(?:en|uk)/races/\d+")

    def test_every_claim_marker_has_real_declared_source(self):
        for _, year, race, text in stories():
            with self.subTest(year=year, race=race):
                prose, sources = text.split("**Deep Dive · Evidence**", 1)
                used, declared = set(REF.findall(prose)), set(REF.findall(sources))
                self.assertGreaterEqual(len(used), 2)
                self.assertEqual(used, declared)
                self.assertEqual(len(REF.findall(sources)), len(declared))
                self.assertGreaterEqual(len(URL.findall(sources)), 2)
                for key in declared:
                    self.assertTrue(key.startswith(str(year)[-2:] + "-"), key)
                self.assertNotIn("example.com", sources)


if __name__ == "__main__":
    unittest.main()
