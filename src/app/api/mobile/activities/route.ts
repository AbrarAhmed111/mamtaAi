import { NextResponse, type NextRequest } from 'next/server'
import { requireMobileAuth, requireMobileBabyAccess } from '@/lib/mobile/auth'
import { supabaseAdmin } from '@/lib/supabase/client'
import { checkLimit, getPlanLimits, incrementUsage, planLimitErrorResponse } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

const allowedTypes = new Set([
  'feeding',
  'sleep',
  'diaper_change',
  'play',
  'bath',
  'medicine',
  'milestone',
  'other',
])

export async function GET(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const babyId = searchParams.get('babyId')
  const activityType = searchParams.get('activityType')
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)))
  if (!babyId) return NextResponse.json({ error: 'babyId is required' }, { status: 400 })

  const access = await requireMobileBabyAccess(auth.auth.user.id, babyId)
  if (!access.ok) return access.response

  let query = (supabaseAdmin as any)
    .from('baby_activities')
    .select('*')
    .eq('baby_id', babyId)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (activityType) query = query.eq('activity_type', activityType)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ activities: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const babyId = String(body.babyId || '').trim()
  const activityType = String(body.activityType || body.activity_type || '').trim()
  if (!babyId) return NextResponse.json({ error: 'babyId is required' }, { status: 400 })
  if (!allowedTypes.has(activityType)) return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 })

  const access = await requireMobileBabyAccess(auth.auth.user.id, babyId)
  if (!access.ok) return access.response

  const timezone = auth.auth.profile?.timezone ?? null
  const planCtx = await getPlanLimits(auth.auth.user.id, timezone)
  const activityLimit = await checkLimit(auth.auth.user.id, 'create_activity', { timezone, activityType })
  if (!activityLimit.allowed) return planLimitErrorResponse(activityLimit, planCtx.slug)

  const startedAt = body.startedAt || body.started_at ? new Date(body.startedAt || body.started_at) : new Date()
  if (Number.isNaN(startedAt.getTime())) {
    return NextResponse.json({ error: 'Invalid start time' }, { status: 400 })
  }

  const insert: Record<string, unknown> = {
    baby_id: babyId,
    recorded_by: auth.auth.user.id,
    activity_type: activityType,
    started_at: startedAt.toISOString(),
    notes: typeof body.notes === 'string' ? body.notes : null,
  }

  if (body.endedAt || body.ended_at) {
    const endedAt = new Date(body.endedAt || body.ended_at)
    if (Number.isNaN(endedAt.getTime()) || endedAt.getTime() <= startedAt.getTime()) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }
    insert.ended_at = endedAt.toISOString()
  }

  if (activityType === 'feeding') {
    insert.food_type = body.feedingType || body.feeding_type || 'other'
    if (body.amountMl || body.amount_ml) insert.amount_ml = Number(body.amountMl || body.amount_ml)
  }
  if (activityType === 'diaper_change') {
    insert.diaper_type = body.diaperType || body.diaper_type || 'wet'
  }
  if (activityType === 'sleep' && !insert.ended_at) {
    return NextResponse.json({ error: 'Sleep end time is required' }, { status: 400 })
  }
  if (activityType === 'milestone') {
    insert.milestone_category = body.milestoneCategory || body.milestone_category || 'other'
    insert.milestone_description = body.milestoneDescription || body.milestone_description || body.notes || null
  }

  const { data, error } = await (supabaseAdmin as any)
    .from('baby_activities')
    .insert(insert)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await incrementUsage(auth.auth.user.id, 'activities_count', 1, timezone)
  return NextResponse.json({ activity: data }, { status: 201 })
}

