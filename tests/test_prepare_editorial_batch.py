import unittest

from scripts.prepare_editorial_batch import build_packets, build_statistics


class PrepareEditorialBatchTests(unittest.TestCase):
    def setUp(self):
        self.manifest = {
            "batch_id": "test-legends",
            "source": {"name": "f1db", "release": "v2026.17.0"},
            "drivers": ["ayrton-senna", "alain-prost"],
            "locale_targets": ["en", "uk"],
            "review_status": "draft",
            "created_at": "2026-10-19",
            "reviewer": None,
        }
        self.rows = [("ayrton-senna", "Ayrton Senna", "hash"), ("alain-prost", "Alain Prost", "hash")]

    def test_prepares_unpublished_packets_without_invented_biographies(self):
        result = build_packets(self.manifest, self.rows)
        self.assertEqual(result["publication_status"], "unpublished")
        self.assertEqual(len(result["profiles"]), 2)
        self.assertEqual(result["profiles"][0]["drafts"], {"en": None, "uk": None})
        self.assertEqual(result["profiles"][0]["claims"], [])
        self.assertEqual(result["profiles"][0]["source_display_name"], "Ayrton Senna")

    def test_result_statistics_do_not_claim_championship_points(self):
        stats = build_statistics([
            {"race_id": 10, "position_number": 1, "points": 9},
            {"race_id": 11, "position_number": None, "points": 0},
        ])
        self.assertEqual(stats["race_result_rows"], 2)
        self.assertEqual(stats["classified_first_rows"], 1)
        self.assertEqual(stats["raw_result_points_sum"], "9")
        self.assertIn("NOT championship points", stats["points_semantics"])

    def test_unknown_driver_fails(self):
        self.manifest["drivers"] = ["not-a-driver"]
        with self.assertRaises(ValueError):
            build_packets(self.manifest, self.rows)


if __name__ == "__main__":
    unittest.main()
