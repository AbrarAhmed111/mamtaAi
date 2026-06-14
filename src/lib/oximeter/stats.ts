import type { OximeterLiveReading, OximeterSessionStats } from './types'
import { classifySpo2 } from './thresholds'

export function computeSessionStats(
  readings: OximeterLiveReading[],
  sessionStartedAt: string | null,
): OximeterSessionStats {
  const valid = readings.filter(
    r => r.isValid && !r.decodePending && r.spo2 != null && r.pulseRate != null,
  )
  const spo2Values = valid.map(r => r.spo2 as number)
  const pulseValues = valid.map(r => r.pulseRate as number)
  const latest = readings[readings.length - 1]

  const avg = (arr: number[]) =>
    arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null

  return {
    currentSpo2: latest?.spo2 ?? null,
    currentPulse: latest?.pulseRate ?? null,
    minSpo2: spo2Values.length ? Math.min(...spo2Values) : null,
    maxSpo2: spo2Values.length ? Math.max(...spo2Values) : null,
    avgSpo2: avg(spo2Values),
    minPulse: pulseValues.length ? Math.min(...pulseValues) : null,
    maxPulse: pulseValues.length ? Math.max(...pulseValues) : null,
    avgPulse: avg(pulseValues),
    readingCount: readings.length,
    sessionStartedAt,
    lastUpdatedAt: latest?.measuredAt ?? null,
  }
}

export function toLiveReading(
  spo2: number,
  pulseRate: number,
  opts: {
    perfusionIndex?: number | null
    signalQuality?: number | null
    isValid?: boolean
    measuredAt?: string
    isStale?: boolean
    decodePending?: boolean
  } = {},
): OximeterLiveReading {
  const isValid = opts.decodePending ? false : (opts.isValid ?? true)
  return {
    spo2: opts.decodePending ? null : spo2,
    pulseRate: opts.decodePending ? null : pulseRate,
    perfusionIndex: opts.perfusionIndex ?? null,
    signalQuality: opts.signalQuality ?? null,
    isValid,
    spo2Status: classifySpo2(isValid && !opts.decodePending ? spo2 : null),
    measuredAt: opts.measuredAt ?? new Date().toISOString(),
    isStale: opts.isStale,
    decodePending: opts.decodePending,
  }
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 5000) return 'just now'
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  return new Date(iso).toLocaleTimeString()
}
