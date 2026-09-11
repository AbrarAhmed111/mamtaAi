'use client'

import type { ReactNode } from 'react'

export const CHART = {
  pink: '#db2777',
  rose: '#f43f5e',
  purple: '#9333ea',
  teal: '#0d9488',
  emerald: '#10b981',
  grid: '#f3f4f6',
  axis: '#e5e7eb',
  tick: '#6b7280',
  cursor: '#fbcfe8',
  tooltipBg: 'rgba(255,255,255,0.97)',
} as const

export const CHART_PALETTE = [
  '#db2777',
  '#9333ea',
  '#0d9488',
  '#f43f5e',
  '#6366f1',
  '#ea580c',
  '#0891b2',
  '#84cc16',
] as const

export const chartMargin = { top: 12, right: 16, left: 12, bottom: 12 }

/** Dual Y-axes (SpO₂ left + pulse right). Legend lives outside the chart. */
export const dualAxisChartMargin = { top: 8, right: 56, left: 4, bottom: 4 }

export const xAxisProps = {
  tick: { fontSize: 11, fill: CHART.tick },
  tickLine: false,
  axisLine: { stroke: CHART.axis },
  minTickGap: 20,
}

export const yAxisProps = {
  tick: { fontSize: 11, fill: CHART.tick },
  tickLine: false,
  axisLine: false,
  width: 44,
}

export type TooltipRow = {
  color?: string
  name?: string | number
  value?: number | string | null
  dataKey?: string | number
}

export function ModernChartTooltip({
  active,
  payload,
  label,
  suffix = '',
  footer,
}: {
  active?: boolean
  payload?: TooltipRow[]
  label?: string | number
  suffix?: string
  footer?: ReactNode
}) {
  if (!active || !payload?.length) return null
  const items = payload.filter(p => p.value != null && p.value !== '')
  if (items.length === 0) return null

  return (
    <div
      className="rounded-xl border border-pink-100 px-3.5 py-2.5 shadow-xl backdrop-blur-md"
      style={{ background: CHART.tooltipBg }}
    >
      {label != null && label !== '' ? <p className="text-xs font-semibold text-gray-900">{label}</p> : null}
      <ul className={`space-y-1.5 ${label ? 'mt-1.5' : ''}`}>
        {items.map(item => (
          <li
            key={String(item.dataKey ?? item.name)}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <span className="flex items-center gap-2 text-gray-600">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm"
                style={{ backgroundColor: item.color || CHART.pink }}
              />
              <span className="font-medium">{String(item.name ?? '')}</span>
            </span>
            <span className="font-semibold tabular-nums text-gray-900">
              {item.value}
              {suffix}
            </span>
          </li>
        ))}
      </ul>
      {footer ? <div className="mt-2 border-t border-pink-50 pt-2 text-[10px] text-gray-500">{footer}</div> : null}
    </div>
  )
}

export function formatChartDate(iso: string): string {
  try {
    const d = new Date(`${iso}T12:00:00`)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

export function fillDateWindow<T extends { date: string }>(
  points: T[],
  days: number,
  empty: (date: string) => T,
): Array<T & { label: string }> {
  const map = new Map(points.map(p => [p.date, p]))
  const out: Array<T & { label: string }> = []
  const anchor = new Date()
  anchor.setHours(12, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(anchor)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const row = map.get(key) ?? empty(key)
    out.push({ ...row, label: formatChartDate(key) })
  }
  return out
}

export function formatTimeLabel(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return ''
  }
}
