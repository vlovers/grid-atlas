import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("circuit_claim_audit", ROOT / "scripts/audit_circuit_claim_worklist.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CircuitClaimWorklistTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original = json.loads(module.WORKLIST.read_text(encoding="utf-8"))

    def test_pending_claims_are_reported_not_approved(self):
        report = module.audit(self.original)
        self.assertEqual(report["circuits"], 5)
        self.assertEqual(report["claims_pending"], 15)
        self.assertFalse(report["publishable"])

    def test_forged_approval_is_rejected(self):
        item = copy.deepcopy(self.original)
        item["circuits"][0]["claims"][0]["status"] = "verified"
        with self.assertRaises(ValueError):
            module.audit(item)

    def test_missing_evidence_is_rejected(self):
        item = copy.deepcopy(self.original)
        item["circuits"][0]["claims"][0]["sources"] = []
        with self.assertRaises(ValueError):
            module.audit(item)

    def test_wrong_source_protocol_is_rejected(self):
        item = copy.deepcopy(self.original)
        item["circuits"][0]["claims"][0]["sources"][0]["url"] = "http://example.com/a"
        with self.assertRaises(ValueError):
            module.audit(item)

    def test_published_status_is_rejected(self):
        item = copy.deepcopy(self.original)
        item["publication_status"] = "published"
        with self.assertRaises(ValueError):
            module.audit(item)


if __name__ == "__main__":
    unittest.main()
