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

from scripts.editorial_dossiers import (
    ROOT, TOPICS, attach_dossiers, load_dossiers, load_json, packet_profiles,
    quality_report, render_draft, validate_dossier, write_new_or_identical,
)

AS_OF = dt.date(2026, 10, 19)
IDS = {"alain-prost", "michael-schumacher"}


class DossierTests(unittest.TestCase):
    def setUp(self):
        self.doc = load_json(ROOT / "docs/editorial/dossiers/alain-prost.en.json")
        self.packet = {
            "batch_id": "fixture-batch", "source": {"name": "f1db", "release": "v2026.17.0"},
            "publication_status": "unpublished", "researcher_note": "preserve this",
            "profiles": [{
                "driver_id": "alain-prost", "source_display_name": "Curated name",
                "source": {"name": "f1db", "release": "v2026.17.0"},
                "statistical_observations": {"raw_result_points_sum": "10.5"},
                "career_result_chronology": [{"season": 1980}],
                "narrative_status": "needs_review",
                "drafts": {"en": "Existing hand-written draft", "uk": None},
                "claims": [{"statement": "Existing research"}],
                "media": [], "editorial_tasks": ["Keep task"],
            }],
        }

    def validate(self, doc=None):
        validate_dossier(self.doc if doc is None else doc, IDS, AS_OF)

    def attach(self, packet=None, doc=None):
        return attach_dossiers(self.packet if packet is None else packet,
                               {("alain-prost", "en"): self.doc if doc is None else doc}, IDS, AS_OF)

    def test_real_dossiers_are_unapproved_and_render_all_registered_claims(self):
        dossiers = load_dossiers((ROOT / "docs/editorial/dossiers").glob("*.json"), IDS, AS_OF)
        self.assertGreaterEqual(len(dossiers), 2)
        self.assertIn(("alain-prost", "en"), dossiers)
        self.assertIn(("alain-prost", "uk"), dossiers)
        self.assertIn(("michael-schumacher", "en"), dossiers)
        self.assertIn(("michael-schumacher", "uk"), dossiers)
        for doc in dossiers.values():
            text = render_draft(doc)
            self.assertIn("UNPUBLISHED RESEARCH DRAFT", text)
            for claim in doc["claims"]:
                self.assertEqual(text.count(claim["statement"]), 1)
            for source in doc["sources"]:
                self.assertIn(source["source_url"], text)

    def test_schema_rejects_wrong_shapes_and_unknown_fields(self):
        for value in (None, [], {}, {**self.doc, "automatic_approval": True}):
            with self.subTest(value=type(value)), self.assertRaises(ValueError):
                validate_dossier(value, IDS, AS_OF)
        for field, value in (("schema_version", True), ("driver_id", []), ("locale", []),
                             ("sources", None), ("claims", {}), ("sections", "text"),
                             ("gaps", [None]), ("title", " "), ("author", ""),
                             ("media", [{"license": "invented"}])):
            with self.subTest(field=field), self.assertRaises(ValueError):
                self.validate({**self.doc, field: value})

    def test_invalid_publication_and_approval_states_rejected_at_attachment(self):
        for field, value in (("status", "approved"), ("status", "published"),
                             ("publication_status", "published"), ("reviewer", "Robot"),
                             ("reviewed_at", "2026-10-19")):
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                self.attach(doc={**self.doc, field: value})
        self.doc["claims"][0]["status"] = "verified"
        with self.assertRaisesRegex(ValueError, "unapproved"):
            self.attach()

    def test_missing_and_invalid_references_rejected(self):
        for change in (
            lambda d: d["claims"][0].update(evidence=[]),
            lambda d: d["claims"][0]["evidence"][0].update(source_id="missing"),
            lambda d: d["claims"][0]["evidence"][0].update(locator=" "),
            lambda d: d["claims"][0]["evidence"][0].update(supports="true"),
            lambda d: d["sections"][0].update(claim_ids=["missing"]),
            lambda d: d["sections"].pop(),
            lambda d: d["claims"][0].update(statement=""),
            lambda d: d["claims"].append(copy.deepcopy(d["claims"][0])),
            lambda d: d["sources"].append(copy.deepcopy(d["sources"][0])),
            lambda d: d["sections"].append(copy.deepcopy(d["sections"][0])),
        ):
            doc = copy.deepcopy(self.doc)
            change(doc)
            with self.assertRaises(ValueError):
                self.validate(doc)

    def test_non_supporting_evidence_is_not_approval_or_corroboration(self):
        self.doc["claims"][0]["evidence"][1]["supports"] = False
        self.validate()
        report = quality_report([("alain-prost", "Name", "hash")],
                                {("alain-prost", "en"): self.doc}, {"en"}, "digest", AS_OF)
        profile = report["profiles"][0]
        cid = self.doc["claims"][0]["claim_id"]
        self.assertIn(cid, profile["contradictory_evidence_claims"])
        self.assertIn(cid, profile["single_source_group_claims"])
        self.assertFalse(profile["publishable"])
        self.doc["claims"][0]["evidence"][0]["supports"] = False
        with self.assertRaisesRegex(ValueError, "no supporting evidence"):
            self.validate()

    def test_bad_source_urls_dates_and_metadata_rejected(self):
        for field, value in (("source_url", "javascript:alert(1)"),
                             ("source_url", "https://example.org/"),
                             ("source_url", "https://user:pass@example.org/article"),
                             ("source_url", "https://example.org/a b"),
                             ("source_url", "https://[broken/article"),
                             ("accessed_on", "2026-02-30"), ("accessed_on", "20261019"),
                             ("accessed_on", "2027-01-01"), ("accessed_on", None),
                             ("publisher", ""), ("version", ""), ("independence_group", "")):
            doc = copy.deepcopy(self.doc)
            doc["sources"][0][field] = value
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                self.validate(doc)

    def test_same_publisher_is_not_independent_corroboration(self):
        for source in self.doc["sources"]:
            source["independence_group"] = "one-publisher"
        report = quality_report([("alain-prost", "Name", "hash")],
                                {("alain-prost", "en"): self.doc}, {"en"}, "digest", AS_OF)
        self.assertEqual(len(report["profiles"][0]["single_source_group_claims"]), len(self.doc["claims"]))

    def test_incomplete_fields_and_missing_locales_are_reported_not_approved(self):
        report = quality_report([("alain-prost", "Name", "hash")],
                                {("alain-prost", "en"): self.doc}, {"en", "uk"}, "digest", AS_OF)
        en, uk = report["profiles"]
        self.assertIn("full_name", en["missing_topics"])
        self.assertEqual(uk["dossier_status"], "missing")
        self.assertEqual(set(uk["missing_topics"]), set(TOPICS))
        self.assertTrue(all(not p["publishable"] for p in report["profiles"]))
        self.assertEqual(report, quality_report([("alain-prost", "Name", "hash")],
                         {("alain-prost", "en"): self.doc}, {"uk", "en"}, "digest", AS_OF))

    def test_empty_research_dossier_is_incomplete(self):
        self.doc.update(claims=[], sections=[], sources=[])
        self.validate()
        report = quality_report([("alain-prost", "Name", "hash")],
                                {("alain-prost", "en"): self.doc}, {"en"}, "digest", AS_OF)
        self.assertEqual(len(report["profiles"][0]["missing_topics"]), len(TOPICS))

    def test_packet_size_duplicates_identities_and_release(self):
        for change in (
            lambda p: p.update(profiles=[]),
            lambda p: p.update(profiles=p["profiles"] * 51),
            lambda p: p["profiles"].append(copy.deepcopy(p["profiles"][0])),
            lambda p: p["profiles"][0].update(driver_id="unknown-driver"),
            lambda p: p.update(publication_status="published"),
            lambda p: p["source"].update(release="latest"),
            lambda p: p["profiles"][0].update(narrative_status="verified"),
            lambda p: p["profiles"][0].update(drafts=[]),
        ):
            packet = copy.deepcopy(self.packet)
            change(packet)
            with self.assertRaises(ValueError):
                packet_profiles(packet, IDS)

    def test_accepts_fifty_profiles_and_per_driver_locale_targets(self):
        packet = copy.deepcopy(self.packet)
        ids = {f"fixture-{i}" for i in range(50)}
        packet["profiles"] = [{**self.packet["profiles"][0], "driver_id": did} for did in sorted(ids)]
        self.assertEqual(len(packet_profiles(packet, ids)), 50)
        report = quality_report([("alain-prost", "Name", "hash")], {}, {"en", "uk"},
                                "digest", AS_OF, targets={("alain-prost", "en")})
        self.assertEqual(report["locale_slots"], 1)

    def test_attachment_idempotency_and_exact_existing_content_preservation(self):
        before = copy.deepcopy(self.packet)
        once = self.attach()
        twice = self.attach(packet=once)
        self.assertEqual(once, twice)
        self.assertEqual(before, self.packet)
        attached = twice["profiles"][0].pop("editorial_dossiers")
        self.assertEqual(attached["en"], self.doc)
        self.assertEqual(twice, before)

    def test_conflicts_do_not_modify_existing_content(self):
        enriched = self.attach()
        enriched["profiles"][0]["editorial_dossiers"]["en"]["title"] = "Human edit"
        before = copy.deepcopy(enriched)
        with self.assertRaisesRegex(ValueError, "existing dossier conflict"):
            self.attach(packet=enriched)
        self.assertEqual(before, enriched)
        self.packet["profiles"][0]["drafts"] = {"uk": None}
        with self.assertRaisesRegex(ValueError, "outside packet"):
            self.attach()

    def test_duplicate_dossiers_json_keys_and_no_clobber_output(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for name in ("a.json", "b.json"):
                (root / name).write_text(json.dumps(self.doc))
            with self.assertRaisesRegex(ValueError, "duplicate driver/locale"):
                load_dossiers(root.glob("*.json"), IDS, AS_OF)
            bad = root / "bad.json"
            bad.write_text('{"status":"draft","status":"published"}')
            with self.assertRaisesRegex(ValueError, "duplicate JSON key"):
                load_json(bad)
            output = root / "packet.json"
            write_new_or_identical(output, "original")
            write_new_or_identical(output, "original")
            with self.assertRaisesRegex(ValueError, "output conflict"):
                write_new_or_identical(output, "changed")
            self.assertEqual(output.read_text(), "original")

    def test_cli_checksum_reproducibility_and_safe_attachment(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            archive = root / "f1db-json-splitted.zip"
            with zipfile.ZipFile(archive, "w") as bundle:
                bundle.writestr("f1db-seasons.json", json.dumps([{"year": 1950}]))
                bundle.writestr("f1db-drivers.json", json.dumps([
                    {"id": did, "name": did} for did in sorted(IDS)]))
            checksum = root / "checksums_sha256.txt"
            checksum.write_text(hashlib.sha256(archive.read_bytes()).hexdigest() + "  " + archive.name + "\n")
            packet = root / "packet.json"
            packet.write_text(json.dumps(self.packet))
            output = root / "output.json"
            dossiers = root / "dossiers"
            dossiers.mkdir()
            (dossiers / "prost.json").write_text(json.dumps(self.doc))
            cmd = [sys.executable, str(ROOT / "scripts/editorial_dossiers.py"),
                   "--archive", str(archive), "--checksums", str(checksum),
                   "--as-of", AS_OF.isoformat(), "--dossiers", str(dossiers),
                   "--packets", str(packet), "--enriched-output", str(output)]
            def run():
                return subprocess.run(cmd, capture_output=True, text=True, cwd=root)
            first, second = run(), run()
            self.assertEqual(first.returncode, 0, first.stderr)
            self.assertEqual(second.returncode, 0, second.stderr)
            self.assertEqual(first.stdout, second.stdout)
            self.assertEqual(json.loads(first.stdout)["drivers_audited"], 1)
            self.assertEqual(load_json(packet), self.packet)
            output.write_text("human edited output")
            self.assertNotEqual(run().returncode, 0)
            self.assertEqual(output.read_text(), "human edited output")
            checksum.write_text("0" * 64 + "  " + archive.name + "\n")
            self.assertIn("mismatch", run().stderr)


if __name__ == "__main__":
    unittest.main()
