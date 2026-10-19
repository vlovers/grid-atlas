"""All approvals in this file belong to explicitly synthetic fixtures."""
import copy
import datetime as dt
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

from scripts.editorial_dossiers import ROOT, load_json
from scripts.editorial_review import revision_digest, validate_review

AS_OF = dt.date(2026, 10, 20)
PILOT = ROOT / "docs/editorial/pilots/senna"


def fixture():
    dossier = {
        "schema_version": 1, "driver_id": "fixture-driver", "locale": "en",
        "title": "Synthetic editorial fixture", "author": "Fixture Author",
        "status": "needs_review", "publication_status": "unpublished",
        "reviewer": None, "reviewed_at": None,
        "sources": [{"source_id": "fixture-source", "source_url": "https://example.org/record",
                     "title": "Synthetic record", "publisher": "Example", "author": None,
                     "accessed_on": "2026-10-19", "version": "Synthetic v1",
                     "independence_group": "example"}],
        "claims": [{"claim_id": "fixture-driver-record", "topic": "identity",
                    "statement": "This is a synthetic assertion, not historical content.",
                    "status": "needs_review", "evidence": [
                        {"source_id": "fixture-source", "locator": "Synthetic row 1", "supports": True}]}],
        "sections": [{"section_id": "record", "title": "Record",
                      "claim_ids": ["fixture-driver-record"]}], "gaps": [], "media": [],
    }
    review = {
        "schema_version": 1, "stage": "evidence_review",
        "sources": {"fixture-source": {"kind": "primary", "published_on": None,
                                       "publication_note": "Synthetic; publication day unknown"}},
        "claim_reviews": {"fixture-driver-record": None},
        "checks": dict.fromkeys(("identity", "language", "originality", "links", "signoff")),
        "issues": [], "media": [], "publication": None,
    }
    return dossier, review


def approve(dossier, review):
    """Synthetic human decisions for testing only; never applied to pilot files."""
    decision = {"actor": "human", "reviewer": "Fixture Independent Editor",
                "reviewed_on": "2026-10-20", "revision_sha256": revision_digest(dossier, review),
                "note": "Synthetic fixture review; no real historical approval"}
    for key in review["claim_reviews"]:
        review["claim_reviews"][key] = copy.deepcopy(decision)
    for key in review["checks"]:
        review["checks"][key] = copy.deepcopy(decision)
    for issue in review["issues"]:
        issue["resolution"] = copy.deepcopy(decision)
    for asset in review["media"]:
        asset["review"] = copy.deepcopy(decision)
    review["stage"] = "approved"
    return decision


