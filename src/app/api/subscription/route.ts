import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  ensureFreeSubscription,
  getPlanLimits,
  PLAN_DEFINITIONS,
  syncUsageFromDatabase,
  usageMeter,
} from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureFreeSubscription(user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .maybeSingle()

    const timezone = (profile as { timezone?: string } | null)?.timezone ?? null
    const usage = await syncUsageFromDatabase(user.id, timezone)
    const ctx = await getPlanLimits(user.id, timezone)

    const { data: billingRow } = await supabase
      .from('user_subscriptions')
      .select('status, cancel_at_period_end, stripe_customer_id, stripe_subscription_id, current_period_end')
      .eq('user_id', user.id)
      .in('status', ['trial', 'active', 'paused', 'payment_failed', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const recordingsMeter = usageMeter({ ...ctx, usage }, 'recordings')
    const activitiesMeter = usageMeter({ ...ctx, usage }, 'activities')
    const exportsMeter = usageMeter({ ...ctx, usage }, 'exports')

    const plans = Object.values(PLAN_DEFINITIONS).map(p => ({
      slug: p.slug,
      name: p.name,
      description: p.description,
      price_usd: p.price_usd,
      billing_cycle: p.billing_cycle,
      is_popular: p.is_popular,
      features: p.features,
      limitations: p.limitations,
    }))

    return NextResponse.json({
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
      },
      usage,
      meters: {
        recordings: recordingsMeter,
        activities: activitiesMeter,
        exports: exportsMeter,
      },
      plans,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
