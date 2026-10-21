"""Regression tests for bilingual champion source provenance and publication gates."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("champion_audit", ROOT / "scripts/audit-champion-chapters.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
CHAPTERS = json.loads(mod.CHAPTERS.read_text())
STORIES = json.loads(mod.STORIES.read_text())

def loader(driver, locale):
    return json.loads((mod.DOSSIERS / f"{driver}.{locale}.json").read_text())


class ChampionChapterAudit(unittest.TestCase):
    def test_full_real_cohort(self):
        self.assertEqual(mod.audit_chapters(CHAPTERS, loader), [])
        self.assertEqual(mod.audit_race_stories(STORIES), [])

    def test_blocks_publication(self):
        d = copy.deepcopy(CHAPTERS)
        d["publication_allowed"] = True
        self.assertTrue(mod.audit_chapters(d, loader))

    def test_blocks_human_approval_spoofing(self):
        d = copy.deepcopy(CHAPTERS)
        d["chapters"][0]["human_editor_approved"] = True
        self.assertTrue(mod.audit_chapters(d, loader))

    def test_missing_uk_copy(self):
        d = copy.deepcopy(CHAPTERS)
        del d["chapters"][0]["body"]["uk"]
        self.assertTrue(mod.audit_chapters(d, loader))

    def test_missing_claim_id(self):
        d = copy.deepcopy(CHAPTERS)
        d["chapters"][0]["based_on_claim_ids"] = ["non-existent-source-claim"]
        self.assertTrue(mod.audit_chapters(d, loader))

    def test_mismatched_dossier_locale(self):
        d = copy.deepcopy(CHAPTERS)
        d["chapters"][0]["dossier_files"]["uk"] = d["chapters"][0]["dossier_files"]["en"]
        self.assertTrue(mod.audit_chapters(d, loader))

    def test_mismatched_identity(self):
        def wrong(driver, locale):
            d = loader(driver, locale)
            d["driver_id"] = "not-the-same-driver"
            return d
        self.assertTrue(mod.audit_chapters(CHAPTERS, wrong))

    def test_evidence_without_support(self):
        def unsupported(driver, locale):
            d = loader(driver, locale)
            for claim in d["claims"]:
                claim["evidence"] = []
            return d
        self.assertTrue(mod.audit_chapters(CHAPTERS, unsupported))

    def test_reject_unreviewed_race_approval(self):
        d = copy.deepcopy(STORIES)
        d["stories"][0]["approved"] = True
        self.assertTrue(mod.audit_race_stories(d))

    def test_reject_race_unsafe_source(self):
        d = copy.deepcopy(STORIES)
        d["stories"][0]["source"] = "https://example.org/results"
        self.assertTrue(mod.audit_race_stories(d))

    def test_reject_race_media_publication(self):
        d = copy.deepcopy(STORIES)
        d["stories"][0]["media"] = [{"url":"unlicensed"}]
        self.assertTrue(mod.audit_race_stories(d))


if __name__ == "__main__":
    unittest.main()
