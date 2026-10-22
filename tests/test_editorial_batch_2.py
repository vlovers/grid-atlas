"""Structural audit regression for unpublished Editorial Atlas briefs."""
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("editorial_batch_2", ROOT / "scripts/audit-editorial-batch-2.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

class EditorialBatch2Test(unittest.TestCase):
    def test_pack_is_structurally_valid(self):
        data = json.loads(MODULE.PACK.read_text(encoding="utf-8"))
        self.assertEqual([], MODULE.validate(data))
    def test_approval_is_not_automated(self):
        data = json.loads(MODULE.PACK.read_text(encoding="utf-8"))
        data["status"] = "approved"
        self.assertTrue(MODULE.validate(data))
    def test_missing_translation_is_rejected(self):
        data = json.loads(MODULE.PACK.read_text(encoding="utf-8"))
        data["records"][0]["editorial"]["uk"]["deck"] = ""
        self.assertTrue(MODULE.validate(data))

if __name__ == "__main__":
    unittest.main()
