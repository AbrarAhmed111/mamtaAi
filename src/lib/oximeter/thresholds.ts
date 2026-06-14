import type { OximeterAlarmType, Spo2VisualStatus } from './types'

export type OximeterThresholds = {
  spo2NormalMin: number
  spo2AttentionMin: number
  spo2CriticalMin: number
  pulseLow: number
  pulseHigh: number
}

export const DEFAULT_OXIMETER_THRESHOLDS: OximeterThresholds = {
  spo2NormalMin: 95,
  spo2AttentionMin: 90,
  spo2CriticalMin: 85,
  pulseLow: 80,
  pulseHigh: 160,
}

export function classifySpo2(
  spo2: number | null,
  thresholds: OximeterThresholds = DEFAULT_OXIMETER_THRESHOLDS,
): Spo2VisualStatus {
  if (spo2 == null || spo2 <= 0 || spo2 > 100) return 'unreliable'
  if (spo2 < thresholds.spo2CriticalMin) return 'critical'
  if (spo2 < thresholds.spo2AttentionMin) return 'attention'
  if (spo2 < thresholds.spo2NormalMin) return 'attention'
  return 'normal'
}

export function spo2StatusLabel(status: Spo2VisualStatus): string {
  switch (status) {
    case 'normal':
      return 'Normal'
    case 'attention':
      return 'Attention'
    case 'critical':
      return 'Critical'
    case 'unreliable':
      return 'No reliable reading'
  }
}

export function spo2SafetyNote(status: Spo2VisualStatus): string | null {
  if (status === 'normal' || status === 'unreliable') return null
  return 'This reading may require attention. Check sensor placement and contact a healthcare professional when necessary. Device readings can be affected by motion, fit, and signal quality.'
}

export function detectAlarms(
  spo2: number | null,
  pulse: number | null,
  signalQuality: number | null,
  isValid: boolean,
  thresholds: OximeterThresholds = DEFAULT_OXIMETER_THRESHOLDS,
): OximeterAlarmType[] {
  const alarms: OximeterAlarmType[] = []
  if (!isValid) {
    alarms.push('poor_signal')
    return alarms
  }
  if (spo2 != null && spo2 > 0 && spo2 < thresholds.spo2AttentionMin) {
    alarms.push('low_spo2')
  }
  if (pulse != null && pulse > 0 && pulse < thresholds.pulseLow) {
    alarms.push('low_pulse')
  }
  if (pulse != null && pulse > thresholds.pulseHigh) {
    alarms.push('high_pulse')
  }
  if (signalQuality != null && signalQuality < 40) {
    alarms.push('poor_signal')
  }
  if (spo2 === 0 || pulse === 0) {
    alarms.push('sensor_removed')
  }
  return alarms
}

export function pulseStatusLabel(
  pulse: number | null,
  thresholds: OximeterThresholds = DEFAULT_OXIMETER_THRESHOLDS,
): string {
  if (pulse == null || pulse <= 0) return 'Waiting…'
  if (pulse < thresholds.pulseLow) return 'Low'
  if (pulse > thresholds.pulseHigh) return 'Elevated'
  return 'Normal'
}

export function spo2MeterPercent(spo2: number | null): number {
  if (spo2 == null || spo2 <= 0) return 0
  return Math.min(100, Math.max(0, spo2))
}

export function pulseMeterPercent(
  pulse: number | null,
  thresholds: OximeterThresholds = DEFAULT_OXIMETER_THRESHOLDS,
): number {
  if (pulse == null || pulse <= 0) return 0
  const min = 40
  const max = Math.max(thresholds.pulseHigh + 20, 180)
  return Math.min(100, Math.max(0, ((pulse - min) / (max - min)) * 100))
}

export function heartAnimationDurationSec(pulseRate: number | null): number {
  if (!pulseRate || pulseRate <= 0) return 1
  const raw = 60 / pulseRate
  return Math.min(1.2, Math.max(0.35, raw))
}
