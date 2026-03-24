const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createCheckoutSession(playerEmail, playerName, playerId) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: playerEmail,
    line_items: [{
      price: process.env.STRIPE_PRICE_ID,
      quantity: 1,
    }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { playerId: String(playerId) }
    },
    payment_settings: {
      save_default_payment_method: 'on_subscription'
    },
    metadata: { playerEmail, playerId: String(playerId) },
    success_url: `${process.env.BASE_URL}/dashboard?id=${playerId}&success=true`,
    cancel_url: `${process.env.BASE_URL}/pricing`,
  });
  return session.url;
}

function handleWebhook(rawBody, sig) {
  const event = stripe.webhooks.constructEvent(
    rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    return {
      type: 'activated',
      playerId: session.metadata.playerId,
      email: session.metadata.playerEmail,
      stripeCustomerId: session.customer,
      stripeSubId: session.subscription,
    };
  }

  if (event.type === 'customer.subscription.deleted') {
    return {
      type: 'cancelled',
      stripeCustomerId: event.data.object.customer,
    };
  }

  return null;
}

module.exports = { createCheckoutSession, handleWebhook };
