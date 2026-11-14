import hashlib
import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "packages/data-importer"))
from import_seasons import ASSET
from import_race_results import read_results, build_sql

class RaceResultsTests(unittest.TestCase):
    def fixture(self, records):
        tmp=tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        archive=Path(tmp.name)/ASSET
        with zipfile.ZipFile(archive,"w") as bundle:
            bundle.writestr("f1db-seasons.json",json.dumps([{"year":1950}]))
            bundle.writestr("f1db-races-race-results.json",json.dumps(records))
        checksum=Path(tmp.name)/"checksums_sha256.txt"
        checksum.write_text(hashlib.sha256(archive.read_bytes()).hexdigest()+"  "+ASSET+"\n")
        return archive,checksum

    def row(self, **changes):
        result={"raceId":1,"positionDisplayOrder":1,"driverId":"farina","constructorId":"alfa-romeo",
                "positionNumber":1,"positionText":"1","driverNumber":"2","laps":70,"points":9,"sharedCar":False}
        result.update(changes)
        return result

    def test_valid_result(self):
        a,c=self.fixture([self.row()])
        rows,digest=read_results(a,c)
        self.assertEqual(len(rows),1)
        sql=build_sql(rows,digest)
        self.assertIn("ON CONFLICT (race_id, position_display_order) DO UPDATE SET",sql)
        self.assertIn('Existing result identity differs',sql)
        update=sql.split('DO UPDATE SET')[1].split('WHERE')[0]
        self.assertNotIn('points=',update)
        self.assertNotIn('driver_id=',update)
        self.assertIsNone(rows[0][11])
        self.assertIsNone(rows[0][12])

    def test_flags_preserve_false_true_and_unknown_with_exact_record_digest(self):
        item=self.row(polePosition=False,fastestLap=True)
        rows,_=read_results(*self.fixture([item]))
        self.assertEqual(rows[0][11:13],(False,True))
        self.assertEqual(rows[0][13],'f1db-races-race-results.json#raceId=1&positionDisplayOrder=1')
        self.assertEqual(rows[0][14],hashlib.sha256(json.dumps(item,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest())

    def test_flag_strings_numbers_and_arrays_are_rejected(self):
        for value in ['false',0,1,[],{}]:
            with self.subTest(value=value),self.assertRaisesRegex(ValueError,'flag'):
                read_results(*self.fixture([self.row(polePosition=value)]))

    def test_duplicate_rejected(self):
        a,c=self.fixture([self.row(),self.row(driverId="fagioli")])
        with self.assertRaisesRegex(ValueError,"Duplicate"):read_results(a,c)

    def test_bad_points_rejected(self):
        a,c=self.fixture([self.row(points=-1)])
        with self.assertRaisesRegex(ValueError,"points"):read_results(a,c)

    def test_tampered_release_rejected(self):
        a,c=self.fixture([self.row()])
        c.write_text("0"*64+"  "+ASSET)
        with self.assertRaisesRegex(ValueError,"mismatch"):read_results(a,c)
