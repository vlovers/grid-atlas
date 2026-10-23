"""Regression checks for source-to-chapter coverage."""
import importlib.util
import json
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("chapters",ROOT/"scripts/audit-editorial-chapters.py")
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
DIR=ROOT/"docs/editorial/releases/v2"
class ChapterAuditTest(unittest.TestCase):
    def setUp(self):
        self.d=json.loads((DIR/"chapter-drafts.json").read_text(encoding="utf-8"))
        self.r=json.loads((DIR/"pilot-research.json").read_text(encoding="utf-8"))
    def test_claims_covered(self):
        self.assertEqual([],mod.validate(self.d,self.r))
    def test_unknown_claim_fails(self):
        self.d["articles"][0]["chapters"][0]["claim_ids"].append("made-up-claim")
        self.assertTrue(mod.validate(self.d,self.r))
    def test_missing_locale_fails(self):
        self.d["articles"][0]["chapters"][0]["body"]["uk"]=""
        self.assertTrue(mod.validate(self.d,self.r))
    def test_fake_approval_fails(self):
        self.d["articles"][0]["review_state"]="approved"
        self.assertTrue(mod.validate(self.d,self.r))
if __name__=="__main__":unittest.main()
