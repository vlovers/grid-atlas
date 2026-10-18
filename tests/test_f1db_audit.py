import hashlib
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from scripts.audit_f1db import audit, checksum_for, ASSET


class AuditTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.archive = self.root / ASSET
        self.checksums = self.root / "checksums_sha256.txt"

    def write_zip(self, entries):
        with zipfile.ZipFile(self.archive, "w") as zip_file:
            for name, rows in entries.items():
                zip_file.writestr(name, json.dumps(rows))
        digest = hashlib.sha256(self.archive.read_bytes()).hexdigest()
        self.checksums.write_text(f"{digest}  {ASSET}\n")

    def test_counts_and_no_duplicates(self):
        self.write_zip({"f1db-drivers.json": [{"id": "a"}, {"id": "b"}]})
        data = audit(self.archive, self.checksums)
        self.assertEqual(data["collections"]["f1db-drivers"]["rows"], 2)
        self.assertEqual(data["collections"]["f1db-drivers"]["duplicate_id_count"], 0)

    def test_duplicates_reported(self):
        self.write_zip({"drivers.json": [{"id": "x"}, {"id": "x"}]})
        data = audit(self.archive, self.checksums)
        self.assertEqual(data["collections"]["drivers"]["duplicate_id_count"], 1)

    def test_tampering_detected(self):
        self.write_zip({"drivers.json": [{"id": "x"}]})
        self.checksums.write_text("0" * 64 + f"  {ASSET}\n")
        with self.assertRaisesRegex(ValueError, "mismatch"):
            audit(self.archive, self.checksums)

    def test_unsafe_paths_rejected(self):
        self.write_zip({"../escape.json": [{"id": "x"}]})
        with self.assertRaisesRegex(ValueError, "Unsafe"):
            audit(self.archive, self.checksums)

    def test_missing_checksum_rejected(self):
        with self.assertRaisesRegex(ValueError, "No SHA-256"):
            checksum_for("irrelevant", ASSET)


if __name__ == "__main__":
    unittest.main()
