"""Offline tests for content coverage census; no database required."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("content_coverage", Path(__file__).resolve().parents[1] / "scripts/content-coverage.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CoverageTests(unittest.TestCase):
    def test_query_is_read_only_transaction(self):
        class Completed:
            stdout = "BEGIN\n7\nCOMMIT\n"
        with patch.object(module.subprocess, "run", return_value=Completed()) as run:
            self.assertEqual(module.query("postgresql://fixture", "SELECT count(*) FROM historical_drivers;"), ["7"])
            args, kwargs = run.call_args
            self.assertEqual(args[0][0], "psql")
            self.assertIn("BEGIN TRANSACTION READ ONLY;", kwargs["input"])
            self.assertIn("SELECT count(*) FROM historical_drivers;", kwargs["input"])

    def test_census_queries_all_entities_without_inventing_publication(self):
        with patch.object(module, "scalar", return_value=3) as scalar:
            result = module.census("fixture")
        self.assertEqual(set(result["entities"]), set(module.ENTITY_TABLES))
        self.assertEqual(result["entities"]["drivers"]["total"], 3)
        self.assertEqual(result["entities"]["races"]["missing_season"], 3)
        self.assertIn("published_articles_uk", result["not_measured"])
        self.assertIn("official_standings", result["not_measured"])
        self.assertTrue(any("historical_race_results" in call.args[1] for call in scalar.call_args_list))

    def test_markdown_marks_unknown_as_not_measured(self):
        with patch.object(module, "scalar", return_value=0):
            report = module.census("fixture")
        md = module.markdown(report)
        self.assertIn("| drivers | 0 | 0 | 0 |", md)
        self.assertIn("Not measured", md)
        self.assertIn("published_articles_en", md)
        self.assertNotIn("100%", md)


if __name__ == "__main__":
    unittest.main()
