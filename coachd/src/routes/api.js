const express = require('express');
const router = express.Router();
const queries = require('../db/queries');
const ai = require('../services/ai');
const { createCheckoutSession, createPortalSession } = require('../services/stripe');

// Demo: returns hardcoded sample player + plan (no DB, no auth)
router.get('/demo', (req, res) => {
  res.json({
    player: {
      id: 'demo',
      player_name: 'Jordan',
      position: 'Center',
      age: 12,
      level: 'Rep AA',
      primary_goal: 'Prepare for upcoming tryouts',
      subscription_status: 'demo'
    },
    plan: {
      plan: {
        weekly_theme: 'Explosive Edge & First-Step Quickness',
        development_note: 'This week we focus on the edges and that first explosive stride — the skills scouts notice first at tryouts.',
        skills: {
          title: 'Edge Control & Acceleration',
          why_it_matters: 'At Rep AA, coaches are watching your edges from the first whistle. A center who can explode off their edges on both sides is a first-line candidate.',
          drill_1: {
            name: 'Inside-Outside Edge Slalom',
            reps: '3 sets × 4 lengths',
            what_you_need: 'Ice, 5 pylons set 3ft apart',
            execution: 'Weave through pylons using only inside and outside edges — no toe picks. Keep knees bent, chest up. Focus on pushing through the full blade, not just the toe.',
            what_to_feel: 'Pressure through the full blade on every push. Your ankles should feel engaged the whole time.'
          },
          drill_2: {
            name: 'Stop-and-Explode Starts',
            reps: '5 reps × 2 directions',
            what_you_need: 'Ice, blue line',
            execution: 'Skate hard to the blue line, execute a full stop, then explode back immediately. Work both left and right stops. The key is how fast your first two strides are after the stop.',
            what_to_feel: 'Your weight should shift forward instantly after the stop. Think about driving your knee forward on that first stride.'
          },
          scout_insight: 'At Rep AA tryouts, centers are evaluated on how they transition from back-check to offense. Your edge control determines how cleanly you pivot and accelerate — coaches see this even when you don\'t have the puck.'
        },
        training: {
          title: 'Lower Body Power & First-Step Explosiveness',
          why_it_matters: 'Your edges are only as good as the power behind them. These off-ice exercises build the hip and glute strength that creates explosive first strides.',
          exercise_1: {
            name: 'Lateral Banded Walks',
            sets_reps: '3 sets × 15 steps each direction',
            how_to: 'Place a resistance band just above your knees. Get into a half-squat and walk sideways, keeping tension on the band the whole time. Don\'t let your knees cave in.',
            hockey_benefit: 'Activates the glutes and hip abductors — the exact muscles that fire when you push off your edges.'
          },
          exercise_2: {
            name: 'Single-Leg Box Jumps',
            sets_reps: '3 sets × 6 reps per leg',
            how_to: 'Stand on one leg, squat down, then jump onto a low box. Land softly on the same foot and hold for 1 second. Step down, don\'t jump down.',
            hockey_benefit: 'Trains the explosive power your skating leg needs to generate a hard first stride.'
          },
          exercise_3: {
            name: 'Skater Jumps',
            sets_reps: '3 sets × 10 reps',
            how_to: 'Jump laterally from one foot to the other in a wide arc — like you\'re skating. Land and hold for a beat before jumping again. Keep your chest up and core tight.',
            hockey_benefit: 'Mimics the exact movement pattern of powerful edge pushes. Great pre-skate activation too.'
          },
          recovery_note: 'After training, spend 5 minutes doing hip flexor stretches and hamstring work. Most hockey players are tight through the hips from skating posture — staying loose keeps you injury-free through a long season.'
        },
        nutrition: {
          title: 'Fuel for High-Intensity Ice Sessions',
          the_focus: 'Tryout skating is short and explosive. You need fast fuel before, real protein after, and consistent habits in between.',
          pre_training: 'Banana + peanut butter on toast, 60–90 min before. Easy to digest, gives you fast carbs + a bit of protein to sustain energy.',
          post_training: 'Chocolate milk or Greek yogurt within 30 min after skating. The carb + protein combo is exactly what muscles need to recover.',
          daily_habit: 'A glass of water when you wake up, before you do anything else. Most young athletes are mildly dehydrated — it affects reaction time and how sharp you feel on the ice.',
          avoid_this: 'Energy drinks or heavy, greasy food within 2 hours of skate. Both will slow you down. Save the burger for after.'
        }
      }
    }
  });
});

// Return to existing plan by email
router.post('/login', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  const player = await queries.getPlayerByEmail(email.trim().toLowerCase());
  if (!player) return res.status(404).json({ error: 'No plan found for that email. Check the address or start a new plan.' });
  res.json({ redirect: `/dashboard?id=${player.id}` });
});

// Create player and redirect to Stripe
router.post('/signup', async (req, res) => {
  try {
    const { parent_name, player_name, position, age, level, tryout_date, gender, primary_goal } = req.body;
    const parent_email = req.body.parent_email?.trim().toLowerCase();
    if (!parent_email || !parent_name || !player_name || !position || !age || !level || !primary_goal) {
      return res.status(400).json({ error: 'All required fields must be filled in.' });
    }
    const existing = await queries.getPlayerByEmail(parent_email);
    if (existing) {
      return res.status(409).json({
        error: `${existing.player_name}'s plan already exists for this email. Check your inbox for the dashboard link, or go to your dashboard directly.`,
        redirect: `/dashboard?id=${existing.id}`
      });
    }
    const player = await queries.createPlayer({
      parent_email, parent_name, player_name, position,
      age: parseInt(age), level, tryout_date: tryout_date || null,
      gender: gender || 'boy', primary_goal
    });
    res.json({ playerId: player.id });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Stripe billing portal — cancel, update card, view invoices
router.get('/billing-portal/:id', async (req, res) => {
  try {
    const player = await queries.getPlayerById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    if (!player.stripe_customer_id) return res.status(400).json({ error: 'No billing account found.' });
    const url = await createPortalSession(player.stripe_customer_id);
    res.json({ url });
  } catch (err) {
    console.error('Billing portal error:', err);
    res.status(500).json({ error: 'Could not open billing portal' });
  }
});

// Get checkout URL
router.get('/checkout/:id', async (req, res) => {
  try {
    const player = await queries.getPlayerById(req.params.id);
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
    const player = await queries.getPlayerById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const plan = await queries.getLatestPlan(player.id);
    res.json({ player, plan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load player data' });
  }
});

// Generate/refresh plan
router.post('/plan/generate', async (req, res) => {
  try {
    const { player_id } = req.body;
    const player = await queries.getPlayerById(player_id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const plan = await ai.generateWeeklyPlan(player);
    await queries.saveWeeklyPlan(player.id, plan);
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
    const player = await queries.getPlayerById(player_id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const history = await queries.getRecentMessages(player.id, 6);
    const response = await ai.chat(player, history, message);
    await queries.saveMessage(player.id, 'user', message);
    await queries.saveMessage(player.id, 'assistant', response);
    res.json({ response });

    // Every 5 messages, update the player's long-term coaching notes (fire and forget)
    const totalMessages = await queries.getMessageCount(player.id);
    if (totalMessages % 5 === 0) {
      const allMessages = await queries.getRecentMessages(player.id, 40);
      ai.summarizePlayer(player, allMessages, player.player_notes)
        .then(notes => queries.updatePlayerNotes(player.id, notes))
        .catch(err => console.error('Player notes update failed:', err));
    }
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to get response' });
  }
});

module.exports = router;
