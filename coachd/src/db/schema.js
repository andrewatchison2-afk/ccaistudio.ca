const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
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
      player_notes TEXT DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      player_id INTEGER REFERENCES players(id),
      role TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS weekly_plans (
      id SERIAL PRIMARY KEY,
      player_id INTEGER REFERENCES players(id),
      plan_json TEXT NOT NULL,
      week_number INTEGER DEFAULT 1,
      generated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('Database initialised');
}

module.exports = { pool, initDB };
