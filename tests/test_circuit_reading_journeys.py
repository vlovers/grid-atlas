"""Content coverage and reader-path safeguards for source-backed circuit stories."""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ED = ROOT / "apps/web/src/components/editorial"
SOURCE = (ED / "circuit-extra-stories.tsx").read_text(encoding="utf-8")
PAGE = (ROOT / "apps/web/src/app/[locale]/circuits/[id]/page.tsx").read_text(encoding="utf-8")

class CircuitReadingJourneysTests(unittest.TestCase):
    def test_all_73_capsules_unique_and_bilingual(self):
        files = ["circuit-extra-stories.json", "circuit-next20-stories.json", "circuit-final33-stories.json"]
        cohorts = [json.loads((ED / file).read_text(encoding="utf-8")) for file in files]
        self.assertEqual([len(group) for group in cohorts], [20, 20, 33])
        records = [item for group in cohorts for item in group]
        self.assertEqual(len({item["id"] for item in records}), 73)
        for item in records:
            for locale in ("en", "uk"):
                self.assertGreater(len(item["description"][locale].strip()), 70)
                self.assertTrue(item["title"][locale].strip())
            self.assertRegex(item["source"], r"^https://")
        self.assertIn("const entries = [...facts, ...nextFacts, ...finalFacts]", SOURCE)

    def test_reader_links_are_derived_from_exact_unambiguous_races(self):
        renderer = (ED / "circuit-narrative.tsx").read_text(encoding="utf-8")
        self.assertIn("<CircuitMoments circuitId={circuit.external_id}", PAGE)
        self.assertIn("history={history}", PAGE)
        self.assertIn("history.filter(race => race.season_year === moment.year)", renderer)
        self.assertIn("matches.length === 1 ? matches[0] : null", renderer)
        self.assertIn("href={`/races/${race.race_id}`}", renderer)
        self.assertIn("href={`/drivers/${winner.driver_id}`}", renderer)
        self.assertIn("isCircuitEditionApproved(circuitId)", renderer)
        self.assertIn("Independent editorial approval remains pending", renderer)

    def test_one_grand_prix_archive_replaces_overlapping_timelines(self):
        self.assertEqual(PAGE.count('data-testid="circuit-history-table"'), 1)
        for duplicate in ["ArchiveRhythm", "ArchiveJourney", "CircuitArchiveBrief", "CircuitExtraStories", "circuit-archive-overview"]:
            self.assertNotIn(duplicate, PAGE)
        self.assertIn('name="q" type="search"', PAGE)
        self.assertIn("filtered.slice(offset, offset + CIRCUIT_PAGE_SIZE)", PAGE)

    def test_corner_guides_are_bilingual_and_provenanced(self):
        guides = json.loads((ED / "circuit-corner-guides.json").read_text(encoding="utf-8"))
        source_files = ["circuit-extra-stories.json", "circuit-next20-stories.json", "circuit-final33-stories.json"]
        archived = {row["id"] for name in source_files for row in json.loads((ED / name).read_text(encoding="utf-8"))}
        flagship = {"silverstone", "monaco", "monza", "suzuka", "spa-francorchamps"}
        self.assertEqual(len(guides), 78)
        self.assertEqual({g["id"] for g in guides}, archived | flagship)
        self.assertEqual(len({g["id"] for g in guides}), 78)
        for guide in guides:
            self.assertGreaterEqual(len(guide["sections"]), 2)
            for corner in guide["sections"]:
                self.assertTrue(corner["label"].strip())
                for locale in ("en","uk"):
                    self.assertGreater(len(corner[locale].strip()), 65)
                self.assertTrue(corner["source"].startswith("https://"))
        self.assertIn("<CircuitCornerGuide circuitId={circuit.external_id}", PAGE)

    def test_archive_only_stories_are_not_mislabeled_corner_history(self):
        renderer = (ED / "circuit-corner-guide.tsx").read_text(encoding="utf-8")
        self.assertIn("cornerGuideFor(circuitId, availableLayouts)", renderer)
        self.assertIn("legacyGuides.find", renderer)
        self.assertIn("A corner-name guide is not available", renderer)
        guides = json.loads((ED / "circuit-corner-guides.json").read_text(encoding="utf-8"))
        purely_archival = [
            guide["id"] for guide in guides
            if all("/f1db/f1db/blob/" in item["source"] for item in guide["sections"])
        ]
        self.assertTrue(purely_archival, "the archive-only coverage must remain explicitly differentiated")
        self.assertIn("pescara", purely_archival)
        self.assertNotIn("brands-hatch", purely_archival)
        self.assertNotIn("paul-ricard", purely_archival)
        self.assertNotIn("donington", purely_archival)

    def test_year_extraction_does_not_invent_race_ids(self):
        years = [int(match.group(0)) for match in re.finditer(r"\b(?:19|20)\d{2}\b", "1973–1975")]
        self.assertEqual(years, [1973, 1975])
        self.assertIn("return year ? Number(year[0]) : null", SOURCE)

if __name__ == "__main__":
    unittest.main()
