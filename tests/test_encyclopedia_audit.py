import importlib.util
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('encyclopedia_audit', Path(__file__).resolve().parents[1] / 'scripts/audit-encyclopedia.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class AuditResponseTests(unittest.TestCase):
    def test_distinguishes_streamed_fallback_from_rendered_profile(self):
        parser = audit.ProfileHTML()
        stream = 'e:' + json.dumps(['$', 'section', None, {'data-testid': 'missing-entity'}]) + '\n'
        parser.feed('<meta name="robots" content="noindex, follow"><script>self.__next_f.push('
                    + json.dumps([1, stream]) + ')</script>')
        self.assertTrue(parser.noindex)
        self.assertEqual(parser.markers, set())
        self.assertEqual(parser.streamed_markers(), {'missing-entity'})

    def test_names_cannot_impersonate_missing_ui_and_archive_links_are_visible_only(self):
        parser = audit.ProfileHTML()
        stream = 'e:' + json.dumps(['$', 'h1', None, {'children': 'missing-entity'}]) + '\n'
        parser.feed('<section data-testid="identity-facts"><h1>missing-entity</h1>'
                    '<a href="/en/drivers/1">Driver</a></section>'
                    '<script>self.__next_f.push(' + json.dumps([1, stream]) + ')</script>')
        self.assertFalse(parser.noindex)
        self.assertEqual(parser.streamed_markers(), set())
        self.assertEqual(parser.markers, {'identity-facts'})
        self.assertEqual(parser.links, {'/en/drivers/1'})
