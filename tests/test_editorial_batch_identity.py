import unittest
import json
from pathlib import Path
from scripts.editorial_batch_identity import reconcile

DIGEST = "a" * 64


def fixture():
    ids = [f"driver-{i:02}" for i in range(30)]
    batch = {
        "batch_id": "drivers-30-v1", "publication_status": "unpublished",
        "drivers": [{"driver_id": driver_id, "priority": "pilot" if i < 5 else "batch_01",
                     "status": "existing_research_dossier" if i < 5 else "research_draft",
                     "required_locales": ["en", "uk"]} for i, driver_id in enumerate(ids)],
    }
    release = {"status": "research_only", "drivers": [{"driver_id": x} for x in ids[:5]]}
    rows = [(x, f"Driver {i}", "b" * 64) for i, x in enumerate(ids)]
    return batch, release, rows


class EditorialBatchIdentityTests(unittest.TestCase):
    def test_30_pinned_ids_matched_without_fake_review(self):
        batch, release, rows = fixture()
        report = reconcile(batch, release, rows, DIGEST)
        self.assertEqual(report["errors"], [])
        self.assertEqual(report["totals"]["matched_external_ids"], 30)
        self.assertEqual(report["totals"]["pilots"], 5)
        self.assertEqual(report["totals"]["human_identity_reviews"], 0)
        self.assertEqual(report["totals"]["approved_for_publication"], 0)
        self.assertTrue(all(x["human_identity_review"] == "pending" for x in report["drivers"]))

    def test_unknown_canonical_id_fails_closed(self):
        batch, release, rows = fixture()
        rows.pop()
        report = reconcile(batch, release, rows, DIGEST)
        self.assertIn("f1db_id_not_found:driver-29", report["errors"])

    def test_duplicate_candidate_and_source_ids_fail(self):
        batch, release, rows = fixture()
        batch["drivers"][29]["driver_id"] = "driver-28"
        rows.append(rows[0])
        report = reconcile(batch, release, rows, DIGEST)
        self.assertIn("duplicate_candidate:driver-28", report["errors"])
        self.assertIn("duplicate_f1db_id:driver-00", report["errors"])

    def test_pilot_manifest_drift_fails(self):
        batch, release, rows = fixture()
        batch["drivers"][4]["priority"] = "batch_01"
        report = reconcile(batch, release, rows, DIGEST)
        self.assertIn("pilot_manifest_drift", report["errors"])

    def test_published_or_bad_locale_rejected(self):
        batch, release, rows = fixture()
        batch["publication_status"] = "published"
        batch["drivers"][8]["required_locales"] = ["en", "en"]
        report = reconcile(batch, release, rows, DIGEST)
        self.assertIn("batch_schema_or_publication_gate", report["errors"])
        self.assertIn("invalid_locales:driver-08", report["errors"])

    def test_stale_research_status_warns_without_faking_progress(self):
        batch, release, rows = fixture()
        batch["drivers"][5]["status"] = "candidate_unresearched"
        report = reconcile(batch, release, rows, DIGEST)
        self.assertEqual(report["errors"], [])
        self.assertIn("stale_manifest_status:driver-05", report["warnings"])

    def test_archive_digest_must_be_sha256(self):
        batch, release, rows = fixture()
        report = reconcile(batch, release, rows, "not-a-digest")
        self.assertIn("invalid_archive_digest", report["errors"])

    def test_real_farina_uses_pinned_f1db_id_in_all_research_surfaces(self):
        root = Path(__file__).resolve().parents[1]
        prefix = root / "docs/editorial/batches/drivers-30-v1"
        batch = json.loads((root / "docs/editorial/batches/drivers-30-v1.json").read_text(encoding="utf-8"))
        years = json.loads((prefix / "championship-reference.json").read_text(encoding="utf-8"))
        story = json.loads((prefix / "narrative-chapters-v1.json").read_text(encoding="utf-8"))
        card = json.loads((prefix / "research/nino-farina.json").read_text(encoding="utf-8"))
        self.assertIn("nino-farina", [row["driver_id"] for row in batch["drivers"]])
        self.assertNotIn("giuseppe-farina", [row["driver_id"] for row in batch["drivers"]])
        self.assertEqual(years["driver_championship_years"]["nino-farina"], [1950])
        self.assertEqual(card["driver_id"], "nino-farina")
        self.assertTrue(all(claim["claim_id"].startswith("nino-farina-") for claim in card["claims"]))
        chapters = next(row["chapters"] for row in story["stories"] if row["driver_id"] == "nino-farina")
        known = {claim["claim_id"] for claim in card["claims"]}
        self.assertTrue(all(set(chapter["claim_ids"]) <= known for chapter in chapters))
        self.assertFalse((prefix / "research/giuseppe-farina.json").exists())


if __name__ == "__main__":
    unittest.main()
