const express = require('express');
const router = express.Router();
const queries = require('../db/queries');
const ai = require('../services/ai');
const { createCheckoutSession } = require('../services/stripe');

// Create player and redirect to Stripe
router.post('/signup', async (req, res) => {
  try {
    const { parent_email, parent_name, player_name, position, age, level, tryout_date, primary_goal } = req.body;
    if (!parent_email || !parent_name || !player_name || !position || !age || !level || !primary_goal) {
      return res.status(400).json({ error: 'All required fields must be filled in.' });
    }
    const existing = queries.getPlayerByEmail(parent_email);
    if (existing) {
      return res.json({ playerId: existing.id, redirect: `/dashboard?id=${existing.id}` });
    }
    const result = queries.createPlayer({ parent_email, parent_name, player_name, position: position, age: parseInt(age), level, tryout_date: tryout_date || null, primary_goal });
    res.json({ playerId: result.lastInsertRowid });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Get checkout URL
router.get('/checkout/:id', async (req, res) => {
  try {
    const player = queries.getPlayerById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const url = await createCheckoutSession(player.parent_email, player.parent_name, player.id);
    res.json({ url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Payment setup failed' });
  }
});

// Get player + plan
router.get('/player/:id', async (req, res) => {
  try {
    const player = queries.getPlayerById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const plan = queries.getLatestPlan(player.id);
    res.json({ player, plan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load player data' });
  }
});

// Generate/refresh plan
router.post('/plan/generate', async (req, res) => {
  try {
    const { player_id } = req.body;
    const player = queries.getPlayerById(player_id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const plan = await ai.generateWeeklyPlan(player);
    queries.saveWeeklyPlan(player.id, plan);
    res.json({ plan });
  } catch (err) {
    console.error('Plan generation error:', err);
    res.status(500).json({ error: 'Failed to generate plan' });
  }
});

// Chat
router.post('/chat', async (req, res) => {
  try {
    const { player_id, message } = req.body;
    const player = queries.getPlayerById(player_id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const history = queries.getRecentMessages(player.id);
    const response = await ai.chat(player, history, message);
    queries.saveMessage(player.id, 'user', message);
    queries.saveMessage(player.id, 'assistant', response);
    res.json({ response });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to get response' });
  }
});

module.exports = router;
