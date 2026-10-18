import hashlib
import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "packages/data-importer"))
from import_seasons import ASSET
from import_races import read_races, build_sql


class RaceImporterTests(unittest.TestCase):
    def fixture(self, races):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        archive = Path(temp.name) / ASSET
        with zipfile.ZipFile(archive, "w") as z:
            z.writestr("f1db-seasons.json", json.dumps([{"year": 1950}]))
            z.writestr("f1db-races.json", json.dumps(races))
        checksums = Path(temp.name) / "checksums_sha256.txt"
        checksums.write_text(hashlib.sha256(archive.read_bytes()).hexdigest() + "  " + ASSET + "\n")
        return archive, checksums

    def test_valid_fixture(self):
        a, c = self.fixture([{"id": 1, "year": 1950, "round": 1, "circuitId": "silverstone",
                              "date": "1950-05-13", "officialName": "British Grand Prix"}])
        rows, digest = read_races(a, c)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0][:6], ("1", 1950, 1, "silverstone", "1950-05-13", "British Grand Prix"))
        sql = build_sql(rows, digest)
        self.assertIn("Race season absent", sql)
        self.assertIn("Referenced circuit absent", sql)
        self.assertIn("ON CONFLICT(external_identity_id) DO NOTHING", sql)

    def test_duplicate_round_fails(self):
        rows = [{"id": n, "year": 1950, "round": 1, "circuitId": "silverstone",
                 "date": "1950-05-13", "officialName": "GP"} for n in (1, 2)]
        a, c = self.fixture(rows)
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            read_races(a, c)

    def test_invalid_date_fails(self):
        a, c = self.fixture([{"id": 1, "year": 1950, "round": 1, "circuitId": "silverstone",
                              "date": "1950-02-31", "officialName": "GP"}])
        with self.assertRaisesRegex(ValueError, "Invalid race date"):
            read_races(a, c)

    def test_bad_checksum_fails(self):
        a, c = self.fixture([{"id": 1, "year": 1950, "round": 1, "circuitId": "silverstone",
                              "date": "1950-05-13", "officialName": "GP"}])
        c.write_text("0"*64 + "  " + ASSET)
        with self.assertRaisesRegex(ValueError, "mismatch"):
            read_races(a, c)
