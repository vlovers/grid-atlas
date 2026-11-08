"""Mock-only safety tests for branch cleanup. No GitHub network or deletion."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

PATH = Path(__file__).resolve().parents[1] / "scripts" / "cleanup-merged-branches.py"
spec = importlib.util.spec_from_file_location("cleanup_branches", PATH)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BranchCleanupTests(unittest.TestCase):
    def test_audit_retains_default_active_and_protected(self):
        branches = [
            {"name": "main", "commit": {"sha": "base"}, "protected": True},
            {"name": "feat/active", "commit": {"sha": "active"}, "protected": False},
            {"name": "release/locked", "commit": {"sha": "locked"}, "protected": True},
            {"name": "feat/merged", "commit": {"sha": "old"}, "protected": False},
            {"name": "feat/unmerged", "commit": {"sha": "unique"}, "protected": False},
        ]
        def api(path, method="GET"):
            if path == "repos/vlovers/grid-atlas":
                return {"default_branch": "main"}
            if path == "repos/vlovers/grid-atlas/branches/main":
                return {"commit": {"sha": "base"}}
            if "compare/" in path:
                return {"status": "behind", "ahead_by": 0} if path.endswith("...old") else {"status": "diverged", "ahead_by": 2}
            raise AssertionError(path)
        def paged(repo, resource):
            return branches if resource == "branches" else []
        with patch.object(module, "api", side_effect=api), patch.object(module, "paged", side_effect=paged), patch.object(module, "list_referenced_branches", return_value={"feat/active"}), patch.object(module, "ref_info", return_value={"commit": {"sha": "base"}}):
            entries = {item["name"]: item for item in module.audit("vlovers/grid-atlas")["entries"]}
        for name in ("main", "feat/active", "release/locked", "feat/unmerged"):
            self.assertEqual(entries[name]["status"], "retain")
        self.assertEqual(entries["feat/merged"]["status"], "candidate")

    def test_open_pr_head_and_base_are_protected(self):
        pull = {"head": {"ref": "feature", "repo": {"full_name": "vlovers/grid-atlas"}},
                "base": {"ref": "integration", "repo": {"full_name": "vlovers/grid-atlas"}}}
        with patch.object(module, "paged", return_value=[pull]):
            self.assertEqual(module.list_referenced_branches("vlovers/grid-atlas"), {"feature", "integration"})

    def test_apply_rejects_excess_targets_before_deletes(self):
        manifest = {"repository": "vlovers/grid-atlas", "base": "main", "base_sha": "base", "entries": [
            {"name": f"feat/{i}", "sha": str(i), "status": "candidate"} for i in range(11)
        ]}
        with patch.object(module, "api", return_value={"default_branch": "main"}), patch.object(module, "list_referenced_branches", return_value=set()), patch.object(module, "ref_info", return_value={"commit": {"sha": "base"}}):
            with self.assertRaisesRegex(RuntimeError, "exceed"):
                module.apply(manifest, {f"feat/{i}" for i in range(11)})

    def test_apply_skips_changed_sha(self):
        manifest = {"repository": "vlovers/grid-atlas", "base": "main", "base_sha": "base", "entries": [
            {"name": "feat/merged", "sha": "old", "status": "candidate"}
        ]}
        def api(path, method="GET"):
            self.assertNotEqual(method, "DELETE")
            return {"default_branch": "main"}
        with patch.object(module, "api", side_effect=api), patch.object(module, "list_referenced_branches", return_value=set()), patch.object(module, "ref_info", side_effect=lambda repo, name: {"protected": False, "commit": {"sha": "base" if name == "main" else "updated"}}):
            report = module.apply(manifest, {"feat/merged"})
        self.assertEqual(report["deleted"], [])
        self.assertEqual(len(report["skipped"]), 1)

    def test_apply_requires_explicit_candidate_allowlist(self):
        manifest = {"repository": "vlovers/grid-atlas", "base": "main", "base_sha": "base", "entries": [
            {"name": "feat/merged", "sha": "old", "status": "candidate"},
            {"name": "feat/other", "sha": "other", "status": "candidate"},
        ]}
        with patch.object(module, "api", return_value={"default_branch": "main"}), patch.object(module, "ref_info", return_value={"commit": {"sha": "base"}}), patch.object(module, "list_referenced_branches", return_value=set()):
            with self.assertRaisesRegex(RuntimeError, "approved"):
                module.apply(manifest, {"feat/not-in-manifest"})

    def test_apply_refuses_stale_main_before_delete(self):
        manifest = {"repository": "vlovers/grid-atlas", "base": "main", "base_sha": "base", "entries": [
            {"name": "feat/merged", "sha": "old", "status": "candidate"}
        ]}
        with patch.object(module, "api", return_value={"default_branch": "main"}), patch.object(module, "ref_info", return_value={"commit": {"sha": "changed"}}):
            with self.assertRaisesRegex(RuntimeError, "SHA changed"):
                module.apply(manifest, {"feat/merged"})

    def test_apply_deletes_only_verified_unchanged_ancestor(self):
        manifest = {"repository": "vlovers/grid-atlas", "base": "main", "base_sha": "base", "entries": [
            {"name": "feat/merged", "sha": "old", "status": "candidate"},
            {"name": "feat/not-approved", "sha": "unique", "status": "retain"}
        ]}
        deletes = []
        def api(path, method="GET"):
            if method == "DELETE":
                deletes.append(path)
                return {}
            return {"default_branch": "main"}
        with patch.object(module, "api", side_effect=api), patch.object(module, "list_referenced_branches", return_value=set()), patch.object(module, "ref_info", side_effect=lambda repo, name: {"protected": False, "commit": {"sha": "base" if name == "main" else "old"}}), patch.object(module, "compare", return_value={"status": "behind", "ahead_by": 0}):
            report = module.apply(manifest, {"feat/merged"})
        self.assertEqual(len(report["deleted"]), 1)
        self.assertEqual(deletes, ["repos/vlovers/grid-atlas/git/refs/heads/feat/merged"])


if __name__ == "__main__":
    unittest.main()
