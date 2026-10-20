"""Aggregate editorial audit: positive checks and tampering detection."""
import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path

SCRIPT=Path(__file__).resolve().parents[1]/"scripts/audit-editorial-research-pack.py"
spec=importlib.util.spec_from_file_location("editorial_pack_audit",SCRIPT)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class FullCohortTests(unittest.TestCase):
    def test_all_files_and_no_publication(self):
        d=module.audit()
        self.assertEqual(d["failures"],[])
        self.assertEqual(d["research_briefs_expected"],5)
        self.assertEqual(d["evidence_bundles_expected"],4)
        self.assertEqual(d["claim_count"],10)
        self.assertEqual(d["research_scenes_count"],36)
        self.assertFalse(d["publishable"])
        self.assertEqual(d["archive_parity"],"not_tested_by_this_audit")

    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.dir=Path(self.tmp.name)
        for path in module.PACK.glob("*.json"):
            shutil.copyfile(path,self.dir/path.name)
    def tearDown(self):
        self.tmp.cleanup()
    def mutate(self,name,change):
        p=self.dir/name
        d=json.loads(p.read_text(encoding="utf-8"))
        change(d)
        p.write_text(json.dumps(d,ensure_ascii=False),encoding="utf-8")
        return module.audit(self.dir)["failures"]
    def test_missing_driver(self):
        (self.dir/"alain-prost.json").unlink()
        self.assertTrue(module.audit(self.dir)["failures"])
    def test_missing_evidence(self):
        (self.dir/"max-verstappen-season-evidence.json").unlink()
        self.assertTrue(module.audit(self.dir)["failures"])
    def test_public_claim_rejected(self):
        self.assertTrue(self.mutate("lewis-hamilton-season-evidence.json",lambda d:d["claims"][0].update(review_status="verified")))
    def test_duplicate_claim_rejected_across_bundles(self):
        self.assertTrue(self.mutate("max-verstappen-season-evidence.json",lambda d:d["claims"][0].update(id="lewis-hamilton-2008-points")))
    def test_must_not_allow_images(self):
        self.assertTrue(self.mutate("ayrton-senna.json",lambda d:d["media"].update(publication_allowed=True)))
    def test_source_reference_requires_valid_id(self):
        self.assertTrue(self.mutate("michael-schumacher-season-evidence.json",lambda d:d["claims"][0].update(source_ids=["missing"])))
    def test_review_identity_cannot_be_faked(self):
        self.assertTrue(self.mutate("max-verstappen-season-evidence.json",lambda d:d["approval"].update(human_editor="Fake")))
    def test_research_only_locales(self):
        self.assertTrue(self.mutate("alain-prost.json",lambda d:d["chapters"][0]["heading"].pop("uk")))

if __name__=="__main__":unittest.main()
