# Coachd
### AI hockey development coach for minor hockey families
$19.99/month · 7-day free trial · Card required at signup

---

## Quick Start

```bash
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm run seed
npm run dev
```

Open http://localhost:3000

## Test on your phone

```bash
# Find your local IP
ipconfig        # Windows
ifconfig        # Mac/Linux

# Open on your phone (must be on same WiFi)
http://[your-ip]:3000
```

## Test the AI quality

After seeding, open the dashboard for Connor:
http://localhost:3000/dashboard?id=1

Ask the coach:
- "What should Connor work on for his first step?"
- "What do Rep AA coaches look for at tryouts for a center?"
- "Best off-ice exercises for a 12-year-old?"

**If answers are specific and hockey-intelligent → prompts are working.**
If answers feel generic → open `src/services/ai.js` and tighten the constraints.

## Iterate on AI quality

The system prompts are in `src/services/ai.js`.
To test a change:
1. Edit the system prompt
2. Run `npm run seed` to reset test data
3. Open the dashboard and test again
4. Repeat until every answer sounds like a real hockey coach

## Stripe Setup

```bash
# 1. Create account at stripe.com
# 2. Add product: $19.99/month recurring subscription
# 3. Copy Price ID → .env as STRIPE_PRICE_ID
# 4. Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/webhook
# 5. Copy webhook secret → .env as STRIPE_WEBHOOK_SECRET
```

## Deploy

Recommended: Railway.app or Render.com
- Both support Node.js + SQLite
- Set all env vars in dashboard
- Push to GitHub → auto-deploys

## Environment Variables

```
ANTHROPIC_API_KEY=     # Required - from console.anthropic.com
STRIPE_SECRET_KEY=     # Required - from stripe.com dashboard
STRIPE_WEBHOOK_SECRET= # Required - from stripe CLI or dashboard
STRIPE_PRICE_ID=       # Required - your $19.99/month price ID
BASE_URL=              # Required - your deployed URL (or localhost:3000)
PORT=3000              # Optional
```

---
Built in Lethbridge, Alberta for hockey families everywhere.
