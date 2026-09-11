import { NextResponse } from 'next/server'
import { requireOximeterAuth } from '@/lib/oximeter/access'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireOximeterAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const { data, error } = await auth.supabase
    .from('oximeter_sessions' as 'oximeter_readings')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  return NextResponse.json({ session: data })
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireOximeterAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const status = body.status ? String(body.status) : 'completed'
  const endReason = body.endReason ? String(body.endReason) : null

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status !== 'active') {
    patch.ended_at = body.endedAt ? String(body.endedAt) : new Date().toISOString()
    patch.end_reason = endReason
  }

  const { data, error } = await auth.supabase
    .from('oximeter_sessions' as 'oximeter_readings')
    .update(patch as never)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session: data })
}
