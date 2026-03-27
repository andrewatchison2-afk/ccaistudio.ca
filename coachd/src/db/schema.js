const Database = require('better-sqlite3');
const path = require('path');
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../coachd.db');
const db = new Database(dbPath);

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_email TEXT UNIQUE NOT NULL,
      parent_name TEXT NOT NULL,
      player_name TEXT NOT NULL,
      position TEXT NOT NULL,
      age INTEGER NOT NULL,
      level TEXT NOT NULL,
      tryout_date TEXT,
      gender TEXT DEFAULT 'boy',
      primary_goal TEXT NOT NULL DEFAULT 'Complete all-around development',
      subscription_status TEXT DEFAULT 'pending',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER REFERENCES players(id),
      role TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS weekly_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER REFERENCES players(id),
      plan_json TEXT NOT NULL,
      week_number INTEGER DEFAULT 1,
      generated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // Migrate: add gender column if it doesn't exist yet
  const cols = db.prepare("PRAGMA table_info(players)").all().map(c => c.name);
  if (!cols.includes('gender')) {
    db.exec("ALTER TABLE players ADD COLUMN gender TEXT DEFAULT 'boy'");
    console.log('Migration: added gender column');
  }
  if (!cols.includes('player_notes')) {
    db.exec("ALTER TABLE players ADD COLUMN player_notes TEXT DEFAULT NULL");
    console.log('Migration: added player_notes column');
  }
  console.log('Database initialised');
}

module.exports = { db, initDB };
