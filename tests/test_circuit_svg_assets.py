"""Offline integrity and rights checks for pinned historical circuit contours."""
import hashlib
import json
from pathlib import Path
import re
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "apps/web/public/circuit-layouts"
MANIFEST = ROOT / "apps/web/src/components/circuit-layout-manifest.json"
SVG_NAMESPACE = "{http://www.w3.org/2000/svg}"

class PinnedCircuitArtTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.entries = json.loads(MANIFEST.read_text(encoding="utf-8"))

    def test_complete_one_to_one_asset_identity(self):
        self.assertEqual(len(self.entries), 160)
        ids = [entry["layout_id"] for entry in self.entries]
        self.assertEqual(len(set(ids)), 160)
        self.assertEqual(
            {entry["path"].removeprefix("/circuit-layouts/") for entry in self.entries},
            {file.name for file in ASSETS.glob("*.svg")},
        )
        self.assertEqual(len(list(ASSETS.glob("*.svg"))), 160)
        for entry in self.entries:
            self.assertEqual(entry["path"], f'/circuit-layouts/{entry["layout_id"]}.svg')
            self.assertRegex(entry["layout_id"], r"^[a-z0-9-]+$")
            self.assertEqual(entry["license"], "CC-BY-4.0")
            self.assertEqual(entry["author"], "Jules Roy")
            self.assertIn("/blob/v2026.17.0/src/assets/circuits/white-outline/", entry["source_url"])
            self.assertRegex(entry["source_git_blob_sha"], r"^[a-f0-9]{40}$")

    def test_byte_identical_pinned_assets_and_svg_allowlist(self):
        for entry in self.entries:
            with self.subTest(layout=entry["layout_id"]):
                payload = (ASSETS / f'{entry["layout_id"]}.svg').read_bytes()
                git_sha = hashlib.sha1(
                    f"blob {len(payload)}\\0".replace("\\0", "\0").encode() + payload
                ).hexdigest()
                self.assertEqual(git_sha, entry["source_git_blob_sha"])
                source = payload.decode("utf-8")
                self.assertNotRegex(source, r"(?i)<script|foreignObject|<image|href\s*=|on[a-z]+\s*=|url\(|@import|<style")
                root = ET.fromstring(payload)
                self.assertEqual(root.tag, SVG_NAMESPACE + "svg")
                self.assertTrue(list(root))
                for el in root.iter():
                    self.assertIn(el.tag, {SVG_NAMESPACE + "svg", SVG_NAMESPACE + "path"})
                    for attr, value in el.attrib.items():
                        self.assertIn(attr, {"width", "height", "style", "d", "xml:space", "fill", "transform", "stroke", "stroke-width",
                                             "{http://www.w3.org/XML/1998/namespace}space"})
                        self.assertNotIn("javascript:", value.lower())
                    if el.tag.endswith("path"):
                        self.assertTrue(el.get("d"))

if __name__ == "__main__":
    unittest.main()