class EditorialReviewTests(unittest.TestCase):
    def setUp(self):
        self.doc, self.review = fixture()

    def validate(self):
        return validate_review(self.doc, self.review, {"fixture-driver"}, AS_OF)

    def test_valid_research_is_not_approval_and_does_not_mutate_inputs(self):
        before = copy.deepcopy((self.doc, self.review))
        report = self.validate()
        self.assertFalse(report["ready_for_publication"])
        self.assertFalse(report["public_content_written"])
        self.assertIn("claim_reviews.fixture-driver-record: independent human review missing", report["blockers"])
        self.assertEqual((self.doc, self.review), before)
        self.assertEqual(self.validate(), report)

    def test_explicit_human_approved_fixture_is_ready_but_dossier_stays_unpublished(self):
        approve(self.doc, self.review)
        self.assertTrue(self.validate()["ready_for_publication"])
        self.assertEqual(self.doc["publication_status"], "unpublished")
        self.review["stage"] = "evidence_review"
        self.assertFalse(self.validate()["ready_for_publication"])

    def test_approval_or_publication_without_reviews_fails_closed(self):
        for stage in ("approved", "published"):
            self.review["stage"] = stage
            with self.subTest(stage=stage), self.assertRaisesRegex(ValueError, "approval/publication blocked"):
                self.validate()

    def test_reuses_existing_claim_source_and_canonical_identity_validation(self):
        for field, change in (
            ("identity", lambda d: d.update(driver_id="unknown")),
            ("evidence", lambda d: d["claims"][0].update(evidence=[])),
            ("reference", lambda d: d["claims"][0]["evidence"][0].update(source_id="unknown")),
            ("source URL", lambda d: d["sources"][0].update(source_url="https://example.org")),
            ("locator", lambda d: d["claims"][0]["evidence"][0].update(locator="")),
            ("uncited prose", lambda d: d.update(body="Unregistered assertion")),
        ):
            self.doc, self.review = fixture()
            change(self.doc)
            with self.subTest(field=field), self.assertRaises(ValueError):
                self.validate()

    def test_strict_review_shape_and_reference_coverage(self):
        for field, value in (("schema_version", True), ("stage", "verified"),
                             ("sources", {}), ("claim_reviews", {}), ("checks", {}),
                             ("issues", {}), ("media", "photo"), ("automatic_publish", True)):
            self.doc, self.review = fixture()
            self.review[field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                self.validate()
        for value in (None, [], {}):
            with self.subTest(value=value), self.assertRaises(ValueError):
                validate_review(self.doc, value, {"fixture-driver"}, AS_OF)

    def test_empty_research_cannot_be_approved(self):
        for field in ("claims", "sources", "sections"):
            self.doc[field] = []
        self.review["sources"] = {}
        self.review["claim_reviews"] = {}
        approve(self.doc, self.review)
        with self.assertRaisesRegex(ValueError, "at least one sourced claim"):
            self.validate()

    def test_unknown_issue_claim_and_duplicate_media_fail(self):
        self.review["issues"] = [{"claim_id": "unknown", "kind": "contradiction",
                                 "note": "Unresolved reference", "resolution": None}]
        with self.assertRaisesRegex(ValueError, "unknown dossier claim"):
            self.validate()
        self.review["issues"] = []
        self.review["media"] = [self.asset(), self.asset()]
        with self.assertRaisesRegex(ValueError, "duplicate asset"):
            self.validate()

    def test_missing_source_publication_date_is_explicit_not_invented(self):
        self.assertFalse(self.validate()["ready_for_publication"])
        for field, value in (("kind", "official"), ("publication_note", " "),
                             ("published_on", "2026-10-20"), ("published_on", "2026-02-30")):
            self.doc, self.review = fixture()
            self.review["sources"]["fixture-source"][field] = value
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                self.validate()

    def test_primary_secondary_and_community_are_distinct(self):
        for kind in ("primary", "secondary", "community"):
            self.doc, self.review = fixture()
            self.review["sources"]["fixture-source"]["kind"] = kind
            approve(self.doc, self.review)
            if kind == "community":
                with self.assertRaisesRegex(ValueError, "community-only"):
                    self.validate()
            else:
                self.assertTrue(self.validate()["ready_for_publication"])

    def test_author_self_review_machine_review_future_date_and_missing_rationale_fail(self):
        for field, value in (("reviewer", " fixture author "), ("actor", "automation"),
                             ("reviewed_on", "2026-10-21"), ("reviewed_on", "2026-10-18"),
                             ("note", " "), ("reviewer", None)):
            self.doc, self.review = fixture()
            approve(self.doc, self.review)
            self.review["claim_reviews"]["fixture-driver-record"][field] = value
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                self.validate()

    def test_content_evidence_locale_source_and_media_edits_invalidate_decisions(self):
        changes = [
            lambda d, r: d["claims"][0].update(statement="Changed original wording"),
            lambda d, r: d.update(locale="uk"),
            lambda d, r: d["sources"][0].update(title="Changed source title"),
            lambda d, r: d["claims"][0]["evidence"][0].update(locator="Changed locator"),
            lambda d, r: r["sources"]["fixture-source"].update(kind="secondary"),
            lambda d, r: r["issues"].append({"claim_id": None, "kind": "missing_evidence",
                                           "note": "New research gap", "resolution": None}),
            lambda d, r: r["media"].append(self.asset()),
        ]
        for index, change in enumerate(changes):
            self.doc, self.review = fixture()
            approve(self.doc, self.review)
            change(self.doc, self.review)
            with self.subTest(index=index), self.assertRaisesRegex(ValueError, "stale decision"):
                self.validate()

    def test_digest_is_independent_of_object_key_order_and_json_whitespace(self):
        digest = revision_digest(self.doc, self.review)
        reordered = dict(reversed(list(self.doc.items())))
        self.assertEqual(digest, revision_digest(reordered, self.review))

    def test_each_locale_requires_its_own_decisions(self):
        approve(self.doc, self.review)
        english = copy.deepcopy(self.review)
        self.doc["locale"] = "uk"
        self.review = english
        with self.assertRaisesRegex(ValueError, "stale decision"):
            self.validate()

    def test_gaps_and_unresolved_issues_block_approval(self):
        self.doc["gaps"] = ["Missing research"]
        approve(self.doc, self.review)
        with self.assertRaisesRegex(ValueError, "Missing research"):
            self.validate()
        self.doc, self.review = fixture()
        self.review["issues"] = [{"claim_id": "fixture-driver-record", "kind": "missing_evidence",
                                 "note": "Need exact passage", "resolution": None}]
        approve(self.doc, self.review)
        self.review["issues"][0]["resolution"] = None
        with self.assertRaisesRegex(ValueError, "Need exact passage"):
            self.validate()

    def test_contrary_evidence_requires_explicit_reviewed_resolution(self):
        self.doc["claims"][0]["evidence"].append(
            {"source_id": "fixture-source", "locator": "Contrary synthetic row", "supports": False})
        approve(self.doc, self.review)
        with self.assertRaisesRegex(ValueError, "contradiction issue"):
            self.validate()
        self.review["issues"] = [{"claim_id": "fixture-driver-record", "kind": "contradiction",
                                 "note": "Narrowed statement and attributed disagreement", "resolution": None}]
        approve(self.doc, self.review)
        self.assertTrue(self.validate()["ready_for_publication"])

    @staticmethod
    def asset():
        return {"source_page_url": "https://example.org/photo", "creator": "Fixture Photographer",
                "license_name": "Synthetic license (test only)", "license_url": "https://example.org/license",
                "attribution": "Synthetic attribution", "modifications": "None", "review": None}

    def test_media_reuse_requires_all_metadata_and_independent_review(self):
        for missing in ("creator", "license_name", "license_url", "attribution", "modifications", "review"):
            self.doc, self.review = fixture()
            self.review["media"] = [self.asset()]
            if missing != "review":
                self.review["media"][0][missing] = None
            approve(self.doc, self.review)
            if missing == "review":
                self.review["media"][0]["review"] = None
            with self.subTest(missing=missing), self.assertRaisesRegex(ValueError, "media"):
                self.validate()
        self.doc, self.review = fixture()
        self.review["media"] = [self.asset()]
        approve(self.doc, self.review)
        self.assertTrue(self.validate()["ready_for_publication"])

    def test_publication_is_explicit_and_cannot_predate_signoff(self):
        decision = approve(self.doc, self.review)
        self.review["publication"] = decision.copy()
        with self.assertRaisesRegex(ValueError, "only.*published"):
            self.validate()
        self.review["stage"] = "published"
        self.assertTrue(self.validate()["ready_for_publication"])
        self.review["publication"]["reviewed_on"] = "2026-10-19"
        with self.assertRaisesRegex(ValueError, "precede sign-off"):
            self.validate()
        self.review["publication"] = None
        with self.assertRaisesRegex(ValueError, "publication.*missing"):
            self.validate()

    def test_signoff_cannot_predate_claim_reviews(self):
        approve(self.doc, self.review)
        self.review["checks"]["signoff"]["reviewed_on"] = "2026-10-19"
        with self.assertRaisesRegex(ValueError, "precede individual"):
            self.validate()

    def test_senna_pilots_are_valid_separate_unapproved_locales(self):
        for locale in ("en", "uk"):
            dossier = load_json(PILOT / f"{locale}.dossier.json")
            review = load_json(PILOT / f"{locale}.review.json")
            report = validate_review(dossier, review, {"ayrton-senna"}, AS_OF)
            self.assertEqual(report["locale"], locale)
            self.assertFalse(report["ready_for_publication"])
            self.assertEqual(review["stage"], "evidence_review")
            self.assertIsNone(review["publication"])
            self.assertTrue(all(value is None for value in review["claim_reviews"].values()))
            self.assertTrue(all(value is None for value in review["checks"].values()))
            self.assertTrue(all(issue["resolution"] is None for issue in review["issues"]))
            self.assertEqual(review["media"], [])

    def test_cli_is_deterministic_read_only_and_require_ready_fails(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            archive = root / "f1db-json-splitted.zip"
            with zipfile.ZipFile(archive, "w") as bundle:
                bundle.writestr("f1db-seasons.json", json.dumps([{"year": 1950}]))
                bundle.writestr("f1db-drivers.json", json.dumps([{"id": "fixture-driver", "name": "Fixture"}]))
            checksum = root / "checksums_sha256.txt"
            checksum.write_text(hashlib.sha256(archive.read_bytes()).hexdigest() + "  " + archive.name + "\n")
            dossier = root / "dossier.json"
            review = root / "review.json"
            dossier.write_text(json.dumps(self.doc))
            review.write_text(json.dumps(self.review))
            before = {path.name: path.read_bytes() for path in root.iterdir()}
            cmd = [sys.executable, str(ROOT / "scripts/editorial_review.py"),
                   "--dossier", str(dossier), "--review", str(review), "--archive", str(archive),
                   "--checksums", str(checksum), "--as-of", AS_OF.isoformat()]
            def run(extra=()):
                return subprocess.run([*cmd, *extra], cwd=root, capture_output=True, text=True)
            first, second = run(), run()
            self.assertEqual(first.returncode, 0, first.stderr)
            self.assertEqual(first.stdout, second.stdout)
            self.assertFalse(json.loads(first.stdout)["ready_for_publication"])
            self.assertEqual(run(["--require-ready"]).returncode, 1)
            self.assertEqual(before, {path.name: path.read_bytes() for path in root.iterdir()})
            approve(self.doc, self.review)
            review.write_text(json.dumps(self.review))
            self.assertEqual(run(["--require-ready"]).returncode, 0)
            checksum.write_text("0" * 64 + "  " + archive.name + "\n")
            self.assertIn("mismatch", run().stderr)
            review.write_text('{"schema_version":1,"schema_version":2}')
            checksum.write_text(hashlib.sha256(archive.read_bytes()).hexdigest() + "  " + archive.name + "\n")
            self.assertIn("duplicate JSON key", run().stderr)


if __name__ == "__main__":
    unittest.main()
