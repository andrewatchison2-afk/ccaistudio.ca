const { pool } = require('./schema');

async function createPlayer(data) {
  const { rows } = await pool.query(
    `INSERT INTO players (parent_email, parent_name, player_name, position, age, level, tryout_date, gender, primary_goal)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [data.parent_email, data.parent_name, data.player_name,
     data.position, data.age, data.level, data.tryout_date || null,
     data.gender || 'boy', data.primary_goal]
  );
  return rows[0];
}

async function getPlayerById(id) {
  const { rows } = await pool.query('SELECT * FROM players WHERE id = $1', [id]);
  return rows[0] || null;
}

async function getPlayerByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM players WHERE parent_email = $1', [email]);
  return rows[0] || null;
}

async function updatePlayerStatus(id, status, stripeCustomerId, stripeSubId) {
  await pool.query(
    `UPDATE players SET subscription_status = $1,
      stripe_customer_id = COALESCE($2, stripe_customer_id),
      stripe_subscription_id = COALESCE($3, stripe_subscription_id)
     WHERE id = $4`,
    [status, stripeCustomerId, stripeSubId, id]
  );
}

async function saveWeeklyPlan(playerId, planJson) {
  const { rows } = await pool.query('SELECT COUNT(*) as c FROM weekly_plans WHERE player_id = $1', [playerId]);
  const weekNum = (parseInt(rows[0].c) || 0) + 1;
  await pool.query(
    'INSERT INTO weekly_plans (player_id, plan_json, week_number) VALUES ($1,$2,$3)',
    [playerId, JSON.stringify(planJson), weekNum]
  );
}

async function getLatestPlan(playerId) {
  const { rows } = await pool.query(
    'SELECT * FROM weekly_plans WHERE player_id = $1 ORDER BY generated_at DESC LIMIT 1',
    [playerId]
  );
  if (!rows[0]) return null;
  return { ...rows[0], plan: JSON.parse(rows[0].plan_json) };
}

async function saveMessage(playerId, role, message) {
  await pool.query(
    'INSERT INTO conversations (player_id, role, message) VALUES ($1,$2,$3)',
    [playerId, role, message]
  );
}

async function getRecentMessages(playerId, limit = 12) {
  const { rows } = await pool.query(
    'SELECT * FROM (SELECT * FROM conversations WHERE player_id = $1 ORDER BY created_at DESC LIMIT $2) sub ORDER BY created_at ASC',
    [playerId, limit]
  );
  return rows;
}

async function updatePlayerNotes(id, notes) {
  await pool.query('UPDATE players SET player_notes = $1 WHERE id = $2', [notes, id]);
}

async function getMessageCount(playerId) {
  const { rows } = await pool.query('SELECT COUNT(*) as count FROM conversations WHERE player_id = $1', [playerId]);
  return parseInt(rows[0].count);
}

async function getAllPlayers() {
  const { rows } = await pool.query('SELECT * FROM players ORDER BY created_at DESC');
  return rows;
}

module.exports = {
  createPlayer, getPlayerById, getPlayerByEmail, updatePlayerStatus,
  saveWeeklyPlan, getLatestPlan, saveMessage, getRecentMessages,
  updatePlayerNotes, getMessageCount, getAllPlayers
};
