const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../services/stripe');
const queries = require('../db/queries');
const ai = require('../services/ai');

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    const event = handleWebhook(req.body, sig);
    if (!event) return res.json({ received: true });

    if (event.type === 'activated') {
      const player = queries.getPlayerById(event.playerId);
      if (player) {
        queries.updatePlayerStatus(event.playerId, 'trial', event.stripeCustomerId, event.stripeSubId);
        // Generate first plan in background
        ai.generateWeeklyPlan(player).then(plan => {
          queries.saveWeeklyPlan(player.id, plan);
        }).catch(console.error);
      }
    }

    if (event.type === 'cancelled') {
      const player = queries.getPlayerByEmail(event.stripeCustomerId);
      if (player) queries.updatePlayerStatus(player.id, 'cancelled', null, null);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
