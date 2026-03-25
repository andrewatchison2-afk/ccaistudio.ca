const { db } = require('./schema');

module.exports = {
  createPlayer: (data) => {
    const stmt = db.prepare(`
      INSERT INTO players (parent_email, parent_name, player_name, position, age, level, tryout_date, primary_goal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(data.parent_email, data.parent_name, data.player_name,
      data.position, data.age, data.level, data.tryout_date || null, data.primary_goal);
  },
  getPlayerById: (id) => db.prepare('SELECT * FROM players WHERE id = ?').get(id),
  getPlayerByEmail: (email) => db.prepare('SELECT * FROM players WHERE parent_email = ?').get(email),
  updatePlayer: (id, data) => {
    db.prepare(`UPDATE players SET parent_name = ?, player_name = ?, position = ?, age = ?, level = ?, tryout_date = ?, primary_goal = ? WHERE id = ?`)
      .run(data.parent_name, data.player_name, data.position, data.age, data.tryout_date || null, data.primary_goal, id);
  },
  updatePlayerStatus: (id, status, stripeCustomerId, stripeSubId) => {
    db.prepare(`UPDATE players SET subscription_status = ?,
      stripe_customer_id = COALESCE(?, stripe_customer_id),
      stripe_subscription_id = COALESCE(?, stripe_subscription_id)
      WHERE id = ?`
    ).run(status, stripeCustomerId, stripeSubId, id);
  },
  saveWeeklyPlan: (playerId, planJson) => {
    const weekNum = (db.prepare('SELECT COUNT(*) as c FROM weekly_plans WHERE player_id = ?').get(playerId).c || 0) + 1;
    db.prepare('INSERT INTO weekly_plans (player_id, plan_json, week_number) VALUES (?, ?, ?)').run(playerId, JSON.stringify(planJson), weekNum);
  },
  getLatestPlan: (playerId) => {
    const row = db.prepare('SELECT * FROM weekly_plans WHERE player_id = ? ORDER BY generated_at DESC LIMIT 1').get(playerId);
    if (!row) return null;
    return { ...row, plan: JSON.parse(row.plan_json) };
  },
  saveMessage: (playerId, role, message) => {
    db.prepare('INSERT INTO conversations (player_id, role, message) VALUES (?, ?, ?)').run(playerId, role, message);
  },
  getRecentMessages: (playerId, limit = 12) => {
    return db.prepare('SELECT * FROM conversations WHERE player_id = ? ORDER BY created_at DESC LIMIT ?').all(playerId, limit).reverse();
  },
  getAllPlayers: () => db.prepare('SELECT * FROM players ORDER BY created_at DESC').all(),
};
