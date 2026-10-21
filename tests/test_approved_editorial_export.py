"""Approved bundle exporter: no automated human signoff and no unpublished leaks."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("approved_export", ROOT / "scripts/export_approved_editorial.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
D = json.loads((ROOT / "docs/editorial/pilots/senna/en.dossier.json").read_text())
R = json.loads((ROOT / "docs/editorial/pilots/senna/en.review.json").read_text())

class ApprovedExportTests(unittest.TestCase):
    def test_actual_senna_pilot_is_blocked(self):
        with patch.object(mod, "validate_review", return_value={"ready_for_publication":False}):
            with self.assertRaisesRegex(ValueError, "independent approval"):
                mod.export(D,R,{D["driver_id"]},mod.iso_date("2026-10-21"))

    def test_missing_human_signoff_is_blocked(self):
        rev=copy.deepcopy(R);rev["stage"]="approved"
        with patch.object(mod, "validate_review", return_value={"ready_for_publication":True}):
            with self.assertRaisesRegex(ValueError, "signoff"):
                mod.export(D,rev,{D["driver_id"]},mod.iso_date("2026-10-21"))

    def test_text_only_no_media(self):
        rev=copy.deepcopy(R);rev["stage"]="approved";rev["media"]=[{"unsafe":"image"}]
        with patch.object(mod, "validate_review", return_value={"ready_for_publication":True}):
            with self.assertRaisesRegex(ValueError, "media"):
                mod.export(D,rev,{D["driver_id"]},mod.iso_date("2026-10-21"))

    def test_no_unapproved_claims_even_if_report_claims_ready(self):
        rev=copy.deepcopy(R);rev["stage"]="approved"
        rev["checks"]["signoff"]={"actor":"human","reviewer":"Test reviewer"}
        with patch.object(mod, "validate_review", return_value={"ready_for_publication":True}):
            with self.assertRaisesRegex(ValueError, "claim approval"):
                mod.export(D,rev,{D["driver_id"]},mod.iso_date("2026-10-21"))

if __name__=="__main__":
    unittest.main()
