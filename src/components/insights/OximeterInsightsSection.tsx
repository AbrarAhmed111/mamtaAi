'use client'

import Link from 'next/link'
import { FaBluetooth } from 'react-icons/fa'
import { Activity as ActivityIcon, Heart as HeartIcon } from 'lucide-react'
import type { OximeterInsightsPayload } from '@/lib/insights/oximeter-insights'
import {
  OximeterBabyComparisonChart,
  OximeterBabySummaryChart,
  OximeterVitalsTrendChart,
} from '@/components/insights/OximeterInsightsCharts'

type Props = {
  oximeter: OximeterInsightsPayload
  focusBabyId?: string
}

export default function OximeterInsightsSection({ oximeter, focusBabyId }: Props) {
  const multiBaby = oximeter.babySummaries.length > 1
  const trendLabel = `${oximeter.trendDays} days`

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-teal-100/80 bg-gradient-to-r from-teal-50/50 via-white to-pink-50/40 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Oximeter Insights</h2>
            <p className="mt-1 text-sm text-gray-600">
              SpO₂ and pulse trends from your connected oximeter sessions.
            </p>
          </div>
          <Link
            href="/dashboard/oximeter"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm font-semibold text-pink-700 hover:bg-pink-50"
          >
            <FaBluetooth />
            Open oximeter
          </Link>
        </div>

        {!oximeter.hasData ? (
          <div className="mt-5 rounded-xl border border-dashed border-teal-200 bg-white/80 p-6 text-center">
            <ActivityIcon className="mx-auto h-8 w-8 text-teal-500" strokeWidth={2} />
            <p className="mt-2 text-sm font-medium text-gray-800">No oximeter readings yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Connect an oximeter and monitor your baby to see charts here.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-teal-100 bg-white p-3">
              <p className="text-xs text-gray-500">Readings ({trendLabel})</p>
              <p className="text-xl font-bold text-gray-900">{oximeter.totalReadings}</p>
            </div>
            <div className="rounded-xl border border-teal-100 bg-white p-3">
              <p className="text-xs text-gray-500">Last 7 days</p>
              <p className="text-xl font-bold text-gray-900">{oximeter.readingsLast7Days}</p>
            </div>
            <div className="rounded-xl border border-teal-100 bg-white p-3">
              <p className="text-xs text-gray-500">Avg SpO₂ (7d)</p>
              <p className="text-xl font-bold text-teal-700">
                {oximeter.avgSpo2Last7Days != null ? `${oximeter.avgSpo2Last7Days}%` : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-white p-3">
              <p className="text-xs text-gray-500">Avg pulse (7d)</p>
              <p className="text-xl font-bold text-rose-700">
                {oximeter.avgPulseLast7Days != null ? `${oximeter.avgPulseLast7Days}` : '—'}
              </p>
            </div>
          </div>
        )}
      </div>

      {oximeter.hasData ? (
        <>
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-pink-100 bg-white p-5">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                <ActivityIcon className="h-4 w-4 text-teal-600" strokeWidth={2.2} />
                Vitals trend ({trendLabel})
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Hover for daily averages · daily averages across all your children
              </p>
              <OximeterVitalsTrendChart trend={oximeter.dailyTrend} days={oximeter.trendDays} />
            </div>

            <div className="rounded-xl border border-pink-100 bg-white p-5">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                <HeartIcon className="h-4 w-4 text-rose-500" strokeWidth={2.2} />
                Per-child averages
              </h3>
              <p className="mt-1 text-xs text-gray-500">Interactive bars · compare typical SpO₂ and pulse by baby</p>
              <OximeterBabySummaryChart summaries={oximeter.babySummaries} />
            </div>
          </div>

          {multiBaby ? (
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-pink-100 bg-white p-5">
                <h3 className="font-semibold text-gray-900">Children compared — SpO₂</h3>
                <p className="mt-1 text-xs text-gray-500">Hover each point for values by child</p>
                <OximeterBabyComparisonChart
                  series={oximeter.babyDailySeries}
                  mode="spo2"
                  days={oximeter.trendDays}
                  focusBabyId={focusBabyId}
                />
              </div>
              <div className="rounded-xl border border-pink-100 bg-white p-5">
                <h3 className="font-semibold text-gray-900">Children compared — pulse</h3>
                <p className="mt-1 text-xs text-gray-500">Hover each point for values by child</p>
                <OximeterBabyComparisonChart
                  series={oximeter.babyDailySeries}
                  mode="pulse"
                  days={oximeter.trendDays}
                  focusBabyId={focusBabyId}
                />
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
