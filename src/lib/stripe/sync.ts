import type Stripe from 'stripe'
import { getFreePlanId } from '@/lib/subscription/service'
import type { PlanSlug } from '@/lib/subscription/types'
import { supabaseAdmin } from '@/lib/supabase/client'
import { getStripe } from './client'
import { getPlanIdBySlug, getPlanSlugByStripePriceId } from './prices'

type SubscriptionRow = {
  id: string
  user_id: string
  plan_id: string
  status: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  usage_stats: Record<string, unknown> | null
}

function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'trialing':
      return 'trial'
    case 'active':
      return 'active'
    case 'past_due':
    case 'unpaid':
      return 'payment_failed'
    case 'paused':
      return 'paused'
    case 'canceled':
    case 'incomplete_expired':
      return 'cancelled'
    default:
      return 'active'
  }
}

function periodBounds(subscription: Stripe.Subscription) {
  const periodStart =
    subscription.items?.data?.[0]?.current_period_start ??
    (subscription as Stripe.Subscription & { current_period_start?: number }).current_period_start
  const periodEnd =
    subscription.items?.data?.[0]?.current_period_end ??
    (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end

  const start = periodStart
    ? new Date(periodStart * 1000).toISOString()
    : new Date().toISOString()
  const end = periodEnd
    ? new Date(periodEnd * 1000).toISOString()
    : new Date().toISOString()
  return { start, end }
}

async function getUserSubscriptionRow(userId: string): Promise<SubscriptionRow | null> {
  const { data } = await (supabaseAdmin as any)
    .from('user_subscriptions')
    .select('id, user_id, plan_id, status, stripe_customer_id, stripe_subscription_id, usage_stats')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as SubscriptionRow) ?? null
}

async function resolvePlanSlugFromSubscription(
  subscription: Stripe.Subscription,
): Promise<PlanSlug | null> {
  const priceId = subscription.items.data[0]?.price?.id
  if (!priceId) return null
  return getPlanSlugByStripePriceId(priceId)
}

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
): Promise<string> {
  const row = await getUserSubscriptionRow(userId)
  if (row?.stripe_customer_id) return row.stripe_customer_id

  const stripe = getStripe()
  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  })

  if (row?.id) {
    await (supabaseAdmin as any)
      .from('user_subscriptions')
      .update({ stripe_customer_id: customer.id, updated_at: new Date().toISOString() })
      .eq('id', row.id)
  }

  return customer.id
}

export async function applyPaidPlanFromStripeSubscription(
  userId: string,
  subscription: Stripe.Subscription,
  planSlug?: PlanSlug | null,
): Promise<void> {
  const slug = planSlug ?? (await resolvePlanSlugFromSubscription(subscription))
  if (!slug || slug === 'free') {
    throw new Error('Could not resolve paid plan from Stripe subscription')
  }

  const planId = await getPlanIdBySlug(slug)
  if (!planId) throw new Error(`Plan not found for slug ${slug}`)

  const { start, end } = periodBounds(subscription)
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id ?? null

  const payload = {
    plan_id: planId,
    status: mapStripeSubscriptionStatus(subscription.status),
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    start_date: start,
    current_period_start: start,
    current_period_end: end,
    auto_renew: !subscription.cancel_at_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    cancelled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  }

  const row = await getUserSubscriptionRow(userId)
  if (row?.id) {
    await (supabaseAdmin as any).from('user_subscriptions').update(payload).eq('id', row.id)
    return
  }

  await (supabaseAdmin as any).from('user_subscriptions').insert({
    user_id: userId,
    ...payload,
    usage_stats: { period: new Date().toISOString().slice(0, 7) },
  })
}

