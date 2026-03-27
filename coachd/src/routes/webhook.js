const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../services/stripe');
const queries = require('../db/queries');
const ai = require('../services/ai');
const { sendWelcome, sendPlanReady } = require('../services/email');

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    const event = handleWebhook(req.body, sig);
    if (!event) return res.json({ received: true });

    if (event.type === 'activated') {
      const player = await queries.getPlayerById(event.playerId);
      if (player) {
        await queries.updatePlayerStatus(event.playerId, 'trial', event.stripeCustomerId, event.stripeSubId);

        // Send welcome email immediately
        sendWelcome({
          parentName: player.parent_name,
          playerName: player.player_name,
          parentEmail: player.parent_email,
          playerId: player.id
        }).catch(console.error);

        // Generate first plan, then send "plan ready" email
        ai.generateWeeklyPlan(player).then(async plan => {
          await queries.saveWeeklyPlan(player.id, plan);
          sendPlanReady({
            parentName: player.parent_name,
            playerName: player.player_name,
            parentEmail: player.parent_email,
            playerId: player.id,
            weeklyTheme: plan?.weekly_theme || null
          }).catch(console.error);
        }).catch(console.error);
      }
    }

    if (event.type === 'cancelled') {
      const player = await queries.getPlayerByEmail(event.stripeCustomerId);
      if (player) await queries.updatePlayerStatus(player.id, 'cancelled', null, null);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
