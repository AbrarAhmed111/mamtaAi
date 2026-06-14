import { NextResponse } from 'next/server'
import { requireOximeterAuth, requireDeviceOwnership } from '@/lib/oximeter/access'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireOximeterAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const owned = await requireDeviceOwnership(auth.supabase, auth.user.id, id)
  if (owned instanceof NextResponse) return owned

  const body = await request.json().catch(() => ({}))
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.connectionStatus != null) patch.connection_status = String(body.connectionStatus)
  if (body.deviceName != null) patch.device_name = String(body.deviceName)
  if (body.babyId != null) patch.baby_id = body.babyId ? String(body.babyId) : null
  if (body.batteryLevel != null) patch.battery_level = Number(body.batteryLevel)
  if (body.lastReadingAt != null) patch.last_reading_at = String(body.lastReadingAt)
  if (body.lastConnectedAt != null) patch.last_connected_at = String(body.lastConnectedAt)
  if (typeof body.isActive === 'boolean') patch.is_active = body.isActive

  const { data, error } = await auth.supabase
    .from('oximeter_devices')
    .update(patch as never)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ device: data })
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireOximeterAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const owned = await requireDeviceOwnership(auth.supabase, auth.user.id, id)
  if (owned instanceof NextResponse) return owned

  const { error } = await auth.supabase.from('oximeter_devices').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
