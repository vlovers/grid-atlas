"""Fail-closed checks for unpublished bilingual circuit editorial candidates."""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("circuit_candidate", ROOT / "scripts/prepare_circuit_editorial_candidate.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CircuitCandidateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manuscript = module.SOURCE.read_text(encoding="utf-8")
        cls.evidence = module.EVIDENCE.read_text(encoding="utf-8")

    def test_all_five_are_bilingual_and_unpublished(self):
        output = module.build_candidate(self.manuscript, self.evidence)
        self.assertEqual(len(output["circuits"]), 5)
        self.assertEqual(output["stage"], "draft")
        self.assertEqual(output["publication_status"], "unpublished")
        self.assertIsNone(output["approved_revision"])
        for subject in output["circuits"]:
            self.assertEqual(set(subject["locales"]), {"en", "uk"})
            self.assertTrue(subject["events"])

    def test_missing_language_fails(self):
        manuscript = self.manuscript.replace("### UK — Тут почався чемпіонат", "### XX — Тут почався чемпіонат")
        with self.assertRaises(ValueError):
            module.build_candidate(manuscript, self.evidence)

    def test_changed_layout_fails(self):
        altered = self.evidence.replace("silverstone-1", "silverstone-9")
        with self.assertRaises(ValueError):
            module.build_candidate(self.manuscript, altered)

    def test_missing_event_fails(self):
        altered = "\n".join(line for line in self.evidence.splitlines()
                            if not (line.startswith("| Suzuka | 1988 |")))
        with self.assertRaises(ValueError):
            module.build_candidate(self.manuscript, altered)

    def test_duplicate_circuit_fails(self):
        duplicate = self.manuscript + "\n## Silverstone\n### EN — Again\nText\n### UK — Ще\nТекст\n"
        with self.assertRaises(ValueError):
            module.build_candidate(duplicate, self.evidence)

    def test_missing_manuscript_fails(self):
        altered = self.manuscript.replace("## Monza\n", "## Another track\n")
        with self.assertRaises(ValueError):
            module.build_candidate(altered, self.evidence)


if __name__ == "__main__":
    unittest.main()
