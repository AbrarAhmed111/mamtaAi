import { NextResponse, type NextRequest } from 'next/server'
import { requireMobileAuth, requireMobileBabyAccess } from '@/lib/mobile/auth'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const babyId = searchParams.get('babyId')
  const limit = Math.min(300, Math.max(1, Number(searchParams.get('limit') || 120)))
  if (!babyId) return NextResponse.json({ error: 'babyId is required' }, { status: 400 })

  const access = await requireMobileBabyAccess(auth.auth.user.id, babyId)
  if (!access.ok) return access.response

  const { data, error } = await (supabaseAdmin as any)
    .from('oximeter_readings')
    .select('*')
    .eq('baby_id', babyId)
    .order('measured_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    readings: (data || []).map((reading: any) => ({
      id: reading.id,
      babyId: reading.baby_id,
      spo2: reading.spo2_percentage,
      pulse: reading.pulse_rate_bpm,
      perfusionIndex: reading.perfusion_index,
      recordedAt: reading.measured_at,
      status: reading.status,
      isAlarm: reading.is_alarm,
    })),
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const babyId = String(body.babyId || '').trim()
  const spo2 = Number(body.spo2)
  const pulse = Number(body.pulse)
  if (!babyId) return NextResponse.json({ error: 'babyId is required' }, { status: 400 })
  if (!Number.isFinite(spo2) || !Number.isFinite(pulse)) {
    return NextResponse.json({ error: 'spo2 and pulse are required' }, { status: 400 })
  }

  const access = await requireMobileBabyAccess(auth.auth.user.id, babyId)
  if (!access.ok) return access.response

  const measuredAt = body.recordedAt ? new Date(body.recordedAt).toISOString() : new Date().toISOString()
  const { data, error } = await (supabaseAdmin as any)
    .from('oximeter_readings')
    .insert({
      baby_id: babyId,
      user_id: auth.auth.user.id,
      spo2_percentage: spo2,
      pulse_rate_bpm: pulse,
      perfusion_index: body.perfusionIndex != null ? Number(body.perfusionIndex) : null,
      measured_at: measuredAt,
      device_id: body.device?.id || body.deviceId || 'mobile',
      device_model: body.device?.name || body.deviceName || null,
      status: 'normal',
      is_alarm: false,
      is_valid: true,
      metadata: { source: 'expo-mobile' },
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reading: data }, { status: 201 })
}

