import type Stripe from 'stripe'
import type { PlanSlug } from '@/lib/subscription/types'
import { isDowngrade } from '@/lib/subscription/plans'
import { getSiteUrl } from '@/lib/site-url'
import { getStripe } from './client'
import {
  clearPendingPlanChange,
  getOrCreateStripeCustomer,
  setPendingPlanChange,
  syncStripeSubscriptionById,
} from './sync'
import { getStripePriceIdForPlan, isPaidPlanSlug } from './prices'
import { supabaseAdmin } from '@/lib/supabase/client'
import { notifyAdminsOfSubscriptionIssueAsync } from '@/lib/notifications/admin-notifications'

export type CheckoutResult = {
  url: string
  // 'checkout' = redirect to Stripe, 'upgraded' = applied now, 'scheduled' = downgrade at period end,
  // 'cancelled_change' = a previously scheduled downgrade was cancelled.
  outcome: 'checkout' | 'upgraded' | 'scheduled' | 'cancelled_change'
}

function scheduleIdOf(subscription: Stripe.Subscription): string | null {
  const sched = (subscription as Stripe.Subscription & { schedule?: string | { id: string } | null })
    .schedule
  if (!sched) return null
  return typeof sched === 'string' ? sched : sched.id
}

function currentPeriodEndOf(subscription: Stripe.Subscription): number | null {
  return (
    subscription.items?.data?.[0]?.current_period_end ??
    (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end ??
    null
  )
}

async function releaseScheduleIfAny(
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<void> {
  const scheduleId = scheduleIdOf(subscription)
  if (!scheduleId) return
  try {
    await stripe.subscriptionSchedules.release(scheduleId)
  } catch {
    // schedule may already be released/completed — ignore
  }
}

export async function createCheckoutOrUpgrade(params: {
  userId: string
  email: string
  planSlug: 'plus' | 'pro'
}): Promise<CheckoutResult> {
  const { userId, email, planSlug } = params
  if (!isPaidPlanSlug(planSlug)) {
    throw new Error('Invalid plan')
  }

  const priceId = await getStripePriceIdForPlan(planSlug)
  const siteUrl = getSiteUrl()

  const { data: subRow } = await (supabaseAdmin as any)
    .from('user_subscriptions')
    .select(
      'stripe_subscription_id, stripe_customer_id, metadata, plan:subscription_plans!user_subscriptions_plan_id_fkey(slug)',
    )
    .eq('user_id', userId)
    .in('status', ['trial', 'active', 'paused', 'payment_failed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const currentSlug = subRow?.plan?.slug as PlanSlug | undefined
  const pendingChange = (subRow?.metadata as { pending_plan_change?: { plan_slug?: string } } | null)
    ?.pending_plan_change

  const stripe = getStripe()

  if (subRow?.stripe_subscription_id) {
    const subscription = await stripe.subscriptions.retrieve(subRow.stripe_subscription_id)
    const itemId = subscription.items.data[0]?.id
    const currentPriceId = subscription.items.data[0]?.price?.id
    if (!itemId || !currentPriceId) throw new Error('Stripe subscription has no items')

    // Already on the requested plan.
    if (currentSlug === planSlug) {
      // If a downgrade was scheduled, treat this as "keep my current plan" and cancel it.
      if (pendingChange?.plan_slug) {
        await releaseScheduleIfAny(stripe, subscription)
        await clearPendingPlanChange(userId)
        return {
          url: `${siteUrl}/dashboard/settings?billing=kept&plan=${planSlug}`,
          outcome: 'cancelled_change',
        }
      }
      throw new Error('You are already on this plan')
    }

    // Downgrade (e.g. Pro -> Plus): schedule the change for the end of the paid period
    // so the user keeps what they paid for until then.
    if (currentSlug && isDowngrade(currentSlug, planSlug)) {
      const periodEnd = currentPeriodEndOf(subscription)
      if (!periodEnd) throw new Error('Could not determine billing period end')

      let scheduleId = scheduleIdOf(subscription)
      if (!scheduleId) {
        const created = await stripe.subscriptionSchedules.create({
          from_subscription: subscription.id,
        })
        scheduleId = created.id
      }

      const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)
      const currentPhase = schedule.phases[0]

      await stripe.subscriptionSchedules.update(scheduleId, {
        end_behavior: 'release',
        phases: [
          {
            items: [{ price: currentPriceId, quantity: 1 }],
            start_date: currentPhase?.start_date,
            end_date: currentPhase?.end_date ?? periodEnd,
          },
          {
            items: [{ price: priceId, quantity: 1 }],
          },
        ],
        metadata: { user_id: userId, plan_slug: planSlug },
      })

      const effectiveAt = new Date((currentPhase?.end_date ?? periodEnd) * 1000).toISOString()
      await setPendingPlanChange(userId, {
        plan_slug: planSlug,
        effective_at: effectiveAt,
        stripe_schedule_id: scheduleId,
      })

      return {
        url: `${siteUrl}/dashboard/settings?billing=scheduled&plan=${planSlug}`,
        outcome: 'scheduled',
      }
    }

    // Upgrade (e.g. Plus -> Pro): apply immediately with prorations.
    // Release any pending downgrade schedule first.
    await releaseScheduleIfAny(stripe, subscription)
    await clearPendingPlanChange(userId)

    await stripe.subscriptions.update(subRow.stripe_subscription_id, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: 'create_prorations',
      metadata: { user_id: userId, plan_slug: planSlug },
    })

    await syncStripeSubscriptionById(subRow.stripe_subscription_id, userId)

    notifyAdminsOfSubscriptionIssueAsync({
      userId,
      issueKind: 'plan_upgraded',
      planSlug,
    })

    return {
      url: `${siteUrl}/billing/success?plan=${planSlug}`,
      outcome: 'upgraded',
    }
  }

  if (currentSlug === planSlug) {
    throw new Error('You are already on this plan')
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

  return { url: session.url, outcome: 'checkout' }
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
