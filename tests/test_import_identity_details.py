import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'packages/data-importer'))
from import_identity_details import read_details, build_sql
from import_seasons import ASSET


class IdentityDetailsTests(unittest.TestCase):
    def fixture(self, circuit_changes=None, **changes):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        root = Path(temp.name)
        archive = root / ASSET
        driver = {'id': 'driver', 'fullName': 'Driver, One', 'dateOfBirth': '1990-01-02',
                  'nationalityCountryId': 'test', 'permanentNumber': '0',
                  'totalChampionshipWins': 99, 'abbreviation': None, **changes}
        with zipfile.ZipFile(archive, 'w') as bundle:
            for name, rows in {
                'seasons': [{'year': 1950}], 'countries': [{'id': 'test', 'name': 'Test Country'}],
                'drivers': [driver], 'constructors': [{'id': 'constructor', 'countryId': 'test'}],
                'circuits': [{'id': 'circuit', 'placeName': 'Test City', 'length': 9.9, 'turns': 99, **(circuit_changes or {})}],
            }.items():
                bundle.writestr(f'f1db-{name}.json', json.dumps(rows))
        checksums = root / 'checksums.txt'
        checksums.write_text(hashlib.sha256(archive.read_bytes()).hexdigest() + '  ' + ASSET)
        return archive, checksums

    def test_allowlist_preserves_zero_null_and_country_names(self):
        rows, digest = read_details(*self.fixture())
        fields = json.loads(rows[0][-1])
        self.assertEqual(fields['permanent_number'], '0')
        self.assertEqual(fields['nationality'], 'Test Country')
        self.assertNotIn('abbreviation', fields)
        self.assertNotIn('totalChampionshipWins', fields)
        self.assertNotIn('length', json.loads(rows[2][-1]))
        self.assertNotIn('turns', json.loads(rows[2][-1]))
        self.assertEqual(rows[0][3], 'f1db-drivers.json#id=driver')
        sql = build_sql(rows, digest)
        self.assertIn('o.content_hash=st.content_hash', sql)
        self.assertIn('Missing or mismatched entity observation', sql)
        self.assertIn('ON CONFLICT(external_identity_id) DO UPDATE', sql)

    def test_invalid_dates_numbers_and_unresolved_country_rejected(self):
        for changes in [{'dateOfBirth': '1990-02-30'}, {'permanentNumber': 0},
                        {'permanentNumber': '100'}, {'permanentNumber': '-1'},
                        {'nationalityCountryId': 'unknown'}, {'fullName': ''}]:
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                read_details(*self.fixture(**changes))

    def test_checksum_mismatch_rejected_before_fields_are_read(self):
        archive, checksum = self.fixture()
        checksum.write_text('0' * 64 + '  ' + ASSET)
        with self.assertRaisesRegex(ValueError, 'mismatch'):
            read_details(archive, checksum)

    def test_circuit_coordinates_and_previous_names_preserve_source_values(self):
        rows, _ = read_details(*self.fixture(circuit_changes={
            'latitude': 0, 'longitude': -180, 'direction': 'ANTI_CLOCKWISE',
            'previousNames': ['Old Name', 'Earlier Name']}))
        fields = json.loads(rows[2][-1])
        self.assertEqual(fields['latitude'], 0)
        self.assertEqual(fields['longitude'], -180)
        self.assertEqual(fields['direction'], 'ANTI_CLOCKWISE')
        self.assertEqual(fields['previous_names'], 'Old Name · Earlier Name')
        self.assertNotIn('length', fields)
        self.assertNotIn('turns', fields)

    def test_invalid_circuit_coordinates_and_names_rejected(self):
        for changes in [{'latitude': True}, {'latitude': 90.01}, {'longitude': -180.1},
                        {'latitude': '0'}, {'latitude': float('nan')},
                        {'longitude': float('inf')}, {'previousNames': 'Old Name'},
                        {'previousNames': ['']}, {'previousNames': [5]}]:
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                read_details(*self.fixture(circuit_changes=changes))

    def test_missing_names_and_coordinates_remain_unknown(self):
        rows, _ = read_details(*self.fixture(circuit_changes={
            'latitude': None, 'longitude': None, 'previousNames': []}))
        fields = json.loads(rows[2][-1])
        for key in ['latitude', 'longitude', 'previous_names']:
            self.assertNotIn(key, fields)
