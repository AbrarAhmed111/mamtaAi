import { NextResponse } from 'next/server'
import { requireAdminApi, getAdminDb } from '@/lib/admin'
import { formatAccountType } from '@/lib/expert/profile-role'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const db = getAdminDb()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [
    usersRes,
    babiesRes,
    recordingsWeekRes,
    pendingExpertsRes,
    recentUsersRes,
    subsRes,
    plansRes,
    reportsRes,
    errorLogsRes,
  ] = await Promise.all([
    (db as any).from('profiles').select('id', { count: 'exact', head: true }),
    (db as any).from('babies').select('id', { count: 'exact', head: true }).eq('is_active', true),
    (db as any)
      .from('recordings')
      .select('id', { count: 'exact', head: true })
      .gte('recorded_at', weekAgo.toISOString()),
    (db as any)
      .from('expert_applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    (db as any)
      .from('profiles')
      .select('id, full_name, role, is_expert, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(5),
    (db as any)
      .from('user_subscriptions')
      .select('id, status, plan:subscription_plans!user_subscriptions_plan_id_fkey(slug, price_usd)')
      .in('status', ['trial', 'active', 'paused']),
    (db as any).from('subscription_plans').select('slug, price_usd'),
    (db as any)
      .from('content_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    (db as any)
      .from('error_logs')
      .select('id', { count: 'exact', head: true })
      .eq('is_resolved', false),
  ])

  const planBreakdown: Record<string, number> = { free: 0, plus: 0, pro: 0 }
  let mrr = 0

  for (const row of subsRes.data || []) {
    const slug = row.plan?.slug as string | undefined
    if (slug && slug in planBreakdown) {
      planBreakdown[slug] += 1
      if (slug === 'plus' || slug === 'pro') {
        mrr += Number(row.plan?.price_usd ?? 0)
      }
    }
  }

  const recentSignups = (recentUsersRes.data || []).map((u: Record<string, unknown>) => ({
    id: u.id,
    fullName: u.full_name,
    role: u.role,
    isExpert: u.is_expert === true,
    accountType: formatAccountType(String(u.role ?? 'parent'), u.is_expert === true),
    createdAt: u.created_at,
    suspended: Boolean((u.metadata as Record<string, unknown> | null)?.suspended),
  }))

  return NextResponse.json({
    platform: {
      totalUsers: usersRes.count ?? 0,
      totalBabies: babiesRes.count ?? 0,
      recordingsThisWeek: recordingsWeekRes.count ?? 0,
      mrr: Math.round(mrr * 100) / 100,
    },
    pendingExperts: pendingExpertsRes.count ?? 0,
    flaggedContent: reportsRes.count ?? 0,
    unresolvedErrors: errorLogsRes.count ?? 0,
    planBreakdown,
    recentSignups,
    plans: plansRes.data ?? [],
  })
}
