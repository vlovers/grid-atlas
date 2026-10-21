import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("fact_validator", Path(__file__).with_name("validate.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def fact():
    return {
        "entity_kind": "constructor_season", "entity_id": "1", "year": 2008,
        "field": "chassis", "value": "EXAMPLE-NOT-HISTORICAL",
        "source": {"url": "https://example.org/archive", "title": "Example", "publisher": "Example",
                   "locator": "p. 1", "accessed_on": "2026-10-21"},
        "status": "draft",
    }


class ValidationTests(unittest.TestCase):
    def test_draft_is_valid_but_not_published(self):
        self.assertEqual(module.validate(fact()), [])

    def test_review_requires_reviewer(self):
        row = fact()
        row["status"] = "reviewed"
        self.assertTrue(module.validate(row))
        row.update(reviewer="Human reviewer", reviewed_on="2026-10-21")
        self.assertEqual(module.validate(row), [])

    def test_reject_unknown_field(self):
        row = fact()
        row["field"] = "world_titles"
        self.assertTrue(module.validate(row))

    def test_reject_insecure_source(self):
        row = fact()
        row["source"]["url"] = "http://example.org"
        self.assertTrue(module.validate(row))

    def test_reject_boolean_numeric(self):
        row = fact()
        row.update(entity_kind="circuit_layout", field="turns", value=True)
        self.assertTrue(module.validate(row))

    def test_reject_svg_injection(self):
        row = fact()
        row.update(entity_kind="circuit_layout", field="svg_path",
                   value='<script>alert(1)</script>', layout_version="2008")
        self.assertTrue(module.validate(row))

    def test_accept_path_only_with_layout_version(self):
        row = fact()
        row.update(entity_kind="circuit_layout", field="svg_path", value="M 0 0 L 10 10 Z")
        self.assertTrue(module.validate(row))
        row["layout_version"] = "example-layout"
        self.assertEqual(module.validate(row), [])

    def test_reject_unreviewed_missing_source(self):
        row = fact()
        del row["source"]
        self.assertTrue(module.validate(row))

    def test_reject_out_of_range_year(self):
        row = fact()
        row["year"] = 1900
        self.assertTrue(module.validate(row))


if __name__ == "__main__":
    unittest.main()
