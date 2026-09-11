'use client'

import { useId, useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { OximeterLiveReading } from '@/lib/oximeter/types'
import {
  CHART,
  ModernChartTooltip,
  chartMargin,
  formatTimeLabel,
  xAxisProps,
  yAxisProps,
} from '@/components/charts/chart-theme'

export type OximeterChartVariant = 'trend' | 'stability' | 'variability'

type Props = {
  readings: OximeterLiveReading[]
  mode?: 'spo2' | 'pulse'
  variant?: OximeterChartVariant
  height?: number
}

function extractValues(readings: OximeterLiveReading[], mode: 'spo2' | 'pulse') {
  return readings
    .filter(r => !r.decodePending && r.isValid)
    .map(r => ({
      value: mode === 'spo2' ? r.spo2 : r.pulseRate,
      time: r.measuredAt,
    }))
    .filter((r): r is { value: number; time: string } => r.value != null && r.value > 0)
    .slice(-60)
}

function deriveSeries(
  rows: Array<{ value: number; time: string }>,
  variant: OximeterChartVariant,
): Array<{ value: number; time: string; label: string }> {
  const values = rows.map(r => r.value)
  if (variant === 'trend') {
    return rows.map(r => ({ ...r, label: formatTimeLabel(r.time) }))
  }

  if (variant === 'stability') {
    const windowSize = 5
    return rows.map((r, i) => {
      const start = Math.max(0, i - windowSize + 1)
      const slice = values.slice(start, i + 1)
      return {
        value: Math.max(...slice) - Math.min(...slice),
        time: r.time,
        label: formatTimeLabel(r.time),
      }
    })
  }

  return rows.map((r, i) => ({
    value: i === 0 ? 0 : Math.abs(r.value - values[i - 1]),
    time: r.time,
    label: formatTimeLabel(r.time),
  }))
}

const VARIANT_META: Record<
  OximeterChartVariant,
  { title: string; unit: string; ref?: number; refLabel?: string }
> = {
  trend: { title: 'Reading', unit: '' },
  stability: { title: 'Range', unit: '' },
  variability: { title: 'Change', unit: '' },
}

export default function OximeterLiveChart({
  readings,
  mode = 'spo2',
  variant = 'trend',
  height = 160,
}: Props) {
  const gradId = useId().replace(/:/g, '')
  const isOxygen = mode === 'spo2'
  const stroke = isOxygen ? CHART.teal : CHART.rose
  const fillTop = isOxygen ? CHART.teal : CHART.rose

  const data = useMemo(() => deriveSeries(extractValues(readings, mode), variant), [readings, mode, variant])

  const meta = VARIANT_META[variant]
  const unit = mode === 'spo2' ? '%' : ' BPM'
  const valueName = mode === 'spo2' ? 'SpO₂' : 'Pulse'

  if (data.length < 2) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200/90 bg-gradient-to-b from-gray-50/50 to-white px-3 text-center"
        style={{ height }}
      >
        <p className="text-xs font-medium text-gray-500">Collecting live data…</p>
        <p className="mt-0.5 text-[10px] text-gray-400">Interactive chart appears after a few readings</p>
      </div>
    )
  }

  const values = data.map(d => d.value)
  const yMin = Math.floor(Math.min(...values) - (isOxygen ? 2 : 8))
  const yMax = Math.ceil(Math.max(...values) + (isOxygen ? 2 : 8))
  const refLine = variant === 'trend' && isOxygen ? 95 : variant === 'trend' && !isOxygen ? 120 : undefined

  const tooltipSuffix = variant === 'trend' ? unit : unit || ''

  return (
    <div style={{ height }} className="w-full min-w-0 overflow-visible px-1">
      <ResponsiveContainer width="100%" height="100%">
        {variant === 'trend' ? (
          <AreaChart data={data} margin={{ ...chartMargin, top: 16, right: 16, left: 8, bottom: 12 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillTop} stopOpacity={0.35} />
                <stop offset="100%" stopColor={fillTop} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" interval="preserveStartEnd" tick={{ fontSize: 9, fill: CHART.tick }} tickLine={false} axisLine={{ stroke: CHART.axis }} minTickGap={28} />
            <YAxis domain={[yMin, yMax]} {...yAxisProps} width={isOxygen ? 48 : 44} tick={{ fontSize: 10, fill: isOxygen ? CHART.teal : CHART.rose }} tickFormatter={v => `${Math.round(Number(v))}${isOxygen ? '%' : ''}`} />
            <Tooltip
              content={({ active, payload, label }) => (
                <ModernChartTooltip
                  active={active}
                  label={label}
                  suffix={tooltipSuffix}
                  payload={payload?.map(p => ({
                    color: stroke,
                    name: valueName,
                    value: p.value as number,
                  }))}
                />
              )}
              cursor={{ stroke: CHART.cursor, strokeWidth: 1 }}
            />
            {refLine != null ? (
              <ReferenceLine y={refLine} stroke={CHART.purple} strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: isOxygen ? '95%' : '120', fontSize: 9, fill: CHART.purple }} />
            ) : null}
            <Area
              type="monotone"
              dataKey="value"
              name={valueName}
              stroke={stroke}
              strokeWidth={2.5}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 6, stroke, strokeWidth: 2, fill: '#fff' }}
              animationDuration={400}
              isAnimationActive
            />
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ ...chartMargin, top: 16, right: 16, left: 8, bottom: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" interval="preserveStartEnd" tick={{ fontSize: 9, fill: CHART.tick }} tickLine={false} axisLine={{ stroke: CHART.axis }} minTickGap={28} />
            <YAxis domain={[0, 'auto']} {...yAxisProps} width={44} />
            <Tooltip
              content={({ active, payload, label }) => (
                <ModernChartTooltip
                  active={active}
                  label={label}
                  suffix={tooltipSuffix}
                  payload={payload?.map(p => ({
                    color: stroke,
                    name: meta.title,
                    value: p.value as number,
                  }))}
                />
              )}
              cursor={{ stroke: CHART.cursor, strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              name={meta.title}
              stroke={stroke}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, stroke, strokeWidth: 2, fill: '#fff' }}
              animationDuration={400}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
