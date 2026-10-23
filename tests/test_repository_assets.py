"""Regression tests for read-only repository hygiene inventory."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).resolve().parents[1] / "scripts" / "audit-repository-assets.py"
spec = importlib.util.spec_from_file_location("audit_repository_assets", MODULE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RepositoryAssetInventoryTests(unittest.TestCase):
    def test_inventory_reports_bytes_and_reference_candidates_without_deletion(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name, content in {
                "docs/design/example.png": b"12345",
                "scripts/tool.py": b"print('ok')",
                "docs/README.md": b"See [screenshot](design/example.png)",
                "README.md": b"Documentation.",
            }.items():
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(content)
            result = module.inventory(root, ["docs/design/example.png", "scripts/tool.py", "docs/README.md", "README.md"])
            self.assertEqual(result["images"]["count"], 1)
            self.assertEqual(result["images"]["bytes"], 5)
            self.assertEqual(result["scripts"]["count"], 1)
            self.assertEqual([x["path"] for x in result["reference_candidates"]], ["scripts/tool.py"])
            self.assertTrue((root / "docs/design/example.png").exists())
            self.assertTrue((root / "scripts/tool.py").exists())

    def test_empty_inventory(self):
        with tempfile.TemporaryDirectory() as directory:
            result = module.inventory(Path(directory), [])
            self.assertEqual(result["images"]["bytes"], 0)
            self.assertEqual(result["reference_candidates"], [])


if __name__ == "__main__":
    unittest.main()
