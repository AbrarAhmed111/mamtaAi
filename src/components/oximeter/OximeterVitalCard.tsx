'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { formatRelativeTime } from '@/lib/oximeter/stats'

type VitalCardProps = {
  label: string
  value: string
  unit?: string
  status: string
  updatedAt?: string | null
  isStale?: boolean
  icon: ReactNode
  meterPercent: number
  theme: 'oxygen' | 'heart'
  decodePending?: boolean
  footerNote?: string | null
}

const themes = {
  oxygen: {
    card: 'border-teal-100/90 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/40',
    iconWrap: 'bg-teal-100/90 text-teal-600 ring-teal-100',
    meterTrack: 'bg-teal-100/60',
    meterFill: 'bg-gradient-to-r from-teal-400 to-emerald-500',
    status: 'text-teal-700',
    value: 'text-gray-900',
    unit: 'text-teal-600/80',
    shadow: 'shadow-md shadow-teal-100/30 hover:shadow-lg hover:shadow-teal-100/40',
  },
  heart: {
    card: 'border-rose-100/90 bg-gradient-to-br from-rose-50/70 via-white to-pink-50/40',
    iconWrap: 'bg-rose-100/90 text-rose-600 ring-rose-100',
    meterTrack: 'bg-rose-100/60',
    meterFill: 'bg-gradient-to-r from-rose-400 to-pink-500',
    status: 'text-rose-700',
    value: 'text-gray-900',
    unit: 'text-rose-600/80',
    shadow: 'shadow-md shadow-rose-100/30 hover:shadow-lg hover:shadow-rose-100/40',
  },
}

export default function OximeterVitalCard({
  label,
  value,
  unit,
  status,
  updatedAt,
  isStale,
  icon,
  meterPercent,
  theme,
  decodePending,
  footerNote,
}: VitalCardProps) {
  const t = themes[theme]
  const prevValue = useRef(value)
  const flashRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (decodePending || value === '—' || value === prevValue.current) return
    prevValue.current = value
    const el = flashRef.current
    if (!el) return
    el.classList.remove('oxi-value-flash')
    void el.offsetWidth
    el.classList.add('oxi-value-flash')
  }, [value, decodePending])

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border p-5 transition-all duration-300 sm:p-6 ${t.card} ${t.shadow}`}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/40 blur-2xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <div ref={flashRef} className="mt-2 flex items-end gap-1.5">
            <span className={`text-4xl font-bold tabular-nums tracking-tight sm:text-5xl ${t.value}`}>
              {value}
            </span>
            {unit && !decodePending && value !== '—' && (
              <span className={`mb-1.5 text-lg font-semibold ${t.unit}`}>{unit}</span>
            )}
          </div>
          <p className={`mt-2 text-sm font-semibold ${t.status}`}>
            {decodePending ? 'Awaiting live vitals…' : status}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Updated {formatRelativeTime(updatedAt)}
            {isStale ? ' · may be stale' : ''}
          </p>
        </div>
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-4 ${t.iconWrap}`}
        >
          {icon}
        </span>
      </div>

      <div className="relative mt-5">
        <div className={`h-2.5 overflow-hidden rounded-full ${t.meterTrack}`}>
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${t.meterFill}`}
            style={{ width: `${decodePending ? 0 : meterPercent}%` }}
          />
        </div>
      </div>

      {footerNote && (
        <p className="relative mt-3 text-[11px] leading-relaxed text-amber-800/90">{footerNote}</p>
      )}
    </div>
  )
}
