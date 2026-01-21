import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function requireMembership(supabase: Awaited<ReturnType<typeof createServerClient>>, babyId: string, userId: string) {
  const { data: membership } = await supabase
    .from('baby_parents')
    .select('baby_id')
    .eq('baby_id', babyId)
    .eq('parent_id', userId)
    .single()
  return membership
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: babyId } = await params
    const membership = await requireMembership(supabase, babyId, user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('baby_activities')
      .select('id, activity_type, started_at, ended_at, duration_minutes, feeding_type, food_type, amount_ml, notes')
      .eq('baby_id', babyId)
      .in('activity_type', ['feeding', 'sleep'])
      .order('started_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ items: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: babyId } = await params
    const membership = await requireMembership(supabase, babyId, user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const activityType = body.activity_type
    if (!['feeding', 'sleep'].includes(activityType)) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 })
    }

    const startedAt = body.started_at ? new Date(body.started_at) : null
    if (!startedAt || Number.isNaN(startedAt.getTime())) {
      return NextResponse.json({ error: 'Invalid start time' }, { status: 400 })
    }
    const now = new Date()
    if (startedAt.getTime() > now.getTime() + 5 * 60 * 1000) {
      return NextResponse.json({ error: 'Start time cannot be in the future' }, { status: 400 })
    }

    const insert: any = {
      baby_id: babyId,
      recorded_by: user.id,
      activity_type: activityType,
      started_at: startedAt.toISOString(),
      notes: typeof body.notes === 'string' ? body.notes : null,
    }

    if (activityType === 'feeding') {
      const { uiValue, invalid } = normalizeFeedingType(body.feeding_type)
      if (invalid) {
        return NextResponse.json({ error: 'Invalid feeding type' }, { status: 400 })
      }
      if (uiValue) {
        insert.food_type = uiValue
      }
      if (body.amount_ml !== undefined && body.amount_ml !== null && body.amount_ml !== '') {
        const amount = Number(body.amount_ml)
        if (Number.isNaN(amount) || amount < 0 || amount > 1000) {
          return NextResponse.json({ error: 'Feeding amount must be between 0 and 1000 ml' }, { status: 400 })
        }
        insert.amount_ml = amount
      }
    }

    if (activityType === 'sleep') {
      if (body.ended_at) {
        const endedAt = new Date(body.ended_at)
        if (Number.isNaN(endedAt.getTime()) || endedAt.getTime() <= startedAt.getTime()) {
          return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
        }
        if (endedAt.getTime() > now.getTime() + 5 * 60 * 1000) {
          return NextResponse.json({ error: 'End time cannot be in the future' }, { status: 400 })
        }
        const durationMinutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)
        if (durationMinutes > 24 * 60) {
          return NextResponse.json({ error: 'Sleep duration cannot exceed 24 hours' }, { status: 400 })
        }
        insert.ended_at = endedAt.toISOString()
      } else {
        return NextResponse.json({ error: 'Sleep end time is required' }, { status: 400 })
      }
    }

    const { data, error } = await supabase.from('baby_activities').insert(insert).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ item: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

function normalizeFeedingType(value: any): { uiValue: string | null; invalid: boolean } {
  if (value === null || value === undefined || value === '') return { uiValue: null, invalid: false }
  if (typeof value !== 'string') return { uiValue: null, invalid: true }
  const normalized = value.trim()
  if (normalized === '') return { uiValue: null, invalid: false }
  if (normalized === 'breast' || normalized === 'breast_left' || normalized === 'breast_right' || normalized === 'breast_both') {
    return { uiValue: 'breast', invalid: false }
  }
  if (normalized === 'formula' || normalized === 'bottle') return { uiValue: 'formula', invalid: false }
  if (normalized === 'solid') return { uiValue: 'solid', invalid: false }
  if (normalized === 'other') return { uiValue: 'other', invalid: false }
  return { uiValue: null, invalid: true }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: babyId } = await params
    const membership = await requireMembership(supabase, babyId, user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('activity_id')
    if (!activityId) return NextResponse.json({ error: 'Missing activity_id' }, { status: 400 })

    const { error } = await supabase
      .from('baby_activities')
      .delete()
      .eq('id', activityId)
      .eq('baby_id', babyId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

