import { supabaseAdmin } from '@/lib/supabase/client'
import { getPlanDefinition, mergeLimitations, PLAN_DEFINITIONS } from './plans'
import type {
  PlanLimitations,
  PlanSlug,
  SubscriptionContext,
  UsageCounterKey,
  UsageStats,
  UserSubscriptionRow,
} from './types'
import { getCurrentUsagePeriod, normalizeUsageStats } from './usage'

const ACTIVE_STATUSES = new Set(['trial', 'active'])

export async function getFreePlanId(): Promise<string | null> {
  const { data } = await (supabaseAdmin as any)
    .from('subscription_plans')
    .select('id')
    .eq('slug', 'free')
    .maybeSingle()
  return data?.id ?? null
}

export async function ensureFreeSubscription(userId: string): Promise<void> {
  const { data: existing } = await (supabaseAdmin as any)
    .from('user_subscriptions')
    .select('id, status')
    .eq('user_id', userId)
    .in('status', ['trial', 'active', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing?.id) return

  let planId = await getFreePlanId()
  if (!planId) {
    await seedSubscriptionPlansIfMissing()
    planId = await getFreePlanId()
  }
  if (!planId) return

  const now = new Date()
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  await (supabaseAdmin as any).from('user_subscriptions').insert({
    user_id: userId,
    plan_id: planId,
    status: 'active',
    start_date: now.toISOString(),
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    auto_renew: false,
    usage_stats: { period: getCurrentUsagePeriod() },
  })
}

export async function seedSubscriptionPlansIfMissing(): Promise<void> {
  for (const def of Object.values(PLAN_DEFINITIONS)) {
    const { data: existing } = await (supabaseAdmin as any)
      .from('subscription_plans')
      .select('id')
      .eq('slug', def.slug)
      .maybeSingle()

    if (existing?.id) {
      await (supabaseAdmin as any)
        .from('subscription_plans')
        .update({
          name: def.name,
          description: def.description,
          price_usd: def.price_usd,
          billing_cycle: def.billing_cycle,
          features: def.features,
          limitations: def.limitations,
          is_popular: def.is_popular,
          display_order: def.display_order,
          is_active: true,
          is_visible: def.slug !== 'free',
          updated_at: new Date().toISOString(),
        })
        .eq('slug', def.slug)
      continue
    }

    await (supabaseAdmin as any).from('subscription_plans').insert({
      name: def.name,
      slug: def.slug,
      description: def.description,
      price_usd: def.price_usd,
      billing_cycle: def.billing_cycle,
      trial_days: 0,
      features: def.features,
      limitations: def.limitations,
      is_popular: def.is_popular,
      display_order: def.display_order,
      is_active: true,
      is_visible: def.slug !== 'free',
    })
  }
}

export async function getUserSubscription(userId: string): Promise<UserSubscriptionRow | null> {
  const { data } = await (supabaseAdmin as any)
    .from('user_subscriptions')
    .select(
      `
      id,
      user_id,
      plan_id,
      status,
      usage_stats,
      current_period_start,
      current_period_end,
      plan:subscription_plans!user_subscriptions_plan_id_fkey (
        slug,
        name,
        limitations,
        features
      )
    `,
    )
    .eq('user_id', userId)
    .in('status', Array.from(ACTIVE_STATUSES))
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as UserSubscriptionRow) ?? null
}

export async function getSubscriptionContext(userId: string, timezone?: string | null): Promise<SubscriptionContext> {
  const row = await getUserSubscription(userId)
  const period = getCurrentUsagePeriod(timezone)

  if (!row?.plan) {
    const free = getPlanDefinition('free')
    return {
      slug: 'free',
      planName: free.name,
      limitations: free.limitations,
      usage: normalizeUsageStats(null, period),
      subscriptionId: null,
      status: 'active',
    }
  }

  const slug = (row.plan.slug || 'free') as PlanSlug
  const limitations = mergeLimitations(row.plan.limitations as PlanLimitations, slug)

  return {
    slug,
    planName: row.plan.name || getPlanDefinition(slug).name,
    limitations,
    usage: normalizeUsageStats(row.usage_stats, period),
    subscriptionId: row.id,
    status: row.status,
  }
}

export async function getPlanLimits(userId: string, timezone?: string | null): Promise<SubscriptionContext> {
  return getSubscriptionContext(userId, timezone)
}

export async function incrementUsage(
  userId: string,
  usageKey: UsageCounterKey,
  amount = 1,
  timezone?: string | null,
): Promise<UsageStats> {
  const row = await getUserSubscription(userId)
  const period = getCurrentUsagePeriod(timezone)
  let usage = normalizeUsageStats(row?.usage_stats ?? null, period)

  const current = Number(usage[usageKey] ?? 0)
  usage = { ...usage, [usageKey]: current + amount }

  if (row?.id) {
    await (supabaseAdmin as any)
      .from('user_subscriptions')
      .update({ usage_stats: usage, updated_at: new Date().toISOString() })
      .eq('id', row.id)
  } else {
    await ensureFreeSubscription(userId)
    const refreshed = await getUserSubscription(userId)
    if (refreshed?.id) {
      await (supabaseAdmin as any)
        .from('user_subscriptions')
        .update({ usage_stats: usage, updated_at: new Date().toISOString() })
        .eq('id', refreshed.id)
    }
  }

  return usage
}

export async function syncUsageFromDatabase(userId: string, timezone?: string | null): Promise<UsageStats> {
  const period = getCurrentUsagePeriod(timezone)
  const [year, month] = period.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 1))

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)

  const { count: recordings } = await (supabaseAdmin as any)
    .from('recordings')
    .select('id', { count: 'exact', head: true })
    .eq('recorded_by', userId)
    .gte('recorded_at', start.toISOString())
    .lt('recorded_at', end.toISOString())

  const { count: activities } = await (supabaseAdmin as any)
    .from('baby_activities')
    .select('id', { count: 'exact', head: true })
    .eq('recorded_by', userId)
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())

  const { count: forumMonth } = await (supabaseAdmin as any)
    .from('forum_threads')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', userId)
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())

  const { count: forumWeek } = await (supabaseAdmin as any)
    .from('forum_threads')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', userId)
    .gte('created_at', weekStart.toISOString())

  const { count: blogPosts } = await (supabaseAdmin as any)
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', userId)
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())

  const usage: UsageStats = {
    period,
    recordings_count: recordings ?? 0,
    activities_count: activities ?? 0,
    forum_threads_count: forumMonth ?? 0,
    forum_threads_week_count: forumWeek ?? 0,
    blog_posts_count: blogPosts ?? 0,
    exports_count: normalizeUsageStats(
      (await getUserSubscription(userId))?.usage_stats ?? null,
      period,
    ).exports_count,
  }

  const row = await getUserSubscription(userId)
  if (row?.id) {
    await (supabaseAdmin as any)
      .from('user_subscriptions')
      .update({ usage_stats: usage, updated_at: new Date().toISOString() })
      .eq('id', row.id)
  }

  return usage
}
