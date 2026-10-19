import hashlib
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from importlib.util import spec_from_file_location, module_from_spec

path = Path(__file__).resolve().parents[1] / "packages/data-importer/import_seasons.py"
spec = spec_from_file_location("f1db_seasons_import", path)
module = module_from_spec(spec)
spec.loader.exec_module(module)


class SeasonsImporterTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.archive = Path(self.tmp.name) / module.ASSET
        self.checksums = Path(self.tmp.name) / "checksums_sha256.txt"

    def fixture(self, rows):
        with zipfile.ZipFile(self.archive, "w") as z:
            z.writestr("f1db-seasons.json", json.dumps(rows))
        h = hashlib.sha256(self.archive.read_bytes()).hexdigest()
        self.checksums.write_text(f"{h}  {module.ASSET}\n")

    def test_valid_years(self):
        self.fixture([{"year": 1951}, {"year": 1950}])
        years, digest = module.verified_seasons(self.archive, self.checksums)
        self.assertEqual(years, [1950, 1951])
        self.assertEqual(len(digest), 64)

    def test_reject_duplicate(self):
        self.fixture([{"year": 1950}, {"year": 1950}])
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            module.verified_seasons(self.archive, self.checksums)

    def test_reject_bad_checksum(self):
        self.fixture([{"year": 1950}])
        self.checksums.write_text("0" * 64 + f"  {module.ASSET}\n")
        with self.assertRaisesRegex(ValueError, "mismatch"):
            module.verified_seasons(self.archive, self.checksums)

    def test_reject_non_int_year(self):
        self.fixture([{"year": "1950"}])
        with self.assertRaisesRegex(ValueError, "Invalid"):
            module.verified_seasons(self.archive, self.checksums)
