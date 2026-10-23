"""Offline tests for the source-backed cross-era media identity audit."""
import hashlib
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    'cross_era_identity_audit', ROOT / 'scripts/audit-cross-era-identities.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def sha(row):
    return hashlib.sha256(json.dumps(
        row, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()


class CrossEraIdentityAuditTests(unittest.TestCase):
    def setUp(self):
        self.rows = {
            'driver': [{'id': 'known-driver', 'fullName': 'Known Driver'},
                       {'id': 'new-driver', 'fullName': 'New Driver'}],
            'constructor': [], 'circuit': [], 'race': [], 'layout': [],
        }
        self.snapshot = {
            'source': {'slug': 'f1db', 'release': module.RELEASE,
                       'artifact': module.ASSET, 'sha256': 'a' * 64},
            'subjects': [{'type': 'driver', 'id': 'known-driver',
                          'name': 'Known Driver',
                          'record_sha256': sha(self.rows['driver'][0])}],
            'layouts': [],
        }
        self.staging = {
            'schema_version': 1, 'lane': 'research_only', 'publication_allowed': False,
            'entries': [self.entry('research-known', 'known-driver'),
                        self.entry('research-new', 'new-driver')],
        }

    @staticmethod
    def entry(research_id, identifier):
        return {'id': research_id, 'subject': {'type': 'driver', 'id': identifier},
                'status': 'candidate', 'review': None, 'content_sha256': None,
                'delivery': {'local_path': None, 'remote_url': None}}

    def audit(self):
        return module.audit_cross_era_identities(
            self.staging, self.snapshot, self.rows, 'a' * 64)

    def test_source_rows_produce_review_only_proposals(self):
        report = self.audit()
        self.assertTrue(report['ok'])
        self.assertEqual(report['already_pinned'], 1)
        self.assertEqual(report['verified_unpinned'], 1)
        self.assertFalse(report['publication_allowed'])
        self.assertEqual(report['proposed_pilot_subjects'], [{
            'type': 'driver', 'id': 'new-driver', 'name': 'New Driver',
            'record_sha256': sha(self.rows['driver'][1])}])

    def test_unknown_canonical_id_fails(self):
        self.staging['entries'][1]['subject']['id'] = 'invented'
        with self.assertRaisesRegex(ValueError, 'unknown F1DB'):
            self.audit()

    def test_changed_pinned_record_fails(self):
        self.rows['driver'][0]['fullName'] = 'Changed Driver'
        with self.assertRaisesRegex(ValueError, 'Media identity snapshot changed'):
            self.audit()

    def test_duplicate_research_id_fails(self):
        self.staging['entries'][1]['id'] = 'research-known'
        with self.assertRaisesRegex(ValueError, 'duplicate staged'):
            self.audit()

    def test_unapproved_staging_required(self):
        self.staging['entries'][0]['review'] = {'approved': True}
        with self.assertRaisesRegex(ValueError, 'unapproved and undelivered'):
            self.audit()

    def test_wrong_archive_digest_fails(self):
        with self.assertRaisesRegex(ValueError, 'source release/checksum mismatch'):
            module.audit_cross_era_identities(
                self.staging, self.snapshot, self.rows, 'b' * 64)

    def test_duplicate_f1db_id_fails(self):
        self.rows['driver'].append(dict(self.rows['driver'][0]))
        with self.assertRaisesRegex(
                ValueError, 'Unknown canonical media identity|Duplicate or missing canonical'):
            self.audit()


if __name__ == '__main__':
    unittest.main()
