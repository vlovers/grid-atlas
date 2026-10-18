#!/usr/bin/env python3
"""Apply versioned SQL migrations with checksums and a PostgreSQL advisory lock.

Requires psql and DATABASE_URL. No third-party Python packages.
"""
import hashlib
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "migrations"
LOCK_ID = 17021950


def run():
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is required")
    paths = sorted(MIGRATIONS.glob("[0-9][0-9][0-9][0-9]_*.sql"))
    if not paths:
        raise RuntimeError("No migrations found")
    # A single psql session holds both advisory lock and migration transaction.
    lines = [
        "\\set ON_ERROR_STOP on",
        "BEGIN;",
        f"SELECT pg_advisory_xact_lock({LOCK_ID});",
        """CREATE TABLE IF NOT EXISTS schema_migrations (
          version TEXT PRIMARY KEY,
          checksum TEXT NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$'),
          applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );""",
    ]
    for path in paths:
        name = path.name
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        # SQL file contents are from trusted, reviewed repository migrations.
        # psql's \gexec executes conditionally only for unapplied migrations.
        # We must not use \i unconditionally. A separate shell executor is simpler
        # but would drop the lock. Instead embed migration SQL conditionally via a
        # PostgreSQL stored procedure? PostgreSQL cannot run transaction control
        # inside DO. Use savepoint-free SQL via psql \gset and \if.
        lines.pop()
        lines.extend([
            f"SELECT CASE WHEN EXISTS (SELECT 1 FROM schema_migrations WHERE version = '{name}') THEN 'false' ELSE 'true' END AS should_apply \gset",
            "\\if :should_apply",
            path.read_text(encoding="utf-8").replace("BEGIN;", "", 1).rsplit("COMMIT;", 1)[0],
            f"INSERT INTO schema_migrations(version, checksum) VALUES ('{name}', '{digest}');",
            "\\endif",
        ])
    lines.append("COMMIT;")
    completed = subprocess.run(["psql", url, "-X", "-v", "ON_ERROR_STOP=1"],
                              input="\n".join(lines) + "\n", text=True)
    return completed.returncode


if __name__ == "__main__":
    try:
        sys.exit(run())
    except (OSError, RuntimeError) as exc:
        print(f"Migration error: {exc}", file=sys.stderr)
        sys.exit(1)
