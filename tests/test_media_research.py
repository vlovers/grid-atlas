import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / f'{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


commons = load('discover-commons-media')
identities = load('verify-media-identities')


class MediaResearchTests(unittest.TestCase):
    def test_metadata_is_plain_text_candidate_only_and_does_not_copy_binary_url(self):
        payload = {'query': {'pages': [{'title': 'File:Synthetic.jpg', 'revisions': [{'revid': 1}], 'imageinfo': [{
            'descriptionurl': 'https://commons.wikimedia.org/wiki/File:Synthetic.jpg', 'url': 'https://upload.wikimedia.org/not-downloaded.jpg',
            'sha1': 'a' * 40, 'timestamp': '2026-10-20T00:00:00Z', 'mime': 'image/jpeg', 'width': 40, 'height': 30,
            'extmetadata': {'Artist': {'value': '<a href="https://example.org/author">Fixture Creator</a>'},
                            'Credit': {'value': '<a href="javascript:alert(1)">Untrusted</a>'}}
        }]}]}}
        output = commons.selected_metadata(payload, '2026-10-20')
        self.assertEqual(output[0]['metadata']['Artist']['text'], 'Fixture Creator')
        self.assertEqual(output[0]['metadata']['Credit']['https_links'], [])
        self.assertEqual(output[0]['status'], 'candidate')
        self.assertIsNone(output[0]['review'])
        self.assertNotIn('upload.wikimedia.org', json.dumps(output))
        self.assertEqual(output, commons.selected_metadata(payload, '2026-10-20'))

    def test_missing_or_api_error_metadata_fails(self):
        for payload in ({'error': {'code': 'maxlag'}}, {}, {'query': {'pages': [{'title': 'Missing', 'missing': True}]}}):
            with self.assertRaises(ValueError):
                commons.selected_metadata(payload, '2026-10-20')

    def test_snapshot_rejects_wrong_subject_and_wrong_historical_layout(self):
        driver = {'id': 'fixture-driver', 'name': 'Synthetic driver'}
        checksum = hashlib.sha256(json.dumps(driver, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
        snapshot = {'source': {'slug': 'f1db', 'release': identities.RELEASE, 'artifact': identities.ASSET, 'sha256': 'a'*64},
                    'subjects': [{'type': 'driver', 'id': 'fixture-driver', 'name': 'Synthetic driver', 'record_sha256': checksum}],
                    'layouts': [{'id': 'historic', 'circuit_id': 'fixture-circuit', 'race_ids': ['1']}]}
        collections = {'driver': [driver], 'layout': [{'id': 'historic', 'circuitId': 'fixture-circuit'}],
                       'race': [{'id': 1, 'circuitId': 'fixture-circuit', 'circuitLayoutId': 'historic'}]}
        identities.verify_snapshot(snapshot, collections, 'a'*64)
        changed = copy.deepcopy(snapshot); changed['subjects'][0]['id'] = 'invented'
        with self.assertRaisesRegex(ValueError, 'Unknown canonical'):
            identities.verify_snapshot(changed, collections, 'a'*64)
        changed = copy.deepcopy(collections); changed['race'][0]['circuitLayoutId'] = 'modern'
        with self.assertRaisesRegex(ValueError, 'Historical race/circuit/layout mismatch'):
            identities.verify_snapshot(snapshot, changed, 'a'*64)
        with self.assertRaisesRegex(ValueError, 'checksum mismatch'):
            identities.verify_snapshot(snapshot, collections, 'b'*64)


if __name__ == '__main__':
    unittest.main()
