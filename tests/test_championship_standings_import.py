import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "packages/data-importer"))
from import_championship_standings import read_standings, build_sql
from import_seasons import ASSET


class ChampionshipStandingsTests(unittest.TestCase):
    def fixture(self, drivers=None, constructors=None):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        root = Path(temp.name)
        archive = root / ASSET
        drivers = drivers if drivers is not None else [
            {"year": 1950, "positionDisplayOrder": 1, "positionNumber": 1, "positionText": "1",
             "driverId": "farina", "points": 30.0, "championshipWon": True},
            {"year": 2026, "positionDisplayOrder": 1, "positionNumber": 1, "positionText": "1",
             "driverId": "current", "points": 1.5, "championshipWon": False}]
        constructors = constructors if constructors is not None else [
            {"year": 1958, "positionDisplayOrder": 1, "positionNumber": 1, "positionText": "1",
             "constructorId": "vanwall", "engineManufacturerId": "vanwall", "points": 48.0,
             "championshipWon": True},
            {"year": 1958, "positionDisplayOrder": 2, "positionNumber": None, "positionText": "EX",
             "constructorId": "vanwall", "engineManufacturerId": "other", "points": 0,
             "championshipWon": False}]
        with zipfile.ZipFile(archive, "w") as bundle:
            bundle.writestr("f1db-seasons.json", json.dumps([{"year": y} for y in (1950, 1958, 2026)]))
            bundle.writestr("f1db-seasons-driver-standings.json", json.dumps(drivers))
            bundle.writestr("f1db-seasons-constructor-standings.json", json.dumps(constructors))
        checksums = root / "checksums_sha256.txt"
        checksums.write_text(hashlib.sha256(archive.read_bytes()).hexdigest() + "  " + ASSET)
        return archive, checksums

    def test_keeps_championship_points_and_constructor_engine_variants(self):
        rows, digest = read_standings(*self.fixture())
        self.assertEqual(len(rows), 4)
        self.assertEqual(rows[0][7], "30.0")
        self.assertEqual(rows[1][7], "1.5")
        self.assertEqual(rows[2][6], "vanwall")
        self.assertEqual(rows[3][6], "other")
        self.assertEqual(rows[3][4], None)
        sql = build_sql(rows, digest)
        self.assertIn("ON CONFLICT(season_year,entity_kind,position_display_order)", sql)
        self.assertIn("Unresolved standing entity", sql)
        self.assertIn("pg_advisory_xact_lock", sql)

    def test_rejects_duplicate_order_and_invalid_values(self):
        archive, checksums = self.fixture(drivers=[
            {"year": 1950, "positionDisplayOrder": 1, "positionNumber": 1, "positionText": "1",
             "driverId": "a", "points": 5, "championshipWon": True},
            {"year": 1950, "positionDisplayOrder": 1, "positionNumber": 2, "positionText": "2",
             "driverId": "b", "points": 4, "championshipWon": False}])
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            read_standings(archive, checksums)
        for change in ({"points": -2}, {"points": 1.123}, {"championshipWon": "false"},
                       {"positionText": "UNKNOWN"}, {"positionNumber": 0}):
            row = {"year": 1950, "positionDisplayOrder": 1, "positionNumber": 1,
                   "positionText": "1", "driverId": "a", "points": 5, "championshipWon": True}
            row.update(change)
            with self.subTest(change=change), self.assertRaises(ValueError):
                read_standings(*self.fixture(drivers=[row]))

    def test_rejects_champion_in_current_pinned_season(self):
        row = {"year": 2026, "positionDisplayOrder": 1, "positionNumber": 1,
               "positionText": "1", "driverId": "a", "points": 100, "championshipWon": True}
        with self.assertRaisesRegex(ValueError, "active season"):
            read_standings(*self.fixture(drivers=[row]))

    def test_checksum_mismatch(self):
        archive, checksums = self.fixture()
        checksums.write_text("0" * 64 + "  " + ASSET)
        with self.assertRaisesRegex(ValueError, "mismatch"):
            read_standings(archive, checksums)


if __name__ == "__main__":
    unittest.main()
