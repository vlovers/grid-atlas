"""Tests for local Markdown links and code fence handling."""
import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

MODULE = Path(__file__).resolve().parents[1] / "scripts" / "audit-doc-links.py"
spec = importlib.util.spec_from_file_location("audit_doc_links", MODULE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class DocumentationLinkAuditTests(unittest.TestCase):
    def test_long_fences_and_line_numbers(self):
        sample = "# Guide\n````python\n[ignore](missing.md)\n```\n[ignore](also-missing.md)\n````\n[real](existing.md)\n[ref]: another.md\n"
        self.assertEqual(list(module.targets(sample)), [(7, "existing.md"), (8, "another.md")])

    def test_relative_targets_and_external_routes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "docs").mkdir()
            (root / "docs" / "guide.md").write_text("[ok](../README.md#intro)\n[bad](missing.md)\n[web](https://example.com)\n[route](/en/drivers)\n", encoding="utf-8")
            (root / "README.md").write_text("# Intro\n", encoding="utf-8")
            with patch.object(module, "ROOT", root), patch.object(module, "tracked_paths", return_value={"docs/guide.md", "README.md"}):
                failures = module.audit()
            self.assertEqual(len(failures), 1)
            self.assertEqual(failures[0]["target"], "missing.md")

if __name__ == "__main__":
    unittest.main()
