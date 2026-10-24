import importlib.util
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "constructor_research_audit", ROOT / "scripts/audit-constructor-research-identities.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def fixture():
    subjects = []
    rows = []
    for i in range(12):
        row = {"id": f"constructor-{i}", "name": f"Constructor {i}"}
        rows.append(row)
        pinned = i < 2
        subjects.append({
            "name": row["name"], "f1db_external_id": row["id"] if pinned else None,
            "source_record_sha256": module.digest_row(row) if pinned else None,
            "human_review": "pending", "independent_claim_review": "pending",
            "publication": "blocked",
        })
    return {"schema_version": 1, "publication_status": "research_only",
            "source": {"release": "v2026.17.0"}, "subjects": subjects}, rows


class ConstructorIdentityAuditTests(unittest.TestCase):
    def test_pinned_records_and_unapproved_candidate_list(self):
        manifest, rows = fixture()
        result = module.reconcile(manifest, rows)
        self.assertEqual(result["verified_pins"], 2)
        self.assertEqual(result["needs_manual_review"], 10)
        self.assertIs(result["publication_allowed"], False)
        self.assertEqual(result["subjects"][2]["candidates"][0]["id"], "constructor-2")

    def test_hash_change_rejected(self):
        manifest, rows = fixture()
        rows[0]["name"] = "Mutated"
        with self.assertRaisesRegex(ValueError, "hash mismatch"):
            module.reconcile(manifest, rows)

    def test_duplicate_source_id_rejected(self):
        manifest, rows = fixture()
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            module.reconcile(manifest, rows + [rows[0]])

    def test_approval_forgery_rejected(self):
        manifest, rows = fixture()
        manifest["subjects"][0]["human_review"] = "approved"
        with self.assertRaisesRegex(ValueError, "unsafe approval"):
            module.reconcile(manifest, rows)

    def test_candidate_hash_cannot_be_invented(self):
        manifest, rows = fixture()
        manifest["subjects"][2]["source_record_sha256"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "unverified identity"):
            module.reconcile(manifest, rows)

    def test_ambiguous_name_remains_proposal_only(self):
        manifest, rows = fixture()
        rows.append({"id": "another-constructor", "name": "Constructor 2"})
        result = module.reconcile(manifest, rows)
        self.assertEqual(len(result["subjects"][2]["candidates"]), 2)
        self.assertIs(result["publication_allowed"], False)


if __name__ == "__main__":
    unittest.main()
