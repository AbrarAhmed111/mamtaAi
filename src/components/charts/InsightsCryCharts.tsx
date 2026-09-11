'use client'

import { useId } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CHART,
  CHART_PALETTE,
  ModernChartTooltip,
  chartMargin,
  fillDateWindow,
  xAxisProps,
  yAxisProps,
} from '@/components/charts/chart-theme'

type DailyPoint = { date: string; count: number }

export function RecordingsDailyChart({ trend, days = 14 }: { trend: DailyPoint[]; days?: number }) {
  const gradId = useId().replace(/:/g, '')
  const data = fillDateWindow(trend, days, date => ({ date, count: 0 }))
  const hasAny = data.some(d => d.count > 0)

  if (!hasAny) {
    return <p className="mt-4 text-sm text-gray-500">No trend data yet.</p>
  }

  return (
    <div className="mt-4 h-[240px] w-full min-w-0 overflow-visible px-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ ...chartMargin, top: 16, right: 16, left: 8 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.pink} stopOpacity={0.4} />
              <stop offset="100%" stopColor={CHART.rose} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" interval="preserveStartEnd" {...xAxisProps} />
          <YAxis allowDecimals={false} {...yAxisProps} />
          <Tooltip
            content={
              <ModernChartTooltip
                footer={undefined}
              />
            }
            cursor={{ stroke: CHART.cursor, strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="Recordings"
            stroke={CHART.pink}
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            dot={{ r: 4, fill: '#fff', stroke: CHART.pink, strokeWidth: 2 }}
            activeDot={{ r: 7, stroke: CHART.pink, strokeWidth: 2, fill: '#fff' }}
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[11px] text-gray-400">Hover points for daily counts</p>
    </div>
  )
}

export function CryTypeDistributionChart({
  items,
}: {
  items: Array<{ type: string; count: number }>
}) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-gray-500">No cry type data yet.</p>
  }

  const data = items.map((item, i) => ({
    ...item,
    label: item.type.replace(/_/g, ' '),
    fill: CHART_PALETTE[i % CHART_PALETTE.length],
  }))

  return (
    <div className="mt-4 h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
          <XAxis type="number" allowDecimals={false} {...xAxisProps} />
          <YAxis
            type="category"
            dataKey="label"
            width={88}
            tick={{ fontSize: 10, fill: CHART.tick }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<ModernChartTooltip />}
            cursor={{ fill: '#fdf2f8' }}
          />
          <Bar dataKey="count" name="Count" radius={[0, 8, 8, 0]} animationDuration={700}>
            {data.map(entry => (
              <Cell key={entry.type} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HourlyPatternChart({
  items,
}: {
  items: Array<{ hour: number; count: number }>
}) {
  const data = Array.from({ length: 24 }, (_, hour) => {
    const hit = items.find(i => i.hour === hour)
    return {
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      count: hit?.count ?? 0,
    }
  }).filter(d => d.count > 0)

  if (data.length === 0) {
    return <p className="mt-4 text-sm text-gray-500">No recordings today yet.</p>
  }

  return (
    <div className="mt-4 h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" interval="preserveStartEnd" {...xAxisProps} />
          <YAxis allowDecimals={false} {...yAxisProps} />
          <Tooltip
            content={<ModernChartTooltip />}
            cursor={{ fill: '#fff1f2' }}
          />
          <Bar
            dataKey="count"
            name="Recordings"
            fill={CHART.rose}
            radius={[8, 8, 0, 0]}
            animationDuration={700}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BabyRecordingsChart({
  items,
  focusBabyId,
}: {
  items: Array<{ babyId: string; babyName: string; recordings: number; avgDuration: number }>
  focusBabyId?: string
}) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">No baby data available yet.</p>
  }

  const data = items.map((item, i) => ({
    ...item,
    name: item.babyName,
    fill: CHART_PALETTE[i % CHART_PALETTE.length],
    dimmed: focusBabyId != null && focusBabyId !== item.babyId,
  }))

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="name" {...xAxisProps} />
          <YAxis allowDecimals={false} {...yAxisProps} />
          <Tooltip content={<ModernChartTooltip />} cursor={{ fill: '#fdf2f8' }} />
          <Bar dataKey="recordings" name="Recordings" radius={[8, 8, 0, 0]} animationDuration={700}>
            {data.map(entry => (
              <Cell
                key={entry.babyId}
                fill={entry.fill}
                fillOpacity={entry.dimmed ? 0.35 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
