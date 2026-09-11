'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, Clock, Heart } from 'lucide-react'
import Spinner from '@/components/ui/spinner'
import { useOximeter } from '@/contexts/OximeterContext'
import { dashboardFetch } from '@/lib/session/client'
import { classifySpo2, pulseStatusLabel, spo2StatusLabel } from '@/lib/oximeter/thresholds'
import { formatRelativeTime } from '@/lib/oximeter/stats'

type StoredReading = {
  id: string
  spo2_percentage: number | null
  pulse_rate_bpm: number | null
  measured_at: string
  is_valid?: boolean | null
  metadata?: { decode_pending?: boolean } | null
  device_model?: string | null
}

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

export default function OximeterLastReadingsPanel() {
  const { babies, babiesLoading, connection, setSelectedBabyId } = useOximeter()
  const [readings, setReadings] = useState<StoredReading[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedBabyId = connection.babyId ?? babies[0]?.id ?? null
  const selectedBabyName =
    connection.babyName ?? babies.find(b => b.id === selectedBabyId)?.name ?? null

  const loadReadings = useCallback(async (babyId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await dashboardFetch(
        `/api/oximeter/readings?babyId=${encodeURIComponent(babyId)}&limit=12`,
        { cache: 'no-store' },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to load readings')
      const rows = Array.isArray(data.readings) ? (data.readings as StoredReading[]) : []
      setReadings(rows.filter(isDisplayableReading))
    } catch (err) {
      setReadings([])
      setError(err instanceof Error ? err.message : 'Failed to load readings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedBabyId) {
      setReadings([])
      return
    }
    void loadReadings(selectedBabyId)
  }, [selectedBabyId, loadReadings])

  const latest = readings[0] ?? null
  const history = useMemo(() => readings.slice(1, 6), [readings])

  if (babiesLoading) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Spinner size={18} />
          Loading last readings…
        </div>
      </div>
    )
  }

  if (babies.length === 0) return null

  return (
    <section className="rounded-3xl border border-gray-100/90 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Last Readings</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {selectedBabyName
              ? `Most recent stored readings for ${selectedBabyName}`
              : 'Select a baby to view history'}
          </p>
        </div>
        {babies.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {babies.map(baby => (
              <button
                key={baby.id}
                type="button"
                onClick={() => setSelectedBabyId(baby.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedBabyId === baby.id
                    ? 'border-pink-300 bg-pink-50 text-pink-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-pink-200'
                }`}
              >
                {baby.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="mt-5 flex items-center gap-2 text-sm text-gray-500">
          <Spinner size={16} />
          Fetching readings…
        </div>
      )}

      {!loading && error && (
        <p className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      {!loading && !error && !latest && selectedBabyId && (
        <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center">
          <p className="text-sm font-medium text-gray-700">No readings saved yet</p>
          <p className="mt-1 text-xs text-gray-500">
            Connect an oximeter to start recording SpO₂ and pulse for {selectedBabyName}.
          </p>
        </div>
      )}

      {!loading && latest && (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-teal-100/90 bg-gradient-to-br from-teal-50/50 to-white p-4">
              <div className="flex items-center gap-2 text-teal-700">
                <Activity className="h-4 w-4" strokeWidth={2.2} />
                <span className="text-xs font-semibold uppercase tracking-wide">Last SpO₂</span>
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">
                {latest.spo2_percentage}
                <span className="ml-1 text-lg font-semibold text-teal-600">%</span>
              </p>
              <p className="mt-1 text-xs font-medium text-teal-700">
                {spo2StatusLabel(classifySpo2(Number(latest.spo2_percentage)))}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-100/90 bg-gradient-to-br from-rose-50/50 to-white p-4">
              <div className="flex items-center gap-2 text-rose-700">
                <Heart className="h-4 w-4" strokeWidth={2.2} />
                <span className="text-xs font-semibold uppercase tracking-wide">Last Pulse</span>
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">
                {latest.pulse_rate_bpm}
                <span className="ml-1 text-lg font-semibold text-rose-600">BPM</span>
              </p>
              <p className="mt-1 text-xs font-medium text-rose-700">
                {pulseStatusLabel(Number(latest.pulse_rate_bpm))}
              </p>
            </div>
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            Last recorded {formatRelativeTime(latest.measured_at)} ·{' '}
            {formatMeasuredAt(latest.measured_at)}
          </p>

          {history.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Recent history
              </p>
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100">
                {history.map(row => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-3 bg-white px-4 py-3 text-sm transition hover:bg-pink-50/30"
                  >
                    <span className="text-gray-600">{formatMeasuredAt(row.measured_at)}</span>
                    <span className="tabular-nums font-semibold text-gray-900">
                      <span className="text-teal-700">{row.spo2_percentage}%</span>
                      <span className="mx-2 text-gray-300">·</span>
                      <span className="text-rose-700">{row.pulse_rate_bpm} BPM</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}
