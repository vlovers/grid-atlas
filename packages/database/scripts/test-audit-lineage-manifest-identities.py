#!/usr/bin/env python3
"""Regression tests for fail-closed lineage identity preflight (no PostgreSQL needed)."""
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import subprocess

SCRIPT = Path(__file__).with_name("audit-lineage-manifest-identities.py")
spec = importlib.util.spec_from_file_location("lineage_identity_preflight", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
MANIFEST = Path(__file__).resolve().parents[3] / "docs/data-sources/manifests/silverstone-2021.proposed.json"


class PreflightTests(unittest.TestCase):
    def test_valid_manifest_invokes_psql_with_rollback(self):
        with patch.dict(os.environ, {"DATABASE_URL": "postgresql://example/test"}):
            with patch.object(module.subprocess, "run", return_value=subprocess.CompletedProcess([], 0)) as run:
                module.main(MANIFEST)
        args, kwargs = run.call_args
        self.assertEqual(args[0][0], "psql")
        self.assertIn("ROLLBACK;", kwargs["input"])
        self.assertIn("RAISE EXCEPTION", kwargs["input"])
        self.assertIn("resolved_count", kwargs["input"])

    def test_missing_database_url_fails_without_psql(self):
        with patch.dict(os.environ, {}, clear=True):
            with patch.object(module.subprocess, "run") as run:
                with self.assertRaisesRegex(ValueError, "DATABASE_URL"):
                    module.main(MANIFEST)
                run.assert_not_called()

    def test_failed_identity_resolution_fails_closed(self):
        with patch.dict(os.environ, {"DATABASE_URL": "postgresql://example/test"}):
            with patch.object(module.subprocess, "run", return_value=subprocess.CompletedProcess([], 3)):
                with self.assertRaisesRegex(RuntimeError, "Identity preflight failed"):
                    module.main(MANIFEST)

    def test_invalid_manifest_fails_before_psql(self):
        claim = json.loads(MANIFEST.read_text(encoding="utf-8"))[0]
        claim["subject"] = claim["object"]
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "invalid.json"
            path.write_text(json.dumps([claim]), encoding="utf-8")
            with patch.dict(os.environ, {"DATABASE_URL": "postgresql://example/test"}):
                with patch.object(module.subprocess, "run") as run:
                    with self.assertRaisesRegex(ValueError, "self edge"):
                        module.main(path)
                    run.assert_not_called()

    def test_empty_manifest_does_not_connect(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "empty.json"
            path.write_text("[]", encoding="utf-8")
            with patch.dict(os.environ, {}, clear=True):
                with self.assertRaisesRegex(ValueError, "DATABASE_URL"):
                    module.main(path)
            with patch.dict(os.environ, {"DATABASE_URL": "postgresql://example/test"}):
                with patch.object(module.subprocess, "run") as run:
                    module.main(path)
                    run.assert_not_called()


if __name__ == "__main__":
    unittest.main()
