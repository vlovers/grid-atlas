"""Offline preview must stay non-public and render user copy safely."""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("circuit_preview", ROOT / "scripts/render_circuit_editorial_preview.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CircuitPreviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.candidate = module.build_candidate(module.SOURCE.read_text(encoding="utf-8"),
                                               module.EVIDENCE.read_text(encoding="utf-8"))

    def test_five_circuits_two_languages(self):
        html = module.render(self.candidate)
        self.assertEqual(html.count("<article>"), 5)
        self.assertEqual(html.count('<section lang="en">'), 5)
        self.assertEqual(html.count('<section lang="uk">'), 5)
        self.assertIn('name="robots" content="noindex,nofollow"', html)
        self.assertIn("Draft · Unpublished", html)

    def test_html_injection_is_escaped(self):
        import copy
        candidate = copy.deepcopy(self.candidate)
        candidate["circuits"][0]["locales"]["en"]["paragraphs"][0] = '<img src=x onerror=alert(1)>'
        html = module.render(candidate)
        self.assertNotIn('<img src=x onerror=', html)
        self.assertIn('&lt;img src=x onerror=', html)

    def test_refuses_approved_or_published_state(self):
        import copy
        for key, value in (("stage", "approved"), ("publication_status", "published"),
                           ("approved_revision", "fake"), ("reviewed_by", "fake")):
            candidate = copy.deepcopy(self.candidate)
            candidate[key] = value
            with self.assertRaises(ValueError):
                module.render(candidate)


if __name__ == "__main__":
    unittest.main()
