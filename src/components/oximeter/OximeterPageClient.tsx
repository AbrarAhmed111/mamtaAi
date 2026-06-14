'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Activity, BarChart2, Heart, LineChart, TrendingUp, Waves } from 'lucide-react'
import { FaBluetooth, FaExclamationTriangle } from 'react-icons/fa'
import OximeterLastReadingsPanel from '@/components/oximeter/OximeterLastReadingsPanel'
import PediatricVitalsReferenceSection from '@/components/oximeter/PediatricVitalsReferenceSection'
import OximeterLiveChart, { type OximeterChartVariant } from '@/components/oximeter/OximeterLiveChart'
import OximeterVitalCard from '@/components/oximeter/OximeterVitalCard'
import { useOximeter } from '@/contexts/OximeterContext'
import type { OximeterLiveReading } from '@/lib/oximeter/types'
import {
  heartAnimationDurationSec,
  pulseMeterPercent,
  pulseStatusLabel,
  spo2MeterPercent,
  spo2SafetyNote,
  spo2StatusLabel,
} from '@/lib/oximeter/thresholds'
import { formatRelativeTime } from '@/lib/oximeter/stats'

function SessionStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100/90 bg-white/90 px-4 py-3 shadow-sm transition-all duration-200 hover:border-pink-100 hover:shadow-md hover:shadow-pink-50/50">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">{value}</p>
    </div>
  )
}

