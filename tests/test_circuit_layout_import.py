import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "packages/data-importer"))
from import_circuit_layouts import read_circuit_facts, build_sql
from import_seasons import ASSET

class CircuitLayoutImportTests(unittest.TestCase):
    def fixture(self, layouts=None, races=None):
        d = tempfile.TemporaryDirectory()
        self.addCleanup(d.cleanup)
        root = Path(d.name)
        archive = root / ASSET
        layouts = layouts if layouts is not None else [
            {"id":"austin-2012", "circuitId":"americas", "effective":False, "length":5.513, "turns":20},
            {"id":"austin-modern", "circuitId":"americas", "effective":True, "length":5.513, "turns":20}]
        races = races if races is not None else [
            {"id":100, "year":2012, "round":19, "circuitLayoutId":"austin-2012",
             "courseLength":5.513, "turns":20, "laps":56, "distance":308.405,
             "scheduledLaps":56, "scheduledDistance":308.405, "direction":"CLOCKWISE"},
            {"id":101, "year":2026, "round":18, "circuitLayoutId":"austin-modern",
             "courseLength":5.513, "turns":20, "laps":56, "distance":308.405,
             "scheduledLaps":56, "scheduledDistance":308.405, "direction":"CLOCKWISE"}]
        with zipfile.ZipFile(archive,"w") as bundle:
            bundle.writestr("f1db-seasons.json",json.dumps([{"year":2012},{"year":2026}]))
            bundle.writestr("f1db-circuits-layouts.json",json.dumps(layouts))
            bundle.writestr("f1db-races.json",json.dumps(races))
        checksums=root/"checksums_sha256.txt"
        checksums.write_text(hashlib.sha256(archive.read_bytes()).hexdigest()+"  "+ASSET)
        return archive,checksums

    def test_layouts_are_not_promoted_to_track_geometry(self):
        layouts,events,digest=read_circuit_facts(*self.fixture())
        self.assertEqual(len(layouts),2)
        self.assertEqual(len(events),2)
        self.assertEqual(layouts[1][2],"true")
        self.assertEqual(events[0][2],"5.513")
        sql=build_sql(layouts,events,digest)
        self.assertIn("ON CONFLICT(external_layout_id)",sql)
        self.assertIn("ON CONFLICT(race_id)",sql)
        self.assertIn("Missing circuit identity",sql)
        self.assertNotIn("track_svg",sql)

    def test_rejects_bad_layout_fk_and_fabricated_measurements(self):
        cases=[
            ([{"id":"x","circuitId":"americas","effective":True,"length":-1,"turns":20}],None),
            ([{"id":"x","circuitId":"americas","effective":"yes","length":5,"turns":20}],None),
            (None,[{"id":100,"circuitLayoutId":"nonexistent","courseLength":5.5,
                    "turns":20,"laps":56,"distance":308,"scheduledLaps":56,
                    "scheduledDistance":308}])]
        for layouts,races in cases:
            with self.subTest(layouts=layouts,races=races),self.assertRaises(ValueError):
                read_circuit_facts(*self.fixture(layouts=layouts,races=races))

    def test_checksum_must_match(self):
        a,c=self.fixture()
        c.write_text("0"*64+"  "+ASSET)
        with self.assertRaisesRegex(ValueError,"mismatch"):
            read_circuit_facts(a,c)

if __name__=="__main__":
    unittest.main()
