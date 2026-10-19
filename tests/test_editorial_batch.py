import unittest

from scripts.validate_editorial_batch import validate


def manifest():
    return {
        "batch_id": "legends-001",
        "source": {"name": "f1db", "release": "v2026.17.0"},
        "drivers": ["ayrton-senna", "alain-prost"],
        "locale_targets": ["en", "uk"],
        "review_status": "draft",
        "created_at": "2026-10-19",
        "reviewer": None,
    }


class BatchManifestTests(unittest.TestCase):
    def test_valid_unpublished_batch(self):
        self.assertEqual(validate(manifest()), 2)

    def test_duplicate_driver_fails(self):
        m = manifest()
        m["drivers"].append("ayrton-senna")
        with self.assertRaises(ValueError):
            validate(m)

    def test_cannot_auto_approve(self):
        m = manifest()
        m["review_status"] = "verified"
        with self.assertRaises(ValueError):
            validate(m)

    def test_wrong_release_fails(self):
        m = manifest()
        m["source"]["release"] = "latest"
        with self.assertRaises(ValueError):
            validate(m)

    def test_oversized_batch_fails(self):
        m = manifest()
        m["drivers"] = [f"driver-{i}" for i in range(51)]
        with self.assertRaises(ValueError):
            validate(m)


if __name__ == "__main__":
    unittest.main()
