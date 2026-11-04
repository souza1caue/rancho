CREATE TABLE IF NOT EXISTS accounts (
 id TEXT PRIMARY KEY,
 username TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 salt TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 recovery_hash TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY,
 account_id TEXT NOT NULL REFERENCES accounts(id),
 expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS farms (
 account_id TEXT PRIMARY KEY REFERENCES accounts(id),
 document TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0,
 write_id TEXT,
 updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS snapshots (
 account_id TEXT NOT NULL REFERENCES accounts(id),
 revision INTEGER NOT NULL,
 document TEXT NOT NULL,
 created_at TEXT NOT NULL,
 PRIMARY KEY(account_id,revision)
);
CREATE TABLE IF NOT EXISTS auth_limits (
 bucket TEXT PRIMARY KEY,
 hits INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
