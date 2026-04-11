import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'
import type { SubscriptionStatus, SubscriptionTier } from '@/types/database'

export const runtime = 'nodejs'

// Map Stripe subscription status → our enum
function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const map: Partial<Record<Stripe.Subscription.Status, SubscriptionStatus>> = {
    active: 'active',
    canceled: 'canceled',
    past_due: 'past_due',
    trialing: 'trialing',
    incomplete: 'incomplete',
  }
  return map[status] ?? 'incomplete'
}

// Determine subscription tier from price ID
function tierFromPriceId(priceId: string): SubscriptionTier {
  if (priceId === process.env.STRIPE_BRAND_PRO_PRICE_ID) return 'brand_pro'
  if (priceId === process.env.STRIPE_SUPPLIER_FEATURED_PRICE_ID) return 'supplier_featured'
  return 'free'
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  adminSupabase: ReturnType<typeof createAdminClient>
) {
  const userId = subscription.metadata.supabase_user_id
  if (!userId) return

  const item = subscription.items.data[0]
  const priceId = item?.price.id ?? ''
  const tier: SubscriptionTier =
    subscription.status === 'canceled' || subscription.status === 'incomplete_expired'
      ? 'free'
      : tierFromPriceId(priceId)

  const updates = {
    subscription_id: subscription.id,
    subscription_status: mapStatus(subscription.status),
    subscription_tier: tier,
    // current_period_end is still present at runtime; cast needed for newer SDK types
    subscription_period_end: new Date(
      (subscription as any).current_period_end * 1000
    ).toISOString(),
  }

  await adminSupabase.from('profiles').update(updates).eq('id', userId)

  // Sync is_featured flag on supplier listing
  if (tier === 'supplier_featured' || tier === 'free') {
    await adminSupabase
      .from('suppliers')
      .update({ is_featured: tier === 'supplier_featured' })
      .eq('profile_id', userId)
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // Idempotency check
  const { data: existing } = await adminSupabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Log event
  await adminSupabase.from('stripe_events').insert({
    id: event.id,
    type: event.type,
    payload: event.data.object as any,
  })

  // Handle events
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionChange(subscription, adminSupabase)
      break
    }
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        await handleSubscriptionChange(subscription, adminSupabase)
      }
      break
    }
    default:
      break
  }

  return NextResponse.json({ received: true })
}
