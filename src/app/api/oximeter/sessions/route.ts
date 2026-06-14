import { NextResponse } from 'next/server'
import { requireOximeterAuth, requireBabyAccess, requireDeviceOwnership } from '@/lib/oximeter/access'
import { getActiveSessionForUser } from '@/lib/oximeter/session-server'

export async function GET(request: Request) {
  const auth = await requireOximeterAuth()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const babyId = url.searchParams.get('babyId')
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 20)))

  let q = auth.supabase
    .from('oximeter_sessions' as 'oximeter_readings')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (babyId) {
    const denied = await requireBabyAccess(auth.supabase, auth.user.id, babyId)
    if (denied) return denied
    q = q.eq('baby_id', babyId)
  }

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sessions: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireOximeterAuth()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const babyId = String(body.babyId || '').trim()
  const deviceRowId = body.deviceId ? String(body.deviceId) : null

  if (!babyId) {
    return NextResponse.json({ error: 'babyId is required' }, { status: 400 })
  }

  const denied = await requireBabyAccess(auth.supabase, auth.user.id, babyId)
  if (denied) return denied

  if (deviceRowId) {
    const owned = await requireDeviceOwnership(auth.supabase, auth.user.id, deviceRowId)
    if (owned instanceof NextResponse) return owned
  }

  const existing = await getActiveSessionForUser(auth.supabase, auth.user.id, babyId)
  if (existing) {
    return NextResponse.json({ session: existing })
  }

  const { data, error } = await auth.supabase
    .from('oximeter_sessions' as 'oximeter_readings')
    .insert({
      user_id: auth.user.id,
      baby_id: babyId,
      device_row_id: deviceRowId,
      status: 'active',
      started_at: new Date().toISOString(),
    } as never)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session: data }, { status: 201 })
}
