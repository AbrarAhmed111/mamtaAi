'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Spinner from '@/components/ui/spinner'
import { toast } from '@/components/ui/sonner'
import { FaChartLine, FaClock, FaExclamationTriangle, FaHistory, FaMicrophone, FaBaby, FaDownload } from 'react-icons/fa'
import Link from 'next/link'
import { usePlanLimit } from '@/hooks/useSubscription'
import OximeterInsightsSection from '@/components/insights/OximeterInsightsSection'
import type { OximeterInsightsPayload } from '@/lib/insights/oximeter-insights'
import {
  BabyRecordingsChart,
  CryTypeDistributionChart,
  HourlyPatternChart,
  RecordingsDailyChart,
} from '@/components/charts/InsightsCryCharts'

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
  subscription?: {
    slug: string
    insightsHistoryDays: number | null
    allowExport: boolean
    fullCharts: boolean
  }
  oximeter?: OximeterInsightsPayload
}

function InsightsPageContent() {
  const searchParams = useSearchParams()
  const handlePlanLimit = usePlanLimit()
  const focusBabyId = (searchParams.get('babyId') || '').trim()

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

  useEffect(() => {
    if (!focusBabyId || loading || !data) return
    const t = window.setTimeout(() => {
      document.getElementById(`insight-baby-${focusBabyId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
    return () => window.clearTimeout(t)
  }, [focusBabyId, loading, data])

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
  const focusBabyInBreakdown =
    focusBabyId && data?.babyBreakdown?.some(b => b.babyId === focusBabyId) === true
  const focusBabyName =
    focusBabyId && data?.babyBreakdown?.length
      ? data.babyBreakdown.find(b => b.babyId === focusBabyId)?.babyName || null
      : null

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 rounded-2xl border border-pink-100 p-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Insights & Analytics
        </h1>
        <p className="text-sm text-gray-600 mt-2">Daily stats, cry history, oximeter trends, and graphical analytics for your babies.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {data?.subscription?.allowExport ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
              onClick={async () => {
                const res = await fetch('/api/insights/export')
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}))
                  if (handlePlanLimit(err)) return
                  toast.error(err?.message || err?.error || 'Export failed')
                  return
                }
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `MamtaAI-insights-${new Date().toISOString().slice(0, 10)}.csv`
                a.click()
                URL.revokeObjectURL(url)
                toast.success('Export downloaded')
              }}
            >
              <FaDownload />
              Export CSV
            </button>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-pink-300 px-4 py-2 text-sm font-medium text-pink-700 hover:bg-pink-50"
            >
              Upgrade to export insights
            </Link>
          )}
        </div>
        {focusBabyId ? (
          <p className="mt-3 text-sm rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-900 px-4 py-2 max-w-2xl">
            <span className="font-semibold">Health context</span>{' '}
            <span className="text-emerald-800">
              {focusBabyInBreakdown
                ? focusBabyName
                  ? `Breakdown for ${focusBabyName} is highlighted below.`
                  : 'Scroll to the highlighted row in Baby-wise breakdown.'
                : 'This baby has no cry analytics yet. Add recordings from their profile to see trends here.'}
            </span>
          </p>
        ) : null}
      </section>

      {data?.oximeter ? (
        <OximeterInsightsSection oximeter={data.oximeter} focusBabyId={focusBabyId || undefined} />
      ) : null}

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
          <RecordingsDailyChart trend={data?.dailyTrend ?? []} days={data?.subscription?.fullCharts ? 14 : 7} />
        </div>

        <div className="bg-white rounded-xl border border-pink-100 p-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FaHistory className="text-pink-500" /> Cry Type Distribution</h2>
          <CryTypeDistributionChart items={(data?.cryTypeDistribution || []).slice(0, 6)} />
        </div>

        <div className="bg-white rounded-xl border border-pink-100 p-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FaClock className="text-pink-500" /> Hourly Pattern (Today)</h2>
          <HourlyPatternChart items={data?.hourlyTrend || []} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-pink-100 p-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FaBaby className="text-pink-500" /> Baby-wise Breakdown (30 days)</h2>
          <div className="mt-4 space-y-4">
            {(data?.babyBreakdown || []).length === 0 ? (
              <p className="text-sm text-gray-500">No baby data available yet.</p>
            ) : (
              <>
                <BabyRecordingsChart items={data?.babyBreakdown || []} focusBabyId={focusBabyId || undefined} />
                {(data?.babyBreakdown || []).map(item => {
              const isFocused = focusBabyId === item.babyId
              return (
                <div
                  key={item.babyId}
                  id={`insight-baby-${item.babyId}`}
                  className={`rounded-lg border p-3 text-sm transition-shadow ${
                    isFocused
                      ? 'border-emerald-300 bg-emerald-50/60 ring-2 ring-emerald-200 shadow-sm'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  <span className="font-medium text-gray-900">{item.babyName}</span>
                  <span className="text-gray-500"> · avg duration {Math.round(item.avgDuration)} sec</span>
                </div>
              )
                })}
              </>
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
                {/* <th className="py-2 pr-3">Cry Type</th> */}
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
                  {/* <td className="py-2 pr-3 capitalize">{item.cryType}</td> */}
                  <td className="py-2 pr-3">{Math.round(item.confidence * 100)}%</td>
                  <td className="py-2 pr-3 capitalize">{item.urgency}</td>
                </tr>
              ))}
              {(data?.recentHistory || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
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

export default function InsightsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-gray-600 gap-2">
          <Spinner size={18} />
          Loading insights...
        </div>
      }
    >
      <InsightsPageContent />
    </Suspense>
  )
}
