import hashlib
import importlib.util
import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "packages/data-importer"
sys.path.insert(0, str(ROOT))
from import_drivers import read_drivers, build_sql
from import_seasons import ASSET

class DriversImporterTests(unittest.TestCase):
    def fixture(self, driver_rows):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        root = Path(temp.name)
        archive = root / ASSET
        with zipfile.ZipFile(archive, "w") as z:
            z.writestr("f1db-seasons.json", json.dumps([{"year": 1950}]))
            z.writestr("f1db-drivers.json", json.dumps(driver_rows))
        digest = hashlib.sha256(archive.read_bytes()).hexdigest()
        checks = root / "checksums_sha256.txt"
        checks.write_text(f"{digest}  {ASSET}\n")
        return archive, checks

    def test_valid_and_guarded(self):
        archive, checks = self.fixture([{"id":"driver-one","name":"Driver, One"}])
        rows, digest = read_drivers(archive, checks)
        self.assertEqual(len(rows), 1)
        sql = build_sql(rows, digest)
        self.assertIn("ON CONFLICT(external_identity_id) DO NOTHING", sql)
        self.assertIn("source_observations", sql)
        self.assertIn("Driver, One", sql)

    def test_duplicate_rejected(self):
        archive, checks = self.fixture([{"id":"x","name":"One"},{"id":"x","name":"Two"}])
        with self.assertRaisesRegex(ValueError,"Duplicate"):
            read_drivers(archive, checks)

    def test_tampered_archive_rejected(self):
        archive, checks = self.fixture([{"id":"x","name":"One"}])
        checks.write_text("0"*64 + "  " + ASSET + "\n")
        with self.assertRaisesRegex(ValueError,"mismatch"):
            read_drivers(archive, checks)
