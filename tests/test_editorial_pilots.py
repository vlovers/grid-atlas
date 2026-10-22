"""Unpublished sourced editorial pilot integrity."""
import importlib.util
import json
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("pilot_audit", ROOT / "scripts/audit-editorial-pilots.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class EditorialPilotsTest(unittest.TestCase):
    def test_pilots_are_structurally_valid(self):
        self.assertEqual([], module.validate(json.loads(module.PACK.read_text(encoding="utf-8"))))
    def test_fake_approval_is_rejected(self):
        pack = json.loads(module.PACK.read_text(encoding="utf-8"))
        pack["items"][0]["review"]["state"] = "approved"
        self.assertTrue(module.validate(pack))
    def test_missing_source_locator_is_rejected(self):
        pack = json.loads(module.PACK.read_text(encoding="utf-8"))
        pack["items"][0]["claims"][0]["evidence"]["locator"] = ""
        self.assertTrue(module.validate(pack))

if __name__ == "__main__":
    unittest.main()
