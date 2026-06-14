import { NextResponse } from 'next/server'
import { requireOximeterAuth, requireBabyAccess } from '@/lib/oximeter/access'
import { updateSessionStats } from '@/lib/oximeter/session-server'
import { detectAlarms } from '@/lib/oximeter/thresholds'
import {
  mapAlarmsToDb,
  mapSignalQuality,
  readingIsPlausible,
  validateReadingPayload,
} from '@/lib/oximeter/validate'

const lastInsertBySession = new Map<string, { at: number; spo2: number; pulse: number; hex?: string }>()

export async function GET(request: Request) {
  const auth = await requireOximeterAuth()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const babyId = url.searchParams.get('babyId')
  const sessionId = url.searchParams.get('sessionId')
  const limit = Math.min(300, Math.max(1, Number(url.searchParams.get('limit') || 120)))

  if (!babyId) {
    return NextResponse.json({ error: 'babyId is required' }, { status: 400 })
  }

  const denied = await requireBabyAccess(auth.supabase, auth.user.id, babyId)
  if (denied) return denied

  let q = auth.supabase
    .from('oximeter_readings')
    .select('*')
    .eq('baby_id', babyId)
    .order('measured_at', { ascending: false })
    .limit(limit)

  if (sessionId) {
    q = q.eq('session_id' as 'baby_id', sessionId)
  }

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ readings: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireOximeterAuth()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const babyId = String(body.babyId || '').trim()
  const sessionId = String(body.sessionId || '').trim()
  const deviceBleId = String(body.deviceId || body.deviceBleId || 'unknown').trim()
  const deviceRowId = body.deviceRowId ? String(body.deviceRowId) : null

  if (!babyId || !sessionId) {
    return NextResponse.json({ error: 'babyId and sessionId are required' }, { status: 400 })
  }

  const validated = validateReadingPayload(body)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const denied = await requireBabyAccess(auth.supabase, auth.user.id, babyId)
  if (denied) return denied

  const { data: session } = await auth.supabase
    .from('oximeter_sessions' as 'oximeter_readings')
    .select('id, status, baby_id')
    .eq('id', sessionId)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  const sessionRow = session as { id: string; status: string; baby_id: string }
  if (sessionRow.status !== 'active') {
    return NextResponse.json({ error: 'Session is not active' }, { status: 409 })
  }
  if (sessionRow.baby_id !== babyId) {
    return NextResponse.json({ error: 'Session baby mismatch' }, { status: 400 })
  }

  const now = Date.now()
  const last = lastInsertBySession.get(sessionId)
  const rawHex =
    validated.rawOnly && body.rawPayload && typeof body.rawPayload === 'object'
      ? String((body.rawPayload as { hex?: string }).hex ?? '')
      : ''

  if (validated.rawOnly) {
    if (last && now - last.at < 800 && last.hex === rawHex && rawHex) {
      return NextResponse.json({ skipped: true, reason: 'duplicate' })
    }
  } else if (
    last &&
    now - last.at < 800 &&
    last.spo2 === validated.spo2 &&
    last.pulse === validated.pulseRate
  ) {
    return NextResponse.json({ skipped: true, reason: 'duplicate' })
  }

  const signalQualityNum =
    body.signalQuality != null ? Number(body.signalQuality) : null
  const isValid = validated.rawOnly
    ? false
    : typeof body.isValid === 'boolean'
      ? body.isValid
      : readingIsPlausible(validated.spo2, validated.pulseRate)

  const alarms = validated.rawOnly
    ? []
    : detectAlarms(validated.spo2, validated.pulseRate, signalQualityNum, isValid)
  const alarmMeta = mapAlarmsToDb(alarms)

  const insertRow = {
    baby_id: babyId,
    spo2_percentage: validated.spo2,
    pulse_rate_bpm: validated.pulseRate,
    perfusion_index: body.perfusionIndex != null ? Number(body.perfusionIndex) : null,
    status: validated.rawOnly ? 'borderline' : alarmMeta.status,
    is_alarm: validated.rawOnly ? false : alarmMeta.is_alarm,
    alarm_reason: validated.rawOnly ? null : alarmMeta.alarm_reason,
    device_id: deviceBleId,
    device_model: body.deviceModel ? String(body.deviceModel) : null,
    signal_quality: mapSignalQuality(signalQualityNum),
    measured_at: validated.measuredAt,
    session_id: sessionId,
    user_id: auth.user.id,
    is_valid: isValid,
    raw_payload: body.rawPayload ?? null,
    metadata: {
      ...(deviceRowId ? { device_row_id: deviceRowId } : {}),
      ...(validated.rawOnly ? { decode_pending: true } : {}),
    },
  }

  const { data, error } = await auth.supabase
    .from('oximeter_readings')
    .insert(insertRow as never)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  lastInsertBySession.set(sessionId, {
    at: now,
    spo2: validated.spo2,
    pulse: validated.pulseRate,
    hex: rawHex || undefined,
  })

  if (isValid && !validated.rawOnly) {
    await updateSessionStats(auth.supabase, sessionId, validated.spo2, validated.pulseRate)
  }

  if (deviceRowId) {
    await auth.supabase
      .from('oximeter_devices')
      .update({
        last_reading_at: validated.measuredAt,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', deviceRowId)
      .eq('owner_id', auth.user.id)
  }

  return NextResponse.json({ reading: data }, { status: 201 })
}
