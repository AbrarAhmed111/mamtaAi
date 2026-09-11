import { NextResponse } from 'next/server'
import { requireBabyAccess, requireOximeterAuth } from '@/lib/oximeter/access'
import type { OximeterBreachKind } from '@/lib/oximeter/baby-thresholds'
import { dispatchOximeterAlert } from '@/lib/notifications/oximeter-notifications'
import { parseNotificationPreferences } from '@/lib/notification-preferences'

const VALID_BREACHES = new Set<OximeterBreachKind>([
  'spo2_low',
  'spo2_high',
  'pulse_low',
  'pulse_high',
])

export async function POST(request: Request) {
  const auth = await requireOximeterAuth()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const babyId = String(body.babyId || '').trim()
  const babyName = String(body.babyName || 'Baby').trim()
  const spo2 = Number(body.spo2)
  const pulse = Number(body.pulse)
  const title = String(body.title || '').trim()
  const message = String(body.body || body.message || '').trim()
  const breaches = Array.isArray(body.breaches)
    ? (body.breaches.filter((b: unknown) => typeof b === 'string' && VALID_BREACHES.has(b as OximeterBreachKind)) as OximeterBreachKind[])
    : []

  if (!babyId || !title || !message) {
    return NextResponse.json({ error: 'babyId, title, and body are required' }, { status: 400 })
  }
  if (!Number.isFinite(spo2) || !Number.isFinite(pulse)) {
    return NextResponse.json({ error: 'Invalid vitals' }, { status: 400 })
  }
  if (breaches.length === 0) {
    return NextResponse.json({ error: 'At least one breach type is required' }, { status: 400 })
  }

  const denied = await requireBabyAccess(auth.supabase, auth.user.id, babyId)
  if (denied) return denied

  const { data: profile } = await auth.supabase
    .from('profiles')
    .select('metadata')
    .eq('id', auth.user.id)
    .maybeSingle()

  const prefs = parseNotificationPreferences(profile?.metadata)
  const wantsEmail = prefs.emailProductUpdates !== false

  await dispatchOximeterAlert({
    userId: auth.user.id,
    babyId,
    babyName,
    spo2,
    pulse,
    breaches,
    title,
    body: message,
    sendEmail: wantsEmail,
  })

  return NextResponse.json({ ok: true })
}