export async function downgradeUserToFree(userId: string): Promise<void> {
  const freePlanId = await getFreePlanId()
  if (!freePlanId) return

  const row = await getUserSubscriptionRow(userId)
  if (!row?.id) return

  await (supabaseAdmin as any)
    .from('user_subscriptions')
    .update({
      plan_id: freePlanId,
      status: 'active',
      stripe_subscription_id: null,
      auto_renew: false,
      cancel_at_period_end: false,
      cancelled_at: new Date().toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0,
        23,
        59,
        59,
      ).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
}

export async function syncStripeSubscriptionById(
  stripeSubscriptionId: string,
  fallbackUserId?: string,
): Promise<void> {
  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
    expand: ['items.data.price'],
  })

  let userId = fallbackUserId || subscription.metadata?.user_id
  if (!userId && typeof subscription.customer === 'string') {
    const customer = await stripe.customers.retrieve(subscription.customer)
    if (!customer.deleted) {
      userId = customer.metadata?.user_id
    }
  } else if (!userId && subscription.customer && typeof subscription.customer === 'object') {
    const customer = subscription.customer
    if (!('deleted' in customer && customer.deleted)) {
      userId = customer.metadata?.user_id
    }
  }

  if (!userId) {
    throw new Error(`No user_id for Stripe subscription ${stripeSubscriptionId}`)
  }

  if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
    await downgradeUserToFree(userId)
    return
  }

  const slug = await resolvePlanSlugFromSubscription(subscription)
  await applyPaidPlanFromStripeSubscription(userId, subscription, slug)
}

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.metadata?.user_id
  const planSlug = session.metadata?.plan_slug as PlanSlug | undefined
  if (!userId) throw new Error('checkout.session.completed missing user_id metadata')

  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

  if (!subscriptionId) {
    throw new Error('checkout.session.completed missing subscription id')
  }

  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price'],
  })

  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id

  if (customerId) {
    const row = await getUserSubscriptionRow(userId)
    if (row?.id && row.stripe_customer_id !== customerId) {
      await (supabaseAdmin as any)
        .from('user_subscriptions')
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq('id', row.id)
    }
  }

  await applyPaidPlanFromStripeSubscription(
    userId,
    subscription,
    planSlug && planSlug !== 'free' ? planSlug : null,
  )
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = invoice as Stripe.Invoice & {
    subscription?: string | { id: string } | null
  }
  if (typeof legacy.subscription === 'string') return legacy.subscription
  if (legacy.subscription && typeof legacy.subscription === 'object') {
    return legacy.subscription.id
  }
  const parentSub = invoice.parent?.subscription_details?.subscription
  if (typeof parentSub === 'string') return parentSub
  return null
}

export async function recordInvoicePayment(invoice: Stripe.Invoice): Promise<void> {
  if (!invoice.id || invoice.amount_paid == null) return

  const userId = invoice.metadata?.user_id
  const subscriptionId = getInvoiceSubscriptionId(invoice)

  let resolvedUserId = userId
  if (!resolvedUserId && subscriptionId) {
    const { data } = await (supabaseAdmin as any)
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle()
    resolvedUserId = data?.user_id
  }

  if (!resolvedUserId) return

  const row = await getUserSubscriptionRow(resolvedUserId)
  const amount = invoice.amount_paid / 100

  const { data: existing } = await (supabaseAdmin as any)
    .from('payment_transactions')
    .select('id')
    .eq('gateway_transaction_id', invoice.id)
    .maybeSingle()

  if (existing?.id) return

  await (supabaseAdmin as any).from('payment_transactions').insert({
    user_id: resolvedUserId,
    subscription_id: row?.id ?? null,
    amount,
    currency: (invoice.currency || 'usd').toUpperCase(),
    transaction_type: 'subscription',
    payment_method: 'card',
    payment_gateway: 'stripe',
    gateway_transaction_id: invoice.id,
    gateway_customer_id:
      typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null,
    status: invoice.status === 'paid' ? 'completed' : 'processing',
    completed_at: new Date().toISOString(),
    invoice_url: invoice.hosted_invoice_url ?? null,
    receipt_url: invoice.invoice_pdf ?? null,
    metadata: { stripe_invoice_id: invoice.id },
  })
}

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription') {
        await handleCheckoutSessionCompleted(session)
      }
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await syncStripeSubscriptionById(subscription.id, subscription.metadata?.user_id)
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.user_id
      if (userId) {
        await downgradeUserToFree(userId)
      } else {
        const { data } = await (supabaseAdmin as any)
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle()
        if (data?.user_id) await downgradeUserToFree(data.user_id)
      }
      break
    }
    case 'invoice.paid': {
      await recordInvoicePayment(event.data.object as Stripe.Invoice)
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = getInvoiceSubscriptionId(invoice)
      if (subscriptionId) {
        const { data } = await (supabaseAdmin as any)
          .from('user_subscriptions')
          .select('id')
          .eq('stripe_subscription_id', subscriptionId)
          .maybeSingle()
        if (data?.id) {
          await (supabaseAdmin as any)
            .from('user_subscriptions')
            .update({ status: 'payment_failed', updated_at: new Date().toISOString() })
            .eq('id', data.id)
        }
      }
      break
    }
    default:
      break
  }
}
