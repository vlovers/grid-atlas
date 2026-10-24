import datetime as dt
import json
from pathlib import Path
import shutil
import tempfile
import unittest

from scripts.audit_driver_biography_batch2 import BATCH, audit, checked_assertion
from scripts.editorial_dossiers import load_json
from scripts.editorial_review import validate_review
from scripts.export_approved_editorial import export


class BiographyBatch2Tests(unittest.TestCase):
    def changed_batch(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        target = Path(directory.name) / 'batch'
        shutil.copytree(BATCH, target)
        return target

    def mutate(self, batch, relative, change):
        path = batch / relative
        value = load_json(path)
        change(value)
        path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

    def test_twenty_substantial_bilingual_drafts_share_claims_and_never_claim_archive_verification_offline(self):
        report = audit()
        self.assertEqual(len(report['profiles']), 10)
        self.assertGreaterEqual(report['en_words'], 5500)
        self.assertGreaterEqual(report['uk_words'], 4500)
        self.assertGreaterEqual(report['paired_claims'], 120)
        self.assertFalse(report['publication_allowed'])
        self.assertFalse(report['archive_identity_checked'])
        self.assertEqual(report['statistics_checked'], 0)
        self.assertEqual(report['human_approved_dossiers'], 0)

    def test_recorded_evidence_binds_the_current_manuscript_revisions(self):
        current = audit()
        recorded = load_json(BATCH / 'archive-validation.json')
        for field in ['profiles', 'en_words', 'uk_words', 'paired_claims', 'statistics_assertions']:
            self.assertEqual(recorded[field], current[field], field)

    def test_missing_named_evidence_file_is_not_a_working_locator(self):
        batch = self.changed_batch()
        def change(doc):
            evidence = next(e for c in doc['claims'] for e in c['evidence'] if e['source_id'] == 'f1db')
            evidence['locator'] = 'see missing-crosscheck.json for record evidence'
        self.mutate(batch, 'dossiers/jim-clark.en.json', change)
        with self.assertRaisesRegex(ValueError, 'missing local evidence reference'):
            audit(batch)

    def test_existing_exporter_blocks_every_real_locale_revision(self):
        for path in (BATCH / 'dossiers').glob('*.json'):
            doc = load_json(path)
            review = load_json(BATCH / 'reviews' / path.name.replace('.json', '.review.json'))
            with self.subTest(file=path.name), self.assertRaisesRegex(ValueError, 'independent approval'):
                export(doc, review, {doc['driver_id']}, dt.date(2026, 10, 24))

    def test_machine_actor_cannot_fill_a_human_review_slot(self):
        doc = load_json(BATCH / 'dossiers/jim-clark.en.json')
        review = load_json(BATCH / 'reviews/jim-clark.en.review.json')
        claim = doc['claims'][0]['claim_id']
        review['claim_reviews'][claim] = {'actor': 'ai', 'reviewer': 'automated test',
            'reviewed_on': '2026-10-24', 'revision_sha256': 'a' * 64, 'note': 'must be rejected'}
        with self.assertRaisesRegex(ValueError, 'only human decisions'):
            validate_review(doc, review, {doc['driver_id']}, dt.date(2026, 10, 24))

    def test_translation_cannot_drop_or_reassign_evidence(self):
        batch = self.changed_batch()
        self.mutate(batch, 'dossiers/jim-clark.uk.json', lambda doc: doc['claims'][0]['evidence'][0].update(locator='Different passage'))
        # Keep the readable draft in sync: the failure must be evidence parity, not a stale render.
        with self.assertRaisesRegex(ValueError, 'EN/UK claims/evidence diverged'):
            audit(batch)

    def test_unregistered_prose_in_readable_copy_fails(self):
        batch = self.changed_batch()
        path = batch / 'manuscripts/jim-clark.en.md'
        path.write_text(path.read_text() + '\nAn unsupported extra paragraph.\n')
        with self.assertRaisesRegex(ValueError, 'uncited prose'):
            audit(batch)

    def test_promoting_sidecar_without_review_cannot_make_batch_pass(self):
        batch = self.changed_batch()
        self.mutate(batch, 'reviews/jim-clark.en.review.json', lambda doc: doc.update(stage='approved'))
        with self.assertRaisesRegex(ValueError, 'stay in evidence review'):
            audit(batch)

    def test_missing_locale_and_future_source_dates_fail(self):
        batch = self.changed_batch()
        (batch / 'dossiers/jim-clark.uk.json').unlink()
        with self.assertRaisesRegex(ValueError, 'twenty'):
            audit(batch)
        batch = self.changed_batch()
        self.mutate(batch, 'dossiers/jim-clark.en.json', lambda doc: doc['sources'][0].update(accessed_on='2027-01-01'))
        with self.assertRaisesRegex(ValueError, 'future'):
            audit(batch)

    def test_statistics_cannot_reference_unregistered_prose(self):
        batch = self.changed_batch()
        self.mutate(batch, 'statistics-assertions.json', lambda doc: doc['assertions'][0].update(claim_ids=['invented-claim']))
        with self.assertRaisesRegex(ValueError, 'unknown claim'):
            audit(batch)

    def test_archive_assertions_reject_false_points_and_missing_records(self):
        case = {'id': 'test-points', 'driver_id': 'synthetic', 'claim_ids': ['synthetic-claim'],
                'table': 'seasons-driver-standings', 'where': {'driverId': 'synthetic'},
                'select': ['points'], 'expected': [[72]]}
        self.assertEqual(checked_assertion(case, [{'driverId': 'synthetic', 'points': 72}])['observed'], [[72]])
        with self.assertRaisesRegex(ValueError, 'archive mismatch'):
            checked_assertion(case, [{'driverId': 'synthetic', 'points': 71.5}])
        with self.assertRaisesRegex(ValueError, 'archive mismatch'):
            checked_assertion(case, [{'driverId': 'another', 'points': 72}])

    def test_dns_entry_exists_but_is_not_a_race_start(self):
        case = {'id': 'dns-record', 'driver_id': 'synthetic', 'claim_ids': ['synthetic-claim'],
                'table': 'races-race-results', 'where': {'driverId': 'synthetic'},
                'select': ['positionText', 'laps'], 'expected': [['DNS', None]]}
        result = checked_assertion(case, [{'driverId': 'synthetic', 'positionText': 'DNS', 'laps': None}])
        self.assertEqual(result['matched_records'], 1)
        false_absence = {**case, 'select': 'count', 'expected': 0}
        with self.assertRaisesRegex(ValueError, 'archive mismatch'):
            checked_assertion(false_absence, [{'driverId': 'synthetic', 'positionText': 'DNS', 'laps': None}])

    def test_shared_drive_rows_do_not_become_two_wins(self):
        case = {'id': 'shared-result', 'driver_id': 'synthetic', 'claim_ids': ['synthetic-claim'],
                'table': 'races-race-results', 'where': {'driverId': 'synthetic', 'positionNumber': 1},
                'select': 'distinct_races', 'expected': 1}
        rows = [{'raceId': 1, 'driverId': 'synthetic', 'positionNumber': 11},
                {'raceId': 1, 'driverId': 'synthetic', 'positionNumber': 1}]
        self.assertEqual(checked_assertion(case, rows)['observed'], 1)
        with self.assertRaisesRegex(ValueError, 'archive mismatch'):
            checked_assertion({**case, 'expected': 2}, rows)

    def test_unknown_archive_fields_fail_instead_of_becoming_empty(self):
        case = {'id': 'typo', 'driver_id': 'synthetic', 'claim_ids': ['synthetic-claim'],
                'table': 'drivers', 'where': {'driverID': 'synthetic'}, 'select': 'count', 'expected': 0}
        with self.assertRaisesRegex(ValueError, 'unknown archive filter'):
            checked_assertion(case, [{'id': 'synthetic'}])


if __name__ == '__main__':
    unittest.main()
