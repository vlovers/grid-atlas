import copy
import unittest
from scripts.editorial_release import MANIFEST, PILOTS, ROOT, audit_release, repository_path
from scripts.editorial_dossiers import load_json
from scripts.editorial_review import validate_review, revision_digest
import datetime as dt


class EditorialReleaseTests(unittest.TestCase):
    def setUp(self):
        self.manifest = load_json(MANIFEST)

    def test_ten_valid_but_unsigned_locales(self):
        report = audit_release(self.manifest, PILOTS)
        self.assertEqual(len(report['profiles']), 10)
        self.assertEqual(report['ready_locales'], 0)
        self.assertFalse(report['public_content_written'])
        for row in report['profiles']:
            self.assertGreaterEqual(row['claims'], 6)
            self.assertGreaterEqual(row['sections'], 5)
            self.assertTrue(row['blockers'])
            self.assertEqual(len(row['revision_sha256']), 64)

    def test_unknown_duplicate_and_missing_locale_block_release(self):
        for mutate in [lambda x: x['drivers'].append(x['drivers'][0]),
                       lambda x: x['drivers'][0].update(driver_id='unknown'),
                       lambda x: x['drivers'][0]['locales'].pop('uk')]:
            value = copy.deepcopy(self.manifest)
            mutate(value)
            with self.assertRaises(ValueError):
                audit_release(value, PILOTS)

    def test_canonical_identity_required(self):
        with self.assertRaises(ValueError):
            audit_release(self.manifest, set())

    def test_path_escape_not_allowed(self):
        for path in ['../outside.json', '/etc/passwd', 'docs/editorial/../../../README.md']:
            with self.assertRaises(ValueError):
                repository_path(path)

    def test_all_actual_dossiers_reject_faked_lifecycle_and_automation(self):
        for pilot in self.manifest['drivers']:
            for locale, refs in pilot['locales'].items():
                d = load_json(ROOT / refs['dossier'])
                r = load_json(ROOT / refs['review'])
                r['stage'] = 'approved'
                with self.subTest(driver=pilot['driver_id'], locale=locale), self.assertRaises(ValueError):
                    validate_review(d, r, PILOTS, dt.date(2026, 10, 21))
                r['stage'] = 'evidence_review'
                r['checks']['signoff'] = dict(actor='automation', reviewer='CI', reviewed_on='2026-10-21', revision_sha256=revision_digest(d, r), note='not human approval')
                with self.assertRaises(ValueError):
                    validate_review(d, r, PILOTS, dt.date(2026, 10, 21))

    def test_interpretations_cannot_disappear_from_manifest(self):
        self.manifest['drivers'][0]['locales']['en']['attributed_interpretation_claims'] = []
        with self.assertRaises(ValueError):
            audit_release(self.manifest, PILOTS)
