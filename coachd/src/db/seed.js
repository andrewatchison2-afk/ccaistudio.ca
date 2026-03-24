require('dotenv').config();
const { db, initDB } = require('./schema');
const queries = require('./queries');
const ai = require('../services/ai');

async function seed() {
  initDB();

  // Clear existing test data
  db.prepare("DELETE FROM weekly_plans WHERE player_id IN (SELECT id FROM players WHERE parent_email = 'dave@test.com')").run();
  db.prepare("DELETE FROM conversations WHERE player_id IN (SELECT id FROM players WHERE parent_email = 'dave@test.com')").run();
  db.prepare("DELETE FROM players WHERE parent_email = 'dave@test.com'").run();

  const tryoutDate = new Date();
  tryoutDate.setMonth(tryoutDate.getMonth() + 5);

  const result = queries.createPlayer({
    parent_email: 'dave@test.com',
    parent_name: 'Dave',
    player_name: 'Connor',
    position: 'Center',
    age: 12,
    level: 'Rep AA',
    tryout_date: tryoutDate.toISOString().split('T')[0],
    primary_goal: 'Prepare for upcoming tryouts'
  });

  const playerId = result.lastInsertRowid;
  db.prepare("UPDATE players SET subscription_status = 'trial' WHERE id = ?").run(playerId);

  console.log('Generating plan for Connor...');
  const player = queries.getPlayerById(playerId);
  const plan = await ai.generateWeeklyPlan(player);
  queries.saveWeeklyPlan(playerId, plan);

  console.log(`\n✅ Seed complete`);
  console.log(`   Player ID: ${playerId}`);
  console.log(`   Dashboard: http://localhost:3000/dashboard?id=${playerId}`);
  console.log(`\n   Test the AI: Ask the coach "What should Connor work on for his first step?"`);
  console.log(`   If the answer is specific and hockey-intelligent, the prompts are working.`);
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
