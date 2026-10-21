"""Offline safety tests for nonpublic driver research briefs."""
import importlib.util
import unittest
from pathlib import Path

FILE = Path(__file__).resolve().parents[1] / "scripts/validate-editorial-research-pack.py"
spec = importlib.util.spec_from_file_location("research_pack", FILE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def example():
    return {
        "schema_version": 1, "kind": "editorial_research_brief",
        "subject": {"type": "driver", "canonical_lookup_slug": "test", "identity_status": "requires_f1db_join"},
        "visibility": "internal_only", "editorial_status": "research_required",
        "locale_policy": ["uk", "en"], "historical_assertions": [],
        "chapters": [{"chapter_id": f"c{i}", "heading": {"uk": "Розділ", "en": "Chapter"},
                      "claim_status": "unverified", "narrative_copy": None,
                      "source_locators": [], "human_reviewer": None,
                      "research_prompts": ["source", "archive"]} for i in range(4)],
        "approval": {x: False for x in ["historical_review","uk_review","en_review","media_rights_review","publication_allowed"]},
        "media": {"status": "no_asset_approved_here", "publication_allowed": False},
        "limitations": ["no titles from raw points", "no inferred contracts"],
    }

class PackValidationTests(unittest.TestCase):
    def test_safe_example(self):
        self.assertEqual(mod.validate(example(), "test"), [])
    def test_must_remain_nonpublic(self):
        x=example(); x["visibility"]="public"
        self.assertTrue(mod.validate(x,"test"))
    def test_no_fabricated_review(self):
        x=example(); x["approval"]["historical_review"]=True
        self.assertTrue(mod.validate(x,"test"))
    def test_no_unreviewed_narrative(self):
        x=example(); x["chapters"][0]["narrative_copy"]="A finished biography"
        self.assertTrue(mod.validate(x,"test"))
    def test_no_unlicensed_media(self):
        x=example(); x["media"]["publication_allowed"]=True
        self.assertTrue(mod.validate(x,"test"))
    def test_no_claims_masquerading_as_approved(self):
        x=example(); x["historical_assertions"]=[{"statement":"invented"}]
        self.assertTrue(mod.validate(x,"test"))
    def test_no_invented_identity(self):
        x=example(); x["subject"]["identity_status"]="verified"
        self.assertTrue(mod.validate(x,"test"))
    def test_unique_chapter_ids(self):
        x=example(); x["chapters"][1]["chapter_id"]="c0"
        self.assertTrue(mod.validate(x,"test"))

if __name__ == "__main__":
    unittest.main()
