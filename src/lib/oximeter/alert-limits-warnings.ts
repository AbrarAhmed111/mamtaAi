import type { BabyOximeterAlerts } from './baby-thresholds'
import { OXIMETER_ALERT_BOUNDS } from './baby-thresholds'

function outOfRange(value: number, min: number, max: number): boolean {
  return !Number.isFinite(value) || value < min || value > max
}

/** Hard errors — values oximeters cannot represent; save is blocked. */
export function getOximeterAlertLimitErrors(alerts: BabyOximeterAlerts): string[] {
  const errors: string[] = []
  const { spo2, pulse } = OXIMETER_ALERT_BOUNDS

  if (outOfRange(alerts.spo2Min, spo2.min, spo2.max)) {
    errors.push(
      `SpO₂ minimum must be between ${spo2.min} and ${spo2.max}% — it is a percentage, not a number like 500 or 1000.`,
    )
  }
  if (outOfRange(alerts.spo2Max, spo2.min, spo2.max)) {
    errors.push(`SpO₂ maximum must be between ${spo2.min} and ${spo2.max}%.`)
  }
  if (outOfRange(alerts.pulseMin, pulse.min, pulse.max)) {
    errors.push(
      `Pulse minimum must be between ${pulse.min} and ${pulse.max} BPM (heart rate in beats per minute).`,
    )
  }
  if (outOfRange(alerts.pulseMax, pulse.min, pulse.max)) {
    errors.push(
      `Pulse maximum must be between ${pulse.min} and ${pulse.max} BPM — values like 500 or 1000 are not valid heart rates.`,
    )
  }

  if (
    Number.isFinite(alerts.spo2Min) &&
    Number.isFinite(alerts.spo2Max) &&
    alerts.spo2Min >= alerts.spo2Max
  ) {
    errors.push('Minimum SpO₂ must be lower than maximum SpO₂.')
  }
  if (
    Number.isFinite(alerts.pulseMin) &&
    Number.isFinite(alerts.pulseMax) &&
    alerts.pulseMin >= alerts.pulseMax
  ) {
    errors.push('Minimum pulse must be lower than maximum pulse.')
  }

  return errors
}

/** Flags limits that may be unsafe, inverted, or likely to cause missed or noisy alerts. */
export function getOximeterAlertLimitWarnings(alerts: BabyOximeterAlerts): string[] {
  if (getOximeterAlertLimitErrors(alerts).length > 0) return []

  const warnings: string[] = []
  const { spo2Min, spo2Max, pulseMin, pulseMax } = alerts

  if (spo2Min < 85) {
    warnings.push(
      `SpO₂ minimum (${spo2Min}%) is very low—you may not be alerted until oxygen is critically low.`,
    )
  } else if (spo2Min > 93) {
    warnings.push(
      `SpO₂ minimum (${spo2Min}%) is unusually high and may trigger frequent alerts during normal variation.`,
    )
  }

  if (spo2Max < 96) {
    warnings.push(
      `SpO₂ maximum (${spo2Max}%) is lower than what is typical for healthy children and may cause frequent alerts.`,
    )
  }

  if (spo2Min < spo2Max && spo2Max - spo2Min < 3) {
    warnings.push('SpO₂ alert range is very narrow—small normal changes may trigger alerts.')
  }

  if (pulseMin < 70) {
    warnings.push(
      `Pulse minimum (${pulseMin} BPM) is lower than typical resting rates for infants and young children.`,
    )
  } else if (pulseMin > 110) {
    warnings.push(
      `Pulse minimum (${pulseMin} BPM) is unusually high—you may miss alerts for low heart rate.`,
    )
  }

  if (pulseMax < 120) {
    warnings.push(
      `Pulse maximum (${pulseMax} BPM) is lower than typical active heart rates for children.`,
    )
  } else if (pulseMax > 190) {
    warnings.push(
      `Pulse maximum (${pulseMax} BPM) is very high—elevated heart rates may go unnoticed until extremely high.`,
    )
  }

  if (pulseMin < pulseMax && pulseMax - pulseMin < 25) {
    warnings.push('Pulse alert range is very narrow—normal activity may trigger alerts.')
  }

  return warnings
}
