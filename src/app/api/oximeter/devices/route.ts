import { NextResponse } from 'next/server'
import { requireOximeterAuth, requireBabyAccess } from '@/lib/oximeter/access'

export async function GET() {
  const auth = await requireOximeterAuth()
  if (!auth.ok) return auth.response

  const { supabase, user } = auth
  const { data, error } = await supabase
    .from('oximeter_devices')
    .select('*')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ devices: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireOximeterAuth()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const deviceId = String(body.deviceId || body.device_identifier || '').trim()
  const deviceName = body.deviceName ? String(body.deviceName) : null
  const model = body.model ? String(body.model) : null
  const manufacturer = body.manufacturer ? String(body.manufacturer) : null
  const babyId = body.babyId ? String(body.babyId) : null

  if (!deviceId) {
    return NextResponse.json({ error: 'deviceId is required' }, { status: 400 })
  }

  const { supabase, user } = auth

  if (babyId) {
    const denied = await requireBabyAccess(supabase, user.id, babyId)
    if (denied) return denied
  }

  const { data: existing } = await supabase
    .from('oximeter_devices')
    .select('id')
    .eq('device_id', deviceId)
    .maybeSingle()

  if (existing?.id) {
    const { data: updated, error } = await supabase
      .from('oximeter_devices')
      .update({
        device_name: deviceName,
        model,
        manufacturer,
        baby_id: babyId,
        connection_status: 'connected',
        last_connected_at: new Date().toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', existing.id)
      .eq('owner_id', user.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ device: updated })
  }

  const { data: created, error } = await supabase
    .from('oximeter_devices')
    .insert({
      device_id: deviceId,
      owner_id: user.id,
      device_name: deviceName,
      model,
      manufacturer,
      baby_id: babyId,
      connection_status: 'connected',
      last_connected_at: new Date().toISOString(),
      is_active: true,
      is_trusted: Boolean(body.isTrusted),
    } as never)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ device: created }, { status: 201 })
}
