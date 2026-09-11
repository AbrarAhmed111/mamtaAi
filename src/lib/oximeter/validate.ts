import type { OximeterAlarmType } from './types'

export function validateReadingPayload(body: {
  spo2?: unknown
  pulseRate?: unknown
  measuredAt?: unknown
  rawPayload?: unknown
  decodePending?: unknown
}):
  | { ok: true; spo2: number; pulseRate: number; measuredAt: string; rawOnly: boolean }
  | { ok: false; error: string } {
  const measuredAt =
    typeof body.measuredAt === 'string' && body.measuredAt.trim()
      ? body.measuredAt
      : new Date().toISOString()
  const ts = new Date(measuredAt).getTime()
  if (Number.isNaN(ts)) return { ok: false, error: 'Invalid measuredAt timestamp' }
  if (ts > Date.now() + 60_000) return { ok: false, error: 'Reading timestamp is in the future' }
  if (ts < Date.now() - 24 * 60 * 60 * 1000) {
    return { ok: false, error: 'Reading timestamp is too old' }
  }

  const rawOnly =
    body.decodePending === true &&
    body.rawPayload != null &&
    typeof body.rawPayload === 'object'

  if (rawOnly) {
    return { ok: true, spo2: 0, pulseRate: 0, measuredAt, rawOnly: true }
  }

  const spo2 = Number(body.spo2)
  const pulseRate = Number(body.pulseRate)
  if (!Number.isFinite(spo2) || spo2 < 0 || spo2 > 100) {
    return { ok: false, error: 'SpO₂ must be between 0 and 100' }
  }
  if (!Number.isFinite(pulseRate) || pulseRate < 0 || pulseRate > 300) {
    return { ok: false, error: 'Pulse rate must be between 0 and 300 BPM' }
  }

  return { ok: true, spo2, pulseRate, measuredAt, rawOnly: false }
}

export function readingIsPlausible(spo2: number, pulseRate: number): boolean {
  if (spo2 === 0 && pulseRate === 0) return false
  if (spo2 > 0 && spo2 < 50) return false
  if (pulseRate > 0 && pulseRate < 30) return false
  return true
}

export function mapAlarmsToDb(alarmTypes: OximeterAlarmType[]): {
  status: string
  is_alarm: boolean
  alarm_reason: string | null
} {
  if (alarmTypes.length === 0) {
    return { status: 'normal', is_alarm: false, alarm_reason: null }
  }
  const hasCritical = alarmTypes.includes('low_spo2')
  const status = hasCritical ? 'critical' : alarmTypes.includes('low_spo2') ? 'low' : 'borderline'
  return {
    status,
    is_alarm: true,
    alarm_reason: alarmTypes.join(','),
  }
}

export function mapSignalQuality(score: number | null | undefined): string | null {
  if (score == null) return null
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'fair'
  return 'poor'
}
