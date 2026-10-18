#!/usr/bin/env python3
"""Exercise manifest identity resolution in an isolated real PostgreSQL schema."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import uuid

ROOT = Path(__file__).resolve().parents[3]


class IdentityIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.url = os.environ["DATABASE_URL"]
        cls.schema = "identity_test_" + uuid.uuid4().hex
        cls.env = {**os.environ, "PGOPTIONS": f"-c search_path={cls.schema}"}
        cls.psql(f"CREATE SCHEMA {cls.schema}", env=os.environ)
        cls.addClassCleanup(cls.psql, f"DROP SCHEMA {cls.schema} CASCADE", env=os.environ)
        subprocess.run([sys.executable, "packages/database/scripts/migrate.py"],
                       cwd=ROOT, env=cls.env, check=True, capture_output=True, text=True)
        cls.psql("""
          INSERT INTO data_sources(slug,homepage_url,attribution) VALUES
            ('identity-fixture','https://example.org','Synthetic test only'),
            ('decoy','https://example.org','Synthetic test only');
          INSERT INTO external_identities(source_id,entity_kind,external_id)
          SELECT s.id,k.kind,v.ident FROM data_sources s
          CROSS JOIN (VALUES ('constructor'),('entrant')) k(kind)
          CROSS JOIN (VALUES ('alpha'),('beta')) v(ident);
          INSERT INTO historical_constructors(external_identity_id,display_name)
            SELECT id,external_id FROM external_identities WHERE entity_kind='constructor';
          INSERT INTO historical_entrants(external_identity_id,display_name)
            SELECT id,external_id FROM external_identities WHERE entity_kind='entrant';
          INSERT INTO external_identities(source_id,entity_kind,external_id)
            SELECT id,'constructor','unmaterialized' FROM data_sources WHERE slug='identity-fixture';
          INSERT INTO external_identities(source_id,entity_kind,external_id)
            SELECT id,'constructor','constructor-only' FROM data_sources WHERE slug='identity-fixture';
          INSERT INTO historical_constructors(external_identity_id,display_name)
            SELECT id,external_id FROM external_identities WHERE external_id='constructor-only';
        """)

    @classmethod
    def psql(cls, sql, env=None):
        return subprocess.run(["psql", cls.url, "-XAt", "-v", "ON_ERROR_STOP=1"],
                              input=sql, env=env or cls.env, text=True,
                              capture_output=True, check=True).stdout.strip()

    def claim(self, kind="constructor"):
        return dict(entity_type=kind, relation_type="renamed_to", effective_year=2000,
                    subject=dict(source_slug="identity-fixture", external_id="alpha"),
                    object=dict(source_slug="identity-fixture", external_id="beta"),
                    source_url="https://example.org/synthetic", source_title="Synthetic fixture",
                    source_publisher="Integration tests", evidence_note="No historical assertion",
                    accessed_at="2026-10-19")

    def preflight(self, claims):
        with tempfile.TemporaryDirectory() as folder:
            manifest = Path(folder) / "claims.json"
            manifest.write_text(json.dumps(claims), encoding="utf-8")
            return subprocess.run([sys.executable,
                                   "packages/database/scripts/audit-lineage-manifest-identities.py",
                                   str(manifest)], cwd=ROOT, env=self.env, text=True, capture_output=True)

    def counts(self):
        return self.psql("""SELECT (SELECT count(*) FROM external_identities),
          (SELECT count(*) FROM historical_constructors), (SELECT count(*) FROM historical_entrants),
          (SELECT count(*) FROM historical_lineage_claims),
          (SELECT count(*) FROM historical_entrant_lineage_claims),
          (SELECT count(*) FROM information_schema.tables WHERE table_schema=current_schema());""")

    def test_source_and_kind_qualified_resolution_is_read_only(self):
        before = self.counts()
        result = self.preflight([self.claim(), self.claim("entrant")])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Resolved 4 distinct endpoints", result.stdout)
        self.assertEqual(before, self.counts())

    def test_other_source_with_matching_id_and_name_cannot_resolve(self):
        claim = self.claim()
        claim["subject"]["source_slug"] = "absent-source"
        result = self.preflight([claim])
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("missing or ambiguous", result.stderr)

    def test_identity_without_historical_entity_cannot_resolve(self):
        claim = self.claim()
        claim["object"]["external_id"] = "unmaterialized"
        result = self.preflight([claim])
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("missing or ambiguous", result.stderr)

    def test_constructor_identity_cannot_resolve_as_entrant(self):
        claim = self.claim("entrant")
        claim["object"]["external_id"] = "constructor-only"
        result = self.preflight([claim])
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("missing or ambiguous", result.stderr)

    def test_mixed_valid_and_missing_endpoints_fail_without_changes(self):
        before = self.counts()
        invalid = self.claim("entrant")
        invalid["object"]["external_id"] = "missing"
        result = self.preflight([self.claim(), invalid])
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("no claims changed", result.stderr)
        self.assertEqual(before, self.counts())


if __name__ == "__main__":
    unittest.main()
