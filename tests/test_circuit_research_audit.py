"""Safety regressions for the unpublished 2021 circuit research package."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
module_path = ROOT / "scripts/audit_circuit_research.py"
spec = importlib.util.spec_from_file_location("circuit_audit", module_path)
audit_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit_module)
DATA = json.loads((ROOT / "docs/editorial/research/circuit-2021-candidates.json").read_text())


class CircuitResearchTests(unittest.TestCase):
    def test_full_batch(self):
        self.assertEqual(len(DATA["records"]), 16)
        self.assertEqual(audit_module.audit(DATA), [])
        self.assertEqual(DATA["publication"], "unpublished")

    def test_deny_auto_publish(self):
        candidate = copy.deepcopy(DATA)
        candidate["publication"] = "published"
        self.assertTrue(audit_module.audit(candidate))

    def test_deny_unreviewed_fact_approval(self):
        candidate = copy.deepcopy(DATA)
        candidate["records"][0]["review"]["status"] = "approved"
        self.assertTrue(audit_module.audit(candidate))

    def test_deny_invented_identity_or_layout(self):
        candidate = copy.deepcopy(DATA)
        candidate["records"][0]["canonical_identity"]["layout_version"] = "2021"
        self.assertTrue(audit_module.audit(candidate))

    def test_deny_bad_domain(self):
        candidate = copy.deepcopy(DATA)
        candidate["records"][0]["source"]["url"] = "https://evil.example/en/racing/2021/monaco"
        self.assertTrue(audit_module.audit(candidate))

    def test_deny_mismatch_of_locator_and_value(self):
        candidate = copy.deepcopy(DATA)
        candidate["records"][0]["length_m"] += 10
        self.assertTrue(audit_module.audit(candidate))

    def test_deny_fake_license(self):
        candidate = copy.deepcopy(DATA)
        candidate["records"][0]["media_license"] = "public_domain"
        self.assertTrue(audit_module.audit(candidate))

    def test_deny_duplicate(self):
        candidate = copy.deepcopy(DATA)
        candidate["records"].append(copy.deepcopy(candidate["records"][0]))
        self.assertTrue(audit_module.audit(candidate))

    def test_deny_boolean_metrics(self):
        candidate = copy.deepcopy(DATA)
        candidate["records"][0]["scheduled_laps"] = True
        self.assertTrue(audit_module.audit(candidate))


if __name__ == "__main__":
    unittest.main()
