import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi, getAdminDb } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status') || ''
  const plan = searchParams.get('plan') || ''
  const q = (searchParams.get('q') || '').trim()
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)))
  const offset = (page - 1) * limit

  const db = getAdminDb()
  let query = (db as any)
    .from('user_subscriptions')
    .select(
      `
      id,
      user_id,
      status,
      stripe_subscription_id,
      stripe_customer_id,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      created_at,
      profile:profiles!user_subscriptions_user_id_fkey(id, full_name, role),
      plan:subscription_plans!user_subscriptions_plan_id_fkey(slug, name, price_usd)
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (plan) query = query.eq('plan.slug', plan)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let items = (data || []).map((row: Record<string, unknown>) => ({
    id: row.id,
    userId: row.user_id,
    status: row.status,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripeCustomerId: row.stripe_customer_id,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    createdAt: row.created_at,
    userName: (row.profile as { full_name?: string })?.full_name ?? 'Unknown',
    userRole: (row.profile as { role?: string })?.role,
    planSlug: (row.plan as { slug?: string })?.slug,
    planName: (row.plan as { name?: string })?.name,
    priceUsd: (row.plan as { price_usd?: number })?.price_usd,
  }))

  if (q) {
    const lower = q.toLowerCase()
    items = items.filter(
      (s: { userName: string; userId: string; planSlug?: string }) =>
        s.userName.toLowerCase().includes(lower) ||
        s.userId.includes(lower) ||
        (s.planSlug || '').includes(lower),
    )
  }

  return NextResponse.json({
    subscriptions: items,
    pagination: { page, limit, total: count ?? items.length },
  })
}
