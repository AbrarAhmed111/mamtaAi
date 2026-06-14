'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { FaBluetooth, FaHeart } from 'react-icons/fa'
import Spinner from '@/components/ui/spinner'
import { dashboardFetch } from '@/lib/session/client'
import { useOximeter } from '@/contexts/OximeterContext'

type BabyOption = { id: string; name: string }

type StoredReading = {
  id: string
  baby_id: string
  spo2_percentage: number | null
  pulse_rate_bpm: number | null
  measured_at: string
  is_valid?: boolean | null
  metadata?: { decode_pending?: boolean } | null
}

type ReadingRow = StoredReading & { babyName: string }

function isDisplayableReading(row: StoredReading): boolean {
  if (row.metadata?.decode_pending) return false
  const spo2 = Number(row.spo2_percentage)
  const pulse = Number(row.pulse_rate_bpm)
  if (!Number.isFinite(spo2) || !Number.isFinite(pulse)) return false
  if (spo2 === 0 && pulse === 0) return false
  return row.is_valid !== false
}

function formatMeasuredAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

type OximeterOverviewRecentReadingsProps = {
  babies?: BabyOption[]
}

export default function OximeterOverviewRecentReadings({
  babies: babiesProp,
}: OximeterOverviewRecentReadingsProps) {
  const { openConnectModal, connection, babies: oximeterBabies, babiesLoading: oximeterBabiesLoading } =
    useOximeter()

  const babiesPropRef = useRef(babiesProp)
  const oximeterBabiesRef = useRef(oximeterBabies)
  babiesPropRef.current = babiesProp
  oximeterBabiesRef.current = oximeterBabies

  const propKey = babiesProp?.length
    ? babiesProp
        .map(b => `${b.id}:${b.name ?? ''}`)
        .sort()
        .join('|')
    : ''
  const oximeterKey = oximeterBabies
    .map(b => `${b.id}:${b.name ?? ''}`)
    .sort()
    .join('|')
  const babiesIdsKey = propKey || oximeterKey

  const babies = useMemo(() => {
    const prop = babiesPropRef.current
    const oxBabies = oximeterBabiesRef.current
    if (prop?.length) return prop.map(b => ({ id: b.id, name: b.name }))
    return oxBabies.map(b => ({ id: b.id, name: b.name }))
  }, [babiesIdsKey])

  const [readings, setReadings] = useState<ReadingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [resolved, setResolved] = useState(false)

  const loadReadings = useCallback(async () => {
    if (!babiesIdsKey) {
      setReadings([])
      setLoading(false)
      setResolved(true)
      return
    }

    const prop = babiesPropRef.current
    const oxBabies = oximeterBabiesRef.current
    const list = prop?.length
      ? prop.map(b => ({ id: b.id, name: b.name }))
      : oxBabies.map(b => ({ id: b.id, name: b.name }))

    setLoading(true)
    try {
      const responses = await Promise.all(
        list.map(async baby => {
          const res = await dashboardFetch(
            `/api/oximeter/readings?babyId=${encodeURIComponent(baby.id)}&limit=8`,
            { cache: 'no-store' },
          )
          const data = await res.json().catch(() => ({}))
          if (!res.ok) return [] as ReadingRow[]
          const rows = Array.isArray(data.readings) ? (data.readings as StoredReading[]) : []
          return rows
            .filter(isDisplayableReading)
            .map(row => ({ ...row, babyName: baby.name }))
        }),
      )

      const merged = responses
        .flat()
        .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())
        .slice(0, 5)

      setReadings(merged)
    } catch {
      setReadings([])
    } finally {
      setLoading(false)
      setResolved(true)
    }
  }, [babiesIdsKey])

  useEffect(() => {
    void loadReadings()
  }, [loadReadings])

  useEffect(() => {
    if (connection.status !== 'connected') return
    const timer = window.setInterval(() => {
      void loadReadings()
    }, 15000)
    return () => window.clearInterval(timer)
  }, [connection.status, loadReadings])

  if (babies.length === 0) {
    if (oximeterBabiesLoading) {
      return (
        <div className="rounded-3xl border border-pink-100/80 bg-white p-5 shadow-md shadow-pink-100/20">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Spinner size={18} />
            Loading oximeter readings…
          </div>
        </div>
      )
    }
    return null
  }

  if (loading && !resolved) {
    return (
      <div className="rounded-3xl border border-pink-100/80 bg-white p-5 shadow-md shadow-pink-100/20">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Spinner size={18} />
          Loading oximeter readings…
        </div>
      </div>
    )
  }

  if (readings.length === 0) {
    return (
      <div className="rounded-3xl border border-pink-100/80 bg-white p-5 shadow-md shadow-pink-100/20 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
              <FaHeart />
            </span>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Oximeter Readings</h3>
              <p className="mt-1 text-sm text-gray-600">
                Connect an oximeter to save SpO₂ and pulse history for your baby.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openConnectModal}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-pink-700 hover:to-rose-700"
          >
            <FaBluetooth />
            Connect Oximeter
          </button>
        </div>
      </div>
    )
  }

  const showBabyName = babies.length > 1

  return (
    <div className="rounded-3xl border border-pink-100/80 bg-white p-5 shadow-md shadow-pink-100/20">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-rose-600 bg-clip-text text-transparent">
          Recent Oximeter Readings
        </h3>
        <Link
          href="/dashboard/oximeter"
          className="text-sm font-semibold text-pink-600 hover:text-pink-700"
        >
          View all
        </Link>
      </div>

      <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100">
        {readings.map(row => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-3 bg-white px-4 py-3 text-sm transition hover:bg-pink-50/40"
          >
            <div className="min-w-0">
              {showBabyName && (
                <p className="truncate text-xs font-medium text-gray-500">{row.babyName}</p>
              )}
              <p className="text-gray-600">{formatMeasuredAt(row.measured_at)}</p>
            </div>
            <span className="shrink-0 tabular-nums font-semibold text-gray-900">
              <span className="text-teal-700">{row.spo2_percentage}%</span>
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-rose-700">{row.pulse_rate_bpm} BPM</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
