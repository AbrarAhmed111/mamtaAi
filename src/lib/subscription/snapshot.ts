import { requireActiveProfile } from '@/lib/session/server'
import {
  ensureFreeSubscription,
  getPlanLimits,
  PLAN_DEFINITIONS,
  syncUsageFromDatabase,
  usageMeter,
} from '@/lib/subscription'
import type { SubscriptionSnapshot } from './snapshot-types'

export async function getSubscriptionSnapshotForCurrentUser(): Promise<SubscriptionSnapshot | null> {
  try {
    const auth = await requireActiveProfile()
    if (!auth.ok) return null

    const { user, profile, supabase } = auth

    await ensureFreeSubscription(user.id)

    const timezone = profile.timezone ?? null
    const [usage, ctx] = await Promise.all([
      syncUsageFromDatabase(user.id, timezone),
      getPlanLimits(user.id, timezone),
    ])

    const { data: billingRow } = await supabase
      .from('user_subscriptions')
      .select('status, cancel_at_period_end, stripe_customer_id, stripe_subscription_id, current_period_end, metadata')
      .eq('user_id', user.id)
      .in('status', ['trial', 'active', 'paused', 'payment_failed', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const pendingChange =
      (billingRow?.metadata as {
        pending_plan_change?: { plan_slug: string; effective_at: string }
      } | null)?.pending_plan_change ?? null

    const snapshot: SubscriptionSnapshot = {
      plan: {
        slug: ctx.slug,
        name: ctx.planName,
        status: ctx.status,
        limitations: ctx.limitations,
        showUpsellBanners: ctx.limitations.show_upsell_banners,
      },
      billing: {
        canManageBilling: Boolean(billingRow?.stripe_customer_id),
        hasStripeSubscription: Boolean(billingRow?.stripe_subscription_id),
        cancelAtPeriodEnd: Boolean(billingRow?.cancel_at_period_end),
        subscriptionStatus: billingRow?.status ?? ctx.status,
        currentPeriodEnd: billingRow?.current_period_end ?? null,
        pendingPlanChange: pendingChange,
      },
      usage,
      meters: {
        recordings: usageMeter({ ...ctx, usage }, 'recordings'),
        activities: usageMeter({ ...ctx, usage }, 'activities'),
        exports: usageMeter({ ...ctx, usage }, 'exports'),
      },
      plans: Object.values(PLAN_DEFINITIONS).map(p => ({
        slug: p.slug,
        name: p.name,
        description: p.description,
        price_usd: p.price_usd,
        billing_cycle: p.billing_cycle,
        is_popular: p.is_popular,
        features: p.features,
        limitations: p.limitations,
      })),
    }

    return snapshot
  } catch {
    return null
  }
}
