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

    def test_reader_links_are_derived_from_actual_races_not_editorial_guess(self):
        self.assertIn("history={chronologicalHistory}", PAGE)
        self.assertIn("history.find(event => event.season_year === year)", SOURCE)
        self.assertIn("race && <Link", SOURCE)
        self.assertIn("winner && <Link", SOURCE)
        self.assertIn("href={`/races/${race.race_id}`}", SOURCE)
        self.assertIn("href={`/drivers/${winner.driver_id}`}", SOURCE)
        self.assertIn("Independent editorial verification pending", SOURCE)
        self.assertIn("Race classifications verify results, not every detail", SOURCE)
        self.assertIn('href="#circuit-layouts"', SOURCE)

    def test_five_editorial_timelines_link_only_recorded_races(self):
        flagship = (ED / "circuit-history-stories.tsx").read_text(encoding="utf-8")
        self.assertIn("races.find(race => String(race.season_year) === moment.year)", flagship)
        self.assertIn("Explore this race in the archive", flagship)
        self.assertIn("<CircuitHistoryStories circuitId={circuit.external_id}", PAGE)
        self.assertIn("history={chronologicalHistory}", PAGE)

    def test_corner_guides_are_bilingual_and_provenanced(self):
        guides = json.loads((ED / "circuit-corner-guides.json").read_text(encoding="utf-8"))
        self.assertEqual({g["id"] for g in guides}, {"silverstone","monza","spa-francorchamps","suzuka","monaco","hungaroring","zandvoort","montreal","interlagos","bahrain","baku","austin","imola","jeddah","mexico-city","yas-marina","marina-bay","catalunya","spielberg","shanghai","istanbul","mugello","portimao"})
        for guide in guides:
            self.assertGreaterEqual(len(guide["sections"]), 2)
            for corner in guide["sections"]:
                self.assertTrue(corner["label"].strip())
                for locale in ("en","uk"):
                    self.assertGreater(len(corner[locale].strip()), 65)
                self.assertTrue(corner["source"].startswith("https://"))
        self.assertIn("<CircuitCornerGuide circuitId={circuit.external_id}", PAGE)

    def test_year_extraction_does_not_invent_race_ids(self):
        years = [int(match.group(0)) for match in re.finditer(r"\b(?:19|20)\d{2}\b", "1973–1975")]
        self.assertEqual(years, [1973, 1975])
        self.assertIn("return year ? Number(year[0]) : null", SOURCE)

if __name__ == "__main__":
    unittest.main()
