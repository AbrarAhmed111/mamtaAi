'use client'

import { useEffect, useMemo, useState } from 'react'
import Spinner from '@/components/ui/spinner'
import { FaChartLine, FaClock, FaExclamationTriangle, FaHistory, FaMicrophone, FaBaby } from 'react-icons/fa'

type InsightResponse = {
  overview: {
    recordingsToday: number
    minutesToday: number
    avgConfidenceToday: number
    urgentToday: number
  } | null
  totals: {
    babies: number
    recordings: number
    predictions: number
    recordingsLast7Days: number
  } | null
  cryTypeDistribution: Array<{ type: string; count: number }>
  dailyTrend: Array<{ date: string; count: number }>
  hourlyTrend: Array<{ hour: number; count: number }>
  babyBreakdown: Array<{ babyId: string; babyName: string; recordings: number; avgDuration: number }>
  recentHistory: Array<{
    id: string
    babyName: string
    recordedAt: string
    durationSeconds: number
    cryType: string
    confidence: number
    urgency: string
  }>
}

function SimpleBars({
  items,
  getKey,
  getLabel,
  getValue,
  colorClass = 'bg-pink-500',
}: {
  items: any[]
  getKey: (item: any) => string
  getLabel: (item: any) => string
  getValue: (item: any) => number
  colorClass?: string
}) {
  const max = Math.max(1, ...items.map(getValue))
  return (
    <div className="space-y-2">
      {items.map(item => {
        const value = getValue(item)
        const width = Math.max(4, Math.round((value / max) * 100))
        return (
          <div key={getKey(item)}>
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span className="truncate">{getLabel(item)}</span>
              <span>{value}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${width}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function InsightsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<InsightResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/insights', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(json?.error || 'Failed to load insights')
          return
        }
        setData(json)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const linePoints = useMemo(() => {
    const trend = data?.dailyTrend || []
    if (!trend.length) return ''
    const max = Math.max(1, ...trend.map(t => t.count))
    const w = 480
    const h = 120
    return trend
      .map((t, i) => {
        const x = (i / Math.max(1, trend.length - 1)) * w
        const y = h - (t.count / max) * h
        return `${x},${y}`
      })
      .join(' ')
  }, [data?.dailyTrend])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-600 gap-2">
        <Spinner size={18} />
        Loading insights...
      </div>
    )
  }

  if (error) {
    return <div className="text-red-600">{error}</div>
  }

  const overview = data?.overview
  const totals = data?.totals

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 rounded-2xl border border-pink-100 p-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Insights & Analytics
        </h1>
        <p className="text-sm text-gray-600 mt-2">Daily stats, cry history, and graphical trends for your babies.</p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-pink-100 p-4">
          <div className="text-xs text-gray-500">Recordings Today</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{overview?.recordingsToday || 0}</div>
        </div>
        <div className="bg-white rounded-xl border border-pink-100 p-4">
          <div className="text-xs text-gray-500">Cry Minutes Today</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{overview?.minutesToday || 0}m</div>
        </div>
        <div className="bg-white rounded-xl border border-pink-100 p-4">
          <div className="text-xs text-gray-500">Avg Confidence Today</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{overview?.avgConfidenceToday || 0}%</div>
        </div>
        <div className="bg-white rounded-xl border border-pink-100 p-4">
          <div className="text-xs text-gray-500">Urgent Alerts Today</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{overview?.urgentToday || 0}</div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-pink-100 p-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FaChartLine className="text-pink-500" /> Daily Trend (14 days)</h2>
          {(data?.dailyTrend?.length || 0) > 0 ? (
            <div className="mt-4">
              <svg viewBox="0 0 480 120" className="w-full h-32">
                <polyline fill="none" stroke="#ec4899" strokeWidth="3" points={linePoints} />
              </svg>
              <div className="mt-2 text-xs text-gray-500 flex justify-between">
                <span>{data?.dailyTrend?.[0]?.date || ''}</span>
                <span>{data?.dailyTrend?.[data.dailyTrend.length - 1]?.date || ''}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-3">No trend data yet.</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-pink-100 p-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FaHistory className="text-pink-500" /> Cry Type Distribution</h2>
          <div className="mt-4">
            <SimpleBars
              items={(data?.cryTypeDistribution || []).slice(0, 6)}
              getKey={i => i.type}
              getLabel={i => i.type}
              getValue={i => i.count}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-pink-100 p-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FaClock className="text-pink-500" /> Hourly Pattern (Today)</h2>
          <div className="mt-4">
            <SimpleBars
              items={(data?.hourlyTrend || []).filter(x => x.count > 0)}
              getKey={i => String(i.hour)}
              getLabel={i => `${String(i.hour).padStart(2, '0')}:00`}
              getValue={i => i.count}
              colorClass="bg-rose-500"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-pink-100 p-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FaBaby className="text-pink-500" /> Baby-wise Breakdown (30 days)</h2>
          <div className="mt-4 space-y-2">
            {(data?.babyBreakdown || []).length === 0 ? (
              <p className="text-sm text-gray-500">No baby data available yet.</p>
            ) : (
              (data?.babyBreakdown || []).map(item => (
                <div key={item.babyId} className="rounded-lg border border-gray-100 p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.babyName}</p>
                    <p className="text-xs text-gray-500">Avg Duration: {Math.round(item.avgDuration)} sec</p>
                  </div>
                  <span className="text-sm px-2 py-1 rounded-full bg-pink-100 text-pink-700">{item.recordings} recordings</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-pink-100 p-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FaMicrophone className="text-pink-500" /> Platform Totals</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-pink-50 p-3">
              <p className="text-xs text-gray-500">Babies</p>
              <p className="text-xl font-bold text-gray-900">{totals?.babies || 0}</p>
            </div>
            <div className="rounded-lg bg-pink-50 p-3">
              <p className="text-xs text-gray-500">Recordings</p>
              <p className="text-xl font-bold text-gray-900">{totals?.recordings || 0}</p>
            </div>
            <div className="rounded-lg bg-pink-50 p-3">
              <p className="text-xs text-gray-500">Predictions</p>
              <p className="text-xl font-bold text-gray-900">{totals?.predictions || 0}</p>
            </div>
            <div className="rounded-lg bg-pink-50 p-3">
              <p className="text-xs text-gray-500">Last 7 days</p>
              <p className="text-xl font-bold text-gray-900">{totals?.recordingsLast7Days || 0}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-pink-100 p-5">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FaExclamationTriangle className="text-pink-500" /> Cry History</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-pink-100 text-left text-gray-600">
                <th className="py-2 pr-3">Baby</th>
                <th className="py-2 pr-3">Recorded At</th>
                <th className="py-2 pr-3">Duration</th>
                <th className="py-2 pr-3">Cry Type</th>
                <th className="py-2 pr-3">Confidence</th>
                <th className="py-2 pr-3">Urgency</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentHistory || []).map(item => (
                <tr key={item.id} className="border-b border-pink-50">
                  <td className="py-2 pr-3 font-medium">{item.babyName}</td>
                  <td className="py-2 pr-3 text-gray-600">{new Date(item.recordedAt).toLocaleString()}</td>
                  <td className="py-2 pr-3 text-gray-600">{Math.round(item.durationSeconds)} sec</td>
                  <td className="py-2 pr-3 capitalize">{item.cryType}</td>
                  <td className="py-2 pr-3">{Math.round(item.confidence * 100)}%</td>
                  <td className="py-2 pr-3 capitalize">{item.urgency}</td>
                </tr>
              ))}
              {(data?.recentHistory || []).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    No cry history available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

