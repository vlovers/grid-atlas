"""Checks that a cohort inventory cannot turn research into published claims."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("editorial_cohort_readiness", ROOT / "scripts/editorial_cohort_readiness.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class CohortReadinessTests(unittest.TestCase):
    def test_real_cohort_including_all_locales(self):
        report = mod.analyze()
        self.assertEqual(report["summary"]["drivers"], 9)
        self.assertEqual(report["summary"]["locales"], 18)
        self.assertEqual(report["summary"]["chapters"], 22)
        self.assertEqual(report["summary"]["ready_to_publish"], 0)
        self.assertFalse(report["publication_authorized"])
        self.assertTrue(all(not d["locales"][lang]["ready_to_publish"]
                            for d in report["drivers"] for lang in ("en", "uk")))

    def test_every_locale_requires_independent_review_and_adapter(self):
        report = mod.analyze()
        for driver in report["drivers"]:
            for lang in ("en", "uk"):
                reasons = driver["locales"][lang]["blockers"]
                self.assertIn("independent_human_review_required", reasons)
                self.assertIn("publication_adapter_not_implemented", reasons)

    def test_missing_dossier_is_explicit(self):
        with tempfile.TemporaryDirectory() as tmp:
            report = mod.analyze(dossiers_dir=Path(tmp))
            self.assertEqual(report["summary"]["drivers"], 9)
            self.assertTrue(all("missing_dossier" in d["locales"][lang]["blockers"]
                                for d in report["drivers"] for lang in ("en", "uk")))

    def test_json_render_is_valid_and_never_authorized(self):
        report = mod.analyze()
        encoded = json.dumps(report, ensure_ascii=False)
        self.assertFalse(json.loads(encoded)["publication_authorized"])
        self.assertNotIn('"ready_to_publish": true', encoded)

    def test_markdown_summary_is_unpublished(self):
        text = mod.markdown(mod.analyze())
        self.assertIn("UNPUBLISHED", text)
        self.assertIn("22", text)
        self.assertIn("publication adapter", text)
        self.assertNotIn("ready to ship", text.lower())

    def test_corrupted_dossier_does_not_grant_approval(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp)
            (p / "jim-clark.en.json").write_text("not json", encoding="utf8")
            report = mod.analyze(dossiers_dir=p)
            entry = next(d for d in report["drivers"] if d["driver_id"] == "jim-clark")
            self.assertIn("invalid_dossier_json", entry["locales"]["en"]["blockers"])
            self.assertFalse(entry["locales"]["en"]["ready_to_publish"])

    def test_senna_sidecars_are_separate_from_champion_cohort(self):
        report = mod.analyze()
        self.assertIn("en", report["senna_pilot"])
        self.assertIn("uk", report["senna_pilot"])
        self.assertFalse(report["senna_pilot"]["en"]["publication_authorized"])


if __name__ == "__main__":
    unittest.main()
