"""Structure and provenance guards for unpublished bilingual driver narratives.

This suite does not approve historical accuracy, rights, translation quality,
canonical F1DB identity mappings, or public publication.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "docs/editorial/driver-arcs"
VOLUMES = [
    FOLDER / "overlooked-careers-volume-01.en-uk.md",
    FOLDER / "overlooked-careers-volume-02.en-uk.md",
]
EXPECTED = {
    "Jean Alesi", "Robert Kubica", "Felipe Massa", "Mark Webber",
    "Rubens Barrichello", "Giancarlo Fisichella", "Jarno Trulli",
    "Sergio Pérez", "Pierre Gasly", "Pastor Maldonado",
}
MARKER = re.compile(r"\[([A-Z]{2}-[A-Z])\]")
ACT = re.compile(r"^\*\*([123])\.", re.MULTILINE)
URL = re.compile(r"https://www\.formula1\.com/[^\s]+")
HEADER = re.compile(r"^## (.+?) — ", re.MULTILINE)


def manuscripts():
    for path in VOLUMES:
        text = path.read_text(encoding="utf-8")
        assert "UNPUBLISHED EDITORIAL RESEARCH" in text
        assert "review" in text.lower() and "pending" in text.lower()
        for part in re.split(r"(?=^## .+? — )", text, flags=re.MULTILINE)[1:]:
            match = HEADER.match(part)
            assert match is not None, path
            yield path, match.group(1), part


class OverlookedDriverStoryTests(unittest.TestCase):
    def test_ten_distinct_careers_and_no_overlap_with_champion_batch(self):
        entries = list(manuscripts())
        self.assertEqual(len(entries), 10)
        self.assertEqual({name for _, name, _ in entries}, EXPECTED)
        self.assertEqual(len(EXPECTED), len(entries))
        self.assertTrue(all("not approved" in path.read_text(encoding="utf-8").lower()
                            for path in VOLUMES))

    def test_three_act_reader_first_bilingual_prose(self):
        for path, name, part in manuscripts():
            with self.subTest(path=path.name, name=name):
                for field in ("**Quick EN:**", "**Quick UK:**", "**Connections:**",
                              "### EN · Three acts", "### UK · Три акти",
                              "**Deep Dive · Evidence**"):
                    self.assertIn(field, part)
                en = part.split("### EN · Three acts", 1)[1].split("### UK · Три акти", 1)[0]
                uk = part.split("### UK · Три акти", 1)[1].split("**Deep Dive · Evidence**", 1)[0]
                for language, prose in (("en", en), ("uk", uk)):
                    self.assertEqual(ACT.findall(prose), ["1", "2", "3"], language)
                    self.assertGreaterEqual(len(prose.split()), 200, (name, language))
                self.assertRegex(part, r"/en/seasons/\d{4}")
                self.assertRegex(part, r"/uk/seasons/\d{4}")
                self.assertNotRegex(part, r"/(?:en|uk)/races/\d+")

    def test_all_claim_markers_have_declared_primary_publisher_links(self):
        for _, name, part in manuscripts():
            with self.subTest(name=name):
                prose, evidence = part.split("**Deep Dive · Evidence**", 1)
                used, declared = set(MARKER.findall(prose)), set(MARKER.findall(evidence))
                self.assertGreaterEqual(len(used), 2)
                self.assertEqual(used, declared)
                self.assertEqual(len(MARKER.findall(evidence)), len(declared))
                self.assertGreaterEqual(len(URL.findall(evidence)), 2)
                self.assertNotIn("example.com", evidence)


if __name__ == "__main__":
    unittest.main()
