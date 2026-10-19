import hashlib
import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "packages/data-importer"))
from import_seasons import ASSET
from import_teams_circuits import KINDS, read_entities, make_sql

class TeamCircuitTests(unittest.TestCase):
    def fixture(self, bad=False):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        archive = root / ASSET
        with zipfile.ZipFile(archive, "w") as z:
            z.writestr("f1db-seasons.json", json.dumps([{"year":1950}]))
            for filename in KINDS:
                rows=[{"id":"test","name":"Example"}]
                if bad and filename=="f1db-entrants.json": rows.append(rows[0])
                z.writestr(filename, json.dumps(rows))
        checksum=hashlib.sha256(archive.read_bytes()).hexdigest()
        manifest=root/"checksums_sha256.txt"
        manifest.write_text(f"{checksum}  {ASSET}\n")
        return archive, manifest

    def test_generates_idempotent_source_attributed_sql(self):
        archive, manifest=self.fixture()
        rows, digest=read_entities(archive, manifest)
        self.assertEqual(len(rows),3)
        sql=make_sql(rows,digest)
        self.assertIn("ON CONFLICT(external_identity_id) DO NOTHING",sql)
        self.assertIn("source_observations",sql)

    def test_rejects_duplicate_source_id(self):
        archive, manifest=self.fixture(bad=True)
        with self.assertRaisesRegex(ValueError,"Duplicate ID"):
            read_entities(archive, manifest)

    def test_rejects_tampered_release(self):
        archive, manifest=self.fixture()
        manifest.write_text("0"*64 + f"  {ASSET}\n")
        with self.assertRaisesRegex(ValueError,"mismatch"):
            read_entities(archive, manifest)
