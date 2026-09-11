export type OximeterReadingLite = {
  baby_id: string
  measured_at: string
  spo2_percentage: number | null
  pulse_rate_bpm: number | null
  is_valid?: boolean | null
  metadata?: { decode_pending?: boolean } | null
}

export type OximeterDailyPoint = {
  date: string
  avgSpo2: number | null
  avgPulse: number | null
  count: number
}

export type OximeterBabySummary = {
  babyId: string
  babyName: string
  avgSpo2: number
  avgPulse: number
  minSpo2: number
  maxSpo2: number
  minPulse: number
  maxPulse: number
  readings: number
}

export type OximeterBabyDailySeries = {
  babyId: string
  babyName: string
  points: OximeterDailyPoint[]
}

export type OximeterInsightsPayload = {
  hasData: boolean
  totalReadings: number
  readingsLast7Days: number
  avgSpo2Last7Days: number | null
  avgPulseLast7Days: number | null
  trendDays: number
  dailyTrend: OximeterDailyPoint[]
  babySummaries: OximeterBabySummary[]
  babyDailySeries: OximeterBabyDailySeries[]
}

function dateKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function isUsableOximeterReading(row: OximeterReadingLite): boolean {
  if (row.is_valid === false) return false
  const meta = row.metadata
  if (meta && typeof meta === 'object' && meta.decode_pending) return false
  const spo2 = Number(row.spo2_percentage)
  const pulse = Number(row.pulse_rate_bpm)
  return Number.isFinite(spo2) && spo2 >= 50 && spo2 <= 100 && Number.isFinite(pulse) && pulse >= 30 && pulse <= 250
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function aggregateDaily(
  rows: OximeterReadingLite[],
  babyFilter?: string,
): Map<string, { spo2Sum: number; pulseSum: number; count: number }> {
  const map = new Map<string, { spo2Sum: number; pulseSum: number; count: number }>()
  for (const row of rows) {
    if (babyFilter && row.baby_id !== babyFilter) continue
    if (!isUsableOximeterReading(row)) continue
    const key = dateKey(row.measured_at)
    const spo2 = Number(row.spo2_percentage)
    const pulse = Number(row.pulse_rate_bpm)
    const cur = map.get(key) || { spo2Sum: 0, pulseSum: 0, count: 0 }
    cur.spo2Sum += spo2
    cur.pulseSum += pulse
    cur.count += 1
    map.set(key, cur)
  }
  return map
}

function dailyMapToSortedPoints(map: Map<string, { spo2Sum: number; pulseSum: number; count: number }>): OximeterDailyPoint[] {
  return Array.from(map.entries())
    .map(([date, v]) => ({
      date,
      avgSpo2: round1(v.spo2Sum / v.count),
      avgPulse: round1(v.pulseSum / v.count),
      count: v.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function buildOximeterInsights(args: {
  readings: OximeterReadingLite[]
  babyNames: Map<string, string>
  trendDays?: number
}): OximeterInsightsPayload {
  const trendDays = args.trendDays ?? 14
  const cutoff = new Date(Date.now() - trendDays * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const usable = args.readings.filter(r => {
    if (new Date(r.measured_at) < cutoff) return false
    return isUsableOximeterReading(r)
  })

  const usable7 = usable.filter(r => new Date(r.measured_at) >= sevenDaysAgo)

  const dailyTrend = dailyMapToSortedPoints(aggregateDaily(usable))

  const babySummaries: OximeterBabySummary[] = []
  const babyDailySeries: OximeterBabyDailySeries[] = []

  const babyIds = Array.from(new Set(usable.map(r => r.baby_id)))

  for (const babyId of babyIds) {
    const babyRows = usable.filter(r => r.baby_id === babyId)
    if (babyRows.length === 0) continue

    const spo2Vals = babyRows.map(r => Number(r.spo2_percentage))
    const pulseVals = babyRows.map(r => Number(r.pulse_rate_bpm))

    babySummaries.push({
      babyId,
      babyName: args.babyNames.get(babyId) || 'Baby',
      avgSpo2: round1(spo2Vals.reduce((a, b) => a + b, 0) / spo2Vals.length),
      avgPulse: round1(pulseVals.reduce((a, b) => a + b, 0) / pulseVals.length),
      minSpo2: Math.min(...spo2Vals),
      maxSpo2: Math.max(...spo2Vals),
      minPulse: Math.min(...pulseVals),
      maxPulse: Math.max(...pulseVals),
      readings: babyRows.length,
    })

    babyDailySeries.push({
      babyId,
      babyName: args.babyNames.get(babyId) || 'Baby',
      points: dailyMapToSortedPoints(aggregateDaily(usable, babyId)),
    })
  }

  babySummaries.sort((a, b) => b.readings - a.readings)

  let avgSpo2Last7Days: number | null = null
  let avgPulseLast7Days: number | null = null
  if (usable7.length > 0) {
    avgSpo2Last7Days = round1(
      usable7.reduce((s, r) => s + Number(r.spo2_percentage), 0) / usable7.length,
    )
    avgPulseLast7Days = round1(
      usable7.reduce((s, r) => s + Number(r.pulse_rate_bpm), 0) / usable7.length,
    )
  }

  return {
    hasData: usable.length > 0,
    totalReadings: usable.length,
    readingsLast7Days: usable7.length,
    avgSpo2Last7Days,
    avgPulseLast7Days,
    trendDays,
    dailyTrend,
    babySummaries,
    babyDailySeries,
  }
}

export const OXIMETER_BABY_CHART_COLORS = [
  '#db2777',
  '#9333ea',
  '#0d9488',
  '#f43f5e',
  '#6366f1',
  '#ea580c',
] as const

export function formatOximeterChartDate(iso: string): string {
  try {
    const d = new Date(`${iso}T12:00:00`)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

/** Pad sparse daily points to a full window for chart axes. */
export function fillTrendWindow(points: OximeterDailyPoint[], days: number): OximeterDailyPoint[] {
  const map = new Map(points.map(p => [p.date, p]))
  const out: OximeterDailyPoint[] = []
  const anchor = new Date()
  anchor.setHours(12, 0, 0, 0)

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(anchor)
    d.setDate(d.getDate() - i)
    const key = dateKey(d.toISOString())
    out.push(map.get(key) ?? { date: key, avgSpo2: null, avgPulse: null, count: 0 })
  }
  return out
}

export type OximeterChartRow = {
  date: string
  label: string
  avgSpo2: number | null
  avgPulse: number | null
  count: number
}

export function toVitalsChartRows(points: OximeterDailyPoint[], days: number): OximeterChartRow[] {
  return fillTrendWindow(points, days).map(p => ({
    ...p,
    label: formatOximeterChartDate(p.date),
  }))
}

export type BabyComparisonRow = {
  date: string
  label: string
  [babyKey: string]: string | number | null
}

export function toBabyComparisonRows(
  series: OximeterBabyDailySeries[],
  days: number,
  mode: 'spo2' | 'pulse',
): BabyComparisonRow[] {
  const filled = series.map(s => ({
    ...s,
    points: fillTrendWindow(s.points, days),
  }))
  const dates = fillTrendWindow([], days).map(p => p.date)

  return dates.map(date => {
    const row: BabyComparisonRow = {
      date,
      label: formatOximeterChartDate(date),
    }
    for (const s of filled) {
      const pt = s.points.find(p => p.date === date)
      const key = `baby_${s.babyId}`
      row[key] = pt ? (mode === 'spo2' ? pt.avgSpo2 : pt.avgPulse) : null
    }
    return row
  })
}
