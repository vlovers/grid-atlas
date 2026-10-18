# Versioned migrations (experimental)

Migration runner reads numbered SQL files, uses PostgreSQL transaction advisory lock, records SHA-256 of applied migrations and rejects altered migration bytes. It supports clean installations and repeat invocations. Apply new SQL files in version order.

Migration files are reviewed trusted code. Do not run user-controlled SQL. Do not modify an existing migration after application.

The current SQL migrations contain BEGIN/COMMIT; the runner strips those wrappers and runs them inside one locked transaction. All future migrations must be transaction-compatible.

Validation must cover clean database, repeat run, appended migration, changed checksum and concurrent invocations before production use.
