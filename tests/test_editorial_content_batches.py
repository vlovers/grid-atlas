"""Audit generated bilingual research manuscripts against canonical evidence.

No historical accuracy, author approval or publication is inferred.
"""
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
BATCH = ROOT / "docs/editorial/batches"
RESEARCH = ROOT / "docs/editorial/research"


class EditorialBatchTest(unittest.TestCase):
    def test_circuit_locale_parity_and_provenance(self):
        data = json.loads((RESEARCH / "circuit-2021-candidates.json").read_text())
        records = data["records"]
        self.assertEqual(len(records), 16)
        for locale in ("uk", "en"):
            folder = BATCH / "circuits-2021" / locale
            self.assertEqual(len(list(folder.glob("*.md"))), len(records))
            for entry in records:
                slug = entry["source"]["url"].rsplit("/", 1)[-1]
                text = (folder / f"{slug}.md").read_text()
                for expected in (
                    entry["venue"], entry["source"]["url"],
                    entry["source"]["locator"],
                    str(entry["scheduled_laps"]),
                    f"{entry['length_m'] / 1000:.3f}",
                ):
                    self.assertIn(expected, text)
                self.assertIn("RESEARCH DRAFT" if locale == "en" else "ДОСЛІДНИЦЬКА ЧЕРНЕТКА", text)

    def test_constructor_locale_parity_and_provenance(self):
        data = json.loads((RESEARCH / "constructors-2025-source-observations.json").read_text())
        claims = data["claims"]
        sources = data["sources"]
        self.assertEqual(len(claims), 15)
        slugs = {c["entity_slug"] for c in claims}
        self.assertEqual(len(slugs), 7)
        for locale in ("uk", "en"):
            folder = BATCH / "constructors-2025" / locale
            self.assertEqual(len(list(folder.glob("*.md"))), len(slugs))
            for slug in slugs:
                text = (folder / f"{slug}.md").read_text()
                for claim in (c for c in claims if c["entity_slug"] == slug):
                    self.assertIn(claim["value"], text)
                    self.assertIn(claim["locator"], text)
                    self.assertIn(sources[claim["source_id"]]["url"], text)
                self.assertIn("RESEARCH DRAFT" if locale == "en" else "ДОСЛІДНИЦЬКА ЧЕРНЕТКА", text)

    def test_batch_is_not_publication(self):
        readme = (BATCH / "README.md").read_text()
        self.assertIn("Research only", readme)
        for md in BATCH.rglob("*.md"):
            if md.name == "README.md":
                continue
            content = md.read_text().lower()
            self.assertNotIn("**approved for publication**", content)
            self.assertNotIn("publication_allowed: true", content)
            self.assertNotIn("human_editor_approved: true", content)
            if "approved for publication" in content:
                self.assertIn("not approved for publication", content)


if __name__ == "__main__":
    unittest.main()