function TrendChartCard({
  title,
  subtitle,
  icon,
  iconClassName,
  borderClassName,
  readings,
  mode,
  variant,
}: {
  title: string
  subtitle: string
  icon: ReactNode
  iconClassName: string
  borderClassName: string
  readings: OximeterLiveReading[]
  mode: 'spo2' | 'pulse'
  variant: OximeterChartVariant
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md ${borderClassName}`}
    >
      <div className="mb-3 flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-[11px] text-gray-500">{subtitle}</p>
        </div>
      </div>
      <OximeterLiveChart readings={readings} mode={mode} variant={variant} height={168} />
    </div>
  )
}

export default function OximeterPageClient() {
  const {
    connection,
    liveReading,
    sessionStats,
    chartReadings,
    activeAlarms,
    rawPacketCount,
    lastRawPacket,
    vitalsDecodeReady,
    openConnectModal,
    disconnect,
    isSupported,
  } = useOximeter()

  const connected = connection.status === 'connected' || connection.status === 'reconnecting'
  const decodePending = !vitalsDecodeReady || liveReading?.decodePending
  const heartDuration = heartAnimationDurationSec(liveReading?.pulseRate ?? null)
  const safetyNote = liveReading && !decodePending ? spo2SafetyNote(liveReading.spo2Status) : null

  const spo2Display =
    decodePending || liveReading?.spo2 == null ? '—' : String(liveReading.spo2)
  const pulseDisplay =
    decodePending || liveReading?.pulseRate == null ? '—' : String(liveReading.pulseRate)

  if (!connected) {
    return (
      <div className="w-full space-y-6">
        <div className="space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
          <div className="rounded-3xl border border-pink-100/80 bg-gradient-to-br from-white via-pink-50/30 to-white p-8 text-center shadow-lg shadow-pink-100/30 lg:sticky lg:top-4">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 text-pink-600 shadow-inner">
            <Heart className="h-7 w-7" strokeWidth={2.2} />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">No Oximeter Connected</h1>
          <p className="mt-2 text-sm text-gray-600">
            Connect an oximeter to monitor oxygen saturation and pulse rate in real time.
          </p>
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-gray-600 lg:max-w-none lg:px-4">
            <li>1. Turn on the oximeter and place it on the finger.</li>
            <li>2. Keep the device near your phone or computer.</li>
            <li>3. Click Connect Oximeter and approve Bluetooth access.</li>
          </ul>
          {!isSupported && (
            <p className="mt-4 text-xs text-amber-700">
              Web Bluetooth requires Chrome or Edge (desktop/Android). Safari on iOS is not supported.
            </p>
          )}
          <button
            type="button"
            onClick={openConnectModal}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-pink-200/50 transition hover:from-pink-700 hover:to-rose-700"
          >
            <FaBluetooth />
            Connect Oximeter
          </button>
        </div>

          <OximeterLastReadingsPanel />
        </div>

        <PediatricVitalsReferenceSection />
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 pb-2">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-pink-100/80 bg-white/90 p-5 shadow-sm shadow-pink-100/20 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
            Oximeter Monitoring
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            <span className="font-medium text-gray-800">{connection.babyName}</span>
            <span className="mx-2 text-gray-300">·</span>
            <span>{connection.deviceName}</span>
          </p>
          {connection.batteryLevel != null && (
            <p className="mt-1 text-xs text-gray-500">Battery {connection.batteryLevel}%</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {connection.status === 'reconnecting' ? 'Reconnecting…' : 'Live and Connected'}
          </span>
          <button
            type="button"
            onClick={() => void disconnect()}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
          >
            Disconnect
          </button>
        </div>
      </div>

      {activeAlarms.length > 0 && !decodePending && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50 to-orange-50/50 p-4 text-sm text-amber-950 shadow-sm">
          <FaExclamationTriangle className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Reading alert</p>
            <p className="mt-1 capitalize text-amber-900/90">
              {activeAlarms.join(', ').replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      )}

      {decodePending && (
        <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-r from-sky-50/80 to-white p-4 text-sm text-sky-950 shadow-sm">
          <p className="font-semibold">Receiving live Bluetooth data</p>
          <p className="mt-1 text-sky-800/90">
            Vitals appear when a numerical packet arrives — waveform packets are normal in the
            background.
          </p>
          <p className="mt-2 font-mono text-[10px] text-sky-900/80">
            Packets: {rawPacketCount}
            {lastRawPacket
              ? ` · Last ${lastRawPacket.length}B${lastRawPacket.bytes[4] === 0x02 ? ' waveform' : lastRawPacket.bytes[4] === 0x01 ? ' vitals' : ''}`
              : ''}
          </p>
        </div>
      )}

      {/* Primary reading cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <OximeterVitalCard
          label="Oxygen Saturation"
          value={spo2Display}
          unit="%"
          status={
            liveReading && !decodePending
              ? spo2StatusLabel(liveReading.spo2Status)
              : 'Waiting for reading…'
          }
          updatedAt={liveReading?.measuredAt}
          isStale={liveReading?.isStale}
          meterPercent={spo2MeterPercent(liveReading?.spo2 ?? null)}
          theme="oxygen"
          decodePending={decodePending}
          footerNote={safetyNote}
          icon={<Activity className="h-5 w-5" strokeWidth={2.2} />}
        />
        <OximeterVitalCard
          label="Heart Rate"
          value={pulseDisplay}
          unit="BPM"
          status={
            liveReading && !decodePending
              ? pulseStatusLabel(liveReading.pulseRate)
              : 'Waiting for reading…'
          }
          updatedAt={liveReading?.measuredAt}
          isStale={liveReading?.isStale}
          meterPercent={pulseMeterPercent(liveReading?.pulseRate ?? null)}
          theme="heart"
          decodePending={decodePending}
          icon={
            <Heart
              className="h-5 w-5"
              strokeWidth={2.2}
              style={
                decodePending
                  ? undefined
                  : { animation: `oxi-heart ${heartDuration}s ease-in-out infinite` }
              }
            />
          }
        />
      </div>

      {/* Realtime trends */}
      <section className="rounded-3xl border border-gray-100/90 bg-gradient-to-b from-white to-pink-50/20 p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Realtime Trends</h2>
            <p className="text-sm text-gray-500">Compact live charts from your current session</p>
          </div>
          <p className="text-xs text-gray-400">Rolling window · last ~60 readings</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TrendChartCard
            title="SpO₂ Trend"
            subtitle="Oxygen saturation over time"
            icon={<LineChart className="h-4 w-4" strokeWidth={2.2} />}
            iconClassName="bg-teal-50 text-teal-600"
            borderClassName="border-teal-100/80 hover:shadow-teal-100/30"
            readings={chartReadings}
            mode="spo2"
            variant="trend"
          />
          <TrendChartCard
            title="SpO₂ Stability"
            subtitle="Short-term range · lower is steadier"
            icon={<BarChart2 className="h-4 w-4" strokeWidth={2.2} />}
            iconClassName="bg-emerald-50 text-emerald-600"
            borderClassName="border-emerald-100/80 hover:shadow-emerald-100/30"
            readings={chartReadings}
            mode="spo2"
            variant="stability"
          />
          <TrendChartCard
            title="Heart Rate Trend"
            subtitle="Pulse rate over time"
            icon={<TrendingUp className="h-4 w-4" strokeWidth={2.2} />}
            iconClassName="bg-rose-50 text-rose-600"
            borderClassName="border-rose-100/80 hover:shadow-rose-100/30"
            readings={chartReadings}
            mode="pulse"
            variant="trend"
          />
          <TrendChartCard
            title="Pulse Variability"
            subtitle="Beat-to-beat change pattern"
            icon={<Waves className="h-4 w-4" strokeWidth={2.2} />}
            iconClassName="bg-pink-50 text-pink-600"
            borderClassName="border-pink-100/80 hover:shadow-pink-100/30"
            readings={chartReadings}
            mode="pulse"
            variant="variability"
          />
        </div>
      </section>

      {/* Session statistics */}
      <section className="rounded-3xl border border-gray-100/90 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">Session Statistics</h2>
          <p className="text-sm text-gray-500">Summary for the current monitoring session</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          <SessionStatCard
            label="Min SpO₂"
            value={sessionStats.minSpo2 != null ? `${sessionStats.minSpo2}%` : '—'}
          />
          <SessionStatCard
            label="Max SpO₂"
            value={sessionStats.maxSpo2 != null ? `${sessionStats.maxSpo2}%` : '—'}
          />
          <SessionStatCard
            label="Avg SpO₂"
            value={sessionStats.avgSpo2 != null ? `${sessionStats.avgSpo2}%` : '—'}
          />
          <SessionStatCard
            label="Min Pulse"
            value={sessionStats.minPulse != null ? `${sessionStats.minPulse}` : '—'}
          />
          <SessionStatCard
            label="Max Pulse"
            value={sessionStats.maxPulse != null ? `${sessionStats.maxPulse}` : '—'}
          />
          <SessionStatCard
            label="Avg Pulse"
            value={sessionStats.avgPulse != null ? `${sessionStats.avgPulse}` : '—'}
          />
          <SessionStatCard label="Total Readings" value={String(sessionStats.readingCount)} />
          <SessionStatCard
            label="Last Updated"
            value={formatRelativeTime(sessionStats.lastUpdatedAt)}
          />
        </div>
      </section>

      <PediatricVitalsReferenceSection />

      <p className="text-center text-xs text-gray-500 sm:text-left">
        Device readings are for wellness monitoring only and are not a medical diagnosis.{' '}
        <Link href="/dashboard/settings" className="font-medium text-pink-600 hover:underline">
          Configure oximeter alerts
        </Link>
        .
      </p>
    </div>
  )
}
