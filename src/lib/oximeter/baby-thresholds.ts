import { DEFAULT_OXIMETER_THRESHOLDS } from './thresholds'

export type OximeterBreachKind = 'spo2_low' | 'spo2_high' | 'pulse_low' | 'pulse_high'

export type BabyOximeterAlerts = {
  enabled: boolean
  spo2Min: number
  spo2Max: number
  pulseMin: number
  pulseMax: number
}

export const OXIMETER_ALERT_SUSTAINED_MS = 5000
export const OXIMETER_ALERT_COOLDOWN_MS = 60_000

export const DEFAULT_BABY_OXIMETER_ALERTS: BabyOximeterAlerts = {
  enabled: true,
  spo2Min: DEFAULT_OXIMETER_THRESHOLDS.spo2AttentionMin,
  spo2Max: 100,
  pulseMin: DEFAULT_OXIMETER_THRESHOLDS.pulseLow,
  pulseMax: DEFAULT_OXIMETER_THRESHOLDS.pulseHigh,
}

/** Allowed alert limit ranges (matches sanitize + oximeter devices). */
export const OXIMETER_ALERT_BOUNDS = {
  spo2: { min: 50, max: 100, label: 'SpO₂', unit: '%' },
  pulse: { min: 30, max: 250, label: 'Pulse', unit: ' BPM' },
} as const

export function parseBabyOximeterAlerts(metadata: unknown): BabyOximeterAlerts {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return { ...DEFAULT_BABY_OXIMETER_ALERTS }
  }
  const raw = (metadata as Record<string, unknown>).oximeterAlerts
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_BABY_OXIMETER_ALERTS }
  }
  const p = raw as Record<string, unknown>
  return sanitizeBabyOximeterAlerts(p)
}

export function sanitizeBabyOximeterAlerts(input: unknown): BabyOximeterAlerts {
  const base = { ...DEFAULT_BABY_OXIMETER_ALERTS }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return base
  const p = input as Record<string, unknown>

  const num = (v: unknown, fallback: number, min: number, max: number) => {
    const n = Number(v)
    if (!Number.isFinite(n)) return fallback
    return Math.min(max, Math.max(min, Math.round(n)))
  }

  const alerts: BabyOximeterAlerts = {
    enabled: p.enabled !== false,
    spo2Min: num(p.spo2Min, base.spo2Min, 50, 100),
    spo2Max: num(p.spo2Max, base.spo2Max, 50, 100),
    pulseMin: num(p.pulseMin, base.pulseMin, 30, 250),
    pulseMax: num(p.pulseMax, base.pulseMax, 30, 250),
  }

  if (alerts.spo2Min > alerts.spo2Max) {
    alerts.spo2Min = Math.min(alerts.spo2Min, alerts.spo2Max)
  }
  if (alerts.pulseMin > alerts.pulseMax) {
    alerts.pulseMin = Math.min(alerts.pulseMin, alerts.pulseMax)
  }

  return alerts
}

export function mergeOximeterAlertsIntoMetadata(
  metadata: unknown,
  alerts: BabyOximeterAlerts,
): Record<string, unknown> {
  const base =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {}
  base.oximeterAlerts = alerts
  return base
}

export function evaluateBabyOximeterBreaches(
  spo2: number,
  pulse: number,
  alerts: BabyOximeterAlerts,
): OximeterBreachKind[] {
  if (!alerts.enabled) return []
  const breaches: OximeterBreachKind[] = []
  if (spo2 < alerts.spo2Min) breaches.push('spo2_low')
  if (spo2 > alerts.spo2Max) breaches.push('spo2_high')
  if (pulse < alerts.pulseMin) breaches.push('pulse_low')
  if (pulse > alerts.pulseMax) breaches.push('pulse_high')
  return breaches
}

export function breachKindLabel(kind: OximeterBreachKind): string {
  switch (kind) {
    case 'spo2_low':
      return 'SpO₂ below minimum'
    case 'spo2_high':
      return 'SpO₂ above maximum'
    case 'pulse_low':
      return 'Pulse below minimum'
    case 'pulse_high':
      return 'Pulse above maximum'
  }
}

function breachParentHint(kind: OximeterBreachKind): string {
  switch (kind) {
    case 'spo2_low':
      return 'readings look lower than usual'
    case 'spo2_high':
      return 'readings look higher than usual'
    case 'pulse_low':
      return 'readings look slower than usual'
    case 'pulse_high':
      return 'readings look faster than usual'
  }
}

export function buildOximeterAlertCopy(args: {
  babyName: string
  breaches: OximeterBreachKind[]
  spo2: number
  pulse: number
  alerts: BabyOximeterAlerts
}): { title: string; body: string } {
  const { babyName, breaches } = args

  const title = `Please check on ${babyName}`

  if (breaches.length === 1) {
    const body = [
      `Please check your baby — ${babyName}'s monitor ${breachParentHint(breaches[0])} for a few moments.`,
      'Make sure they are comfortable, calm, and the sensor is fitted properly.',
      'If something does not look right or you feel worried, contact your doctor or seek medical advice.',
    ].join(' ')
    return { title, body }
  }

  const body = [
    `Please check your baby — ${babyName}'s monitor readings need your attention.`,
    'Make sure they are comfortable, calm, and the sensor is fitted properly.',
    'If something does not look right or you feel worried, contact your doctor or seek medical advice.',
  ].join(' ')

  return { title, body }
}

export function breachUsesSpo2Pref(kind: OximeterBreachKind): boolean {
  return kind === 'spo2_low' || kind === 'spo2_high'
}
