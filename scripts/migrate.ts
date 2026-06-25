import db from "../src/lib/db";

db.exec(`
  CREATE TABLE IF NOT EXISTS user_profiles (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    level      TEXT    NOT NULL DEFAULT 'A1',
    interests  TEXT,
    created_at TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS language_memory (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    repeated_mistakes TEXT,
    updated_at        TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS conversation_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    persona    TEXT    NOT NULL,
    scenario   TEXT    NOT NULL,
    messages   TEXT    NOT NULL,
    created_at TEXT    DEFAULT (datetime('now'))
  );
`);

const tables = db
  .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
  .all() as { name: string }[];

console.log("✓ Migration complete. Tables:", tables.map((t) => t.name).join(", "));
db.close();
