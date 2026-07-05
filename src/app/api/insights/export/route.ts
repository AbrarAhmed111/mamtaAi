import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  checkLimit,
  filterRecordingsByPlanHistory,
  getPlanLimits,
  incrementUsage,
  planLimitErrorResponse,
} from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .maybeSingle()
    const timezone = (profile as { timezone?: string } | null)?.timezone ?? null

    const ctx = await getPlanLimits(user.id, timezone)
    const limitCheck = await checkLimit(user.id, 'export_insights', { timezone })
    if (!limitCheck.allowed) {
      return planLimitErrorResponse(limitCheck, ctx.slug)
    }

    const { data: memberships } = await supabase
      .from('baby_parents')
      .select('baby_id')
      .eq('parent_id', user.id)
      .eq('invitation_status', 'accepted')
      .eq('can_view_history', true)

    const babyIds = Array.from(new Set((memberships || []).map((m: { baby_id: string }) => m.baby_id)))

    let recordings: { recorded_at: string; baby_id: string; duration_seconds: number | null }[] = []
    if (babyIds.length) {
      const { data } = await supabase
        .from('recordings')
        .select('recorded_at, baby_id, duration_seconds')
        .in('baby_id', babyIds)
        .order('recorded_at', { ascending: false })
        .limit(5000)
      recordings = (data || []) as typeof recordings
    }

    const filtered = filterRecordingsByPlanHistory(
      recordings,
      ctx.limitations.insights_history_days,
    )

    const rows = [
      ['recorded_at', 'baby_id', 'duration_seconds'].join(','),
      ...filtered.map(r =>
        [r.recorded_at, r.baby_id, r.duration_seconds ?? ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','),
      ),
    ]

    await incrementUsage(user.id, 'exports_count', 1, timezone)

    return new NextResponse(rows.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="MumtaAI-insights-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Export failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
