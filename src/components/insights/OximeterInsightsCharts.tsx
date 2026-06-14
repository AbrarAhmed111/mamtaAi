'use client'

import { useId } from 'react'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  OximeterBabyDailySeries,
  OximeterBabySummary,
  OximeterDailyPoint,
} from '@/lib/insights/oximeter-insights'
import {
  OXIMETER_BABY_CHART_COLORS,
  toBabyComparisonRows,
  toVitalsChartRows,
} from '@/lib/insights/oximeter-insights'
import {
  CHART,
  ModernChartTooltip,
  chartMargin,
  dualAxisChartMargin,
  xAxisProps,
  yAxisProps,
} from '@/components/charts/chart-theme'

function VitalsTrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ color?: string; name?: string; value?: number | null; dataKey?: string; payload?: { count?: number } }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const count = payload.find(p => p.payload?.count != null)?.payload?.count
  return (
    <ModernChartTooltip
      active={active}
      label={label}
      payload={payload.map(p => ({
        color: p.color,
        name: p.name,
        value: p.value,
        dataKey: p.dataKey,
      }))}
      footer={
        count != null && count > 0
          ? `${count} reading${count === 1 ? '' : 's'} this day`
          : undefined
      }
    />
  )
}

export function OximeterVitalsTrendChart({
  trend,
  days,
}: {
  trend: OximeterDailyPoint[]
  days: number
}) {
  const gradId = useId().replace(/:/g, '')
  const data = toVitalsChartRows(trend, days)
  const hasAny = data.some(d => d.avgSpo2 != null || d.avgPulse != null)

  if (!hasAny) {
    return <p className="mt-4 text-sm text-gray-500">No oximeter readings in this period yet.</p>
  }

  const spo2Values = data.map(d => d.avgSpo2).filter((v): v is number => v != null)
  const pulseValues = data.map(d => d.avgPulse).filter((v): v is number => v != null)
  const spo2Min = spo2Values.length ? Math.max(80, Math.floor(Math.min(...spo2Values) - 2)) : 85
  const spo2Max = spo2Values.length ? Math.min(100, Math.ceil(Math.max(...spo2Values) + 1)) : 100
  const pulseMin = pulseValues.length ? Math.max(0, Math.floor(Math.min(...pulseValues) - 10)) : 0
  const pulseMax = pulseValues.length ? Math.ceil(Math.max(...pulseValues) + 10) : 180

  return (
    <div className="mt-3 w-full min-w-0">
      <div className="mb-2 flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-teal-500" aria-hidden />
          Avg SpO₂
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-hidden />
          Avg pulse
        </span>
      </div>
      <div className="h-[220px] w-full min-w-0 overflow-visible px-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={dualAxisChartMargin}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.teal} stopOpacity={0.4} />
              <stop offset="100%" stopColor={CHART.teal} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" interval="preserveStartEnd" tickMargin={6} {...xAxisProps} />
          <YAxis
            yAxisId="spo2"
            domain={[spo2Min, spo2Max]}
            tick={{ fontSize: 11, fill: CHART.teal }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={v => `${Math.round(Number(v))}%`}
          />
          <YAxis
            yAxisId="pulse"
            orientation="right"
            domain={[pulseMin, pulseMax]}
            tick={{ fontSize: 11, fill: CHART.rose }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={v => `${Math.round(Number(v))}`}
          />
          <Tooltip content={<VitalsTrendTooltip />} cursor={{ stroke: CHART.cursor, strokeWidth: 1, strokeDasharray: '4 4' }} />
          <ReferenceLine yAxisId="spo2" y={95} stroke={CHART.purple} strokeDasharray="4 4" strokeOpacity={0.5} />
          <Area
            yAxisId="spo2"
            type="monotone"
            dataKey="avgSpo2"
            name="Avg SpO₂"
            stroke={CHART.teal}
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            connectNulls={false}
            dot={{ r: 4, fill: '#fff', stroke: CHART.teal, strokeWidth: 2 }}
            activeDot={{ r: 7, strokeWidth: 2, fill: '#fff' }}
            animationDuration={800}
          />
          <Line
            yAxisId="pulse"
            type="monotone"
            dataKey="avgPulse"
            name="Avg pulse"
            stroke={CHART.rose}
            strokeWidth={2.5}
            strokeDasharray="6 4"
            connectNulls={false}
            dot={{ r: 3, fill: '#fff', stroke: CHART.rose, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
            animationDuration={800}
          />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function OximeterBabyComparisonChart({
  series,
  mode,
  days,
  focusBabyId,
}: {
  series: OximeterBabyDailySeries[]
  mode: 'spo2' | 'pulse'
  days: number
  focusBabyId?: string
}) {
  const data = toBabyComparisonRows(series, days, mode)
  const hasAny = data.some(row =>
    series.some(s => {
      const v = row[`baby_${s.babyId}`]
      return v != null
    }),
  )

  if (!hasAny || series.length === 0) {
    return <p className="mt-4 text-sm text-gray-500">Not enough data to compare children yet.</p>
  }

  const suffix = mode === 'spo2' ? '%' : ' BPM'
  const values: number[] = []
  for (const row of data) {
    for (const s of series) {
      const v = row[`baby_${s.babyId}`]
      if (typeof v === 'number') values.push(v)
    }
  }
  const yMin =
    mode === 'spo2'
      ? Math.max(80, Math.floor(Math.min(...values) - 2))
      : Math.max(0, Math.floor(Math.min(...values) - 10))
  const yMax =
    mode === 'spo2'
      ? Math.min(100, Math.ceil(Math.max(...values) + 2))
      : Math.ceil(Math.max(...values) + 10)

  return (
    <div className="mt-3 w-full min-w-0">
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
        {series.map((s, idx) => {
          const color = OXIMETER_BABY_CHART_COLORS[idx % OXIMETER_BABY_CHART_COLORS.length]
          const dimmed = focusBabyId != null && focusBabyId !== s.babyId
          return (
            <span
              key={s.babyId}
              className="inline-flex items-center gap-1.5"
              style={{ opacity: dimmed ? 0.45 : 1 }}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
              {s.babyName}
            </span>
          )
        })}
      </div>
      <div className="h-[220px] w-full min-w-0 overflow-visible px-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ ...chartMargin, top: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" interval="preserveStartEnd" tickMargin={6} {...xAxisProps} />
          <YAxis
            domain={[yMin, yMax]}
            {...yAxisProps}
            width={mode === 'spo2' ? 52 : 44}
            tickFormatter={v => `${Math.round(Number(v))}${mode === 'spo2' ? '%' : ''}`}
          />
          <Tooltip
            content={({ active, payload, label }) => (
              <ModernChartTooltip
                active={active}
                label={label}
                suffix={suffix}
                payload={payload?.map(p => ({
                  color: p.color,
                  name: p.name,
                  value: p.value as number,
                }))}
              />
            )}
            cursor={{ stroke: CHART.cursor, strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          {mode === 'spo2' ? (
            <ReferenceLine y={95} stroke={CHART.purple} strokeDasharray="4 4" strokeOpacity={0.45} />
          ) : null}
          {series.map((s, idx) => {
            const color = OXIMETER_BABY_CHART_COLORS[idx % OXIMETER_BABY_CHART_COLORS.length]
            const dimmed = focusBabyId != null && focusBabyId !== s.babyId
            return (
              <Line
                key={s.babyId}
                type="monotone"
                dataKey={`baby_${s.babyId}`}
                name={s.babyName}
                stroke={color}
                strokeWidth={focusBabyId === s.babyId ? 3 : 2}
                strokeOpacity={dimmed ? 0.35 : 1}
                connectNulls={false}
                dot={{ r: 3, fill: '#fff', stroke: color, strokeWidth: 2 }}
                activeDot={{ r: 7, strokeWidth: 2, fill: '#fff' }}
                animationDuration={800}
              />
            )
          })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function OximeterBabySummaryChart({ summaries }: { summaries: OximeterBabySummary[] }) {
  const data = summaries.map((s, idx) => ({
    name: s.babyName,
    avgSpo2: s.avgSpo2,
    avgPulse: s.avgPulse,
    readings: s.readings,
    babyId: s.babyId,
    minSpo2: s.minSpo2,
    maxSpo2: s.maxSpo2,
    minPulse: s.minPulse,
    maxPulse: s.maxPulse,
    fill: OXIMETER_BABY_CHART_COLORS[idx % OXIMETER_BABY_CHART_COLORS.length],
  }))

  return (
    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="min-w-0">
        <p className="mb-2 text-xs font-semibold text-teal-700">Average SpO₂ by child</p>
        <div className="h-[200px] w-full min-w-0 overflow-visible px-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ ...chartMargin, left: 8, right: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="name" {...xAxisProps} />
            <YAxis domain={[85, 100]} {...yAxisProps} width={48} tickFormatter={v => `${v}%`} />
            <Tooltip
              content={({ active, payload, label }) => (
                <ModernChartTooltip
                  active={active}
                  label={label}
                  suffix="%"
                  payload={payload?.map(p => ({
                    color: CHART.teal,
                    name: 'Avg SpO₂',
                    value: p.value as number,
                  }))}
                  footer={
                    payload?.[0]?.payload
                      ? `Range ${(payload[0].payload as { minSpo2: number; maxSpo2: number }).minSpo2}–${(payload[0].payload as { maxSpo2: number }).maxSpo2}%`
                      : undefined
                  }
                />
              )}
              cursor={{ fill: '#f0fdfa' }}
            />
            <ReferenceLine y={95} stroke={CHART.purple} strokeDasharray="4 4" strokeOpacity={0.45} />
            <Bar dataKey="avgSpo2" name="Avg SpO₂" radius={[10, 10, 0, 0]} animationDuration={800}>
              {data.map(entry => (
                <Cell key={entry.babyId} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
      <div className="min-w-0">
        <p className="mb-2 text-xs font-semibold text-rose-700">Average pulse by child</p>
        <div className="h-[200px] w-full min-w-0 overflow-visible px-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ ...chartMargin, left: 8, right: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="name" {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip
              content={({ active, payload, label }) => (
                <ModernChartTooltip
                  active={active}
                  label={label}
                  suffix=" BPM"
                  payload={payload?.map(p => ({
                    color: CHART.rose,
                    name: 'Avg pulse',
                    value: p.value as number,
                  }))}
                  footer={
                    payload?.[0]?.payload
                      ? `Range ${(payload[0].payload as { minPulse: number; maxPulse: number }).minPulse}–${(payload[0].payload as { maxPulse: number }).maxPulse} BPM`
                      : undefined
                  }
                />
              )}
              cursor={{ fill: '#fff1f2' }}
            />
            <Bar dataKey="avgPulse" name="Avg pulse" radius={[10, 10, 0, 0]} fill={CHART.rose} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
