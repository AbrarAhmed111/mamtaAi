import type { PlanSlug } from '@/lib/subscription/types'
import { getSiteUrl } from '@/lib/site-url'
import { getStripe } from './client'
import { getOrCreateStripeCustomer, syncStripeSubscriptionById } from './sync'
import { getStripePriceIdForPlan, isPaidPlanSlug } from './prices'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function createCheckoutOrUpgrade(params: {
  userId: string
  email: string
  planSlug: 'plus' | 'pro'
}): Promise<{ url: string }> {
  const { userId, email, planSlug } = params
  if (!isPaidPlanSlug(planSlug)) {
    throw new Error('Invalid plan')
  }

  const priceId = await getStripePriceIdForPlan(planSlug)
  const siteUrl = getSiteUrl()

  const { data: subRow } = await (supabaseAdmin as any)
    .from('user_subscriptions')
    .select('stripe_subscription_id, stripe_customer_id, plan:subscription_plans!user_subscriptions_plan_id_fkey(slug)')
    .eq('user_id', userId)
    .in('status', ['trial', 'active', 'paused', 'payment_failed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const currentSlug = subRow?.plan?.slug as PlanSlug | undefined
  if (currentSlug === planSlug) {
    throw new Error('You are already on this plan')
  }

  const stripe = getStripe()

  if (subRow?.stripe_subscription_id) {
    const subscription = await stripe.subscriptions.retrieve(subRow.stripe_subscription_id)
    const itemId = subscription.items.data[0]?.id
    if (!itemId) throw new Error('Stripe subscription has no items')

    await stripe.subscriptions.update(subRow.stripe_subscription_id, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: 'create_prorations',
      metadata: { user_id: userId, plan_slug: planSlug },
    })

    await syncStripeSubscriptionById(subRow.stripe_subscription_id, userId)

    return {
      url: `${siteUrl}/billing/success?plan=${planSlug}`,
    }
  }

  const customerId = await getOrCreateStripeCustomer(userId, email)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/billing/success?checkout_session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/pricing?billing=cancelled`,
    metadata: {
      user_id: userId,
      plan_slug: planSlug,
    },
    subscription_data: {
      metadata: {
        user_id: userId,
        plan_slug: planSlug,
      },
    },
    allow_promotion_codes: true,
  })

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL')
  }

  return { url: session.url }
}

export async function createBillingPortalSession(userId: string): Promise<{ url: string }> {
  const { data: subRow } = await (supabaseAdmin as any)
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const customerId = subRow?.stripe_customer_id as string | undefined
  if (!customerId) {
    throw new Error('No billing account found. Subscribe to a paid plan first.')
  }

  const stripe = getStripe()
  const siteUrl = getSiteUrl()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${siteUrl}/dashboard/settings?billing=portal`,
  })

  return { url: session.url }
}
